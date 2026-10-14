# Design-to-implementation coverage

The 76 Pen frames include screens and states, not 76 independent URLs. `Flux-Mobile.pen` remains the editable visual reference. Real Twitch data replaces illustrative people, counts, payments and status. This matrix states exactly where the original frames land.

| Design frames | Implementation | Behavior |
|---|---|---|
| 01 Home, 02 Explore | `/`, `/explore` | Live catalog, language/category filters, cursor pagination |
| 03 Live/chat, 19 Replay, 20 Clips | `/watch/:login` | Persistent HLS/MP4 player; current media is held across navigation |
| 04 Welcome, 09 Interests | `/welcome`, `/interests` | Local onboarding and stored interests; no claimed recommendation engine |
| 05 Sign in | `/login` | Official device authorization and local vault unlock |
| 06 Signup, 07 Verify email, 08 Recovery | `/signup`, `/recovery`, `/security` | Official Twitch account flows |
| 10 Notifications permission | `/settings/notifications` | In-app notifications setting; no system push permission is requested |
| 11 Search, 51 Filters | `/search` | Debounced search, live-only filter, pagination; language in settings |
| 12 Category | `/game/:slug` | Category live streams with pagination |
| 13 Following | `/following` | Local favorites; optional import from Twitch follows |
| 14 Live channel, 15 Offline channel, 16 Schedule, 17 About | `/channel/:login` | Live/offline states, VOD/clip catalog, schedule, biography |
| 18 Library | `/library`, `/downloads` | History, bookmarks, offline clips and completed replays |
| 21 Create clip, 75 Clip published | Player clip action | Helix creates clip; official editor completes publication. No fake local published state |
| 22 Share | Channel share button | Copies the actual Twitch link; displays the link if clipboard access fails |
| 23 Notifications, 63 Empty notifications | `/notifications` | Bounded local notices for newly live favorites |
| 24 Profile, 25 Edit profile | `/profile`, `/profile/edit` | Local stats and authenticated Twitch biography update; identity/photo handoff |
| 26 Subscribe, 27 Gift, 28 Payment, 29 Confirmed, 59 Declined | `/support/:login` | Official Twitch purchase flow, with confirmation or refusal owned by Twitch |
| 30 Subscriptions, 31 Manage subscription | `/subscriptions` | Official Twitch subscription management |
| 32 Settings, 33 Account | `/settings`, `/account` | Preferences, import follows, encrypted session storage, logout |
| 34 Playback/data, 35 Appearance, 36 Notifications, 37 Privacy | `/settings/:section` | Working persisted settings and local-data deletion |
| 38 Help | `/help` | Service boundaries, troubleshooting, license/source link |
| 39 Studio, 40 Prepare | `/studio`, `/studio/prepare` | Read/update actual channel title, category and language |
| 41 Camera/mic, 42 Preview, 43 Broadcast, 46 End, 60 Permissions refused | Studio handoff | No native capture/RTMP implementation; Twitch or an external broadcast app handles these states |
| 44 Moderation, 45 Actions | `/studio/moderation` | Authenticated timed exclusions/bans with confirmation; full moderation handoff |
| 47 Analytics, 50 Revenue | `/studio/analytics`, `/studio/revenue` | Official creator dashboard |
| 48 Creator contents, 49 Publish replay | Own channel + Twitch dashboard | Public replay/clip browsing; publication is managed on Twitch |
| 52 Player options, 76 Audio only | Player options | Quality selection, sound, audio-only track when available, download |
| 53 Report, 54 Report sent | `/report/:login` | Official reporting; FLUX does not claim to have submitted it |
| 55 Empty search, 56 Empty follows, 57 Offline, 58 Unavailable, 61 Loading | Contextual states | Error recovery, local data, retry, skeletons and empty-state actions |
| 62 Subscriber chat | Chat room status | IRC room-state message; Twitch decides authenticated sends |
| 64 Expired session | Native API error / `/login` | Hourly validation, refresh or explicit reconnect |
| 65 Landscape, 66 Mini player | Responsive player | Landscape composition and in-app mini-player; not OS Picture-in-Picture |
| 67 Keyboard chat, 68 Emotes | Chat composer | Keyboard input, Twitch/BTTV/7TV rendering and third-party emote picker |
| 69 Private messages, 70 Conversation | `/messages` | Clear official handoff; private history is unavailable through the public API |
| 71 Form errors, 72 High contrast | Contextual validation / appearance | Form validation and persisted opaque contrast mode |
| 73 Two-factor auth, 74 Delete account | `/security`, `/delete-account` | Official security/account flows; local logout never deletes Twitch account |

The operational limits above are intentional and visible. A screen that hands off to Twitch is not counted as an independently implemented payment, camera, messaging or broadcast service.
