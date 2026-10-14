// Donate widget: every [data-donate] block on the page is independent.
document.querySelectorAll("[data-donate]").forEach(block => {
  const toggle = block.querySelector("[data-donate-toggle]");
  const form = block.querySelector("[data-donate-form]");
  const errBox = block.querySelector("[data-donate-error]");
  const custom = block.querySelector("[data-donate-custom]");
  const chips = Array.from(block.querySelectorAll(".chip"));
  const submit = block.querySelector("[data-donate-submit]");

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
    submit.disabled = true;
    try {
      const r = await fetch("/api/donate/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const data = await r.json();
      if (data.url) { window.location = data.url; return; }
      throw new Error(data.error || "Donation failed to start.");
    } catch (e2) {
      showError(e2.message);
      submit.disabled = false;
    }
  });
});
