/* Scroll reveal — progressive enhancement. The .reveal class is added by JS,
   so if this script never runs the content simply renders normally.
   Safety net: any element still hidden 3s after load is force-revealed,
   so content can never be stuck invisible on any browser. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var els = document.querySelectorAll('.card, .episode-block, .product');
  if (!els.length) return;
  els.forEach(function (el) { el.classList.add('reveal'); });

  function forceReveal() {
    els.forEach(function (el) { el.classList.add('visible'); });
  }

  if (!('IntersectionObserver' in window)) {
    forceReveal();
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
  els.forEach(function (el) { io.observe(el); });

  /* Fallback: if anything is still hidden after 3s (observer quirk,
     tab backgrounded, weird mobile viewport), reveal everything. */
  setTimeout(function () {
    var stuck = false;
    els.forEach(function (el) {
      if (!el.classList.contains('visible')) stuck = true;
    });
    if (stuck) {
      forceReveal();
      io.disconnect();
    }
  }, 3000);
})();
