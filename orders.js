/* ══════════════════════════════════════════════════════════════
   orders.js — Order history tracking + completion toast
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Safe login check — never assumes a bare `sfLoggedIn` identifier exists. */
  function sfLoggedIn() {
    if (typeof window.sfIsLoggedIn === 'function') return window.sfIsLoggedIn();
    var v = false;
    try { v = !!(localStorage.getItem('sf_user_id') && localStorage.getItem('sf_token')); } catch (e) {}
    window.sfLoggedIn = v;
    return v;
  }

  function initOrderToast() {
        var SVC = [
          'Instagram Followers [90 Days Guarantee]',
          'Instagram Followers [High Quality]',
          'Instagram Likes [90 Days Guarantee]',
          'Instagram Likes [Fast Delivery]',
          'Instagram Story Views', 'Instagram Reel Views',
          'Instagram Post Views', 'Instagram Saves', 'Instagram Comments'
        ];

        var toast    = document.getElementById('sf-order-toast');
        var toastMsg = document.getElementById('sf-toast-msg');
        var _timer   = null;
         var _toastTimers = [];

        toast.addEventListener('click', function () {
          clearTimeout(_timer);
          toast.classList.remove('show');
        });

        function showToast(msg) {
          clearTimeout(_timer);
          toastMsg.textContent = msg;
          toast.classList.add('show');
          _timer = setTimeout(function () { toast.classList.remove('show'); }, 9000);
        }

         function showCompletedFromProfile(data) {
           var list = (data && Array.isArray(data.newCompleted)) ? data.newCompleted : [];
           list.forEach(function (o, i) {
             var toastTimer = setTimeout(function () {
               showToast(
                 'आपका ' + o.quantity + ' ' +
                 (SVC[o.serviceIndex] || 'Service') +
                 ' का ऑर्डर सफलतापूर्वक पूरा हो चुका है! 🎉'
               );
             }, i * 10000);
             _toastTimers.push(toastTimer);
           });
         }

         /*
          * Completion notices now use the same explicit profile-sync event as
          * the rest of the UI. There is no timer or visibility-triggered GET.
          */
         window.addEventListener('sf-profile-synced', function (event) {
           var detail = event && event.detail;
           showCompletedFromProfile(detail && detail.data ? detail.data : detail);
         }, { passive: true });

         window.addEventListener('pagehide', function () {
           clearTimeout(_timer);
           _toastTimers.forEach(clearTimeout);
           _toastTimers = [];
         }, { once: true, passive: true });
  }
  if (document.body) {
    initOrderToast();
  } else {
    document.addEventListener('DOMContentLoaded', initOrderToast, { once: true });
  }
}());
