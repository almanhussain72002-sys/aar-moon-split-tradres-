const INQUIRY_CONFIG = {
  whatsappNumber: "917353842099",
  sheetsEndpoint: "https://script.google.com/macros/s/AKfycbz2GN_c_XYsqR7gnAblr2ICD2RMTy0h4MxvJwyDxAFmCiP6XtTKzxPo6rwMchA4Aj8nMw/exec"
};

const PHONE_INPUT_CONFIG = {
  onlyCountries: ["in", "ae", "sa", "om", "qa", "kw", "us", "gb"],
  countryOrder: ["ae", "sa", "om", "qa", "kw", "us", "gb", "in"],
  initialCountry: "ae"
};

document.addEventListener("DOMContentLoaded", () => {
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

  const revealItems = document.querySelectorAll(".reveal");
  if (revealItems.length) {
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

  // Inquiry forms submit to Google Sheets via Apps Script and can also open WhatsApp without reloading.
  const forms = document.querySelectorAll("[data-inquiry-form]");
  forms.forEach((form) => {
    const status = form.querySelector(".form-status");
    const whatsappButton = form.querySelector("[data-whatsapp-trigger]");
    const submitButton = form.querySelector("[type='submit']");
    const phoneInput = form.querySelector("[name='phone']");
    const iti = initPhoneInput(phoneInput);

    if (whatsappButton) {
      whatsappButton.addEventListener("click", async () => {
        const validation = await validateInquiryForm(form, iti);
        if (!validation.valid) {
          setStatus(status, validation.message, true);
          return;
        }

        window.open(buildWhatsAppUrl(validation.data), "_blank", "noopener");
      });
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const validation = await validateInquiryForm(form, iti);
      if (!validation.valid) {
        setStatus(status, validation.message, true);
        return;
      }

      const inquiry = validation.data;
      setStatus(status, "Sending your inquiry. Please wait...", false);
      setFormBusy(submitButton, true);
      if (whatsappButton) {
        whatsappButton.disabled = true;
      }

      try {
        await sendInquiryToGoogleSheets(inquiry);
        setStatus(status, "Inquiry submitted successfully. Opening WhatsApp now...", false);
        window.open(buildWhatsAppUrl(inquiry), "_blank", "noopener");
        form.reset();
        if (iti) {
          iti.setCountry(PHONE_INPUT_CONFIG.initialCountry);
        }
        phoneInput?.focus();
      } catch (error) {
        setStatus(status, "We could not submit your inquiry right now. Please try again or use WhatsApp directly.", true);
      } finally {
        setFormBusy(submitButton, false);
        if (whatsappButton) {
          whatsappButton.disabled = false;
        }
      }
    });
  });
});

function initPhoneInput(input) {
  if (!input || typeof window.intlTelInput !== "function") return null;

  return window.intlTelInput(input, {
    onlyCountries: PHONE_INPUT_CONFIG.onlyCountries,
    countryOrder: PHONE_INPUT_CONFIG.countryOrder,
    initialCountry: PHONE_INPUT_CONFIG.initialCountry,
    separateDialCode: false,
    strictMode: true,
    formatAsYouType: true,
    autoPlaceholder: "aggressive",
    countrySearch: true,
    loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.12.1/dist/js/utils.js")
  });
}

async function validateInquiryForm(form, iti) {
  const name = form.querySelector("[name='name']");
  const email = form.querySelector("[name='email']");
  const phone = form.querySelector("[name='phone']");
  const country = form.querySelector("[name='country']");
  const product = form.querySelector("[name='product']");
  const quantity = form.querySelector("[name='quantity']");
  const message = form.querySelector("[name='message']");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name?.value.trim()) {
    return { valid: false, message: "Please enter your full name." };
  }

  if (!emailPattern.test(email?.value.trim() || "")) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  if (!phone?.value.trim()) {
    return { valid: false, message: "Please enter your phone number." };
  }

  let phoneNumber = phone.value.trim();
  if (iti) {
    if (!iti.isValidNumber()) {
      return { valid: false, message: "Please enter a valid international phone number." };
    }
    phoneNumber = iti.getNumber();
  } else if (!phoneNumber.startsWith("+")) {
    return { valid: false, message: "Please enter a valid phone number with country code." };
  }

  if (!country?.value.trim()) {
    return { valid: false, message: "Please enter your country." };
  }

  if (!product?.value.trim()) {
    return { valid: false, message: "Please select the product you are interested in." };
  }

  if (!quantity?.value.trim()) {
    return { valid: false, message: "Please enter the required quantity." };
  }

  if ((message?.value.trim() || "").length < 12) {
    return { valid: false, message: "Please enter a short message about your requirement." };
  }

  return {
      valid: true,
      data: {
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phoneNumber,
        country: country.value.trim(),
        product: product.value.trim(),
        quantity: quantity.value.trim(),
        message: message.value.trim(),
        page: window.location.pathname.split("/").pop() || "index.html",
      submittedAt: new Date().toISOString()
    }
  };
}

async function sendInquiryToGoogleSheets(inquiry) {
  if (!INQUIRY_CONFIG.sheetsEndpoint || INQUIRY_CONFIG.sheetsEndpoint.includes("PASTE_YOUR")) {
    throw new Error("Google Apps Script endpoint is not configured.");
  }

  const payload = new URLSearchParams(inquiry);
  const response = await fetch(INQUIRY_CONFIG.sheetsEndpoint, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: payload.toString()
  });

  return response;
}

function buildWhatsAppUrl(inquiry) {
  const text = [
    "Hello, I am interested in your export products. Please share details.",
    "",
    `Name: ${inquiry.name}`,
    `Country: ${inquiry.country}`,
    `Product: ${inquiry.product}`,
    `Quantity: ${inquiry.quantity}`,
    `Phone: ${inquiry.phone}`,
    `Email: ${inquiry.email}`,
    `Message: ${inquiry.message}`
  ].join("\n");

  return `https://wa.me/${INQUIRY_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function setFormBusy(button, isBusy) {
  if (!button) return;
  button.disabled = isBusy;
  button.textContent = isBusy ? "Sending..." : button.dataset.defaultLabel || "Submit Inquiry";
}

function setStatus(target, message, isError) {
  if (!target) return;
  target.textContent = message;
  target.className = `form-status ${isError ? "error" : "success"}`;
}
