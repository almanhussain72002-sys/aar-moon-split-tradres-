import nodemailer from "nodemailer";

const ALLOWED_ORIGINS = [
  "https://aarmoonspirit.com",
  "https://aar-moon-split-tradres.vercel.app"
];

const EMAIL_SUBJECT = "Thank you for your inquiry | AAR Moon Spirit Traders";

function getAllowedOrigins() {
  const configuredOrigins = String(process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([...ALLOWED_ORIGINS, ...configuredOrigins]));
}

function setCorsHeaders(req, res) {
  const requestOrigin = req.headers.origin;
  const allowedOrigins = getAllowedOrigins();

  if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
    res.setHeader("Access-Control-Allow-Origin", requestOrigin || allowedOrigins[0]);
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function getJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") return JSON.parse(req.body);
  return req.body;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email || "").trim());
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeInquiryData(body) {
  const timestamp = new Date().toISOString();

  return {
    timestamp,
    name: clean(body.name || body.fullName || body.full_name),
    company: clean(body.company || body.companyName || body.company_name),
    email: clean(body.email || body.emailAddress || body.email_address),
    phone: clean(body.phone || body.whatsapp || body.phoneNumber || body.phone_number),
    country: clean(body.country),
    product: clean(body.product || body.productInterest || body.product_interest),
    quantity: clean(body.quantity || body.quantityRequired || body.quantity_required),
    message: clean(body.message)
  };
}

function getMissingEnvVars() {
  return [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "EMAIL_FROM",
    "ALLOWED_ORIGIN",
    "GOOGLE_SHEET_WEB_APP_URL"
  ].filter((key) => !process.env[key]);
}

function buildEmailText(name) {
  const customerName = String(name || "").trim() || "Customer";

  return `Dear ${customerName},

Thank you for visiting AAR Moon Spirit Traders.

We have received your inquiry successfully. Our team will connect with you soon for a good business connection.

We look forward to working with you.

Best regards,
AAR Moon Spirit Traders
Email: ${process.env.EMAIL_FROM}
`;
}

async function sendToGoogleSheet(normalizedData) {
  const response = await fetch(process.env.GOOGLE_SHEET_WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(normalizedData)
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(`Google Sheet request failed with status ${response.status}: ${responseText}`);
  }

  if (!responseText) return {};

  try {
    const parsed = JSON.parse(responseText);
    if (parsed.ok === false) {
      throw new Error(parsed.message || "Google Sheet request failed");
    }
    return parsed;
  } catch (error) {
    return { raw: responseText };
  }
}

async function sendCustomerEmail(normalizedData) {
  console.log("[Inquiry API] Email sending starts");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: `"AAR Moon Spirit Traders" <${process.env.EMAIL_FROM}>`,
    to: normalizedData.email,
    subject: EMAIL_SUBJECT,
    text: buildEmailText(normalizedData.name)
  });

  console.log("[Inquiry API] Email sent successfully");
}

export default async function handler(req, res) {
  console.log("[Inquiry API] Request starts");
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  try {
    const allowedOrigins = getAllowedOrigins();
    const requestOrigin = req.headers.origin;

    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      throw new Error(`Origin not allowed: ${requestOrigin}`);
    }

    if (req.method !== "POST") {
      throw new Error(`Method not allowed: ${req.method}`);
    }

    const missingEnvVars = getMissingEnvVars();
    if (missingEnvVars.length) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
    }

    const body = getJsonBody(req);
    console.log("[Inquiry API] Received body", body);

    const normalizedData = normalizeInquiryData(body);
    console.log("[Inquiry API] Normalized form data", normalizedData);

    if (!normalizedData.name || !normalizedData.phone || !normalizedData.product) {
      throw new Error("Name, phone, and product are required");
    }

    if (!isValidEmail(normalizedData.email)) {
      throw new Error("A valid customer email is required");
    }

    let sheetSaved = false;
    let emailSent = false;

    await sendToGoogleSheet(normalizedData);
    sheetSaved = true;
    console.log("[Inquiry API] Google Sheet success");

    console.log("[Inquiry API] Sending email");
    try {
      await sendCustomerEmail(normalizedData);
      emailSent = true;
    } catch (error) {
      console.error("[Inquiry API] Error", {
        message: error.message
      });

      return res.status(500).json({
        success: false,
        sheetSaved,
        emailSent,
        error: error.message || "Email sending failed"
      });
    }

    return res.status(200).json({
      success: true,
      sheetSaved,
      emailSent
    });
  } catch (error) {
    console.error("[Inquiry API] Error", {
      message: error.message
    });

    return res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
}
