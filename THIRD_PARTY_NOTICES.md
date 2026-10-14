# Third-party notices

## Xtra

FLUX is inspired by [Xtra for Twitch](https://github.com/crackededed/Xtra), originally by Andrey Asadchy and maintained by crackededed and contributors. Reference commit: `96772030c7712581ad150c9b8b619c77a3527e50`.

The files in `src-tauri/src/queries/` are copied/adapted from Xtra's `app/src/main/graphql/`. `UserVideos.graphql` adds explicit default sort and broadcast types. Playlist URL construction follows Xtra's `PlayerRepository.kt`. These materials are covered by GNU AGPL v3; FLUX distributes the same license in `LICENSE`. Original authors retain their copyright. FLUX is not endorsed by Xtra or Twitch.

## Visual assets

The original design photos are in `assets/`, with original source URLs in `assets/sources.json`. Copies in `public/images/` illustrate onboarding and local fallback screens; actual Twitch content uses its service-provided thumbnails. The font Inter is distributed through `@fontsource/inter` under the SIL Open Font License. Lucide icons are ISC licensed. App icon geometry was authored for FLUX.

## Dependencies and services

Rust/npm dependency licenses remain their respective authors' property. See Cargo.lock and package-lock.json for exact resolved versions. Tauri, React, hls.js, TanStack Query, React Router, BTTV, 7TV and Twitch are independent projects/services. The Twitch public web Client ID is a public identifier and is not a client secret. Authenticated API use requires a separately registered Public application.
