# Qrify Review Server

Server-side Google review automation with customer cookie injection.

## Architecture

```
Customer scans QR → Your web page (their browser, their Google session)
                    ↓
         Page sends cookies + outletId to server
                    ↓
         Server uses Playwright + customer cookies
                    ↓
         Navigates to Google Maps → fills review → clicks stars
                    ↓
         Returns success + screenshot
```

## Deploy to Render

### 1. Push to GitHub
```bash
cd D:\Outlet-QR
git add .
git commit -m "Add server-side automation"
git push
```

### 2. Create Render Service
1. Go to https://dashboard.render.com
2. New → Web Service → Connect GitHub → `ayaan-there/Qrify`
3. Settings:
   - **Root Directory**: `server`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./server/Dockerfile`
   - **Plan**: Starter ($7/mo)
4. Add Environment Variables:
   - `NODE_ENV` = `production`
5. Add Persistent Disk:
   - Name: `chrome-profile`
   - Mount Path: `/app/chrome-profile`
   - Size: 1 GB
6. Deploy

### 3. Set Up Google Login (One-time)
```bash
# Locally
cd server
npm install
npm run setup-login
# Browser opens → sign in to ayaanusmani2005@gmail.com → press Enter
```

### 4. Copy Profile to Render
```bash
# Zip the profile
tar -czf chrome-profile.tar.gz chrome-profile

# In Render dashboard → Shell → Upload & extract
# Or: scp to server and extract at /app/chrome-profile
```

### 5. Update Frontend Config
In `review.html`, update the server URL:
```html
<meta name="server-url" content="https://qrify-server.onrender.com">
```

Commit & push → Vercel auto-redeploys.

## API Endpoints

### POST `/api/submit-review`
```json
{
  "outletId": "burger-king-dehradun",
  "rating": 5,
  "reviewText": "Optional custom text",
  "customerId": "cust_123456789_abc",
  "cookies": [
    {"name": "SID", "value": "...", "domain": ".google.com", "path": "/", "secure": true}
  ]
}
```

Response:
```json
{
  "success": true,
  "outletId": "burger-king-dehradun",
  "reviewText": "Great place!",
  "rating": 5,
  "screenshots": [{ "label": "text_filled", "data": "base64..." }]
}
```

Error (401):
```json
{ "error": "AUTH_REQUIRED: Customer cookies invalid or expired" }
```

### POST `/api/validate-cookies`
```json
{ "customerId": "cust_123", "cookies": [...] }
```

Response:
```json
{ "valid": true, "customerId": "cust_123" }
```

### GET `/api/outlets`
Returns list of configured outlets.

## Client Integration

The `review.html` automatically:
1. Reads `outletId` from URL
2. Gets cookies from browser
3. Calls server API first
4. Falls back to iframe if server fails

## Rate Limits

- 10 requests/minute per IP
- Adjust in `src/index.js`: `RateLimiterMemory({ points: 10, duration: 60 })`

## Monitoring

- Health check: `GET /health`
- Logs: Winston (console + files)
- Screenshots on error for debugging

## Security Notes

- Cookies transmitted HTTPS only
- Customer cookies never stored on server (passed per-request)
- Rate limiting prevents abuse
- Helmet.js for security headers
- CORS configured for your domains

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `AUTH_REQUIRED` | Re-run `setup-login.js`, copy fresh profile to Render |
| Iframe not found | Google changed page structure; update selectors in `submitReview` |
| Rate limited | Increase limits or add more servers |
| Session expired | Cookies rotate ~30 days; re-run setup |