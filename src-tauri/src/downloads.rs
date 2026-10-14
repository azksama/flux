use crate::twitch::{self, ApiError, MediaKind, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, path::PathBuf};
use tauri::{Emitter, Manager};
use tokio::{io::AsyncWriteExt, sync::Mutex};
use url::Url;

#[derive(Default)]
pub struct Downloads {
    pub cancelled: Mutex<HashSet<String>>,
    pub active: Mutex<HashSet<String>>,
}
#[derive(Clone, Serialize, Deserialize)]
pub struct Download {
    pub id: String,
    pub title: String,
    pub channel: String,
    pub filename: String,
    pub bytes: u64,
}
#[derive(Clone, Serialize)]
struct Progress {
    id: String,
    done: usize,
    total: usize,
    bytes: u64,
}
fn root(app: &tauri::AppHandle) -> Result<PathBuf> {
    app.path()
        .app_data_dir()
        .map(|p| p.join("downloads"))
        .map_err(|_| ApiError::new("storage", "Stockage indisponible."))
}
fn id_ok(id: &str) -> bool {
    !id.is_empty()
        && id.len() < 100
        && id
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}
fn storage_error(_: std::io::Error) -> ApiError {
    ApiError::new(
        "storage",
        "Écriture impossible. Vérifie l’espace disponible.",
    )
}

/// Rewrites all segment, key and map URIs. Unsupported byte-range content fails explicitly.
pub fn rewrite_playlist(text: &str, base: &Url) -> Result<(String, Vec<(String, String)>)> {
    if !text.starts_with("#EXTM3U") || !text.contains("#EXT-X-ENDLIST") {
        return Err(ApiError::new(
            "download",
            "Seuls les replays terminés peuvent être téléchargés.",
        ));
    }
    if text.contains("#EXT-X-BYTERANGE") {
        return Err(ApiError::new(
            "download",
            "Ce format de replay ne peut pas être conservé hors ligne.",
        ));
    }
    let mut resources = Vec::new();
    let mut lines = Vec::new();
    for line in text.lines() {
        if line.trim().is_empty() {
            continue;
        }
        if !line.starts_with('#') {
            let url = base
                .join(line)
                .map_err(|_| ApiError::new("download", "Segment invalide."))?;
            twitch::validate_media_url(url.as_str())?;
            let name = format!("segment-{}.ts", resources.len());
            resources.push((name.clone(), url.to_string()));
            lines.push(name);
        } else if let Some(start) = line.find("URI=\"") {
            let start = start + 5;
            let end = start
                + line[start..]
                    .find('"')
                    .ok_or_else(|| ApiError::new("download", "Ressource invalide."))?;
            let url = base
                .join(&line[start..end])
                .map_err(|_| ApiError::new("download", "Ressource invalide."))?;
            twitch::validate_media_url(url.as_str())?;
            let name = format!("resource-{}.bin", resources.len());
            resources.push((name.clone(), url.to_string()));
            lines.push(format!("{}{}{}", &line[..start], name, &line[end..]));
        } else {
            lines.push(line.into());
        }
    }
    if resources.is_empty() {
        return Err(ApiError::new(
            "download",
            "Le replay ne contient aucun segment.",
        ));
    }
    Ok((lines.join("\n"), resources))
}
pub async fn run(
    app: tauri::AppHandle,
    client: &Client,
    state: &Downloads,
    kind: MediaKind,
    id: String,
    title: String,
    channel: String,
) -> Result<Download> {
    if !id_ok(&id) || matches!(kind, MediaKind::Live) {
        return Err(ApiError::new(
            "input",
            "Choisis un replay terminé ou un clip.",
        ));
    }
    let key = format!(
        "{}-{id}",
        if matches!(kind, MediaKind::Clip) {
            "clip"
        } else {
            "video"
        }
    );
    {
        let mut active = state.active.lock().await;
        if active.len() >= 2 || !active.insert(key.clone()) {
            return Err(ApiError::new(
                "download",
                "Deux téléchargements maximum. Patiente avant de réessayer.",
            ));
        }
    }
    state.cancelled.lock().await.remove(&key);
    let result = run_inner(&app, client, state, &key, kind, &id, (title, channel)).await;
    state.active.lock().await.remove(&key);
    state.cancelled.lock().await.remove(&key);
    if result.is_err() {
        let p = root(&app)?.join(format!("{key}.partial"));
        let _ = tokio::fs::remove_dir_all(p).await;
    }
    result
}
async fn run_inner(
    app: &tauri::AppHandle,
    client: &Client,
    state: &Downloads,
    key: &str,
    kind: MediaKind,
    id: &str,
    metadata: (String, String),
) -> Result<Download> {
    let (title, channel) = metadata;
    let folder = root(app)?.join(format!("{key}.partial"));
    let final_folder = root(app)?.join(key);
    if final_folder.exists() {
        return Err(ApiError::new("download", "Ce contenu est déjà téléchargé."));
    }
    tokio::fs::create_dir_all(&folder)
        .await
        .map_err(storage_error)?;
    let url = twitch::playback(client, kind, id).await?;
    let mut total_bytes = 0u64;
    let filename = if matches!(kind, MediaKind::Clip) {
        let u = twitch::validate_media_url(&url)?;
        let mut r = client.get(u).send().await?;
        if !r.status().is_success() {
            return Err(ApiError::new(
                "download",
                "Téléchargement refusé par Twitch.",
            ));
        }
        let mut file = tokio::fs::File::create(folder.join("clip.mp4"))
            .await
            .map_err(storage_error)?;
        while let Some(chunk) = r.chunk().await? {
            if state.cancelled.lock().await.contains(key) {
                return Err(ApiError::new("cancelled", "Téléchargement annulé."));
            }
            total_bytes += chunk.len() as u64;
            file.write_all(&chunk).await.map_err(storage_error)?;
            let _ = app.emit(
                "download-progress",
                Progress {
                    id: key.into(),
                    done: 0,
                    total: 1,
                    bytes: total_bytes,
                },
            );
        }
        "clip.mp4"
    } else {
        let master = String::from_utf8(twitch::media(client, &url).await?)
            .map_err(|_| ApiError::new("download", "Playlist invalide."))?;
        let master_url = Url::parse(&url).expect("validated playback URL");
        let media_url = if master.contains("#EXT-X-STREAM-INF") {
            let lines: Vec<_> = master.lines().collect();
            let mut variants = Vec::new();
            for pair in lines.windows(2) {
                if pair[0].starts_with("#EXT-X-STREAM-INF") && !pair[1].starts_with('#') {
                    let bandwidth = pair[0]
                        .split(',')
                        .find_map(|p| {
                            p.strip_prefix("BANDWIDTH=")
                                .or_else(|| p.strip_prefix("#EXT-X-STREAM-INF:BANDWIDTH="))
                                .and_then(|v| v.parse::<u64>().ok())
                        })
                        .unwrap_or(0);
                    variants.push((bandwidth, pair[1]));
                }
            }
            variants.sort_by_key(|v| v.0);
            let selected = variants
                .iter()
                .find(|v| v.0 > 500000)
                .or_else(|| variants.last())
                .ok_or_else(|| ApiError::new("download", "Qualité vidéo indisponible."))?;
            master_url
                .join(selected.1)
                .map_err(|_| ApiError::new("download", "Playlist invalide."))?
        } else {
            master_url
        };
        let body = String::from_utf8(twitch::media(client, media_url.as_str()).await?)
            .map_err(|_| ApiError::new("download", "Playlist invalide."))?;
        let (local, resources) = rewrite_playlist(&body, &media_url)?;
        let total = resources.len();
        for (i, (name, source)) in resources.into_iter().enumerate() {
            if state.cancelled.lock().await.contains(key) {
                return Err(ApiError::new("cancelled", "Téléchargement annulé."));
            }
            let bytes = twitch::media(client, &source).await?;
            total_bytes += bytes.len() as u64;
            tokio::fs::write(folder.join(name), bytes)
                .await
                .map_err(storage_error)?;
            let _ = app.emit(
                "download-progress",
                Progress {
                    id: key.into(),
                    done: i + 1,
                    total,
                    bytes: total_bytes,
                },
            );
        }
        tokio::fs::write(folder.join("index.m3u8"), local)
            .await
            .map_err(storage_error)?;
        "index.m3u8"
    };
    let d = Download {
        id: key.into(),
        title,
        channel,
        filename: filename.into(),
        bytes: total_bytes,
    };
    tokio::fs::write(
        folder.join("metadata.json"),
        serde_json::to_vec(&d).map_err(|_| ApiError::new("download", "Métadonnées invalides."))?,
    )
    .await
    .map_err(storage_error)?;
    tokio::fs::rename(&folder, &final_folder)
        .await
        .map_err(storage_error)?;
    Ok(d)
}
pub async fn list(app: &tauri::AppHandle) -> Result<Vec<Download>> {
    let folder = root(app)?;
    if !folder.exists() {
        return Ok(vec![]);
    }
    let mut result = Vec::new();
    let mut entries = tokio::fs::read_dir(folder).await.map_err(storage_error)?;
    while let Some(e) = entries.next_entry().await.map_err(storage_error)? {
        if e.file_name().to_string_lossy().ends_with(".partial") {
            continue;
        }
        if let Ok(bytes) = tokio::fs::read(e.path().join("metadata.json")).await {
            if let Ok(d) = serde_json::from_slice::<Download>(&bytes) {
                result.push(d);
            }
        }
    }
    Ok(result)
}
pub fn path(app: &tauri::AppHandle, id: &str, filename: &str) -> Result<PathBuf> {
    if !id_ok(id) || !["clip.mp4", "index.m3u8"].contains(&filename) {
        return Err(ApiError::new("input", "Téléchargement invalide."));
    }
    Ok(root(app)?.join(id).join(filename))
}
pub async fn remove(app: &tauri::AppHandle, state: &Downloads, id: &str) -> Result<()> {
    if !id_ok(id) {
        return Err(ApiError::new("input", "Téléchargement invalide."));
    }
    if state.active.lock().await.contains(id) {
        return Err(ApiError::new(
            "download",
            "Annule le téléchargement avant sa suppression.",
        ));
    }
    tokio::fs::remove_dir_all(root(app)?.join(id))
        .await
        .map_err(storage_error)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rewrites_local_segment_and_key() {
        let (s,r)=rewrite_playlist("#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI=\"key.bin\"\n#EXTINF:10,\npart.ts\n#EXT-X-ENDLIST",&Url::parse("https://a.ttvnw.net/path/index.m3u8").unwrap()).unwrap();
        assert_eq!(r.len(), 2);
        assert!(s.contains("URI=\"resource-0.bin\""));
        assert_eq!(r[1].1, "https://a.ttvnw.net/path/part.ts");
    }
    #[test]
    fn refuses_live_and_foreign_segments() {
        let base = Url::parse("https://a.ttvnw.net/x").unwrap();
        assert!(rewrite_playlist("#EXTM3U\na.ts", &base).is_err());
        assert!(rewrite_playlist("#EXTM3U\nhttps://evil.com/a\n#EXT-X-ENDLIST", &base).is_err());
    }
}
