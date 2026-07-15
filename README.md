# ShortLoop Dashboard

A Next.js 14 App Router dashboard backed by a public Google Sheet. Two views:
- `/internal` — dark-theme performance dashboard for the ShortLoop team
- `/dealership` — light-theme client-facing view with a per-dealer selector

---

## How it works

Both pages are server components. On each request (after the 60-second ISR window), Next.js re-fetches the Google Sheet server-side and regenerates the page in the background. **The Sheets API is never called from the browser** — the API key stays server-side and is not embedded in the client JS bundle.

---

## 1. Make the Google Sheet public

1. Open your Google Sheet.
2. Click **Share** (top right).
3. Under "General access", change **Restricted** → **Anyone with the link**.
4. Set the role to **Viewer**.
5. Click **Done**.

The sheet must be public so the Sheets API can fetch it without OAuth.

---

## 2. Get a Google API Key

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. In the left sidebar → **APIs & Services** → **Library**.
4. Search for **Google Sheets API** and click **Enable**.
5. Go to **APIs & Services** → **Credentials**.
6. Click **+ Create Credentials** → **API key**.
7. Copy the generated key.
8. Click **Edit API key** (pencil icon) → under **API restrictions**, select **Restrict key** → choose **Google Sheets API** → **Save**.

Restricting the key means it can only query Sheets — even if it were ever exposed, it can't be used for anything else.

---

## 3. Local development

Create a `.env.local` file in the project root (this file is gitignored and never committed):

```
NEXT_PUBLIC_GOOGLE_SHEET_ID=your_sheet_id_or_full_url
NEXT_PUBLIC_GOOGLE_API_KEY=your_api_key
```

`NEXT_PUBLIC_GOOGLE_SHEET_ID` accepts either the bare spreadsheet ID or the full Google Sheets URL — the app extracts the ID automatically.

Run the dev server:

```bash
npm install
npm run dev
```

Verify the connection at [http://localhost:3000/api/test-sheets](http://localhost:3000/api/test-sheets) — it returns the first 5 rows and total row count as JSON.

---

## 4. Add environment variables in Vercel

1. Open your project in the [Vercel dashboard](https://vercel.com/dashboard).
2. Go to **Settings** → **Environment Variables**.
3. Add the following two variables (for **Production**, **Preview**, and **Development**):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_SHEET_ID` | Your spreadsheet ID or full URL |
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Your restricted API key |

4. Click **Save** for each.

---

## 5. Deploy to Vercel

```bash
npx vercel --prod
```

On first run, the CLI walks you through linking the project to your Vercel account and team. Subsequent deploys use the saved configuration.

No `vercel.json` is needed — Next.js 14 is detected and configured automatically.

---

## Auto-refresh from the sheet

Both pages use ISR (`export const revalidate = 60`). After deployment, Vercel serves the cached page instantly and regenerates it in the background every 60 seconds. Any edits you make to the Google Sheet are reflected on the live site within ~60 seconds — no redeployment required.

---

## Pre-deploy checklist

- [ ] Google Sheet is set to **Anyone with the link → Viewer**
- [ ] Google Sheets API is **enabled** in Cloud Console for your project
- [ ] API key is **restricted** to Google Sheets API only
- [ ] Both env vars are set in the Vercel dashboard under **Settings → Environment Variables**
- [ ] `npm run build` passes locally without errors
- [ ] `/api/test-sheets` returns data (verify locally before deploying)
- [ ] The correct sheet tab name is `shortloop_agent_performance_data` in `lib/sheets.js`

---

## Project structure

```
app/
  internal/         # Dark-theme internal performance dashboard
  dealership/       # Light-theme dealership client dashboard
  api/test-sheets/  # Connection test endpoint (can be removed in production)
  layout.jsx        # Root layout with DM Sans font
  not-found.jsx     # Branded 404 page
components/
  layout/Topbar     # Sticky nav with cross-dashboard switch
  ui/               # KPICard, ChartCard, FilterBar, SectionLabel
lib/
  sheets.js         # Google Sheets fetch + row parsing
  metrics.js        # Shared aggregation helpers
  format.js         # fmtMonth helper
```
