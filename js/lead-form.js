/*
 * Euskania — contact form handler for the static Framer export.
 * Replaces Framer's own form submission (which only works on Framer hosting)
 * and sends leads to the inbox through Web3Forms.
 */
(function () {
  "use strict";

  // Public Web3Forms access key (designed to live in client code).
  var ACCESS_KEY = "f215e0f9-314f-4ddc-b0d3-7927b48d934d";
  var ENDPOINT = "https://api.web3forms.com/submit";

  var TEXT = {
    sending: "Enviando…",
    success: "¡Gracias! Hemos recibido tu mensaje. Te respondemos en menos de 24 horas.",
    error: "No se ha podido enviar el formulario. Escríbenos a euskania.es@gmail.com o por WhatsApp al +34 624 161 228.",
    invalidEmail: "Revisa el correo electrónico.",
    missing: "Rellena tu nombre y un teléfono o correo para poder contactarte.",
  };

  // Hidden decoy fields Framer adds to catch bots.
  var HONEYPOTS = ["website", "company", "message", "subject", "title", "description", "feedback", "notes", "details", "remarks", "comments"];

  function findForm(target) {
    return target && target.closest ? target.closest("form[data-framer-form]") : null;
  }

  function field(form, selector) {
    var el = form.querySelector(selector);
    return el ? String(el.value || "").trim() : "";
  }

  function readLead(form) {
    var select = form.querySelector("select");
    var propertyType = "";
    if (select && select.selectedIndex > 0) propertyType = select.options[select.selectedIndex].text.trim();
    return {
      name: field(form, 'input[placeholder="Nombre y apellidos"]'),
      phone: field(form, 'input[placeholder^="+34"]'),
      email: field(form, 'input[type="email"]'),
      propertyType: propertyType,
      message: field(form, "textarea"),
    };
  }

  function isBot(form) {
    return HONEYPOTS.some(function (name) {
      var el = form.querySelector('input[name="' + name + '"]');
      return el && String(el.value || "").trim() !== "";
    });
  }

  function statusBox(form) {
    var box = form.querySelector("[data-lead-status]");
    if (!box) {
      box = document.createElement("p");
      box.setAttribute("data-lead-status", "");
      box.setAttribute("role", "status");
      box.setAttribute("aria-live", "polite");
      box.style.margin = "4px 0 0";
      box.style.fontSize = "14px";
      box.style.lineHeight = "1.4";
      box.style.width = "100%";
      form.appendChild(box);
    }
    return box;
  }

  function showStatus(form, text, kind) {
    var box = statusBox(form);
    box.textContent = text;
    box.style.color = kind === "error" ? "#b42318" : kind === "ok" ? "#067647" : "inherit";
  }

  function setButton(form, busy) {
    var button = form.querySelector('button[type="submit"]');
    if (!button) return;
    button.disabled = busy;
    button.style.opacity = busy ? "0.6" : "";
    button.style.cursor = busy ? "progress" : "";
  }

  function onSubmit(event) {
    var form = findForm(event.target);
    if (!form) return;

    // Stop Framer's runtime from handling the submission.
    event.preventDefault();
    event.stopImmediatePropagation();

    if (form.getAttribute("data-lead-busy") === "1") return;

    var lead = readLead(form);
    if (!lead.name || (!lead.phone && !lead.email)) {
      showStatus(form, TEXT.missing, "error");
      return;
    }
    if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
      showStatus(form, TEXT.invalidEmail, "error");
      return;
    }

    // Bots get a fake success and nothing is sent.
    if (isBot(form)) {
      form.reset();
      showStatus(form, TEXT.success, "ok");
      return;
    }

    form.setAttribute("data-lead-busy", "1");
    setButton(form, true);
    showStatus(form, TEXT.sending, "info");

    var payload = {
      access_key: ACCESS_KEY,
      subject: "Nueva solicitud web — " + (lead.propertyType || "Euskania"),
      from_name: "Web Euskania",
      botcheck: false,
      Nombre: lead.name,
      "Teléfono": lead.phone || "—",
      Email: lead.email || "—",
      "Tipo de propiedad": lead.propertyType || "—",
      Mensaje: lead.message || "—",
      "Página": location.href,
    };
    if (lead.email) payload.replyto = lead.email;

    fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || !data || data.success !== true) throw new Error("send failed");
        });
      })
      .then(function () {
        form.reset();
        showStatus(form, TEXT.success, "ok");
      })
      .catch(function () {
        showStatus(form, TEXT.error, "error");
      })
      .then(function () {
        form.removeAttribute("data-lead-busy");
        setButton(form, false);
      });
  }

  // Capture phase on window runs before Framer's React handlers.
  window.addEventListener("submit", onSubmit, true);
})();
