// Client-side integration for review.html
// This replaces the iframe auto-fill with server API calls

class ReviewAutomationClient {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.customerId = this.getOrCreateCustomerId();
  }
  
  getOrCreateCustomerId() {
    let id = localStorage.getItem('qrify_customer_id');
    if (!id) {
      id = 'cust_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('qrify_customer_id', id);
    }
    return id;
  }
  
  // Extract cookies for Google domains
  async getGoogleCookies() {
    // Note: Cannot access cross-origin cookies from JS directly
    // This requires a browser extension or the cookies must be passed differently
    // For now, we'll use the cookie store API if available
    if ('cookieStore' in window) {
      try {
        const cookies = await cookieStore.getAll({ domain: 'google.com' });
        return cookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          expires: c.expires,
          secure: c.secure,
          sameSite: c.sameSite
        }));
      } catch (e) {
        console.warn('Cookie Store API not available:', e);
      }
    }
    return [];
  }
  
  // Alternative: Get cookies via document.cookie (limited)
  getDocumentCookies() {
    return document.cookie.split(';').map(c => {
      const [name, value] = c.trim().split('=');
      return { name, value, domain: '.google.com' };
    }).filter(c => c.name && c.value);
  }
  
  // Submit review via server
  async submitReview(outletId, rating = 5, customText = null) {
    const cookies = await this.getGoogleCookies();
    const docCookies = this.getDocumentCookies();
    const allCookies = [...cookies, ...docCookies];
    
    if (allCookies.length === 0) {
      console.warn('No Google cookies found. Server will likely need AUTH_REQUIRED.');
    }
    
    try {
      const response = await fetch(`${this.serverUrl}/api/submit-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletId,
          rating,
          reviewText: customText,
          customerId: this.customerId,
          cookies: allCookies
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 401) {
          // Auth required - fallback to manual
          return { 
            success: false, 
            authRequired: true, 
            message: result.error,
            fallback: true 
          };
        }
        throw new Error(result.error || 'Request failed');
      }
      
      return { success: true, ...result };
      
    } catch (error) {
      console.error('Server review submission failed:', error);
      return { success: false, error: error.message, fallback: true };
    }
  }
  
  // Validate cookies with server
  async validateCookies() {
    const cookies = [...await this.getGoogleCookies(), ...this.getDocumentCookies()];
    
    try {
      const response = await fetch(`${this.serverUrl}/api/validate-cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: this.customerId,
          cookies
        })
      });
      
      return await response.json();
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }
}

// Auto-initialize on review page
if (typeof window !== 'undefined' && window.location.pathname.includes('review.html')) {
  // Read server URL from meta tag or config
  const serverUrl = document.querySelector('meta[name="server-url"]')?.content 
    || 'https://qrify-i4yd.onrender.com'; // Your Render URL
  
  const client = new ReviewAutomationClient(serverUrl);
  
  // Store globally for manual triggering
  window.reviewClient = client;
  
  // Try server submission on page load
  document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const outletId = urlParams.get('outlet');
    
    if (outletId) {
      const stored = sessionStorage.getItem('reviewAutofill');
      if (stored) {
        const { text, rating } = JSON.parse(stored);
        
        // Validate cookies first
        const validation = await client.validateCookies();
        
        if (validation.valid) {
          console.log('Cookies valid, submitting via server...');
          const result = await client.submitReview(outletId, rating, text);
          
          if (result.success) {
            showServerSuccess(result);
            return;
          }
        }
        
        // Fallback to client-side copy-paste
        console.log('Server submission failed or not available, using fallback');
        showFallback(text, outletId);
      }
    }
  });
  
  function showServerSuccess(result) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mapsFrame').style.display = 'none';
    document.getElementById('errorState').style.display = 'none';
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-state';
    successDiv.innerHTML = `
      <div style="color: #34a853; font-size: 48px;">✅</div>
      <h2>Review Submitted!</h2>
      <p>Your review has been posted successfully.</p>
      <p style="font-size: 14px; color: #666;">${result.reviewText.substring(0, 100)}...</p>
      <button onclick="window.close()" style="margin-top: 16px; padding: 12px 24px; background: #1a73e8; color: white; border: none; border-radius: 8px; font-weight: 600;">Close</button>
    `;
    document.body.appendChild(successDiv);
  }
  
  function showFallback(text, outletId) {
    // Original fallback logic
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('mapsFrame').style.display = 'none';
    document.getElementById('errorState').style.display = 'flex';
    document.getElementById('copyBox').value = text;
  }
}