# Multi-Outlet Google Review System

**One codebase. Infinite outlets. Zero server costs.**

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        YOU (ADMIN)                              │
│  1. Add outlet: node manage.js add "Joe's Pizza" "GMAPS_URL"   │
│  2. Generate QR:  node manage.js qr "joes-pizza"               │
│  3. Print QR, give to outlet                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER (AT OUTLET)                        │
│  1. Scans QR → opens YOUR generic landing page                 │
│  2. Sees outlet name, picks 1-5 stars                          │
│  3. Taps "Continue to Google Maps"                             │
│  4. Google Maps loads in iframe, pre-filled with:              │
│     - Random review text (100 templates, shuffled)             │
│     - Their selected star rating                               │
│  5. Edits if wanted, solves CAPTCHA (rare), taps "Post"        │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Configure Your Domain
Edit `manage.js` line 10:
```javascript
const BASE_URL = 'https://reviews.yourdomain.com'; // Your actual domain
```

### 2. Add Outlets
```bash
# Add first outlet
node manage.js add "Demo Café" "https://www.google.com/maps/review/ChIJ...long_google_place_id..."

# Add more
node manage.js add "Joe's Pizza" "https://www.google.com/maps/review/ChIJ..."
node manage.js add "Sunset Bar" "https://www.google.com/maps/review/ChIJ..."
```

### 3. Generate QR Codes
```bash
node manage.js qr "demo-cafe"
node manage.js qr "joes-pizza"
node manage.js qr "sunset-bar"
```
QR codes saved to `qr/` folder as PNG files.

### 4. Deploy (Free, 2 minutes)
Drag this entire folder to:
- **Netlify Drop**: https://app.netlify.com/drop
- **Vercel**: `npx vercel`
- **Cloudflare Pages**: Connect GitHub repo
- **GitHub Pages**: Push to repo, enable Pages

### 5. Give QR to Outlets
Each outlet gets their own QR code. Customers scan → leave review for THAT outlet only.

---

## File Structure

```
├── index.html        # Generic landing page (customer sees this)
├── review.html       # Google Maps iframe + auto-fill logic
├── outlets.json      # 👈 EDIT THIS TO ADD OUTLETS
├── manage.js         # CLI tool for adding outlets + QR gen
├── qr/               # Generated QR codes (auto-created)
└── README.md         # This file
```

---

## Editing Outlets (Easiest Way)

**Just edit `outlets.json` directly:**

```json
{
  "outlets": {
    "my-new-cafe": {
      "name": "My New Café",
      "googleMapsReviewUrl": "https://www.google.com/maps/review/PASTE_URL_HERE",
      "qrCodePath": "qr/my-new-cafe.png"
    }
  }
}
```

Then run:
```bash
node manage.js qr "my-new-cafe"
```

---

## Getting the Google Maps Review URL

1. Open Google Maps → Search your business
2. Click "Write a review" 
3. **Copy the URL from browser address bar** (looks like `https://www.google.com/maps/review/ChIJ...`)
4. Paste into `outlets.json` or `manage.js add`

---

## Customer Flow Details

| Step | What Happens | Technical |
|------|--------------|-----------|
| QR Scan | Opens `https://yourdomain.com/?outlet=joes-pizza` | URL param identifies outlet |
| Landing Page | Shows outlet name, 5-star picker, "Continue" button | Generic, branded, mobile-first |
| Tap Continue | Stores review text + rating + outlet URL in `sessionStorage` | No server, client-side only |
| Redirect | Loads `review.html` | Same domain, no cross-origin issues |
| Iframe Loads | Google Maps review page for THAT outlet | `outlets.json` provides URL |
| Auto-Fill | JS injects into iframe: types review, clicks stars | Human-like typing, proper events |
| User Posts | Sees pre-filled form, edits if wanted, taps Post | CAPTCHA solved by user (their session) |

---

## Why This Works at Scale

| Concern | Solution |
|---------|----------|
| **CAPTCHA** | Runs in customer's browser → their Google session → rarely appears |
| **Rate limits** | 1 request per real customer per real device → invisible to Google |
| **Multiple outlets** | Each QR has `?outlet=unique-id` → loads correct Google Maps URL |
| **Zero server** | Static files only → $0/month on Netlify/Vercel/CF Pages |
| **Easy updates** | Edit `outlets.json` → redeploy (30 sec) |
| **Analytics** | Add Plausible/GA to `index.html` → track scans, conversions |

---

## Customization

### Change Review Templates
Edit `REVIEW_TEMPLATES` array in both `index.html` and `review.html` (keep in sync).

### Branding
- Colors: Search `#1a73e8` in both HTML files
- Logo: Replace the ★ in `.logo` div with your SVG
- Text: Edit headlines in `index.html`

### Add Analytics
In `index.html` `<head>`:
```html
<script defer data-domain="yourdomain.com" src="https://plausible.io/js/script.js"></script>
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Outlet not found" | Check `outlets.json` has the exact `outlet` ID from QR URL |
| Auto-fill doesn't work | Browser blocks cross-origin iframe script → fallback shows copy-paste box |
| QR code not generating | Run `npm install qrcode` or use online QR generator with the customer URL |
| Google Maps URL changes | Update `outlets.json` → redeploy |

---

## Cost Breakdown

| Item | Cost |
|------|------|
| Hosting (Netlify/Vercel/CF Pages) | **Free** |
| Domain | ~$12/yr (optional, use free subdomain) |
| QR codes | **Free** (generated locally) |
| Google Maps API | **Free** (using public review URLs) |
| **Total** | **$0–12/year** |

---

## Scaling Beyond 50 Outlets

Still works perfectly. For 1000+ outlets:
1. Move `outlets.json` to a tiny JSONbin.io or Firebase (free tier)
2. Fetch config via `fetch('https://api.jsonbin.io/v3/b/...')` in `index.html`
3. Same static hosting, same zero server cost

---

## Support

- Edit `outlets.json` to add/remove outlets anytime
- Run `node manage.js list` to see all configured outlets
- Run `node manage.js deploy` for deploy reminders
- All customer-facing code is in `index.html` + `review.html` — two files