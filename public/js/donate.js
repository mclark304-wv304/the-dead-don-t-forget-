// Donate widget: every [data-donate] block on the page is independent.
// The PayPal hosted button renders lazily on first open, because the
// PayPal SDK needs a visible container to measure.
document.querySelectorAll("[data-donate]").forEach(block => {
  const toggle = block.querySelector("[data-donate-toggle]");
  const form = block.querySelector("[data-donate-form]");
  const hosted = block.querySelector("[data-paypal-hosted]");
  let rendered = false;

  const renderHosted = () => {
    if (rendered || !hosted) return;
    rendered = true;
    const tryRender = () => {
      if (window.paypal && window.paypal.HostedButtons) {
        window.paypal.HostedButtons({ hostedButtonId: hosted.dataset.hostedId }).render("#" + hosted.id);
      } else {
        setTimeout(tryRender, 300);
      }
    };
    tryRender();
  };

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
    if (!form.hidden) renderHosted();
  });
});
