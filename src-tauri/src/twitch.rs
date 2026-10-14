use reqwest::{Client, Method};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::time::Duration;
use url::Url;

pub const WEB_CLIENT: &str = "kimne78kx3ncx6brgo4mv6wki5h1ko";
pub const SCOPES: &str = "user:read:follows user:write:chat user:read:subscriptions clips:edit channel:manage:broadcast moderator:manage:banned_users moderator:manage:chat_messages user:manage:whispers user:edit";

pub fn client() -> Client {
    Client::builder()
        .timeout(Duration::from_secs(25))
        .connect_timeout(Duration::from_secs(10))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent("FLUX/0.1.0")
        .build()
        .expect("HTTP client")
}

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: String,
    pub message: String,
}
impl ApiError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }
}
impl From<reqwest::Error> for ApiError {
    fn from(e: reqwest::Error) -> Self {
        if e.is_timeout() {
            Self::new("timeout", "Le service met trop de temps à répondre.")
        } else {
            Self::new(
                "network",
                "Connexion au service impossible. Vérifiez votre réseau.",
            )
        }
    }
}
pub type Result<T> = std::result::Result<T, ApiError>;

pub async fn response(r: reqwest::Response) -> Result<Value> {
    let status = r.status();
    if status.as_u16() == 401 {
        return Err(ApiError::new(
            "session_expired",
            "Reconnectez votre compte Twitch.",
        ));
    }
    if status.as_u16() == 429 {
        return Err(ApiError::new(
            "rate_limit",
            "Trop de requêtes. Réessayez dans un instant.",
        ));
    }
    if !status.is_success() {
        return Err(ApiError::new(
            "service",
            &format!("Twitch a refusé cette action ({}).", status.as_u16()),
        ));
    }
    if status.as_u16() == 204 {
        return Ok(json!({}));
    }
    Ok(r.json().await?)
}

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum Browse {
    Streams,
    Games,
    Search,
    Channel,
    Game,
    Videos,
    Clips,
    Following,
    About,
}
pub async fn browse(client: &Client, kind: Browse, variables: Value) -> Result<Value> {
    if variables.to_string().len() > 8192 {
        return Err(ApiError::new("input", "Recherche trop longue."));
    }
    let query = match kind {
        Browse::Streams => include_str!("queries/TopStreams.graphql"),
        Browse::Games => include_str!("queries/TopGames.graphql"),
        Browse::Search => include_str!("queries/SearchChannels.graphql"),
        Browse::Channel => include_str!("queries/UserChannelPage.graphql"),
        Browse::Game => include_str!("queries/GameStreams.graphql"),
        Browse::Videos => include_str!("queries/UserVideos.graphql"),
        Browse::Clips => include_str!("queries/UserClips.graphql"),
        Browse::Following => include_str!("queries/UsersStream.graphql"),
        Browse::About => include_str!("queries/UserAbout.graphql"),
    };
    gql(client, query, variables).await
}
pub async fn gql(client: &Client, query: &str, variables: Value) -> Result<Value> {
    let v = response(
        client
            .post("https://gql.twitch.tv/gql")
            .header("Client-ID", WEB_CLIENT)
            .json(&json!({"query":query,"variables":variables}))
            .send()
            .await?,
    )
    .await?;
    if v.get("errors").is_some() {
        return Err(ApiError::new(
            "upstream_changed",
            "Ce service Twitch est momentanément indisponible.",
        ));
    }
    Ok(v["data"].clone())
}

pub fn valid_login(s: &str) -> bool {
    !s.is_empty() && s.len() <= 25 && s.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_')
}
fn valid_id(s: &str) -> bool {
    !s.is_empty() && s.len() <= 30 && s.bytes().all(|b| b.is_ascii_digit())
}

#[derive(Deserialize, Clone, Copy)]
#[serde(rename_all = "snake_case")]
pub enum MediaKind {
    Live,
    Video,
    Clip,
}
pub async fn playback(client: &Client, kind: MediaKind, id: &str) -> Result<String> {
    if id.len() > 200 {
        return Err(ApiError::new("input", "Identifiant trop long."));
    }
    match kind {
        MediaKind::Live | MediaKind::Video => {
            if !(match kind {
                MediaKind::Live => valid_login(id),
                _ => valid_id(id),
            }) {
                return Err(ApiError::new("input", "Identifiant invalide."));
            }
            let (q, key, vars, path) = match kind {
                MediaKind::Live => (
                    include_str!("queries/StreamPlaybackAccessToken.graphql"),
                    "streamPlaybackAccessToken",
                    json!({"login":id,"platform":"web","playerType":"site"}),
                    format!("https://usher.ttvnw.net/api/v2/channel/hls/{id}.m3u8"),
                ),
                _ => (
                    include_str!("queries/VideoPlaybackAccessToken.graphql"),
                    "videoPlaybackAccessToken",
                    json!({"id":id,"platform":"web","playerType":"site"}),
                    format!("https://usher.ttvnw.net/vod/v2/{id}.m3u8"),
                ),
            };
            let d = gql(client, q, vars).await?;
            let token = d[key]["value"]
                .as_str()
                .ok_or_else(|| ApiError::new("unavailable", "Ce contenu n’est pas disponible."))?;
            let sig = d[key]["signature"]
                .as_str()
                .ok_or_else(|| ApiError::new("unavailable", "Accès vidéo refusé."))?;
            let mut u = Url::parse(&path).expect("fixed Twitch URL");
            u.query_pairs_mut()
                .append_pair("allow_source", "true")
                .append_pair("allow_audio_only", "true")
                .append_pair("platform", "web")
                .append_pair("fast_bread", "true")
                .append_pair("sig", sig)
                .append_pair("token", token);
            Ok(u.into())
        }
        MediaKind::Clip => {
            if !id
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || c == b'-' || c == b'_')
            {
                return Err(ApiError::new("input", "Clip invalide."));
            }
            let d = gql(
                client,
                include_str!("queries/ClipUrls.graphql"),
                json!({"slug":id}),
            )
            .await?;
            let clip = &d["clip"];
            let source = clip["assets"][0]["videoQualities"][0]["sourceURL"]
                .as_str()
                .ok_or_else(|| ApiError::new("unavailable", "Ce clip n’est plus disponible."))?;
            let mut u = Url::parse(source)
                .map_err(|_| ApiError::new("unavailable", "URL vidéo invalide."))?;
            u.query_pairs_mut()
                .append_pair(
                    "sig",
                    clip["playbackAccessToken"]["signature"]
                        .as_str()
                        .unwrap_or_default(),
                )
                .append_pair(
                    "token",
                    clip["playbackAccessToken"]["value"]
                        .as_str()
                        .unwrap_or_default(),
                );
            validate_media_url(u.as_str())?;
            Ok(u.into())
        }
    }
}

/// No arbitrary URL forwarding, credentials, ports or redirect following.
pub fn validate_media_url(raw: &str) -> Result<Url> {
    let u = Url::parse(raw).map_err(|_| ApiError::new("input", "URL invalide."))?;
    let h = u.host_str().unwrap_or_default();
    if u.scheme() != "https"
        || !u.username().is_empty()
        || u.password().is_some()
        || u.port().is_some_and(|p| p != 443)
        || !(h.ends_with(".ttvnw.net")
            || h.ends_with(".twitchcdn.net")
            || h == "clips-media-assets2.twitch.tv"
            || h == "d1ndex63qxojbr.cloudfront.net")
    {
        return Err(ApiError::new(
            "forbidden_url",
            "Source vidéo non autorisée.",
        ));
    }
    Ok(u)
}
pub async fn media(client: &Client, raw: &str) -> Result<Vec<u8>> {
    let u = validate_media_url(raw)?;
    let mut r = client.get(u).send().await?;
    if !r.status().is_success() {
        return Err(ApiError::new(
            "unavailable",
            "Ce flux est hors ligne ou nécessite un accès Twitch.",
        ));
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = r.chunk().await? {
        if bytes.len() + chunk.len() > 32 * 1024 * 1024 {
            return Err(ApiError::new("too_large", "Segment vidéo trop volumineux."));
        }
        bytes.extend_from_slice(&chunk);
    }
    Ok(bytes)
}

#[derive(Clone, Serialize, Deserialize, zeroize::Zeroize, zeroize::ZeroizeOnDrop)]
pub struct Session {
    pub client_id: String,
    pub access_token: String,
    pub refresh_token: String,
    pub user_id: String,
    pub login: String,
}
pub async fn validate(client: &Client, token: &str, client_id: &str) -> Result<Value> {
    let v = response(
        client
            .get("https://id.twitch.tv/oauth2/validate")
            .header("Authorization", format!("OAuth {token}"))
            .send()
            .await?,
    )
    .await?;
    if v["client_id"].as_str() != Some(client_id) {
        return Err(ApiError::new(
            "client_mismatch",
            "Ce jeton ne correspond pas à l’application FLUX configurée.",
        ));
    }
    Ok(v)
}
pub async fn helix(
    client: &Client,
    s: &Session,
    method: Method,
    path: &str,
    query: Vec<(&str, String)>,
    body: Value,
) -> Result<Value> {
    let mut req = client
        .request(method, format!("https://api.twitch.tv/helix/{path}"))
        .bearer_auth(&s.access_token)
        .header("Client-ID", &s.client_id)
        .query(&query);
    if !body.is_null() {
        req = req.json(&body);
    }
    response(req.send().await?).await
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn media_allowlist_blocks_ssrf() {
        for u in [
            "http://usher.ttvnw.net/a",
            "https://ttvnw.net.evil.com/a",
            "https://unrelated.cloudfront.net/a",
            "https://127.0.0.1/a",
            "https://a.ttvnw.net:444/a",
            "https://user:pass@a.ttvnw.net/a",
            "file:///x",
        ] {
            assert!(validate_media_url(u).is_err(), "{u}");
        }
        assert!(validate_media_url("https://video-edge-abc.ttvnw.net/v1/a.ts?token=x").is_ok());
        assert!(validate_media_url("https://d1ndex63qxojbr.cloudfront.net/a.mp4").is_ok());
    }
    #[test]
    fn login_validation() {
        assert!(valid_login("a_streamer_42"));
        for s in ["", "../bad", "a\r\nJOIN #x", "àbc"] {
            assert!(!valid_login(s));
        }
    }
}
