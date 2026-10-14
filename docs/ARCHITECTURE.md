# Architecture

FLUX is a Rust/Tauri 2 application for Android and Windows, with a React/TypeScript WebView. It is an independent Twitch client, not a Twitch server or a Kotlin binary port.

- `src/pages`: French product flows, using the approved FLUX mobile design.
- `src/Player.tsx`: persistent HLS player, quality selection, audio mode, mini-player, replay position and local playback.
- `src/Chat.tsx`, `src/irc.ts`: anonymous Twitch IRC over TLS, bounded message buffer, moderation removal events, Twitch/BTTV/7TV emotes; authenticated sends go through Rust/Helix.
- `src/state.tsx`, `src/storage.ts`: bounded local favorites, viewing history, bookmarks, notices, preferences and migrations. OAuth credentials are never put in localStorage.
- `src-tauri/src/twitch.rs`: fixed GraphQL queries, playback token resolution, Helix helpers and restricted media HTTP client.
- `src-tauri/src/lib.rs`: Tauri commands, Twitch device authorization, hourly validation, refresh rotation, session lifecycle.
- `src-tauri/src/vault.rs`: optional password protected session vault (Argon2id, AES-256-GCM, fresh salt and nonce). The password is required again after restarting the process. Without a vault the session exists only in native memory.
- `src-tauri/src/downloads.rs`: foreground clip/VOD downloads, cancellation, staging directories and atomic finalization. Playlists use local segments and keys after download; active/live and byte-range playlists are rejected explicitly.

## Service boundaries

Public discovery and playback use Twitch's undocumented GraphQL/Usher interfaces, as Xtra does. They can change or be blocked independently of FLUX. The public web Client ID is an identifier, not a credential. FLUX does not bypass paid access, integrity checks, or advertisements. Restricted media may require opening Twitch. Authenticated Helix operations use the user's registered Public Twitch application and approved scopes; that token is not presented to the public GraphQL client.

No bundled secret or external FLUX backend is required. Register a Public application in the Twitch developer console to enable sign-in. Anonymous browsing, local favorites and accessible public streams work without this registration.

Creator metadata and moderation use Helix. Twitch manages account registration/recovery/deletion, identity/security settings, purchases, billing, full analytics, revenue and broadcast ingestion. These flows clearly open Twitch. FLUX does not collect bank details or present invented successful transactions.

## Native security and storage

Only the local main window has the configured Tauri capabilities. Outbound media URLs are HTTPS on explicit Twitch CDN domains, with no credentials or nonstandard ports. Redirects are disabled. Individual media reads are limited to 32 MiB. Commands do not expose arbitrary filesystem paths or generic HTTP forwarding. Download IDs are validated and native asset access is scoped to the app's downloads folder. Android backup is disabled.

The vault uses a versioned envelope and authenticated ciphertext. The key is derived from the local password and not stored beside the vault. Password and session values use zeroizing native containers where practical; JS password input strings still follow JavaScript's normal garbage collection. Forgetting a vault password requires a new Twitch sign-in. Disconnect removes the local vault; remote authorizations can be revoked from Twitch's connections settings.

## Current operational limits

No native camera/RTMP encoder, Android background media service, Cast, push notifications, chat replay, translation or Xtra proxy/ad-block configuration is implemented. Audio mode and downloads require FLUX to stay open. Notifications are an in-app poll while visible. Private-message history and billing are official Twitch handoffs. This release is not full Xtra feature parity.

The browser build is an explicit layout preview; it does not pretend to provide native Twitch integration. Tests distinguish browser layout evidence, Rust live network evidence and Android emulator evidence.

## Upstream analysis

Xtra reference commit: `96772030c7712581ad150c9b8b619c77a3527e50`. Graphify was run on its repository/service package (31 Kotlin files), producing 759 graph nodes and 1666 relationships. The subset graph reports 150 dangling source references and 36 self-loops, so it was used only as a navigation aid; actual query and playlist sources were inspected directly. This was not a full audit of Xtra.
