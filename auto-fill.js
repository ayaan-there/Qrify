const { chromium } = require('playwright');
const fs = require('fs');

const OUTLET = JSON.parse(fs.readFileSync('outlets.json', 'utf8')).outlets['burger-king-dehradun'];

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
  "The atmosphere is warm and inviting, staff is incredibly friendly, and the quality is consistently excellent. This has become my go-to spot.",
  "Visited for the first time and was blown away. The attention to detail, the service, the vibe — everything just works. Rare to find a place this good.",
  "Been coming here for months and it never disappoints. Consistency is hard to find and they nail it every single time. The team clearly takes pride in what they do.",
  "What a find! The service was attentive without being intrusive, the space is beautifully designed, and the overall experience was exactly what I needed.",
  "Honestly one of the best experiences I've had in a long time. Every detail thought through, every interaction genuine. This is how it should be done.",
  "The kind of place that makes you want to be a regular. Great energy, great people, great quality. They've earned every star.",
  "Walked in not knowing what to expect, left planning my next visit. That's the sign of something special. Keep doing what you're doing.",
  "Refreshing to find a place that actually delivers on the hype. No gimmicks, just genuine quality and hospitality. Will be back soon.",
  "The staff remembers you, the quality never wavers, and the atmosphere hits the sweet spot every time. This is what excellence looks like.",
  "Rarely do I leave reviews, but this place deserves recognition. From the moment you walk in to the moment you leave — flawless.",
  "A masterclass in consistency. Whether it's a quick stop or a long visit, the experience is always top-tier. Thank you for the high bar.",
  "The vibe is unmatched. Relaxed but polished, friendly but professional. It's the details that make it — and they nail every single one.",
  "I've recommended this to everyone I know. It's that good. Quality, service, atmosphere — the full package.",
  "This place gets it right. Not just the big things, but the little touches that show they actually care. That's rare.",
  "Five stars isn't enough. The team goes above and beyond in ways that feel natural, not forced. A true standout.",
  "Every visit feels like the first visit — in the best way. Fresh, attentive, consistently excellent. How do they do it?",
  "The gold standard in the neighborhood. Others could learn a thing or two from how this place operates.",
  "Genuinely impressed. It's not just good — it's thoughtfully, intentionally, consistently excellent. Big difference.",
  "This is what happens when passion meets execution. The result is something special that keeps people coming back.",
  "A rare combination of quality, consistency, and genuine hospitality. They make it look easy (it's not).",
  "The kind of place that restores your faith in great service. Thoughtful, professional, and human all at once.",
  "I go out of my way to come here. That says everything. Worth every minute and every penny.",
  "Consistently excellent across every visit. The team clearly has high standards and holds each other to them. Respect.",
  "This place has soul. You can feel it in the service, the space, the details. It's not manufactured — it's real.",
  "The attention to detail is next level. Nothing feels overlooked, nothing feels rushed. Just pure quality.",
  "A benchmark for what a great experience should be. They don't just meet expectations — they redefine them.",
  "Walking in feels like a reset button. The atmosphere, the people, the quality — it all just works.",
  "This is the place you tell friends about with enthusiasm, not just politeness. The real deal.",
  "Rare to find a team this aligned. Everyone's on the same page: excellence. And it shows.",
  "Honestly? Just go. You won't regret it. Great vibes, great people, great everything.",
  "Stopped in on a whim and it made my whole week. Sometimes the best finds are unplanned.",
  "This place gets me. The vibe, the quality, the service — it all just clicks. My new favorite.",
  "Not gonna lie, I've been here 3 times this week already. No regrets. It's that good.",
  "You know a place is special when you start planning your next visit before you've even left. That's this place.",
  "The kind of spot that makes you a little protective — like, 'this is MY place' but also 'everyone needs to know.'",
  "Real talk: this is the best in the area. Not even close. Do yourself a favor and check it out.",
  "Came for the reviews, stayed for the experience. Everything people say is true — and then some.",
  "It's the little things. The way they remember. The extra smile. The genuine care. That's what keeps me coming back.",
  "Five stars, would give ten if I could. This place just gets it right, every single time.",
  "My new 'bad day' fix. Walk in stressed, walk out happy. That's powerful.",
  "The team here doesn't just do their job — they own the experience. And it shows in every interaction.",
  "You can tell when a place is run with heart. This is one of those places. Rare and precious.",
  "If consistency were a sport, these folks would be world champions. Never a miss.",
  "This isn't just a business — it's a part of the community. And it feels like it.",
  "The kind of quality that makes you pause and think, 'wow, they really thought of everything.'",
  "Been to a lot of places. This one's different. In the best possible way.",
  "You know that feeling when everything just works? That's the default here.",
  "Not sure what magic they're running on, but don't stop. It's working beautifully.",
  "This place has that 'je ne sais quoi.' The intangible that makes good into great.",
  "I bring everyone here. Friends, family, colleagues — never a single complaint. Only 'when can we go back?'",
  "The standard. That's what this is. Everything else gets measured against it.",
  "Sometimes you just need a place that delivers. No drama, no fuss, just pure quality. This is it.",
  "Honestly, the best money I've spent in a long time. Value, quality, experience — all there.",
  "Absolutely incredible! From the moment we walked in, we felt welcomed and valued. The attention to detail is remarkable!",
  "Wow, just wow! This place exceeded every expectation. The team's passion shines through in everything they do!",
  "This is what excellence looks like! Every visit is a delight. Thank you for creating something so special!",
  "My heart is full after visiting! The warmth, the quality, the genuine care — it's all here. A true treasure!",
  "Celebrating this amazing find! It's not often you discover a place this good. Grateful for the experience!",
  "Pure magic! From the atmosphere to the service to the little surprises — everything sparkles here!",
  "A rainbow of excellence! Every aspect is colorful, thoughtful, and brilliant. My new happy place!",
  "On fire! This team is absolutely crushing it. Quality, heart, consistency — they have it all!",
  "A diamond in the rough! Polished, precious, and perfectly crafted. So glad I found this gem!",
  "Next level! This place doesn't just raise the bar — it IS the bar. Incredible work, team!",
  "Shining bright! The energy here is contagious in the best way. Left with a huge smile!",
  "Bullseye! They hit every mark: quality, service, vibe, value. A perfect 10/10 experience!",
  "Unicorn status! Rare, magical, and absolutely real. This place is one of a kind!",
  "Championship level! If there were Olympics for this, they'd take gold every time. Legends!",
  "Five stars isn't enough! This place deserves a galaxy!",
  "Sunshine in business form! Warm, bright, and absolutely delightful. My day is better because of this place!",
  "A masterpiece! Every detail composed with care. The team conducts excellence like a symphony!",
  "Riding the wave of awesome! This place just flows — quality, service, vibe, all in perfect harmony!",
  "Superhero status! The team here has superpowers: kindness, excellence, consistency. My heroes!",
  "Blooming brilliant! Fresh, vibrant, and beautifully executed. A garden of great experiences!",
  "Electric! The energy, the quality, the care — it all charges you up!",
  "Artistry in action! This isn't just service — it's craft. Every touch intentional, every moment curated!",
  "Peak performance! They're operating at the summit of excellence. The view from here is amazing!",
  "MAGIC! That's the only word. Pure, undeniable, wonderful magic!",
  "From the heart! This place gives so much — quality, care, joy. Thank you for the gift!",
];

async function run() {
  const review = REVIEWS[Math.floor(Math.random() * REVIEWS.length)];
  console.log('Selected review:', review.substring(0, 80) + '...');

  // Use Profile 1 which has ayaanusmani2005@gmail.com
  const userDataDir = 'C:\\Users\\ASUS\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1';
  
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    args: ['--disable-blink-features=AutomationControlled']
  });

  const page = context.pages()[0] || await context.newPage();
  
  console.log('Opening review URL...');
  await page.goto(OUTLET.googleMapsReviewUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
  
  // Check if we're on sign-in page
  const url = page.url();
  if (url.includes('accounts.google.com') || url.includes('signin')) {
    console.log('\n⚠️  Redirected to sign-in page!');
    console.log('Please sign in to your Google account (ayaanusmani2005@gmail.com) in the browser window.');
    console.log('Waiting for sign-in to complete...');
    
    // Wait for redirect AWAY from sign-in page
    await page.waitForURL(u => !u.toString().includes('accounts.google.com') && !u.toString().includes('signin'), { timeout: 120000 });
    console.log('✅ Signed in! Redirected back to review page.');
  }
  
  // Wait a bit more for review page to fully load
  await page.waitForTimeout(3000);
  
  console.log('Waiting for textarea...');
  
  // Wait for iframe to load
  await page.waitForTimeout(3000);
  
  // Find the review widget iframe
  const frame = page.frame({ name: 'goog-reviews-write-widget' }) 
    || page.frame({ url: /ReviewsService\.LoadWriteWidget/ })
    || page.frames().find(f => f.url().includes('ReviewsService.LoadWriteWidget'));
  
  if (!frame) {
    console.log('Could not find review iframe. Available frames:');
    page.frames().forEach((f, i) => console.log(`  [${i}] ${f.url()}`));
    throw new Error('Review iframe not found');
  }
  
  console.log('Found review iframe:', frame.url());
  
  // Wait for textarea in iframe
  const textareas = await frame.locator('textarea').all();
  console.log(`Found ${textareas.length} textarea(s) in iframe`);
  for (let i = 0; i < textareas.length; i++) {
    const ta = textareas[i];
    const id = await ta.getAttribute('id');
    const aria = await ta.getAttribute('aria-label');
    const placeholder = await ta.getAttribute('placeholder');
    const name = await ta.getAttribute('name');
    console.log(`  [${i}] id="${id}" name="${name}" aria-label="${aria}" placeholder="${placeholder}"`);
  }
  
  // Try multiple selectors
  const selectors = [
    '#c4',
    'textarea[aria-label*="review" i]',
    'textarea[placeholder*="review" i]',
    'textarea[placeholder*="experience" i]',
    'textarea[name="review"]',
    'textarea'
  ];
  
  let textarea = null;
  for (const sel of selectors) {
    try {
      textarea = await frame.waitForSelector(sel, { timeout: 3000 });
      console.log(`Found textarea with: ${sel}`);
      break;
    } catch {}
  }
  
  if (!textarea) {
    console.log('No textarea found in iframe. Page content:');
    console.log(await frame.content());
    throw new Error('No textarea found in iframe');
  }
  
  console.log('Typing review...');
  await textarea.click();
  for (const ch of review) {
    await page.keyboard.type(ch, { delay: 40 + Math.random() * 140 });
  }
  
  console.log('Clicking 5 stars...');
  await page.waitForTimeout(400 + Math.random() * 500);
  
  // Find stars in iframe
  const stars = await frame.locator('[role="radio"][data-rating], .s2xyy, [aria-label*="star" i]').all();
  console.log(`Found ${stars.length} star-like elements in iframe`);
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const rating = await s.getAttribute('data-rating');
    const checked = await s.getAttribute('aria-checked');
    const label = await s.getAttribute('aria-label');
    console.log(`  [${i}] rating="${rating}" checked="${checked}" label="${label}"`);
  }
  
  // Try to click 5-star unchecked
  const starSelectors = [
    '.s2xyy[data-rating="5"][aria-checked="false"]',
    '[role="radio"][data-rating="5"][aria-checked="false"]',
    '[aria-label="Five stars"][aria-checked="false"]',
    '[aria-label*="5 star"][aria-checked="false"]'
  ];
  
  for (const sel of starSelectors) {
    try {
      const star = frame.locator(sel).first();
      await star.click({ timeout: 2000 });
      console.log(`Clicked star with: ${sel}`);
      break;
    } catch {}
  }
  
  console.log('\n✅ DONE! Review typed, 5 stars clicked.');
  console.log('Browser stays open — you can now click "Post" manually.');
  console.log('Press Ctrl+C to close when done.\n');
  
  await new Promise(() => {});
}

run().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});