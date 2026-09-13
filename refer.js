/* ══════════════════════════════════════════════════════════════
   refer.js — Referral system, referral code + native share
   ──────────────────────────────────────────────────────────────
   The compiled bundle's share button calls window.__sfShare(text,
   title). That function is normally provided by the native bridge
   file sf-webview-share.js (loaded just before this module in
   index.html). This module only fills the gap when the bridge is
   missing, so behaviour on the APK/WebView stays byte-identical
   while the browser still gets a working share sheet.
   ══════════════════════════════════════════════════════════════ */
(function (window) {
  'use strict';

  var SHARE_BASE = 'https://star-follower.github.io/Official/';

  /* Referral code helper — reads the cached profile written by the
     view cache, so no extra network call is ever made for it. */
  window.__sfReferralCode = function () {
    try {
      var uid = localStorage.getItem('sf_user_id') || '';
      if (!uid) return '';
      var cache = JSON.parse(localStorage.getItem('sf_view_cache_v2') || '{}');
      var entry = cache['/api/user/' + uid];
      var code = entry && entry.data && entry.data.referralCode;
      return code ? String(code) : '';
    } catch (e) {
      return '';
    }
  };

  window.__sfReferralLink = function (code) {
    var c = code || window.__sfReferralCode();
    return c ? SHARE_BASE + '?ref=' + encodeURIComponent(c) : SHARE_BASE;
  };

  /* Native share handler with no redirect or custom-scheme fallback. */
  if (typeof window.__sfShare !== 'function') {
    window.__sfShare = function (text, title) {
      var message = String(text == null ? '' : text);
      if (typeof navigator.share !== 'function') return;
      try {
        var result = navigator.share({
          title: title || 'Star Follower',
          text: message
        });
        if (result && typeof result.catch === 'function') {
          result.catch(function () {});
        }
      } catch (e) {}
    };
  }
}(window));
