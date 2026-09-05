#!/usr/bin/env node
/**
 * Outlet Manager - Add outlets, generate QR codes, deploy
 * 
 * Usage:
 *   node manage.js add "My Cafe" "https://maps.google.com/review/..."
 *   node manage.js list
 *   node manage.js qr "outlet-id"
 *   node manage.js deploy
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTLETS_FILE = path.join(__dirname, 'outlets.json');
const BASE_URL = process.env.BASE_URL || 'https://qrify-two.vercel.app/'; 

function loadOutlets() {
  return JSON.parse(fs.readFileSync(OUTLETS_FILE, 'utf8'));
}

function saveOutlets(data) {
  fs.writeFileSync(OUTLETS_FILE, JSON.stringify(data, null, 2));
}

function generateId(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 40);
}

function addOutlet(name, googleMapsUrl) {
  const data = loadOutlets();
  const id = generateId(name);
  
  if (data.outlets[id]) {
    console.error(`❌ Outlet "${id}" already exists`);
    process.exit(1);
  }

  data.outlets[id] = {
    name,
    googleMapsReviewUrl: googleMapsUrl,
    qrCodePath: `qr/${id}.png`
  };
  
  saveOutlets(data);
  console.log(`✅ Added outlet: ${id}`);
  console.log(`   Name: ${name}`);
  console.log(`   URL: ${googleMapsUrl}`);
  console.log(`\n📱 Generate QR: node manage.js qr "${id}"`);
  console.log(`🔗 Customer link: ${BASE_URL}/?outlet=${id}`);
}

function listOutlets() {
  const data = loadOutlets();
  console.log('\n📋 Configured Outlets:\n');
  Object.entries(data.outlets).forEach(([id, outlet]) => {
    console.log(`  ${id}`);
    console.log(`    Name: ${outlet.name}`);
    console.log(`    Google Maps: ${outlet.googleMapsReviewUrl.substring(0, 60)}...`);
    console.log(`    Customer URL: ${BASE_URL}/?outlet=${id}`);
    console.log(`    QR Code: ${outlet.qrCodePath}`);
    console.log('');
  });
}

function generateQR(outletId) {
  const data = loadOutlets();
  const outlet = data.outlets[outletId];
  
  if (!outlet) {
    console.error(`❌ Outlet "${outletId}" not found`);
    process.exit(1);
  }

  const customerUrl = `${BASE_URL}/?outlet=${outletId}`;
  const qrDir = path.join(__dirname, 'qr');
  
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }
  
  const qrPath = path.join(__dirname, outlet.qrCodePath);
  
  // Use qrcode library or CLI
  try {
    // Option 1: qrcode-terminal (shows in terminal)
    // Option 2: qrcode (saves PNG) - npm install qrcode
    // Option 3: Google Charts API (no install)
    const googleChartUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(customerUrl)}&chs=300x300&choe=UTF-8`;
    
    // Download using curl or fetch
    const https = require('https');
    const file = fs.createWriteStream(qrPath);
    https.get(googleChartUrl, res => res.pipe(file));
    
    file.on('finish', () => {
      file.close();
      console.log(`✅ QR code saved: ${qrPath}`);
      console.log(`📱 Customer scans → opens: ${customerUrl}`);
    });
  } catch (e) {
    console.error('❌ Failed to generate QR. Install qrcode: npm install qrcode');
    console.log(`\nManual: Use any QR generator with this URL:`);
    console.log(customerUrl);
  }
}

function deploy() {
  console.log('🚀 Deploying to static host...');
  console.log('Files to deploy:');
  console.log('  - index.html (landing page)');
  console.log('  - review.html (review iframe page)');
  console.log('  - outlets.json (config)');
  console.log('  - qr/ (QR code images)');
  console.log('\nDrag this folder to:');
  console.log('  - Netlify: https://app.netlify.com/drop');
  console.log('  - Vercel: npx vercel');
  console.log('  - Cloudflare Pages: https://dash.cloudflare.com/pages');
  console.log('  - GitHub Pages: push to repo');
}

const cmd = process.argv[2];
const arg1 = process.argv[3];
const arg2 = process.argv[4];

switch (cmd) {
  case 'add':
    if (!arg1 || !arg2) {
      console.error('Usage: node manage.js add "Outlet Name" "https://maps.google.com/review/..."');
      process.exit(1);
    }
    addOutlet(arg1, arg2);
    break;
  case 'list':
    listOutlets();
    break;
  case 'qr':
    if (!arg1) {
      console.error('Usage: node manage.js qr "outlet-id"');
      process.exit(1);
    }
    generateQR(arg1);
    break;
  case 'deploy':
    deploy();
    break;
  default:
    console.log(`
📦 Outlet Review Manager

Commands:
  node manage.js add "Name" "Google Maps Review URL"  - Add new outlet
  node manage.js list                                 - List all outlets
  node manage.js qr "outlet-id"                       - Generate QR code
  node manage.js deploy                               - Deploy instructions

Set BASE_URL env var for your domain:
  BASE_URL=https://reviews.yourdomain.com node manage.js add "Cafe" "..."

Files:
  outlets.json      - Edit this directly to add/remove outlets
  index.html        - Generic landing page (customer sees this)
  review.html       - Google Maps iframe + auto-fill
  qr/               - Generated QR codes
`);
}