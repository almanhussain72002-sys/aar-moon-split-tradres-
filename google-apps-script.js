const SHEET_NAME = "Inquiries";

function doPost(e) {
  try {
    const sheet = getInquirySheet_();
    const data = parseRequestBody_(e);

    sheet.appendRow([
      clean_(data.timestamp) || new Date(),
      clean_(data.name),
      clean_(data.company),
      clean_(data.email),
      clean_(data.phone),
      clean_(data.country),
      clean_(data.product),
      clean_(data.quantity),
      clean_(data.message)
    ]);

    return jsonResponse_({
      ok: true,
      message: "Inquiry saved successfully."
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error.message || "Unable to save inquiry."
    });
  }
}

function doGet() {
  return jsonResponse_({
    ok: true,
    message: "AAR inquiry endpoint is running."
  });
}

function getInquirySheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Name",
      "Company",
      "Email",
      "Phone",
      "Country",
      "Product",
      "Quantity",
      "Message"
    ]);
  }

  return sheet;
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body.");
  }

  const body = e.postData.contents;

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error("Request body must be valid JSON.");
  }
}

function clean_(value) {
  return String(value || "").trim();
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
