mod downloads;
#[cfg(test)]
mod live_tests;
mod twitch;
mod vault;
use reqwest::{Client, Method};
use serde::Deserialize;
use serde_json::{json, Value};
use std::time::{Duration, Instant};
use tauri::{Manager, State};
use tokio::sync::Mutex;
use twitch::{ApiError, Result, Session};
use zeroize::Zeroizing;

struct Pending {
    client_id: String,
    device_code: String,
    next: Instant,
    expires: Instant,
    interval: Duration,
}
struct Runtime {
    session: Option<Session>,
    validated: Instant,
    pending: Option<Pending>,
    vault_password: Option<Zeroizing<String>>,
}
struct AppState {
    client: Client,
    runtime: Mutex<Runtime>,
}

#[tauri::command]
async fn browse(
    state: State<'_, AppState>,
    kind: twitch::Browse,
    variables: Value,
) -> Result<Value> {
    twitch::browse(&state.client, kind, variables).await
}
#[tauri::command]
async fn playback(
    state: State<'_, AppState>,
    kind: twitch::MediaKind,
    id: String,
) -> Result<String> {
    twitch::playback(&state.client, kind, &id).await
}
#[tauri::command]
async fn media_fetch(state: State<'_, AppState>, url: String) -> Result<tauri::ipc::Response> {
    Ok(tauri::ipc::Response::new(
        twitch::media(&state.client, &url).await?,
    ))
}

#[tauri::command]
async fn download_start(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    downloads: State<'_, downloads::Downloads>,
    kind: twitch::MediaKind,
    id: String,
    title: String,
    channel: String,
) -> Result<downloads::Download> {
    downloads::run(app, &state.client, &downloads, kind, id, title, channel).await
}
#[tauri::command]
async fn download_list(app: tauri::AppHandle) -> Result<Vec<downloads::Download>> {
    downloads::list(&app).await
}
#[tauri::command]
async fn download_cancel(downloads: State<'_, downloads::Downloads>, id: String) -> Result<()> {
    downloads.cancelled.lock().await.insert(id);
    Ok(())
}
#[tauri::command]
async fn download_remove(
    app: tauri::AppHandle,
    downloads: State<'_, downloads::Downloads>,
    id: String,
) -> Result<()> {
    downloads::remove(&app, &downloads, &id).await
}
#[tauri::command]
fn download_path(app: tauri::AppHandle, id: String, filename: String) -> Result<String> {
    Ok(downloads::path(&app, &id, &filename)?
        .to_string_lossy()
        .into())
}

fn vault_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|_| ApiError::new("storage", "Stockage indisponible."))?;
    std::fs::create_dir_all(&dir)
        .map_err(|_| ApiError::new("storage", "Stockage indisponible."))?;
    Ok(dir.join("session.vault"))
}
async fn persist(app: &tauri::AppHandle, s: &Session, password: &str) -> Result<()> {
    let path = vault_path(app)?;
    let data = Zeroizing::new(
        serde_json::to_vec(s).map_err(|_| ApiError::new("vault", "Session invalide."))?,
    );
    let password = Zeroizing::new(password.to_owned());
    let encrypted = tauri::async_runtime::spawn_blocking(move || vault::seal(&data, &password))
        .await
        .map_err(|_| ApiError::new("vault", "Coffre indisponible."))??;
    let tmp = path.with_extension("tmp");
    tokio::fs::write(&tmp, encrypted)
        .await
        .map_err(|_| ApiError::new("storage", "Écriture impossible."))?;
    tokio::fs::rename(tmp, path)
        .await
        .map_err(|_| ApiError::new("storage", "Enregistrement impossible."))?;
    Ok(())
}
fn public_session(s: &Session) -> Value {
    json!({"login":s.login,"user_id":s.user_id,"client_id":s.client_id})
}

#[tauri::command]
async fn session_status(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<Value> {
    let rt = state.runtime.lock().await;
    Ok(
        json!({"user":rt.session.as_ref().map(public_session),"vault_exists":vault_path(&app)?.exists()}),
    )
}
#[tauri::command]
async fn auth_begin(state: State<'_, AppState>, client_id: String) -> Result<Value> {
    if client_id.len() < 10
        || client_id.len() > 80
        || !client_id.bytes().all(|b| b.is_ascii_alphanumeric())
    {
        return Err(ApiError::new(
            "input",
            "Saisissez le Client ID de votre application Twitch publique.",
        ));
    }
    let v = twitch::response(
        state
            .client
            .post("https://id.twitch.tv/oauth2/device")
            .form(&[
                ("client_id", client_id.as_str()),
                ("scopes", twitch::SCOPES),
            ])
            .send()
            .await?,
    )
    .await?;
    let code = v["device_code"]
        .as_str()
        .ok_or_else(|| ApiError::new("auth", "Autorisation indisponible."))?
        .to_owned();
    let interval = Duration::from_secs(v["interval"].as_u64().unwrap_or(5).max(5));
    state.runtime.lock().await.pending = Some(Pending {
        client_id,
        device_code: code,
        next: Instant::now() + interval,
        expires: Instant::now() + Duration::from_secs(v["expires_in"].as_u64().unwrap_or(1800)),
        interval,
    });
    Ok(
        json!({"user_code":v["user_code"],"verification_uri":v["verification_uri"],"expires_in":v["expires_in"],"interval":interval.as_secs()}),
    )
}
#[tauri::command]
async fn auth_poll(state: State<'_, AppState>) -> Result<Value> {
    let mut rt = state.runtime.lock().await;
    let p = rt
        .pending
        .as_mut()
        .ok_or_else(|| ApiError::new("auth", "Relancez la connexion."))?;
    if Instant::now() >= p.expires {
        rt.pending = None;
        return Err(ApiError::new("expired", "Le code a expiré."));
    }
    if Instant::now() < p.next {
        return Ok(json!({"pending":true}));
    }
    p.next = Instant::now() + p.interval;
    let response = state
        .client
        .post("https://id.twitch.tv/oauth2/token")
        .form(&[
            ("client_id", p.client_id.as_str()),
            ("device_code", p.device_code.as_str()),
            ("scopes", twitch::SCOPES),
            ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
        ])
        .send()
        .await?;
    let status = response.status();
    let v: Value = response.json().await?;
    if !status.is_success() {
        let msg = v["message"].as_str().unwrap_or_default();
        if msg == "authorization_pending" || msg == "slow_down" {
            if msg == "slow_down" {
                p.interval += Duration::from_secs(5);
            }
            return Ok(json!({"pending":true}));
        }
        rt.pending = None;
        return Err(ApiError::new("auth", "Autorisation refusée ou expirée."));
    }
    let token = v["access_token"]
        .as_str()
        .ok_or_else(|| ApiError::new("auth", "Réponse Twitch invalide."))?;
    let identity = twitch::validate(&state.client, token, &p.client_id).await?;
    let session = Session {
        client_id: p.client_id.clone(),
        access_token: token.into(),
        refresh_token: v["refresh_token"].as_str().unwrap_or_default().into(),
        login: identity["login"].as_str().unwrap_or_default().into(),
        user_id: identity["user_id"].as_str().unwrap_or_default().into(),
    };
    let user = public_session(&session);
    rt.session = Some(session);
    rt.pending = None;
    rt.validated = Instant::now();
    Ok(json!({"user":user}))
}
#[tauri::command]
async fn auth_cancel(state: State<'_, AppState>) -> Result<()> {
    state.runtime.lock().await.pending = None;
    Ok(())
}
#[tauri::command]
async fn vault_save(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    password: String,
) -> Result<()> {
    let password = Zeroizing::new(password);
    let mut rt = state.runtime.lock().await;
    let s = rt
        .session
        .as_ref()
        .ok_or_else(|| ApiError::new("auth", "Connectez-vous d’abord."))?;
    persist(&app, s, &password).await?;
    rt.vault_password = Some(password);
    Ok(())
}
#[tauri::command]
async fn vault_unlock(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    password: String,
) -> Result<Value> {
    let bytes = tokio::fs::read(vault_path(&app)?)
        .await
        .map_err(|_| ApiError::new("vault", "Aucun coffre enregistré."))?;
    let pass = Zeroizing::new(password);
    let pass_copy = pass.clone();
    let data = tauri::async_runtime::spawn_blocking(move || vault::open(&bytes, &pass_copy))
        .await
        .map_err(|_| ApiError::new("vault", "Coffre indisponible."))??;
    let s: Session =
        serde_json::from_slice(&data).map_err(|_| ApiError::new("vault", "Coffre invalide."))?;
    {
        let mut rt = state.runtime.lock().await;
        rt.session = Some(s);
        rt.vault_password = Some(pass);
        rt.validated = Instant::now() - Duration::from_secs(7200);
    }
    let s = active_session(&app, &state).await?;
    Ok(public_session(&s))
}
async fn active_session(app: &tauri::AppHandle, state: &AppState) -> Result<Session> {
    let mut rt = state.runtime.lock().await;
    let mut s = rt
        .session
        .clone()
        .ok_or_else(|| ApiError::new("auth", "Connectez-vous à Twitch pour continuer."))?;
    if rt.validated.elapsed() > Duration::from_secs(3600) {
        match twitch::validate(&state.client, &s.access_token, &s.client_id).await {
            Ok(_) => {}
            Err(e) if e.code == "session_expired" => {
                let v = twitch::response(
                    state
                        .client
                        .post("https://id.twitch.tv/oauth2/token")
                        .form(&[
                            ("client_id", s.client_id.as_str()),
                            ("refresh_token", s.refresh_token.as_str()),
                            ("grant_type", "refresh_token"),
                        ])
                        .send()
                        .await?,
                )
                .await;
                match v {
                    Ok(v) => {
                        s.access_token = v["access_token"].as_str().unwrap_or_default().into();
                        s.refresh_token = v["refresh_token"].as_str().unwrap_or_default().into();
                        twitch::validate(&state.client, &s.access_token, &s.client_id).await?;
                        rt.session = Some(s.clone());
                        if let Some(p) = rt.vault_password.as_ref() {
                            persist(app, &s, p).await?;
                        }
                    }
                    Err(_) => {
                        rt.session = None;
                        rt.vault_password = None;
                        return Err(e);
                    }
                }
            }
            Err(e) => return Err(e),
        }
        rt.validated = Instant::now();
    }
    Ok(s)
}
#[tauri::command]
async fn logout(app: tauri::AppHandle, state: State<'_, AppState>) -> Result<()> {
    let mut rt = state.runtime.lock().await;
    rt.session = None;
    rt.pending = None;
    rt.vault_password = None;
    let p = vault_path(&app)?;
    if p.exists() {
        tokio::fs::remove_file(p)
            .await
            .map_err(|_| ApiError::new("storage", "Suppression du coffre impossible."))?;
    }
    Ok(())
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum AccountAction {
    Me,
    Followed {
        after: Option<String>,
    },
    FollowedStreams,
    Subscriptions {
        broadcaster_id: String,
    },
    SendChat {
        broadcaster_id: String,
        message: String,
    },
    CreateClip {
        broadcaster_id: String,
    },
    Schedule {
        broadcaster_id: String,
    },
    ChannelInfo,
    UpdateChannel {
        title: String,
        game_id: String,
        language: String,
    },
    UpdateProfile {
        description: String,
    },
    Ban {
        broadcaster_id: String,
        user_id: String,
        duration: Option<u64>,
        reason: String,
    },
    DeleteMessage {
        broadcaster_id: String,
        message_id: String,
    },
    Whisper {
        to_user_id: String,
        message: String,
    },
}
#[tauri::command]
async fn account(
    app: tauri::AppHandle,
    state: State<'_, AppState>,
    action: AccountAction,
) -> Result<Value> {
    let s = active_session(&app, &state).await?;
    let get = Method::GET;
    let post = Method::POST;
    let patch = Method::PATCH;
    let (m, path, q, b) = match action {
        AccountAction::Me => (get, "users", vec![], Value::Null),
        AccountAction::Followed { after } => (
            get,
            "channels/followed",
            vec![
                ("user_id", s.user_id.clone()),
                ("first", "100".into()),
                ("after", after.unwrap_or_default()),
            ],
            Value::Null,
        ),
        AccountAction::FollowedStreams => (
            get,
            "streams/followed",
            vec![("user_id", s.user_id.clone()), ("first", "100".into())],
            Value::Null,
        ),
        AccountAction::Subscriptions { broadcaster_id } => (
            get,
            "subscriptions/user",
            vec![
                ("user_id", s.user_id.clone()),
                ("broadcaster_id", broadcaster_id),
            ],
            Value::Null,
        ),
        AccountAction::SendChat {
            broadcaster_id,
            message,
        } => {
            if message.trim().is_empty() || message.chars().count() > 500 {
                return Err(ApiError::new(
                    "input",
                    "Le message doit contenir entre 1 et 500 caractères.",
                ));
            }
            (
                post,
                "chat/messages",
                vec![],
                json!({"broadcaster_id":broadcaster_id,"sender_id":s.user_id,"message":message}),
            )
        }
        AccountAction::CreateClip { broadcaster_id } => (
            post,
            "clips",
            vec![("broadcaster_id", broadcaster_id)],
            Value::Null,
        ),
        AccountAction::Schedule { broadcaster_id } => (
            get,
            "schedule",
            vec![("broadcaster_id", broadcaster_id)],
            Value::Null,
        ),
        AccountAction::ChannelInfo => (
            get,
            "channels",
            vec![("broadcaster_id", s.user_id.clone())],
            Value::Null,
        ),
        AccountAction::UpdateChannel {
            title,
            game_id,
            language,
        } => {
            if title.chars().count() > 140 {
                return Err(ApiError::new(
                    "input",
                    "Le titre est limité à 140 caractères.",
                ));
            }
            (
                patch,
                "channels",
                vec![("broadcaster_id", s.user_id.clone())],
                json!({"title":title,"game_id":game_id,"broadcaster_language":language}),
            )
        }
        AccountAction::UpdateProfile { description } => (
            Method::PUT,
            "users",
            vec![("description", description)],
            Value::Null,
        ),
        AccountAction::Ban {
            broadcaster_id,
            user_id,
            duration,
            reason,
        } => (
            post,
            "moderation/bans",
            vec![
                ("broadcaster_id", broadcaster_id),
                ("moderator_id", s.user_id.clone()),
            ],
            json!({"data":{"user_id":user_id,"duration":duration,"reason":reason}}),
        ),
        AccountAction::DeleteMessage {
            broadcaster_id,
            message_id,
        } => (
            Method::DELETE,
            "moderation/chat",
            vec![
                ("broadcaster_id", broadcaster_id),
                ("moderator_id", s.user_id.clone()),
                ("message_id", message_id),
            ],
            Value::Null,
        ),
        AccountAction::Whisper {
            to_user_id,
            message,
        } => (
            post,
            "whispers",
            vec![
                ("from_user_id", s.user_id.clone()),
                ("to_user_id", to_user_id),
            ],
            json!({"message":message}),
        ),
    };
    let result = twitch::helix(&state.client, &s, m, path, q, b).await;
    if result.as_ref().is_err_and(|e| e.code == "session_expired") {
        state.runtime.lock().await.validated = Instant::now() - Duration::from_secs(7200);
    }
    result
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(downloads::Downloads::default())
        .manage(AppState {
            client: twitch::client(),
            runtime: Mutex::new(Runtime {
                session: None,
                validated: Instant::now(),
                pending: None,
                vault_password: None,
            }),
        })
        .invoke_handler(tauri::generate_handler![
            browse,
            playback,
            media_fetch,
            session_status,
            auth_begin,
            auth_poll,
            auth_cancel,
            vault_save,
            vault_unlock,
            logout,
            account,
            download_start,
            download_list,
            download_cancel,
            download_remove,
            download_path
        ])
        .run(tauri::generate_context!())
        .expect("FLUX startup failed");
}
