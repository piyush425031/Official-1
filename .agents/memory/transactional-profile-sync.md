---
name: Transactional profile syncing
description: The Star Follower app's Supabase profile-refresh cost boundary.
---

Profile data must be refreshed from Supabase only after a confirmed order or an offerwall postback/silent-push event. Login and recovery cache their returned payload, while navigation, tab switches, focus changes, and visibility changes read local state.

**Why:** Repeated profile reads on route changes and WebView resume events create unnecessary Supabase cost and can make mobile navigation feel stalled.

**How to apply:** New user-data UI should subscribe to the profile-synced event or local cache. Do not add polling, focus refetching, mount refetching, or visibility-triggered profile requests.