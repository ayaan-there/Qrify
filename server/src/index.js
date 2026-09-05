const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Load outlets config
const OUTLETS = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'outlets.json'), 'utf8')).outlets;

const REVIEWS = [
  "Absolutely loved this place! Will definitely be back.",
  "Great experience from start to finish. Highly recommend.",
  "Fantastic service and atmosphere. A real gem.",
  "Exceeded my expectations in every way. 5 stars!",
  "One of the best spots in the area. Don't miss it.",
  "Wonderful experience. The staff really cares.",
  "Perfect spot for a great time. Already planning my return.",
  "Top-notch quality and service. Impressed!",
  "A delightful find. Everything was just right.",
  "Outstanding! This place sets the standard.",
  "Loved every minute of it. Thank you!",
  "Exceptional in every way. Bravo!",
  "A truly great experience. Highly recommended.",
  "Quality and care in every detail. Loved it.",
  "This place knows how to treat customers right.",
  "Simply excellent. No complaints at all.",
  "A standout experience. Will tell everyone.",
  "Brilliant! Exactly what I was looking for.",
  "First-class all the way. Thank you!",
  "Couldn't ask for better. Perfect!",
  // ... (add all 100 templates)
];

// Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Rate limiter: 10 requests per minute per IP
const rateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
});

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  const requestId = uuidv4();
  req.requestId = requestId;
  logger.info({ requestId, method: req.method, url: req.url, ip: req.ip }, 'Request received');
  next();
});

// Rate limiting middleware
app.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rej) {
    logger.warn({ requestId: req.requestId, ip: req.ip }, 'Rate limit exceeded');
    res.status(429).json({ error: 'Too many requests', retryAfter: Math.ceil(rej.msBeforeNext / 1000) });
  }
});

// Browser pool
let browser = null;
const browserContexts = new Map(); // customerId -> context

async function getBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    logger.info('Browser launched');
  }
  return browser;
}

// Create context with customer cookies
async function createCustomerContext(customerId, cookies) {
  const bw = await getBrowser();
  
  const context = await bw.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    forcedColors: 'none',
    // Critical for fingerprint
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  
  // Inject customer cookies
  if (cookies && cookies.length > 0) {
    const validCookies = cookies.filter(c => c.name && c.value && c.domain);
    await context.addCookies(validCookies);
    logger.info({ customerId, cookieCount: validCookies.length }, 'Cookies injected');
  }
  
  browserContexts.set(customerId, context);
  return context;
}

async function getCustomerContext(customerId, cookies) {
  let context = browserContexts.get(customerId);
  
  if (!context) {
    context = await createCustomerContext(customerId, cookies);
  }
  
  // Verify context is still valid
  try {
    const pages = context.pages();
    if (pages.length === 0) {
      await context.newPage();
    }
  } catch (e) {
    // Context dead, recreate
    browserContexts.delete(customerId);
    context = await createCustomerContext(customerId, cookies);
  }
  
  return context;
}

// Submit review with customer's session
async function submitReview({ outletId, rating = 5, reviewText, customerId, cookies }) {
  const outlet = OUTLETS[outletId];
  if (!outlet) throw new Error('Outlet not found');
  
  const text = reviewText || REVIEWS[Math.floor(Math.random() * REVIEWS.length)];
  const context = await getCustomerContext(customerId, cookies);
  const page = await context.newPage();
  
  const screenshots = [];
  
  async function takeScreenshot(label) {
    try {
      const buf = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 70 });
      screenshots.push({ label, data: buf.toString('base64') });
    } catch {}
  }
  
  try {
    logger.info({ requestId: customerId, outletId, rating }, 'Starting review submission');
    
    await takeScreenshot('initial');
    
    // Navigate to review URL
    await page.goto(outlet.googleMapsReviewUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });
    await takeScreenshot('after_goto');
    
    // Handle sign-in redirect
    if (page.url().includes('accounts.google.com') || page.url().includes('signin')) {
      logger.warn({ requestId: customerId }, 'Sign-in required - cookies may be invalid/expired');
      await takeScreenshot('signin_required');
      throw new Error('AUTH_REQUIRED: Customer cookies invalid or expired. Need fresh login.');
    }
    
    await page.waitForTimeout(3000);
    await takeScreenshot('page_loaded');
    
    // Find review iframe
    const frame = page.frame({ name: 'goog-reviews-write-widget' }) 
      || page.frame({ url: /ReviewsService\.LoadWriteWidget/ })
      || page.frames().find(f => f.url().includes('ReviewsService.LoadWriteWidget'));
    
    if (!frame) {
      await takeScreenshot('iframe_not_found');
      throw new Error('Review iframe not found. Page structure may have changed.');
    }
    
    logger.info({ requestId: customerId }, `Found review iframe: ${frame.url()}`);
    await takeScreenshot('iframe_found');
    
    // Fill textarea
    const textarea = await frame.waitForSelector('#c4', { timeout: 15000 });
    await textarea.click();
    await page.keyboard.type(text, { delay: 40 + Math.random() * 140 });
    await takeScreenshot('text_filled');
    
    // Click stars
    await page.waitForTimeout(400 + Math.random() * 500);
    const star = frame.locator('[role="radio"][data-rating="5"][aria-checked="false"]').first();
    await star.click();
    await takeScreenshot('stars_clicked');
    
    logger.info({ requestId: customerId, outletId }, 'Review submitted successfully');
    
    return { 
      success: true, 
      outletId,
      reviewText: text,
      rating,
      screenshots 
    };
    
  } catch (error) {
    logger.error({ requestId: customerId, error: error.message }, 'Review submission failed');
    await takeScreenshot('error');
    throw error;
  } finally {
    await page.close().catch(() => {});
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    ok: true, 
    timestamp: new Date().toISOString(),
    activeContexts: browserContexts.size
  });
});

// Submit review endpoint
app.post('/api/submit-review', async (req, res) => {
  const { outletId, rating, reviewText, customerId, cookies } = req.body;
  
  if (!outletId) {
    return res.status(400).json({ error: 'outletId required' });
  }
  
  if (!customerId) {
    return res.status(400).json({ error: 'customerId required (from client)' });
  }
  
  if (!cookies || !cookies.length) {
    return res.status(400).json({ error: 'cookies required (from client)' });
  }
  
  try {
    const result = await submitReview({ outletId, rating, reviewText, customerId, cookies });
    res.json(result);
  } catch (err) {
    const status = err.message?.includes('AUTH_REQUIRED') ? 401 : 500;
    res.status(status).json({ 
      error: err.message,
      screenshots: err.screenshots 
    });
  }
});

// Cookie validation endpoint (client calls this first)
app.post('/api/validate-cookies', async (req, res) => {
  const { customerId, cookies } = req.body;
  
  if (!customerId || !cookies?.length) {
    return res.status(400).json({ valid: false, error: 'Missing customerId or cookies' });
  }
  
  try {
    const context = await getCustomerContext(customerId, cookies);
    const page = await context.newPage();
    
    await page.goto('https://search.google.com/local/writereview?placeid=ChIJTVFbC5UZrjsRahqyXSRs4p4', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const valid = !page.url().includes('accounts.google.com') && !page.url().includes('signin');
    
    await page.close();
    
    res.json({ valid, customerId });
  } catch (err) {
    res.json({ valid: false, customerId, error: err.message });
  }
});

// Get outlets list
app.get('/api/outlets', (req, res) => {
  const list = Object.entries(OUTLETS).map(([id, outlet]) => ({
    id,
    name: outlet.name,
    hasReviewUrl: !!outlet.googleMapsReviewUrl
  }));
  res.json({ outlets: list });
});

// Cleanup on shutdown
process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  for (const [id, ctx] of browserContexts) {
    await ctx.close().catch(() => {});
  }
  if (browser) await browser.close();
  process.exit(0);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

module.exports = app;