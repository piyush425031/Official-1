---
name: Transactional profile syncing
description: The Star Follower app's Supabase profile-refresh cost boundary.
---

Profile data is refreshed from Supabase once when an existing session is restored and once immediately after login or recovery. It is also refreshed after a confirmed order or an offerwall postback/silent-push event. Navigation, tab switches, focus changes, and visibility changes read local state.

**Why:** Auth transitions and app launch need live coins, order totals, and referral values, but repeated reads on route changes and WebView resume events create unnecessary Supabase cost.

**How to apply:** New user-data UI should subscribe to the profile-synced event or local cache. Keep the login/recovery response blocked until its one profile read publishes the live data. Do not add polling, focus refetching, mount refetching, or visibility-triggered profile requests.