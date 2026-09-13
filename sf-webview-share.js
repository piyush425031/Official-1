/* ═══════════════════════════════════════════════════════════════════
   sf-webview-share.js
   ───────────────────────────────────────────────────────────────────
   Native Android share for Star Follower, robust inside a WebView/APK.

   WHY THIS IS NEEDED
   The Web Share API (navigator.share) only works inside a WebView if
   the wrapper's WebChromeClient implements onShowFileChooser-style
   support for it (Android's WebView added share-sheet support around
   WebView/Chrome 89+, but many APK wrapper generators don't enable
   it, or block it entirely). In that case navigator.share either:
     - does not exist,
     - exists but rejects/throws immediately, or
     - throws asynchronously with an unhandled promise rejection
       that never reaches a .catch() written deep inside a minified
       bundle.
   This file defines a single, defensive entry point — window.__sfShare
   — that the app (and the compiled bundle) calls instead of touching
   navigator.share directly, plus a global safety net for rejections
   that slip through anyway.
   ═══════════════════════════════════════════════════════════════════ */
(function (window, document) {
  'use strict';

  /*
   * Capture the browser's original top-level opener before earn.js installs
   * its offerwall interception wrapper. This keeps the non-Capacitor fallback
   * from recursively re-entering the offerwall handler.
   */
  var nativeWindowOpen = typeof window.open === 'function'
    ? window.open.bind(window)
    : null;

  function isAndroid() {
    return /android/i.test(navigator.userAgent || '');
  }

  /*
   * Capacitor Browser is the primary path in the APK. If the plugin is not
   * installed or rejects the request, use a real top-level browser window.
   * TimeWall is never loaded into an iframe because its frame security headers
   * make that path render as a blank page.
   */
  function openTopLevelBrowserFallback(url) {
    try {
      if (nativeWindowOpen) {
        return !!nativeWindowOpen(url, '_blank', 'location=yes');
      }
    } catch (e) {}
    return false;
  }

  /*
   * Open a task/update URL in Capacitor's in-app Browser first. The APK
   * exposes the official plugin through Capacitor.Plugins.Browser, so this
   * follows the same behavior as Browser.open({ url }).
   *
   * Native wrappers differ in the bridge method they expose, so support the
   * common Android, React Native WebView, and GoNative shapes after the
   * Capacitor plugin. When no native bridge exists, the URL opens in a
   * top-level browser window instead of an iframe.
   */
  function openInAppBrowser(url) {
    if (!url || !/^https?:\/\//i.test(String(url))) return false;
    url = String(url);

    try {
      var capacitor = window.Capacitor;
      var Browser = capacitor && (
        (capacitor.Plugins && capacitor.Plugins.Browser) ||
        capacitor.Browser
      );
      if (!Browser && capacitor && typeof capacitor.registerPlugin === 'function') {
        Browser = capacitor.registerPlugin('Browser');
      }
      if (Browser && typeof Browser.open === 'function') {
        var openResult = Browser.open({ url: url });
        if (openResult && typeof openResult.catch === 'function') {
          openResult.catch(function () {
            openTopLevelBrowserFallback(url);
          });
        }
        return true;
      }
    } catch (e) {}

    var bridges = [
      [window.Android, ['openInAppBrowser', 'openCustomTab']],
      [window.SFAndroid, ['openInAppBrowser', 'openCustomTab']],
      [window.AndroidShare, ['openInAppBrowser', 'openCustomTab']]
    ];
    for (var i = 0; i < bridges.length; i++) {
      var bridge = bridges[i][0];
      var methods = bridges[i][1];
      if (!bridge) continue;
      for (var j = 0; j < methods.length; j++) {
        try {
          if (typeof bridge[methods[j]] === 'function') {
            bridge[methods[j]](url);
            return true;
          }
        } catch (e) {}
      }
    }

    try {
      if (window.gonative && window.gonative.webview) {
        if (typeof window.gonative.webview.open === 'function') {
          window.gonative.webview.open(url);
          return true;
        }
      }
    } catch (e) {}

    try {
      if (window.ReactNativeWebView &&
          typeof window.ReactNativeWebView.postMessage === 'function') {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'open_in_app_browser',
          url: url
        }));
        return true;
      }
    } catch (e) {}

    return openTopLevelBrowserFallback(url);
  }

  window.__sfOpenInAppBrowser = openInAppBrowser;

  /* Share only through the native Web Share API. */
  /**
   * window.__sfShare(text, title, url)
   * A canceled or unavailable share sheet is a safe no-op: there is no
   * redirect, URL fallback, clipboard fallback, or custom URL scheme.
   */
  function sfShare(text, title, url) {
    title = title || 'Star Follower';
    var payload = { title: title, text: text };
    if (url) payload.url = url;

    if (typeof navigator.share !== 'function') return;
    try {
      var result = navigator.share(payload);
      if (result && typeof result.catch === 'function') {
        result.catch(function () {});
      }
    } catch (e) {}
  }

  window.__sfShare = sfShare;

  /* Global safety net: some WebViews resolve navigator.share's promise
     on a later microtask outside of any reachable .catch(), especially
     when called from deep inside a minified bundle. Prevent it from
     surfacing as a red console error / crashing the WebView bridge. */
  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    var msg = (reason && (reason.message || String(reason))) || '';
    if (/share/i.test(msg) || (reason && reason.name === 'NotAllowedError')) {
      event.preventDefault();
    }
  });
}(window, document));