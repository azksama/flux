//! Opt-in read-only network integration tests. No credentials, account mutations or chat sends.
use crate::twitch::*;
use serde_json::json;
#[tokio::test]
#[ignore = "Requires live Twitch connectivity"]
async fn public_twitch_catalog_and_media() {
    let c = client();
    let top = browse(&c, Browse::Streams, json!({"first":2,"languages":["FR"]}))
        .await
        .unwrap();
    let first = &top["streams"]["edges"][0]["node"];
    let login = first["broadcaster"]["login"].as_str().unwrap();
    let channel = browse(&c, Browse::Channel, json!({"login":login}))
        .await
        .unwrap();
    assert!(channel["user"]["id"].is_string());
    let games = browse(&c, Browse::Games, json!({"first":2})).await.unwrap();
    let slug = games["games"]["edges"][0]["node"]["slug"].as_str().unwrap();
    for (kind, vars) in [
        (Browse::Game, json!({"slug":slug,"first":2})),
        (Browse::Search, json!({"query":login,"first":2})),
        (Browse::Following, json!({"logins":[login]})),
        (Browse::Videos, json!({"login":login,"first":2})),
        (Browse::Clips, json!({"login":login,"first":2})),
        (Browse::About, json!({"login":login})),
    ] {
        let v = browse(&c, kind, vars).await.unwrap();
        assert!(v.is_object());
    }
    let url = playback(&c, MediaKind::Live, login).await.unwrap();
    let manifest = media(&c, &url).await.unwrap();
    let text = String::from_utf8(manifest).unwrap();
    assert!(text.starts_with("#EXTM3U"));
    let playlist = text
        .lines()
        .find(|s| s.starts_with("https://"))
        .expect("variant playlist");
    let body = String::from_utf8(media(&c, playlist).await.unwrap()).unwrap();
    assert!(body.starts_with("#EXTM3U"));
    let segment = body
        .lines()
        .find(|s| !s.is_empty() && !s.starts_with('#'))
        .expect("media segment");
    let base = url::Url::parse(playlist).unwrap();
    let segment_url = base.join(segment).unwrap();
    let bytes = media(&c, segment_url.as_str()).await.unwrap();
    assert!(bytes.len() > 100);
    println!("Live catalog, channel, search, categories, follows, VOD/clip lists, about, HLS master/variant and segment verified.");
}
