// THE DEAD DON'T FORGET — hidden Easter egg.
// DESKTOP: type E-L-I-A-S in sequence, anywhere on the site, and Elias whispers back.
// MOBILE (no keyboard): tap the footer 5 times quickly (not on a link) — same modal.
// No visible hint exists anywhere on the site; this file is the only trace.
(function () {
  "use strict";

  var SEQUENCE = "elias";
  var RESET_MS = 2000;          // sequence resets after 2s of no matching input
  var CLAIM_KEY = "ddf_easter_egg_claimed";
  var progress = 0;
  var timer = null;

  function reset() {
    progress = 0;
    if (timer) { clearTimeout(timer); timer = null; }
  }

  function armReset() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(reset, RESET_MS);
  }

  document.addEventListener("keydown", function (e) {
    // Never hijack real typing in form fields.
    var t = e.target;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
    if (!e.key || e.key.length !== 1) return;

    var ch = e.key.toLowerCase();
    if (ch === SEQUENCE.charAt(progress)) {
      progress++;
      armReset();
      if (progress === SEQUENCE.length) { reset(); openModal(); }
    } else {
      // Mismatch: start over, but a lone "e" may begin a new attempt.
      reset();
      if (ch === SEQUENCE.charAt(0)) { progress = 1; armReset(); }
    }
  });

  function alreadyClaimed() {
    try { return localStorage.getItem(CLAIM_KEY) === "1"; }
    catch (err) { return false; }
  }

  function markClaimed() {
    try { localStorage.setItem(CLAIM_KEY, "1"); } catch (err) { /* private mode */ }
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  var overlay = null;

  function closeModal() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    document.removeEventListener("keydown", escHandler);
  }

  function escHandler(e) {
    if (e.key === "Escape") closeModal();
  }

  // state: "offer" | "already" | "success" | "closed" | "error"
  function render(state, soulNumber) {
    var modal = el("div", "egg-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");

    if (state === "offer") {
      modal.appendChild(el("div", "egg-kicker", "psst&hellip;"));
      modal.appendChild(el("h2", null, "You heard <span>him</span>."));
      modal.appendChild(el("p", null,
        "Elias doesn&rsquo;t whisper to just anyone. Claim your reward &mdash; " +
        "Episode 4 Early Access, free. Only 13 souls will ever find this."));
      var claim = el("button", "btn", "Claim your soul");
      claim.type = "button";
      claim.addEventListener("click", doClaim);
      modal.appendChild(claim);
      modal.appendChild(el("br"));
    } else if (state === "already") {
      modal.appendChild(el("div", "egg-kicker", "the ledger remembers"));
      modal.appendChild(el("h2", null, "You already <span>claimed</span> your soul."));
      modal.appendChild(el("p", null,
        "One soul, one claim. Your Episode 4 Early Access is waiting."));
      var watch1 = el("a", "btn", "Watch Episode 4");
      watch1.href = "/watch/ep4";
      modal.appendChild(watch1);
      modal.appendChild(el("br"));
    } else if (state === "success") {
      modal.appendChild(el("div", "egg-kicker", "it is written"));
      modal.appendChild(el("h2", null, "Soul <span>claimed</span>."));
      modal.appendChild(el("div", "egg-soul", "#" + soulNumber));
      modal.appendChild(el("p", null,
        "You are soul " + soulNumber + " of 13. Episode 4 Early Access is yours &mdash; no payment, no questions."));
      var watch2 = el("a", "btn", "Watch Episode 4");
      watch2.href = "/watch/ep4";
      modal.appendChild(watch2);
      modal.appendChild(el("br"));
    } else if (state === "closed") {
      modal.appendChild(el("div", "egg-kicker", "too late"));
      modal.appendChild(el("h2", null, "The gate is <span>closed</span>."));
      modal.appendChild(el("p", null,
        "The 13 souls are taken. Elias has stopped whispering &mdash; for now."));
    } else { // error
      modal.appendChild(el("div", "egg-kicker", "static"));
      modal.appendChild(el("h2", null, "The whisper <span>faded</span>."));
      modal.appendChild(el("p", null,
        "Something went wrong on our end. Try again in a moment."));
    }

    var close = el("button", "egg-close", "Slip back into the dark");
    close.type = "button";
    close.addEventListener("click", closeModal);
    modal.appendChild(close);

    overlay.innerHTML = "";
    overlay.appendChild(modal);
  }

  function doClaim() {
    render("offer", null); // keep modal open; swap content on response
    var modal = overlay.firstChild;
    var btn = modal.querySelector(".btn");
    if (btn) { btn.disabled = true; btn.textContent = "Listening\u2026"; }

    fetch("/api/easter-egg/claim", { method: "POST", credentials: "same-origin" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.ok) {
          markClaimed();
          render("success", data.soulNumber);
        } else if (data && data.reason === "closed") {
          render("closed", null);
        } else {
          render("error", null);
        }
      })
      .catch(function () { render("error", null); });
  }

  function openModal() {
    if (overlay) return; // already open
    overlay = el("div", "egg-overlay");
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    document.addEventListener("keydown", escHandler);
    render(alreadyClaimed() ? "already" : "offer", null);
  }

  // ── Touch fallback: phones have no keyboard, so 5 quick taps on the
  // footer (anywhere that isn't a link or button) opens the same modal. ──
  var TAP_COUNT = 5;
  var TAP_WINDOW_MS = 3000;
  var taps = 0;
  var tapTimer = null;

  function footerTap(e) {
    var t = e.target;
    if (t && t.closest && t.closest("a,button")) return; // real taps keep working
    taps++;
    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = setTimeout(function () { taps = 0; tapTimer = null; }, TAP_WINDOW_MS);
    if (taps >= TAP_COUNT) {
      taps = 0;
      if (tapTimer) { clearTimeout(tapTimer); tapTimer = null; }
      openModal();
    }
  }

  function armFooter() {
    var footer = document.querySelector("footer");
    if (footer) { footer.addEventListener("click", footerTap); return true; }
    return false;
  }
  if (!armFooter()) {
    document.addEventListener("DOMContentLoaded", armFooter);
  }
})();
