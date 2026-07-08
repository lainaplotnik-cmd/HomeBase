# HomeBase

A modern family allowance and values hub. React/Vite front end + Google Sheets backend via Google Apps Script.

## 1) Set up Google Sheet
1. Create a Google Sheet named `HomeBase`.
2. Go to **Extensions → Apps Script**.
3. Replace the default `Code.gs` with the contents of `apps-script-Code.gs`.
4. Save.
5. In Apps Script, select the function `setupHomeBase` from the dropdown and click **Run**. Authorize it. This creates the tabs and starter data.

## 2) Deploy Apps Script
1. Click **Deploy → New deployment**.
2. Choose type: **Web app**.
3. Execute as: **Me**.
4. Who has access: **Anyone** or **Anyone with the link**.
5. Deploy and copy the Web App URL.

## 3) Connect the React app
Create a file named `.env` in this folder:

```bash
VITE_GOOGLE_SCRIPT_URL="PASTE_YOUR_WEB_APP_URL_HERE"
```

## 4) Run locally
```bash
npm install
npm run dev
```

## 5) GitHub / Vercel
Push this folder to GitHub. In Vercel, import the repo and add the same environment variable:

`VITE_GOOGLE_SCRIPT_URL = your Apps Script web app URL`

## Editing the shopping list
Change rows in the Google Sheet `Rules` tab. Set `active` to FALSE to hide a rule without deleting history.
