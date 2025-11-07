(function(){
  // Bind per-block instance
  document.querySelectorAll('[data-bould-widget]').forEach(function(container){
    const openBtn = container.querySelector('.bould-widget__open');
    const modal = container.querySelector('.bould-widget');
    const closeBtn = container.querySelector('.bould-widget__close');

    function showScreen(name){
      modal.querySelectorAll('.bould-widget__screen').forEach(function(s){
        s.hidden = s.dataset.screen !== name;
      });
    }

    function getProductId(){
      const fromAttr = container.getAttribute('data-product-id') || '';
      if (fromAttr) return fromAttr;
      try{
        const numId = (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product && window.ShopifyAnalytics.meta.product.id) || null;
        if (numId) return `gid://shopify/Product/${numId}`;
      }catch(e){}
      return '';
    }

    function getProductImageUrl(){
      const fromAttr = container.getAttribute('data-product-image') || '';
      if (fromAttr) return fromAttr;
      try{
        const analyticsProduct = window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product;
        if (analyticsProduct){
          if (typeof analyticsProduct.image_url === 'string' && analyticsProduct.image_url) {
            return analyticsProduct.image_url;
          }
          if (Array.isArray(analyticsProduct.images) && analyticsProduct.images.length > 0) {
            return analyticsProduct.images[0];
          }
        }
      }catch(e){}
      return '';
    }

    function isCustomerLoggedIn(){
      try{
        const shopifyCustomer = window.Shopify && window.Shopify.customer;
        if (shopifyCustomer && (shopifyCustomer.id || shopifyCustomer.email)) {
          return true;
        }
      }catch(e){}
      try{
        const analyticsMeta = window.ShopifyAnalytics && window.ShopifyAnalytics.meta;
        if (analyticsMeta){
          if (analyticsMeta.page && analyticsMeta.page.customerId) {
            return true;
          }
          if (analyticsMeta.customerId) {
            return true;
          }
        }
      }catch(e){}
      try{
        const cookies = document.cookie ? document.cookie.split(';') : [];
        for (let i = 0; i < cookies.length; i += 1){
          const cookie = cookies[i].trim();
          if (!cookie) continue;
          const eqIndex = cookie.indexOf('=');
          if (eqIndex === -1) continue;
          const name = cookie.slice(0, eqIndex);
          const value = cookie.slice(eqIndex + 1);
          if (name === 'customer_signed_in'){
            const normalized = value.toLowerCase();
            if (normalized === 'true' || normalized === '1' || normalized === 'yes'){
              return true;
            }
          }
        }
      }catch(e){}
      return false;
    }

    async function open(){
      if(!isCustomerLoggedIn()){
        alert('Please log in to test this feature.');
        return;
      }
      // Move modal to document.body to ensure full-viewport overlay
      if(!modal.parentElement || modal.parentElement !== document.body){
        document.body.appendChild(modal);
      }
      modal.hidden = false;
      modal.setAttribute('data-state','opening');

      // Preflight: check garment processed status immediately
      try{
        const base = container.getAttribute('data-api-base');
        const productId = getProductId();
        const correlationId = Math.random().toString(36).slice(2, 10);
        const endpointBase = base && base !== 'use_app_route' && base !== 'use_app_proxy' ? base : '/apps/bould';
        const statusUrl = productId ? `${endpointBase}?intent=status&product_id=${encodeURIComponent(productId)}` : `${endpointBase}?intent=status`;
        const res = await fetch(statusUrl, { headers: { 'Accept': 'application/json', 'X-Correlation-ID': correlationId } });
        if(res.ok){
          const data = await res.json();
          if(!data.isProcessed){
            // Show immediate message if not processed
            const msg = data.conversionStatus === 'processing'
              ? 'This garment is currently being processed. Please wait a few minutes and try again.'
              : "This garment hasn't been edited.";
            return showError(msg, { requestId: data?.debug?.requestId, productId, conversionStatus: data.conversionStatus });
          }
        }
      } catch(e){
        // Ignore preflight errors; continue to intro
      }

      showScreen('intro');
      setTimeout(function(){ modal.removeAttribute('data-state'); }, 250);
    }
    function close(){ modal.hidden = true; }

    openBtn && openBtn.addEventListener('click', open);
    closeBtn && closeBtn.addEventListener('click', close);
    modal && modal.addEventListener('click', function(e){ if(e.target === modal) close(); });

    modal && modal.addEventListener('click', function(e){
      const t = e.target;
      if(!(t instanceof HTMLElement)) return;
      if(t.matches('[data-action="continue"]')){
        showScreen('form');
      } else if(t.matches('[data-action="close"]')){
        close();
      } else if(t.matches('[data-action="back-to-form"]')){
        showScreen('form');
      }
    });

    const form = container.querySelector('.bould-widget__form');
    if(form){
      form.addEventListener('submit', async function(e){
        e.preventDefault();
        const fd = new FormData(form);
        const file = fd.get('user_image');
        const height = fd.get('height');
        const productImageUrl = getProductImageUrl();
        if(!(file instanceof File) || !height){
          return showError('Missing image or height.');
        }
        if (productImageUrl) {
          fd.set('product_image_url', productImageUrl);
        }
        showScreen('loading');
        try{
          // Determine endpoint: app proxy or absolute API base from settings
          const base = container.getAttribute('data-api-base');
          const productId = getProductId();
          const correlationId = Math.random().toString(36).slice(2, 10);
          const endpointBase = base && base !== 'use_app_route' && base !== 'use_app_proxy' ? base : '/apps/bould';
          const endpoint = productId ? `${endpointBase}?product_id=${encodeURIComponent(productId)}` : endpointBase;
          
          // Add request debugging
          console.log('[Bould Widget] Making request to:', endpoint);
          console.log('[Bould Widget] Form data:', {
            hasImage: file instanceof File,
            imageSize: file instanceof File ? file.size : 'N/A',
            height: height,
            imageType: file instanceof File ? file.type : 'N/A',
            productId,
            correlationId,
            productImageUrl
          });
          
          // Add correlation id header and a timeout
          const controller = new AbortController();
          const timeoutMs = 28000; // Slightly under Shopify proxy 30s limit
          const timeout = setTimeout(() => controller.abort(), timeoutMs);
          const res = await fetch(endpoint, { 
            method: 'POST', 
            body: fd, 
            headers: { 'Accept': 'application/json', 'X-Correlation-ID': correlationId },
            signal: controller.signal
          }).finally(() => clearTimeout(timeout));
          
          console.log('[Bould Widget] Response status:', res.status);
          const resHeaders = Object.fromEntries(res.headers.entries());
          console.log('[Bould Widget] Response headers:', resHeaders);
          
          if(!res.ok){
            let errorMessage = 'Unknown server error';
            let debugInfo = {};
            const contentType = res.headers.get('content-type') || '';
            
            // If response is not JSON, surface a proxy/config hint and raw text
            if (!contentType.includes('application/json')) {
              const text = await res.text().catch(() => '');
              errorMessage = `Server error: ${res.status}. Received non-JSON response. This often indicates a proxy misconfiguration.`;
              const enhancedError = new Error(errorMessage);
              enhancedError.debugInfo = { correlationId, productId, responseCorrelationId: resHeaders['x-correlation-id'] || resHeaders['x-request-id'], hint: 'Verify Shopify App Proxy path maps to /apps/bould', responseSnippet: text.slice(0, 200) };
              enhancedError.statusCode = res.status;
              throw enhancedError;
            }

            try {
              const errorData = await res.json();
              console.log('[Bould Widget] Error response data:', errorData);
              
              if (errorData.debug) {
                debugInfo = errorData.debug;
                console.log('[Bould Widget] Debug info:', debugInfo);
              }
              
              // Handle specific error cases with better messages
              if(res.status === 404){
                errorMessage = 'Widget endpoint not found. Please check your configuration.';
              } else if(res.status === 409){
                if (errorData.error && (errorData.error.includes('not processed') || errorData.error.includes('not been converted')) ) {
                  errorMessage = "This garment hasn't been edited.";
                } else if (errorData.error && errorData.error.includes('processing')) {
                  errorMessage = 'This garment is currently being processed. Please wait a few minutes and try again.';
                } else if (errorData.error && errorData.error.includes('failed')) {
                  errorMessage = 'Garment conversion failed. Please try converting again in the Bould app.';
                } else {
                  errorMessage = errorData.error || "This garment hasn't been edited.";
                }
              } else if(res.status === 502){
                errorMessage = 'Garment processing service is unavailable. Please ensure the garment has been properly converted.';
              } else if(res.status === 504){
                errorMessage = 'The request timed out. Please try again in a moment.';
              } else if(res.status === 500){
                errorMessage = errorData.error || 'Internal server error. Please try again later.';
              } else {
                errorMessage = errorData.error || `Server error: ${res.status}`;
              }
            } catch (parseError) {
              console.error('[Bould Widget] Failed to parse error response:', parseError);
              errorMessage = res.status === 504
                ? 'The request timed out at the edge (504). Please try again.'
                : `Server error: ${res.status} - Unable to parse error response`;
            }
            
            // Create enhanced error with debug info
            const enhancedError = new Error(errorMessage);
            enhancedError.debugInfo = Object.assign({ correlationId, productId, responseCorrelationId: resHeaders['x-correlation-id'] || resHeaders['x-request-id'] }, debugInfo || {});
            enhancedError.statusCode = res.status;
            throw enhancedError;
          }
          
          const data = await res.json();
          console.log('[Bould Widget] Success response:', data);
          
          // If queued (nano provider), poll status until ready
          if (data && data.queued && data.task_id) {
            console.log('[Bould Widget] Try-on queued. Polling for completion. task_id=', data.task_id);
            const start = Date.now();
            const maxMs = 55000; // keep under Shopify proxy cap
            const pollDelay = 1500;
            const taskId = data.task_id;
            let attempt = 0;
            while (Date.now() - start < maxMs) {
              await new Promise(r => setTimeout(r, pollDelay));
              try {
                const statusUrl = `${endpointBase}?intent=tryon_status&task_id=${encodeURIComponent(taskId)}`;
                const stRes = await fetch(statusUrl, { headers: { 'Accept': 'application/json', 'X-Correlation-ID': correlationId } });
                if (stRes.ok) {
                  const st = await stRes.json();
                  if (st && st.result_image_url) {
                    // Merge into data shape
                    data.tryOnImageUrl = st.result_image_url;
                    break;
                  }
                  if (st && st.status) {
                    console.log('[Bould Widget] Try-on status:', st.status);
                    const statusLower = String(st.status).toLowerCase();
                    if (['fail', 'failed', 'error'].includes(statusLower)) {
                      const reason = st.error || 'The try-on provider reported a failure.';
                      throw new Error(`Try-on failed: ${reason}`);
                    }
                  }
                  attempt += 1;
                }
                else {
                  const text = await stRes.text().catch(() => '');
                  console.warn('[Bould Widget] Status poll failed', stRes.status, text);
                  attempt += 1;
                }
              } catch (pe) {
                // continue polling
                console.warn('[Bould Widget] Status poll error', pe);
              }
            }
            if (!data.tryOnImageUrl) {
              throw new Error('The request timed out before the try-on image was ready. Please try again.');
            }
          }

          // Check if garment processing is complete
          if(!data || data.error){
            if(data.error && data.error.includes('not processed')){
              throw new Error('This garment has not been converted yet. Please run conversion in the Bould app first.');
            }
            throw new Error(data.error || 'Invalid response from server.');
          }
          
          // Handle the response based on the API format
          const img = modal.querySelector('.bould-widget__result-image');
          const sizeEl = modal.querySelector('.bould-widget__size');
          const confidenceEl = modal.querySelector('.bould-widget__confidence');
          const feedbackEl = modal.querySelector('.bould-widget__feedback');
          
          // Set the try-on image
          if(data.tryOnImageUrl){
            img.src = data.tryOnImageUrl;
          } else if(data.debug && data.debug.measurement_vis_url){
            img.src = data.debug.measurement_vis_url;
          }
          
          // Format and display the recommended size
          const recommendedSize = data.recommended_size || data.recommendedSize || '-';
          sizeEl.textContent = 'Recommended size: ' + recommendedSize;
          
          // Display confidence with 2 decimal places
          if(data.confidence !== undefined){
            const confidence = parseFloat(data.confidence).toFixed(2);
            confidenceEl.textContent = 'Confidence: ' + confidence + '%';
          }
          
          // Display tailor feedback if available
          if(data.tailor_feedback){
            feedbackEl.textContent = data.tailor_feedback;
          }
          
          showScreen('result');
        }catch(err){
          console.error('[Bould Widget] Error occurred:', err);
          
          let message = (err && err.message ? err.message : 'Unknown error occurred. Please try again.');
          if (err && err.name === 'AbortError') {
            message = 'The request timed out before completing. Please try again in a moment.';
          }
          
          // Add debug information if available
          if (err.debugInfo) {
            console.log('[Bould Widget] Debug information:', err.debugInfo);
            if (err.debugInfo.requestId) {
              message += `\n\nDebug ID: ${err.debugInfo.requestId}`;
            }
            if (err.debugInfo.suggestion) {
              message += `\n\nSuggestion: ${err.debugInfo.suggestion}`;
            }
          }
          
          // Add status code information
          if (err.statusCode) {
            message += `\n\nStatus Code: ${err.statusCode}`;
          }
          
          showError(message, err.debugInfo);
        }
      });
    }

    function showError(message, debugInfo = null){
      const pre = modal.querySelector('.bould-widget__error');
      
      // Create enhanced error display
      let errorHTML = `<div class="bould-widget__error-content">${message}</div>`;
      
      if (debugInfo) {
        errorHTML += `<div class="bould-widget__debug-info" style="margin-top: 10px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 12px; color: #666;">`;
        errorHTML += `<strong>Debug Information:</strong><br>`;
        
        if (debugInfo.requestId) {
          errorHTML += `Request ID: ${debugInfo.requestId}<br>`;
        }
        if (debugInfo.productId) {
          errorHTML += `Product ID: ${debugInfo.productId}<br>`;
        }
        if (debugInfo.conversionStatus) {
          errorHTML += `Conversion Status: ${debugInfo.conversionStatus}<br>`;
        }
        if (debugInfo.timestamp) {
          errorHTML += `Timestamp: ${debugInfo.timestamp}<br>`;
        }
        
        errorHTML += `</div>`;
      }
      
      pre.innerHTML = errorHTML;
      showScreen('error');
    }
  });
})();


