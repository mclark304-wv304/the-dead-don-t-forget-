// Donate widget: every [data-donate] block on the page is independent.
document.querySelectorAll("[data-donate]").forEach(block => {
  const toggle = block.querySelector("[data-donate-toggle]");
  const form = block.querySelector("[data-donate-form]");
  const errBox = block.querySelector("[data-donate-error]");
  const custom = block.querySelector("[data-donate-custom]");
  const chips = Array.from(block.querySelectorAll(".chip"));

  const showError = msg => {
    errBox.textContent = msg;
    errBox.hidden = false;
  };

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
    errBox.hidden = true;
  });

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("selected"));
      chip.classList.add("selected");
      custom.value = "";
    });
  });
  custom.addEventListener("input", () => {
    if (custom.value) chips.forEach(c => c.classList.remove("selected"));
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    errBox.hidden = true;
    const amount = custom.value
      ? custom.value
      : (block.querySelector(".chip.selected") || {}).dataset?.amount || "5";
    // Which button was pressed — PayPal (default) or Stripe card.
    const via = (e.submitter && e.submitter.dataset && e.submitter.dataset.via) || "paypal";
    const endpoint = via === "stripe" ? "/api/stripe/donate/order" : "/api/donate/order";
    // Disable both donate buttons while the request is in flight.
    const submits = Array.from(block.querySelectorAll("[data-donate-submit]"));
    submits.forEach(s => { s.disabled = true; });
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await r.json();
      if (data.url) { window.location = data.url; return; }
      throw new Error(data.error || "Donation failed to start.");
    } catch (e2) {
      showError(e2.message);
      submits.forEach(s => { s.disabled = false; });
    }
  });
});
