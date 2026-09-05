const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROFILE_DIR = path.join(__dirname, '..', 'chrome-profile');

async function setupLogin() {
  console.log('🔐 Setting up Google login for review automation...');
  console.log('📁 Profile will be saved to:', PROFILE_DIR);
  console.log('');
  
  // Ensure profile directory exists
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }
  
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    args: ['--disable-blink-features=AutomationControlled']
  });
  
  const page = context.pages()[0];
  
  console.log('🌐 Opening Google sign-in page...');
  await page.goto('https://accounts.google.com');
  
  console.log('');
  console.log('⚠️  MANUAL STEP REQUIRED:');
  console.log('   1. Sign in to your Google account in the browser window');
   console.log('   2. Complete any 2FA if prompted');
   console.log('   3. Make sure you are fully signed in');
   console.log('');
   console.log('⏳ Press ENTER in this terminal when sign-in is complete...');
   
   await new Promise(r => process.stdin.once('data', r));
   
   // Verify by going to a review page
   console.log('🔍 Verifying login with review page...');
   await page.goto('https://search.google.com/local/writereview?placeid=ChIJTVFbC5UZrjsRahqyXSRs4p4');
   await page.waitForTimeout(5000);
   
   const url = page.url();
   if (url.includes('accounts.google.com') || url.includes('signin')) {
     console.log('❌ Still on sign-in page. Login may not have completed.');
     console.log('   Current URL:', url);
   } else {
     console.log('✅ Login verified! Redirected to review page.');
     console.log('   Current URL:', url);
   }
   
   // Show cookies count
   const cookies = await context.cookies();
   console.log(`🍪 Saved ${cookies.length} cookies to profile`);
   
   await context.close();
   console.log('');
   console.log('✅ Setup complete! Profile saved to:', PROFILE_DIR);
   console.log('');
   console.log('📦 To deploy:');
   console.log('   1. Copy the chrome-profile folder to your server');
   console.log('   2. Or use: tar -czf chrome-profile.tar.gz chrome-profile');
   console.log('   3. Mount as persistent volume on Render/Railway');
}

setupLogin().catch(err => {
  console.error('❌ Setup failed:', err.message);
  process.exit(1);
});