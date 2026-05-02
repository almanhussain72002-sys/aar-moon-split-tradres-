# Google Sheets Inquiry Setup

1. Create a Google Sheet and name the first tab `Inquiries`.
2. Open **Extensions > Apps Script**.
3. Paste the code from `google-apps-script.js` into the Apps Script editor.
4. Save the project.
5. Click **Deploy > New deployment**.
6. Choose **Web app**.
7. Set **Execute as** to `Me`.
8. Set **Who has access** to `Anyone`.
9. Click **Deploy** and authorize the script.
10. Copy the Web App URL ending in `/exec`.
11. In `script.js`, replace `INQUIRY_CONFIG.sheetsEndpoint` with your copied Web App URL.

The website sends a JSON POST request with:

```json
{
  "name": "Buyer Name",
  "phone": "+919876543210",
  "email": "buyer@example.com",
  "company": "Company Name",
  "service": "Coffee",
  "message": "Shipment details",
  "page": "index.html",
  "submittedAt": "2026-05-02T00:00:00.000Z"
}
```

Each successful submission creates a row with:

`Timestamp, Name, Phone, Email, Company, Service, Message`
