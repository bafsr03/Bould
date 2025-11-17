(function(){
  // Bind per-block instance
  document.querySelectorAll('[data-bould-widget]').forEach(function(container){
    const openBtn = container.querySelector('.bould-widget__open');
    const modal = container.querySelector('.bould-widget');
    const closeBtn = container.querySelector('.bould-widget__close');
    const loadingScreen = modal ? modal.querySelector('.bould-widget__screen--loading') : null;
    const loadingStatusEl = loadingScreen ? loadingScreen.querySelector('.bould-widget__loading-text') : null;
    const loadingFeedbackEl = loadingScreen ? loadingScreen.querySelector('[data-loading-feedback]') : null;
    const resultScreen = modal ? modal.querySelector('.bould-widget__screen--result') : null;
    const resultImageEl = resultScreen ? resultScreen.querySelector('.bould-widget__result-image') : null;
    const resultSizeEl = resultScreen ? resultScreen.querySelector('.bould-widget__size') : null;
    const resultConfidenceEl = resultScreen ? resultScreen.querySelector('.bould-widget__confidence') : null;
    const resultFeedbackEl = resultScreen ? resultScreen.querySelector('.bould-widget__feedback') : null;
    const resultStageEls = resultScreen ? Array.from(resultScreen.querySelectorAll('.bould-widget__result-stage')) : [];
    const loadingDefaultText = loadingStatusEl ? loadingStatusEl.textContent || '' : '';
    if (loadingStatusEl && !loadingStatusEl.dataset.defaultText) {
      loadingStatusEl.dataset.defaultText = loadingDefaultText;
    }
    if (loadingFeedbackEl) {
      loadingFeedbackEl.hidden = true;
      loadingFeedbackEl.classList.remove('is-visible');
    }
    let activeFeedbackCycle = null;
    let statusPromise = null;
    const errorActionButton = modal ? modal.querySelector('.bould-widget__screen--error [data-action]') : null;
    const errorActionDefaults = errorActionButton
      ? {
          label: errorActionButton.textContent || 'Try again',
          action: errorActionButton.getAttribute('data-action') || 'back-to-form',
        }
      : { label: 'Try again', action: 'back-to-form' };
    const DEFAULT_ERROR_HEADING = 'Something went wrong';

    function escapeHtml(value){
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatMessage(value){
      return escapeHtml(value).replace(/\r?\n/g, '<br />');
    }

    function isDesignMode(){
      try{
        return !!(window.Shopify && window.Shopify.designMode);
      }catch(e){
        return false;
      }
    }

    function isPhoneDevice(){
      try{
        if (navigator?.userAgentData && typeof navigator.userAgentData.mobile === 'boolean'){
          return navigator.userAgentData.mobile;
        }
      }catch(e){}
      const ua = (navigator.userAgent || navigator.vendor || (window.opera && window.opera.toString && window.opera.toString()) || '').toLowerCase();
      const matchesUa = /(android|iphone|ipad|ipod|windows phone|blackberry|bb10|mobile)/i.test(ua);
      const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
      const narrow = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 820px)').matches;
      return matchesUa || (coarse && narrow);
    }

    function ensureStateNotice(){
      let notice = container.querySelector('.bould-widget__state');
      if (!notice) {
        notice = document.createElement('div');
        notice.className = 'bould-widget__state';
        notice.hidden = true;
        if (openBtn && typeof openBtn.insertAdjacentElement === 'function') {
          openBtn.insertAdjacentElement('afterend', notice);
        } else {
          container.appendChild(notice);
        }
      }
      return notice;
    }

    function showInlineNotice(message, tone){
      const notice = ensureStateNotice();
      notice.className = 'bould-widget__state';
      if (tone === 'warning') {
        notice.classList.add('bould-widget__state--warning');
      } else if (tone === 'error') {
        notice.classList.add('bould-widget__state--error');
      }
      notice.innerHTML = `<p>${escapeHtml(message)}</p>`;
      notice.hidden = false;
    }

    function clearInlineNotice(){
      const notice = container.querySelector('.bould-widget__state');
      if (notice) {
        notice.className = 'bould-widget__state';
        notice.innerHTML = '';
        notice.hidden = true;
      }
    }

    function stopFeedbackCycle(forceHide){
      if (activeFeedbackCycle && typeof activeFeedbackCycle.cancel === 'function') {
        activeFeedbackCycle.cancel(!!forceHide);
      }
      activeFeedbackCycle = null;
    }

    function resetLoadingMessage(){
      stopFeedbackCycle(true);
      if (loadingStatusEl) {
        loadingStatusEl.hidden = false;
        const fallbackText = loadingStatusEl.dataset.defaultText || loadingDefaultText;
        if (fallbackText) {
          loadingStatusEl.textContent = fallbackText;
        }
      }
      if (loadingFeedbackEl) {
        loadingFeedbackEl.hidden = true;
        loadingFeedbackEl.classList.remove('is-visible');
        loadingFeedbackEl.textContent = '';
      }
    }

    function resetResultStage(){
      resultStageEls.forEach(function(el){
        if (!el) return;
        el.classList.remove('is-visible');
      });
      if (resultImageEl) {
        resultImageEl.removeAttribute('src');
        resultImageEl.hidden = false;
      }
      if (resultSizeEl) {
        resultSizeEl.textContent = '';
        resultSizeEl.hidden = false;
      }
      if (resultConfidenceEl) {
        resultConfidenceEl.textContent = '';
        resultConfidenceEl.hidden = false;
      }
      if (resultFeedbackEl) {
        resultFeedbackEl.textContent = '';
        resultFeedbackEl.hidden = false;
        resultFeedbackEl.classList.remove('is-visible');
      }
    }

    const FEEDBACK_VISIBLE_MS = 2600;
    const FEEDBACK_FADE_MS = 420;
    const FEEDBACK_FINAL_SETTLE_MS = 220;
    const DEFAULT_LOADING_FEEDBACK = [
      "Sizing assistant is reviewing your fit details...",
      "Hang tight - preparing your personalized fit notes."
    ];

    function splitIntoSentences(value){
      if (!value) return [];
      const matches = String(value)
        .replace(/\s+/g, ' ')
        .match(/[^.!?]+[.!?]*/g);
      if (!matches) {
        return [String(value).trim()];
      }
      return matches.map(function(part){
        return part.trim();
      }).filter(Boolean);
    }

    function extractFeedbackMessages(data){
      if (!data || typeof data !== 'object') {
        return ["We're reviewing your fit details...", "Hang tight - we're rendering your try-on preview now."];
      }
      const raw =
        data.tailor_feedback_sequence ||
        data.tailor_feedbacks ||
        data.tailorFeedbackSequence ||
        data.tailorFeedbacks ||
        data.tailor_feedback ||
        data.tailorFeedback;
      let messages = [];
      if (Array.isArray(raw)) {
        messages = raw;
      } else if (raw && typeof raw === 'object' && Array.isArray(raw.messages)) {
        messages = raw.messages;
      } else if (raw !== undefined && raw !== null) {
        messages = [raw];
      }
      messages = messages
        .map(function(msg){
          return String(msg || '').replace(/\s+/g, ' ').trim();
        })
        .filter(Boolean);
      if (!messages.length && loadingStatusEl) {
        const fallback = loadingStatusEl.dataset.defaultText || loadingDefaultText || '';
        if (fallback) {
          messages = [fallback];
        }
      }
      if (messages.length === 1) {
        const first = messages[0];
        const newlineParts = first.split(/\n+/).map(function(part){
          return part.replace(/\s+/g, ' ').trim();
        }).filter(Boolean);
        if (newlineParts.length >= 2) {
          messages = [newlineParts[0], newlineParts.slice(1).join(' ').trim()];
        } else {
          const sentences = splitIntoSentences(first);
          if (sentences.length >= 2) {
            const remainder = sentences.slice(1).join(' ').trim();
            if (remainder) {
              messages = [sentences[0], remainder];
            }
          }
        }
      }
      const seen = new Set();
      const deduped = [];
      messages.forEach(function(msg){
        if (!seen.has(msg)) {
          seen.add(msg);
          deduped.push(msg);
        }
      });
      if (!deduped.length) {
        deduped.push("We're reviewing your fit details...");
      }
      if (deduped.length === 1) {
        deduped.push("Hang tight - we're rendering your try-on preview now.");
      }
      return deduped.slice(0, 3);
    }

    function startLoadingFeedback(messages, options){
      const normalized = Array.isArray(messages)
        ? messages
            .map(function(msg){
              return typeof msg === 'string' ? msg.replace(/\s+/g, ' ').trim() : '';
            })
            .filter(Boolean)
        : [];
      if (!loadingFeedbackEl || !normalized.length) {
        const fallbackMessage = normalized.length ? normalized[normalized.length - 1] : '';
        return {
          promise: Promise.resolve({ finalMessage: fallbackMessage || '', cancelled: false }),
          cancel: function(){}
        };
      }

      const opts = Object.assign(
        {
          loop: false,
          holdMs: FEEDBACK_VISIBLE_MS,
          fadeMs: FEEDBACK_FADE_MS,
          finalHoldMs: FEEDBACK_FINAL_SETTLE_MS,
          initialDelay: 30,
          hideStatus: true
        },
        options || {}
      );

      const displayEl = loadingFeedbackEl;
      if (opts.hideStatus && loadingStatusEl) {
        loadingStatusEl.hidden = true;
      }
      displayEl.hidden = false;
      displayEl.classList.remove('is-visible');

      let resolved = false;
      let resolveRef = null;
      const timers = [];

      function clearTimers(){
        while (timers.length) {
          clearTimeout(timers.pop());
        }
      }

      function finish(cancelled, explicitMessage){
        if (resolved) return;
        resolved = true;
        clearTimers();
        const finalMessage =
          explicitMessage !== undefined && explicitMessage !== null && explicitMessage !== ''
            ? explicitMessage
            : (displayEl.textContent || normalized[normalized.length - 1] || '');
        if (resolveRef) {
          resolveRef({ finalMessage, cancelled });
        }
      }

      function showMessage(index){
        if (!normalized.length) {
          finish(true, '');
          return;
        }
        const safeIndex = index % normalized.length;
        const message = normalized[safeIndex];
        displayEl.textContent = message;
        requestAnimationFrame(function(){
          displayEl.classList.add('is-visible');
        });

        const isLast = safeIndex === normalized.length - 1;

        if (opts.loop) {
          timers.push(
            setTimeout(function(){
              displayEl.classList.remove('is-visible');
              timers.push(
                setTimeout(function(){
                  showMessage((safeIndex + 1) % normalized.length);
                }, opts.fadeMs)
              );
            }, opts.holdMs)
          );
          return;
        }

        if (!isLast) {
          timers.push(
            setTimeout(function(){
              displayEl.classList.remove('is-visible');
              timers.push(
                setTimeout(function(){
                  showMessage(safeIndex + 1);
                }, opts.fadeMs)
              );
            }, opts.holdMs)
          );
        } else {
          timers.push(
            setTimeout(function(){
              finish(false, message);
            }, opts.finalHoldMs)
          );
        }
      }

      const sequencePromise = new Promise(function(resolve){
        resolveRef = resolve;
        timers.push(
          setTimeout(function(){
            showMessage(0);
          }, Math.max(0, opts.initialDelay))
        );
      });

      const controller = {
        promise: sequencePromise.then(function(result){
          if (activeFeedbackCycle === controller) {
            activeFeedbackCycle = null;
          }
          return result;
        }),
        cancel: function(forceHide){
          if (resolved) {
            if (forceHide) {
              displayEl.classList.remove('is-visible');
            }
            return;
          }
          if (forceHide) {
            displayEl.classList.remove('is-visible');
          }
          finish(true);
        }
      };

      activeFeedbackCycle = controller;
      return controller;
    }

    function loadImageAsset(url){
      if (!url) {
        return Promise.resolve({ url: '', loaded: false });
      }
      return new Promise(function(resolve){
        const testImg = new Image();
        testImg.decoding = 'async';
        testImg.onload = function(){
          resolve({ url, loaded: true });
        };
        testImg.onerror = function(){
          resolve({ url, loaded: false });
        };
        testImg.src = url;
      });
    }

    function loadImageCandidates(urls){
      const candidates = Array.isArray(urls) ? urls.filter(Boolean) : [];
      if (!candidates.length) {
        return Promise.resolve({ url: '', loaded: false });
      }
      let index = 0;
      return new Promise(function(resolve){
        function attempt(){
          const currentUrl = candidates[index];
          loadImageAsset(currentUrl).then(function(result){
            if (result.loaded) {
              resolve(result);
              return;
            }
            if (index < candidates.length - 1) {
              console.warn('[Bould Widget] Try-on image failed to load, trying next candidate', currentUrl);
              index += 1;
              attempt();
              return;
            }
            resolve({ url: currentUrl, loaded: false });
          });
        }
        attempt();
      });
    }

    function prepareForRequest(){
      resetResultStage();
      stopFeedbackCycle(true);
      if (loadingFeedbackEl) {
        if (loadingStatusEl) {
          loadingStatusEl.hidden = true;
        }
        loadingFeedbackEl.hidden = false;
        loadingFeedbackEl.classList.remove('is-visible');
        loadingFeedbackEl.textContent = '';
        startLoadingFeedback(DEFAULT_LOADING_FEEDBACK, {
          loop: true,
          holdMs: 2000,
          fadeMs: 280,
          initialDelay: 0,
          hideStatus: false
        });
      } else {
        resetLoadingMessage();
      }
      showScreen('loading');
    }

    function revealResultView(details){
      if (!resultScreen) {
        return;
      }
      if (resultImageEl) {
        if (details.imageUrl) {
          resultImageEl.hidden = false;
          if (resultImageEl.src !== details.imageUrl) {
            resultImageEl.src = details.imageUrl;
          }
        } else {
          resultImageEl.removeAttribute('src');
          resultImageEl.hidden = true;
        }
      }
      if (resultSizeEl) {
        if (details.sizeText) {
          resultSizeEl.textContent = details.sizeText;
          resultSizeEl.hidden = false;
        } else {
          resultSizeEl.textContent = '';
          resultSizeEl.hidden = true;
        }
      }
      if (resultConfidenceEl) {
        if (details.confidenceText) {
          resultConfidenceEl.textContent = details.confidenceText;
          resultConfidenceEl.hidden = false;
        } else {
          resultConfidenceEl.textContent = '';
          resultConfidenceEl.hidden = true;
        }
      }
      if (resultFeedbackEl) {
        if (details.feedbackText) {
          resultFeedbackEl.textContent = details.feedbackText;
          resultFeedbackEl.hidden = false;
        } else {
          resultFeedbackEl.textContent = '';
          resultFeedbackEl.hidden = true;
        }
        resultFeedbackEl.classList.remove('is-visible');
      }
      showScreen('result');
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          resultStageEls.forEach(function(el){
            if (!el) return;
            if (el === resultImageEl && !details.imageUrl) {
              el.classList.remove('is-visible');
              return;
            }
            el.classList.add('is-visible');
          });
          if (resultFeedbackEl && resultFeedbackEl.classList.contains('bould-widget__fade-text') && details.feedbackText) {
            resultFeedbackEl.classList.add('is-visible');
          }
        });
      });
      resetLoadingMessage();
    }

    function setOpenButtonDisabled(disabled, reason, title){
      if (!openBtn) return;
      if (!disabled && container.getAttribute('data-plan-blocked') === 'true') {
        return;
      }
      if (disabled) {
        openBtn.disabled = true;
        openBtn.classList.add('bould-widget__open--disabled');
        openBtn.setAttribute('aria-disabled', 'true');
        if (reason) {
          openBtn.setAttribute('data-disabled-reason', reason);
        }
        if (title) {
          openBtn.setAttribute('title', title);
        }
      } else {
        openBtn.disabled = false;
        openBtn.classList.remove('bould-widget__open--disabled');
        openBtn.removeAttribute('aria-disabled');
        if (!reason || openBtn.getAttribute('data-disabled-reason') === reason) {
          openBtn.removeAttribute('data-disabled-reason');
        }
        if (!title || openBtn.getAttribute('title') === title) {
          openBtn.removeAttribute('title');
        }
      }
    }

    function renderDebugInfo(debugInfo){
      if (!debugInfo) return '';
      const lines = [];
      if (debugInfo.requestId) lines.push(`Request ID: ${escapeHtml(debugInfo.requestId)}`);
      if (debugInfo.productId) lines.push(`Product ID: ${escapeHtml(debugInfo.productId)}`);
      if (debugInfo.conversionStatus) lines.push(`Conversion Status: ${escapeHtml(debugInfo.conversionStatus)}`);
      if (debugInfo.statusCode) lines.push(`Status Code: ${escapeHtml(debugInfo.statusCode)}`);
      if (debugInfo.timestamp) lines.push(`Timestamp: ${escapeHtml(debugInfo.timestamp)}`);
      if (debugInfo.suggestion) lines.push(`Suggestion: ${escapeHtml(debugInfo.suggestion)}`);
      if (debugInfo.reason) lines.push(`Reason: ${escapeHtml(debugInfo.reason)}`);
      if (debugInfo.correlationId) lines.push(`Correlation ID: ${escapeHtml(debugInfo.correlationId)}`);
      if (debugInfo.responseCorrelationId) lines.push(`Response ID: ${escapeHtml(debugInfo.responseCorrelationId)}`);
      if (!lines.length) return '';
      return `<div class="bould-widget__debug-info"><strong>Debug Information:</strong><br>${lines.join('<br>')}</div>`;
    }

    function getImmediateGate(designMode){
      if (designMode) {
        return null;
      }
      if (!isCustomerLoggedIn()){
        return {
          heading: 'Sign in required',
          message: 'Please log in to your store account to use this feature.',
          tone: 'info',
          action: 'close',
          blockButton: true,
          code: 'login-required',
          debug: { reason: 'not_logged_in' }
        };
      }
      return null;
    }

    function getPreflightGate(payload, designMode){
      if (!payload) {
        return null;
      }
      if (payload.plan && payload.plan.blocked){
        return {
          heading: 'Upgrade required',
          message: payload.plan.message || UPGRADE_MESSAGE,
          tone: 'warning',
          action: 'close',
          blockButton: true,
          code: 'plan-blocked',
          debug: {
            requestId: payload?.debug?.requestId,
            planId: payload.plan.id,
            productId: payload.productId || getProductId(),
            reason: 'plan_blocked'
          }
        };
      }
      if (!designMode && payload.isProcessed === false){
        const conversionStatus = payload.conversionStatus || 'not_ready';
        let heading = "Garment isn't ready yet";
        let message = 'This garment has not been processed yet.';
        let tone = 'warning';
        if (conversionStatus === 'processing'){
          heading = 'Garment still processing';
          message = 'We are still processing this garment. Please wait a few minutes and try again.';
        } else if (conversionStatus === 'failed'){
          heading = 'Garment conversion failed';
          message = 'This garment is not available for try-on.';
          tone = 'error';
        }
        return {
          heading,
          message,
          tone,
          action: 'close',
          blockButton: false,
          code: 'garment-unprocessed',
          debug: {
            requestId: payload?.debug?.requestId,
            productId: payload.productId || getProductId(),
            conversionStatus,
            reason: 'garment_unprocessed'
          }
        };
      }
      return null;
    }

    function getEndpointBase(){
      const base = container.getAttribute('data-api-base');
      if (base && base !== 'use_app_route' && base !== 'use_app_proxy') {
        return base;
      }
      return '/apps/bould';
    }

    function ensureUpgradeNotice(){
      let notice = container.querySelector('.bould-widget__upgrade');
      if (!notice) {
        notice = document.createElement('div');
        notice.className = 'bould-widget__upgrade';
        container.appendChild(notice);
      }
      return notice;
    }

    const UPGRADE_MESSAGE = "Upgrade to continue using Bould.";

    function applyPlanState(payload){
      const plan = payload && payload.plan ? payload.plan : null;
      const blocked = !!(plan && plan.blocked);
      const existingNotice = container.querySelector('.bould-widget__upgrade');
      const designMode = !!(window.Shopify && window.Shopify.designMode);

      if (blocked) {
        const message =
          plan && plan.message
            ? plan.message
            : UPGRADE_MESSAGE;

        if (designMode) {
          const notice = existingNotice || ensureUpgradeNotice();
          notice.textContent = message;
          notice.hidden = false;
        } else if (existingNotice) {
          existingNotice.textContent = '';
          existingNotice.hidden = true;
        }

        container.setAttribute('data-plan-blocked', 'true');

        if (openBtn) {
          openBtn.disabled = true;
          openBtn.classList.add('bould-widget__open--disabled');
          openBtn.style.display = designMode ? '' : 'none';
          openBtn.setAttribute('data-disabled-reason', 'plan-blocked');
          openBtn.setAttribute('title', message);
          openBtn.setAttribute('aria-disabled', 'true');
        }
      } else {
        container.removeAttribute('data-plan-blocked');
        if (existingNotice) {
          existingNotice.textContent = '';
          existingNotice.hidden = true;
        }
        if (openBtn) {
          openBtn.style.display = '';
          openBtn.disabled = false;
          openBtn.classList.remove('bould-widget__open--disabled');
          openBtn.removeAttribute('data-disabled-reason');
          openBtn.removeAttribute('title');
          openBtn.removeAttribute('aria-disabled');
        }
      }
    }

    async function fetchStatusPayload(){
      const productId = getProductId();
      const designMode = !!(window.Shopify && window.Shopify.designMode);
      if (!productId && !designMode) {
        return null;
      }
      const correlationId = Math.random().toString(36).slice(2, 10);
      const statusParams = new URLSearchParams();
      statusParams.set('intent', 'status');
      if (productId) {
        statusParams.set('product_id', productId);
      }
      if (designMode) {
        statusParams.set('design_mode', '1');
      }
      const statusUrl = `${getEndpointBase()}?${statusParams.toString()}`;
      const res = await fetch(statusUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Correlation-ID': correlationId
        }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.warn('[Bould Widget] Status check failed', res.status, text);
        return null;
      }
      return res.json();
    }

    async function ensurePlanStatus(){
      if (statusPromise) {
        return statusPromise;
      }
      statusPromise = (async () => {
        try {
          const payload = await fetchStatusPayload();
          applyPlanState(payload);
          return payload;
        } catch (error) {
          console.warn('[Bould Widget] Failed to determine plan status', error);
          applyPlanState(null);
          return null;
        } finally {
          statusPromise = null;
        }
      })();
      return statusPromise;
    }

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
      const designMode = isDesignMode();
      const immediateGate = getImmediateGate(designMode);
      if (immediateGate){
        showInlineNotice(immediateGate.message, immediateGate.tone || 'warning');
        if (immediateGate.blockButton) {
          setOpenButtonDisabled(true, immediateGate.code || 'immediate-gate', immediateGate.message);
        }
        if (immediateGate.debug) {
          console.info('[Bould Widget] Immediate gate triggered', immediateGate.debug);
        }
        return;
      }

      setOpenButtonDisabled(false);

      let preflight = null;
      try{
        preflight = await ensurePlanStatus();
      }catch(e){
        preflight = null;
      }
      const preflightGate = getPreflightGate(preflight, designMode);
      if (preflightGate){
        showInlineNotice(preflightGate.message, preflightGate.tone || 'warning');
        if (preflightGate.blockButton) {
          setOpenButtonDisabled(true, preflightGate.code || 'preflight-gate', preflightGate.message);
        } else {
          setOpenButtonDisabled(false);
        }
        if (preflightGate.debug) {
          console.info('[Bould Widget] Preflight gate triggered', preflightGate.debug);
        }
        return;
      }

      clearInlineNotice();
      setOpenButtonDisabled(false);

      if(!modal.parentElement || modal.parentElement !== document.body){
        document.body.appendChild(modal);
      }
      modal.hidden = false;
      modal.setAttribute('data-state','opening');

      showScreen('intro');
      setTimeout(function(){ modal.removeAttribute('data-state'); }, 250);
    }
    function close(){
      modal.hidden = true;
      stopFeedbackCycle();
      resetLoadingMessage();
    }

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
        let feedbackMessages = [];
        let firstFeedbackMessage = '';
        let finalFeedbackText = '';
        prepareForRequest();
        try{
          // Determine endpoint: app proxy or absolute API base from settings
          const productId = getProductId();
          const correlationId = Math.random().toString(36).slice(2, 10);
          const endpointBase = getEndpointBase();
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

          feedbackMessages = extractFeedbackMessages(data);
          firstFeedbackMessage = feedbackMessages[0] || '';
          finalFeedbackText = feedbackMessages.join(' ').trim();
          if (!finalFeedbackText) {
            finalFeedbackText =
              firstFeedbackMessage ||
              (loadingStatusEl ? loadingStatusEl.dataset.defaultText || loadingDefaultText || '' : '');
          }

          stopFeedbackCycle(true);
          if (firstFeedbackMessage) {
            startLoadingFeedback([firstFeedbackMessage], {
              loop: true,
              holdMs: 2200,
              fadeMs: 260,
              initialDelay: 0,
              hideStatus: true
            });
          } else if (feedbackMessages.length) {
            startLoadingFeedback(feedbackMessages, {
              loop: true,
              holdMs: FEEDBACK_VISIBLE_MS,
              fadeMs: FEEDBACK_FADE_MS,
              initialDelay: 0,
              hideStatus: true
            });
          } else if (loadingStatusEl) {
            loadingStatusEl.hidden = false;
          }
          
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
          
          // Derive presentation data
          const recommendedSizeRaw = data.recommended_size || data.recommendedSize || '';
          const normalizedSize = String(recommendedSizeRaw || '').trim();
          const sizeText = 'Recommended size: ' + (normalizedSize || '-');
          let confidenceText = '';
          if (data.confidence !== undefined && data.confidence !== null && data.confidence !== '') {
            const numericConfidence = Number(data.confidence);
            if (!Number.isNaN(numericConfidence)) {
              confidenceText = 'Confidence: ' + numericConfidence.toFixed(2) + '%';
            }
          }

          const imageCandidates = [];
          if (data.tryOnImageUrl) imageCandidates.push(data.tryOnImageUrl);
          if (data.try_on_image_url && data.try_on_image_url !== data.tryOnImageUrl) imageCandidates.push(data.try_on_image_url);
          if (data.tryonImageUrl && data.tryonImageUrl !== data.tryOnImageUrl) imageCandidates.push(data.tryonImageUrl);
          if (data.debug && data.debug.measurement_vis_url) imageCandidates.push(data.debug.measurement_vis_url);

          const imageResult = await loadImageCandidates(imageCandidates);

          stopFeedbackCycle(true);

          if (modal.hidden) {
            console.info('[Bould Widget] Modal closed before result reveal.');
            resetLoadingMessage();
            return;
          }

          const resolvedImageUrl = imageResult && imageResult.loaded ? imageResult.url : '';
          const displayFeedbackText =
            (finalFeedbackText || '').trim() ||
            (loadingStatusEl ? loadingStatusEl.dataset.defaultText || loadingDefaultText || '' : '');

          revealResultView({
            imageUrl: resolvedImageUrl,
            sizeText,
            confidenceText,
            feedbackText: displayFeedbackText
          });
        }catch(err){
          console.error('[Bould Widget] Error occurred:', err);
          resetLoadingMessage();

          let message = (err && err.message ? err.message : 'Unknown error occurred. Please try again.');
          if (err && err.name === 'AbortError') {
            message = 'The request timed out before completing. Please try again in a moment.';
          }

          let debugInfo = err && err.debugInfo ? { ...err.debugInfo } : null;
          if (err && err.statusCode) {
            if (!debugInfo) {
              debugInfo = {};
            }
            debugInfo.statusCode = err.statusCode;
          }
          if (debugInfo) {
            console.log('[Bould Widget] Debug information:', debugInfo);
          }

          const errorOptions = {};
          if (err && err.statusCode === 409) {
            errorOptions.tone = 'warning';
            errorOptions.heading = 'Action needed';
            errorOptions.action = 'close';
          } else if (err && err.statusCode && err.statusCode >= 500) {
            errorOptions.tone = 'error';
          }

          showError(message, debugInfo, errorOptions);
          if (err && err.statusCode === 409) {
            ensurePlanStatus();
          }
        }
      });
    }

    function showError(message, debugInfo = null, options = {}){
      const errorScreen = modal.querySelector('.bould-widget__screen--error');
      if (!errorScreen) {
        return;
      }

      const titleEl = errorScreen.querySelector('h3');
      if (titleEl) {
        titleEl.textContent = options.heading || DEFAULT_ERROR_HEADING;
      }

      if (errorActionButton) {
        if (options.action === 'close') {
          errorActionButton.textContent = options.actionLabel || 'Close';
          errorActionButton.setAttribute('data-action', 'close');
        } else {
          errorActionButton.textContent = errorActionDefaults.label;
          errorActionButton.setAttribute('data-action', errorActionDefaults.action);
        }
      }

      const pre = errorScreen.querySelector('.bould-widget__error');
      if (pre) {
        pre.className = 'bould-widget__error';
        pre.classList.add('bould-widget__error--danger');
        if (options.tone === 'info') {
          pre.classList.remove('bould-widget__error--danger');
          pre.classList.add('bould-widget__error--info');
        } else if (options.tone === 'warning') {
          pre.classList.remove('bould-widget__error--danger');
          pre.classList.add('bould-widget__error--warn');
        } else if (options.tone === 'error') {
          pre.classList.add('bould-widget__error--danger');
        }

        const parts = [`<div class="bould-widget__error-content">${formatMessage(message)}</div>`];
        const debugHtml = renderDebugInfo(debugInfo);
        if (debugHtml) {
          parts.push(debugHtml);
        }
        pre.innerHTML = parts.join('');
      }

      showScreen('error');
    }
    ensurePlanStatus();
  });
})();


