# Thank-you Email Backend Setup

The customer thank-you email is handled by the secure backend route:

`/api/send-thank-you-email`

The frontend first submits the inquiry to the configured Google Sheet Web App URL. After that request succeeds, it calls this backend route to send the customer thank-you email with Nodemailer.

## Environment Variables

Keep these values in `.env` locally and in your hosting provider environment settings for production:

```env
EMAIL_FROM=info@aarmoonsplit.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=info@aarmoonsplit.com
SMTP_PASS=YOUR_APP_PASSWORD_HERE
ALLOWED_ORIGIN=https://aarmoonspirit.com
```

Do not put `SMTP_PASS` in frontend JavaScript, HTML, or CSS.

## Deploy Notes

1. Deploy the site to a Node/serverless hosting platform such as Vercel.
2. Add the environment variables above in the hosting dashboard.
3. Install dependencies during deployment from `package.json`.
4. Confirm the production domain matches `ALLOWED_ORIGIN`.

If your final domain is different, update `ALLOWED_ORIGIN` before testing the live form.
