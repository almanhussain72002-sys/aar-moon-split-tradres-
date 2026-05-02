const INQUIRY_CONFIG = {
  thankYouEmailEndpoint: "/api/send-thank-you-email",
  successMessage: "Thank you! Your inquiry has been submitted successfully.",
  errorMessage: "Something went wrong. Please try again."
};

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initAppleLandingNav();
  initStandaloneInquiryPopup();
  initScrollReveal();
  initInquiryForms();
});

function initNavigation() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelectorAll("[data-nav-close]");

  if (toggle && header) {
    toggle.addEventListener("click", () => {
      header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(header.classList.contains("open")));
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      header?.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    });
  });
}

function initAppleLandingNav() {
  const header = document.querySelector("[data-site-header]");
  if (!header) return;

  const keepSolid = document.body.classList.contains("export-site") && !document.querySelector(".export-hero");
  const updateHeader = () => {
    header.classList.toggle("is-scrolled", keepSolid || window.scrollY > 16);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

function initScrollReveal() {
  const revealItems = document.querySelectorAll(".reveal");
  if (!revealItems.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function initStandaloneInquiryPopup() {
  const path = window.location.pathname.split("/").pop().toLowerCase();
  const isHomePage = path === "" || path === "index.html";
  if (!isHomePage) return;
  if (document.querySelector("[data-inquiry-popup]")) return;

  const popup = document.createElement("div");
  popup.className = "inquiry-popup inquiry-popup--glass";
  popup.dataset.inquiryPopup = "";
  popup.setAttribute("role", "dialog");
  popup.setAttribute("aria-modal", "true");
  popup.setAttribute("aria-labelledby", "inquiry-popup-title");
  popup.innerHTML = `
    <div class="inquiry-popup__overlay"></div>
    <div class="inquiry-popup__panel" role="document">
      <button class="inquiry-popup__close" type="button" aria-label="Close inquiry form" data-popup-close>&times;</button>
      <div class="inquiry-popup__header">
        <p>Import Inquiry</p>
        <h2 id="inquiry-popup-title">Tell us what you want to import</h2>
        <span>Share your requirement and our team will review it for coffee, spices, fruits, vegetables, coconut, or custom sourcing.</span>
      </div>
      <form id="inquiryForm" class="inquiry-popup__form" data-inquiry-form data-popup-form novalidate>
        <input type="text" name="website" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
        <input type="hidden" name="formStartedAt" value="">
        <input type="hidden" name="source" value="Standalone inquiry popup">
        <div class="popup-field-grid">
          <div class="field"><label>Full Name <span>*</span></label><input type="text" name="name" autocomplete="name" required><small class="field-error" data-error-for="name"></small></div>
          <div class="field"><label>Company Name</label><input type="text" name="company" autocomplete="organization"><small class="field-error" data-error-for="company"></small></div>
        </div>
        <div class="popup-field-grid">
          <div class="field"><label>Email Address <span>*</span></label><input type="email" name="email" autocomplete="email" required><small class="field-error" data-error-for="email"></small></div>
          <div class="field"><label>Phone / WhatsApp Number <span>*</span></label><input type="tel" name="phone" inputmode="tel" autocomplete="tel" required><small class="field-error" data-error-for="phone"></small></div>
        </div>
        <div class="popup-field-grid">
          <div class="field"><label>Country <span>*</span></label><input type="text" name="country" autocomplete="country-name" required><small class="field-error" data-error-for="country"></small></div>
          <div class="field"><label>Product Interest <span>*</span></label><select name="product" required><option value="">Select product</option><option value="Coffee">Coffee</option><option value="Spices">Spices</option><option value="Fruits">Fruits</option><option value="Vegetables">Vegetables</option><option value="Coconut">Coconut</option><option value="Other">Other</option></select><small class="field-error" data-error-for="product"></small></div>
        </div>
        <div class="field"><label>Quantity Required</label><input type="text" name="quantity" placeholder="Example: 500 kg, 1 container, 25kg bags"><small class="field-error" data-error-for="quantity"></small></div>
        <div class="field"><label>Message</label><textarea name="message" placeholder="Mention destination country, product grade, packaging, timeline, or any special requirement."></textarea><small class="field-error" data-error-for="message"></small></div>
        <button class="btn btn-primary inquiry-popup__submit" type="submit" data-loading-label="Submitting...">Submit Inquiry</button>
        <div class="form-status" aria-live="polite"></div>
      </form>
    </div>
  `;

  document.body.appendChild(popup);
  document.body.classList.add("inquiry-popup-active");

  requestAnimationFrame(() => {
    popup.classList.add("is-open");
    const firstInput = popup.querySelector('[name="name"]');
    firstInput?.focus({ preventScroll: true });
  });

  const closePopup = () => {
    popup.classList.remove("is-open");
    document.body.classList.remove("inquiry-popup-active");
    setTimeout(() => popup.remove(), 260);
  };

  popup.querySelectorAll("[data-popup-close]").forEach((control) => {
    control.addEventListener("click", closePopup);
  });

  popup.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePopup();
    }
  });

  popup.addEventListener("inquiry:success", () => {
    setTimeout(closePopup, 1400);
  });
}

function initInquiryForms() {
  const form = document.getElementById('inquiryForm');
  if (!form) {
    console.log('[Inquiry Form] inquiryForm not found');
    return;
  }

  let startedAt = form.querySelector('[name="formStartedAt"]');
  if (!startedAt) {
    startedAt = document.createElement("input");
    startedAt.type = "hidden";
    startedAt.name = "formStartedAt";
    form.prepend(startedAt);
  }

  if (!form.querySelector('[name="website"]')) {
    const honeypot = document.createElement("input");
    honeypot.type = "text";
    honeypot.name = "website";
    honeypot.className = "honeypot";
    honeypot.tabIndex = -1;
    honeypot.autocomplete = "off";
    honeypot.setAttribute("aria-hidden", "true");
    form.prepend(honeypot);
  }

  startedAt.value = String(Date.now());

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      clearFieldError(form, field.name);
      setStatus(form, "", false);
    });
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('[Inquiry Form] Submit clicked');

    const validation = validateInquiryForm(this);
    if (!validation.valid) {
      setStatus(this, validation.message, true);
      return;
    }

    const submitButton = this.querySelector("[type='submit']");
    setButtonBusy(submitButton, true);
    setStatus(this, "Submitting your inquiry...", false);

    try {
      const formData = Object.fromEntries(new FormData(this).entries());
      console.log('[Inquiry Form] Sending to API', formData);

      const response = await fetch('/api/send-thank-you-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      console.log('[Inquiry Form] API response status:', response.status);

      const result = await response.json();
      console.log('[Inquiry Form] API result:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Submission failed');
      }

      alert('Thank you! Your inquiry has been submitted successfully.');
      this.reset();
      setStatus(this, INQUIRY_CONFIG.successMessage, false);
      this.dispatchEvent(new CustomEvent("inquiry:success", { bubbles: true }));
      startedAt.value = String(Date.now());
    } catch (error) {
      console.log('[Inquiry Form] API request failed', { message: error.message });
      setStatus(this, error.message || INQUIRY_CONFIG.errorMessage, true);
    } finally {
      setButtonBusy(submitButton, false);
    }
  });
}

function validateInquiryForm(form) {
  clearFieldErrors(form);

  const honeypot = getField(form, "website");
  if (honeypot.value) {
    return { valid: false, message: "Unable to submit this inquiry." };
  }

  const startedAt = Number(getField(form, "formStartedAt").value || 0);
  if (startedAt && Date.now() - startedAt < 1200) {
    return { valid: false, message: "Please wait a moment before submitting." };
  }

  const name = getField(form, "name");
  const phone = getField(form, "phone");
  const email = getField(form, "email");
  const product = getField(form, "product");
  const country = getField(form, "country");
  let isValid = true;

  if (!name.value) {
    setFieldError(form, "name", "Name is required.");
    isValid = false;
  }

  if (!phone.value) {
    setFieldError(form, "phone", "Phone is required.");
    isValid = false;
  } else if (!/^\+?[\d\s()-]{7,20}$/.test(phone.value)) {
    setFieldError(form, "phone", "Enter a valid phone number.");
    isValid = false;
  }

  if (!email.value) {
    setFieldError(form, "email", "Email is required.");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value)) {
    setFieldError(form, "email", "Enter a valid email address.");
    isValid = false;
  }

  if (!product.value) {
    setFieldError(form, "product", "Please select a product.");
    isValid = false;
  }

  if (country.input && !country.value) {
    setFieldError(form, "country", "Country is required.");
    isValid = false;
  }

  return {
    valid: isValid,
    message: isValid ? "" : "Please fix the highlighted fields."
  };
}

function getField(form, name) {
  const input = form.querySelector(`[name="${name}"]`);
  return {
    input,
    value: input ? input.value.trim() : ""
  };
}

function setFieldError(form, name, message) {
  const input = form.querySelector(`[name="${name}"]`);
  const field = input?.closest(".field");
  let error = form.querySelector(`[data-error-for="${name}"]`);

  field?.classList.add("has-error");
  input?.setAttribute("aria-invalid", "true");

  if (!error && field) {
    error = document.createElement("small");
    error.className = "field-error";
    error.dataset.errorFor = name;
    field.appendChild(error);
  }

  if (error) {
    error.textContent = message;
  }
}

function clearFieldError(form, name) {
  if (!name) return;

  const input = form.querySelector(`[name="${name}"]`);
  const field = input?.closest(".field");
  const error = form.querySelector(`[data-error-for="${name}"]`);

  field?.classList.remove("has-error");
  input?.removeAttribute("aria-invalid");
  if (error) {
    error.textContent = "";
  }
}

function clearFieldErrors(form) {
  form.querySelectorAll(".field.has-error").forEach((field) => {
    field.classList.remove("has-error");
  });

  form.querySelectorAll("[aria-invalid='true']").forEach((field) => {
    field.removeAttribute("aria-invalid");
  });

  form.querySelectorAll(".field-error").forEach((error) => {
    error.textContent = "";
  });
}

function setButtonBusy(button, isBusy) {
  if (!button) return;

  if (!button.dataset.originalLabel) {
    button.dataset.originalLabel = button.textContent;
  }

  button.disabled = isBusy;
  button.textContent = isBusy ? (button.dataset.loadingLabel || "Submitting...") : button.dataset.originalLabel;
}

function setStatus(form, message, isError) {
  let target = form.querySelector(".form-status");

  if (!target) {
    target = document.createElement("div");
    target.className = "form-status";
    target.setAttribute("aria-live", "polite");
    form.appendChild(target);
  }

  target.textContent = message;
  target.className = `form-status ${isError ? "error" : "success"}`;
}
