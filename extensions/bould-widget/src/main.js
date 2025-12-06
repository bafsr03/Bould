import { updateHeaderForScreen } from './ui/header';
import { IntroManager } from './ui/intro';
import { ImageViewer } from './ui/image-viewer';
import { LoadingManager } from './ui/loading';
import { ResultManager } from './ui/result';
import { NoticeManager } from './ui/notice';
import { StorageService } from './services/storage';
import { ApiService } from './services/api';
import {
    getProductId,
    getProductImageUrl,
    isPhoneDevice,
    isDesignMode,
    extractFeedbackMessages,
    loadImageCandidates,
    summarizeSlack,
    formatMessage,
    escapeHtml
} from './utils';
import { DEFAULT_LOADING_FEEDBACK, DEFAULT_ERROR_HEADING } from './constants';

(function () {
    // Bind per-block instance
    document.querySelectorAll('[data-bould-widget]').forEach(function (container) {
        // Get all DOM elements
        const openBtn = container.querySelector('.bould-widget__open');
        const modal = container.querySelector('.bould-widget');
        const closeBtn = container.querySelector('.bould-widget__close');

        // Header elements
        const header = modal ? modal.querySelector('.bould-widget__header') : null;
        const headerEyebrow = header ? header.querySelector('.bould-widget__eyebrow') : null;
        const headerTitle = header ? header.querySelector('.bould-widget__title') : null;
        const headerSubtitle = header ? header.querySelector('.bould-widget__subtitle') : null;
        const headerDefaults = {
            eyebrow: headerEyebrow ? headerEyebrow.textContent.trim() : '',
            title: headerTitle ? headerTitle.textContent.trim() : '',
            subtitle: headerSubtitle ? headerSubtitle.textContent.trim() : ''
        };

        // Loading screen elements
        const loadingScreen = modal ? modal.querySelector('.bould-widget__screen--loading') : null;
        const loadingStatusEl = loadingScreen ? loadingScreen.querySelector('.bould-widget__loading-text') : null;
        const loadingFeedbackEl = loadingScreen ? loadingScreen.querySelector('[data-loading-feedback]') : null;
        const loadingGeneratingEl = loadingScreen ? loadingScreen.querySelector('[data-loading-generating]') : null;

        // Result screen elements
        const resultScreen = modal ? modal.querySelector('.bould-widget__screen--result') : null;
        const resultImageEl = resultScreen ? resultScreen.querySelector('.bould-widget__result-image') : null;
        const resultSizeEl = resultScreen ? resultScreen.querySelector('.bould-widget__size') : null;
        const resultConfidenceEl = resultScreen ? resultScreen.querySelector('.bould-widget__confidence') : null;
        const resultFeedbackEl = resultScreen ? resultScreen.querySelector('.bould-widget__feedback') : null;
        const resultStageEls = resultScreen ? Array.from(resultScreen.querySelectorAll('.bould-widget__result-stage')) : [];

        // Intro screen elements
        const introScreen = modal ? modal.querySelector('.bould-widget__screen--intro') : null;
        const introSteps = introScreen ? Array.from(introScreen.querySelectorAll('.bould-widget__intro-step')) : [];
        const introActions = introScreen ? introScreen.querySelector('.bould-widget__actions--intro') : null;

        // Error screen elements
        const errorActionButton = modal ? modal.querySelector('.bould-widget__screen--error [data-action]') : null;
        const errorActionDefaults = errorActionButton
            ? {
                label: errorActionButton.textContent || 'Try again',
                action: errorActionButton.getAttribute('data-action') || 'back-to-form',
            }
            : { label: 'Try again', action: 'back-to-form' };

        // Mark as enhanced
        if (container && container.classList && !container.classList.contains('bould-widget--enhanced')) {
            container.classList.add('bould-widget--enhanced');
        }

        // Widget ID
        const widgetIdRaw = container.getAttribute('data-block-id') || '';
        const widgetViewerId = widgetIdRaw || Math.random().toString(36).slice(2, 8);

        // Initialize managers
        const introManager = new IntroManager({ introScreen, introSteps, introActions });
        const imageViewer = new ImageViewer(widgetViewerId);
        const loadingManager = new LoadingManager({
            loadingScreen,
            loadingStatusEl,
            loadingFeedbackEl,
            loadingGeneratingEl
        });
        const resultManager = new ResultManager({
            resultScreen,
            resultImageEl,
            resultSizeEl,
            resultConfidenceEl,
            resultFeedbackEl,
            resultStageEls
        });
        const noticeManager = new NoticeManager(container, openBtn);
        const storageService = new StorageService(container);
        const apiService = new ApiService(container);

        // State
        let statusPromise = null;
        let defaultFeedbackController = null;
        let defaultFeedbackPromise = null;
        let tailoredFeedbackController = null;
        let tailoredFeedbackPromise = null;

        // Initialize header
        const headerElements = { header, headerEyebrow, headerTitle, headerSubtitle, modal, headerDefaults };
        updateHeaderForScreen('intro', headerElements);

        // Helper functions
        function showScreen(name) {
            if (modal) {
                modal.querySelectorAll('.bould-widget__screen').forEach(function (s) {
                    s.hidden = s.dataset.screen !== name;
                });
            }
            updateHeaderForScreen(name, headerElements);
            if (name === 'intro') {
                introManager.runAnimation();
            } else {
                introManager.clearAnimation();
            }
            loadingManager.setGeneratingActive(name === 'loading');
        }

        async function ensurePlanStatus() {
            if (statusPromise) {
                return statusPromise;
            }
            statusPromise = (async () => {
                try {
                    const payload = await apiService.fetchStatus();
                    noticeManager.applyPlanState(payload);
                    return payload;
                } catch (error) {
                    console.warn('[Bould Widget] Failed to determine plan status', error);
                    noticeManager.applyPlanState(null);
                    return null;
                } finally {
                    statusPromise = null;
                }
            })();
            return statusPromise;
        }

        function prepareForRequest() {
            loadingManager.stopFeedbackCycle(true);
            resultManager.reset();
            defaultFeedbackController = null;
            defaultFeedbackPromise = null;
            tailoredFeedbackController = null;
            tailoredFeedbackPromise = null;

            if (loadingFeedbackEl) {
                if (loadingStatusEl) {
                    loadingStatusEl.hidden = true;
                }
                loadingFeedbackEl.hidden = false;
                loadingFeedbackEl.classList.remove('is-visible');
                loadingFeedbackEl.textContent = '';
                defaultFeedbackController = loadingManager.startFeedback(DEFAULT_LOADING_FEEDBACK, {
                    loop: true,
                    holdMs: 2600,
                    fadeMs: 600,
                    initialDelay: 0,
                    hideStatus: false
                });
                defaultFeedbackPromise = defaultFeedbackController ? defaultFeedbackController.promise : null;
            } else {
                loadingManager.reset();
            }
            showScreen('loading');
        }

        async function open() {
            const designMode = isDesignMode();
            const immediateGate = apiService.getImmediateGate(designMode);
            if (immediateGate) {
                noticeManager.showInline(immediateGate.message, immediateGate.tone || 'warning');
                if (immediateGate.blockButton) {
                    noticeManager.setOpenButtonDisabled(true, immediateGate.code || 'immediate-gate', immediateGate.message);
                }
                if (immediateGate.debug) {
                    console.info('[Bould Widget] Immediate gate triggered', immediateGate.debug);
                }
                return;
            }

            noticeManager.setOpenButtonDisabled(false);

            let preflight = null;
            try {
                preflight = await ensurePlanStatus();
            } catch (e) {
                preflight = null;
            }
            const preflightGate = apiService.getPreflightGate(preflight, designMode);
            if (preflightGate) {
                noticeManager.showInline(preflightGate.message, preflightGate.tone || 'warning');
                if (preflightGate.blockButton) {
                    noticeManager.setOpenButtonDisabled(true, preflightGate.code || 'preflight-gate', preflightGate.message);
                } else {
                    noticeManager.setOpenButtonDisabled(false);
                }
                if (preflightGate.debug) {
                    console.info('[Bould Widget] Preflight gate triggered', preflightGate.debug);
                }
                return;
            }

            noticeManager.clearInline();
            noticeManager.setOpenButtonDisabled(false);

            if (!modal.parentElement || modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }
            modal.hidden = false;
            modal.setAttribute('data-state', 'opening');

            const savedResult = storageService.load();
            if (savedResult) {
                resultManager.reveal(savedResult, showScreen);
                loadingManager.reset();
                setTimeout(function () { modal.removeAttribute('data-state'); }, 250);
                return;
            }

            showScreen('intro');
            setTimeout(function () { modal.removeAttribute('data-state'); }, 250);
        }

        function close() {
            modal.hidden = true;
            imageViewer.close(true);
            loadingManager.stopFeedbackCycle();
            loadingManager.reset();
            introManager.clearAnimation();
        }

        function showError(message, debugInfo = null, options = {}) {
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
                const debugHtml = noticeManager.renderDebugInfo(debugInfo);
                if (debugHtml) {
                    parts.push(debugHtml);
                }
                pre.innerHTML = parts.join('');
            }

            showScreen('error');
        }

        // Event listeners
        openBtn && openBtn.addEventListener('click', open);
        closeBtn && closeBtn.addEventListener('click', close);
        modal && modal.addEventListener('click', function (e) { if (e.target === modal) close(); });

        modal && modal.addEventListener('click', function (e) {
            const t = e.target;
            if (!(t instanceof HTMLElement)) return;
            if (t.matches('[data-action="continue"]')) {
                showScreen('form');
            } else if (t.matches('[data-action="close"]')) {
                close();
            } else if (t.matches('[data-action="back-to-form"]')) {
                showScreen('form');
            } else if (t.matches('[data-action="retake"]')) {
                showScreen('form');
            }
        });

        if (resultImageEl) {
            resultImageEl.addEventListener('click', function () {
                const src = resultImageEl.getAttribute('src');
                if (!src) return;
                const altText = resultImageEl.getAttribute('alt') || 'Try on result';
                if (isPhoneDevice()) {
                    imageViewer.open(src, altText, resultImageEl);
                    return;
                }
                const popup = window.open(src, '_blank', 'noopener');
                if (popup && typeof popup === 'object') {
                    try {
                        popup.opener = null;
                    } catch (e) { }
                } else {
                    window.location.href = src;
                }
            });
        }

        // Form handling
        const form = container.querySelector('.bould-widget__form');
        if (form) {
            const heightInput = form.querySelector('input[name="height"]');
            const unitSelect = form.querySelector('select[name="body_unit"]');

            // Create feet/inches inputs wrapper
            const heightWrapper = heightInput ? heightInput.parentElement : null;
            let feetInput = null;
            let inchesInput = null;
            let imperialWrapper = null;

            // Style the unit select to match inputs
            if (unitSelect) {
                unitSelect.style.appearance = 'none';
                unitSelect.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%236B7280' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`;
                unitSelect.style.backgroundRepeat = 'no-repeat';
                unitSelect.style.backgroundPosition = 'right 12px center';
                unitSelect.style.paddingRight = '32px';
            }

            if (heightWrapper) {
                // Ensure wrapper is relative for absolute positioning if needed, 
                // but flex is better. Assuming heightWrapper is a flex container or we make it one.
                // Actually, looking at standard forms, inputs are usually block. 
                // We'll insert the imperial wrapper.
                
                imperialWrapper = document.createElement('div');
                imperialWrapper.className = 'bould-widget__imperial-inputs';
                imperialWrapper.style.display = 'none';
                imperialWrapper.style.gap = '8px';
                imperialWrapper.style.width = '100%'; // Take full width

                feetInput = document.createElement('input');
                feetInput.type = 'number';
                feetInput.placeholder = 'Ft';
                feetInput.className = heightInput.className; // Copy styles
                feetInput.min = '2';
                feetInput.max = '8';
                feetInput.style.flex = '1';
                feetInput.required = true; // Make feet required when visible

                inchesInput = document.createElement('input');
                inchesInput.type = 'number';
                inchesInput.placeholder = 'In';
                inchesInput.className = heightInput.className; // Copy styles
                inchesInput.min = '0';
                inchesInput.max = '11';
                inchesInput.style.flex = '1';
                inchesInput.required = true; // Make inches required when visible

                imperialWrapper.appendChild(feetInput);
                imperialWrapper.appendChild(inchesInput);
                
                // Insert after the original height input
                if (heightInput.nextSibling) {
                    heightWrapper.insertBefore(imperialWrapper, heightInput.nextSibling);
                } else {
                    heightWrapper.appendChild(imperialWrapper);
                }

                // Sync logic
                const updateHiddenHeight = () => {
                    const ft = parseInt(feetInput.value) || 0;
                    const inc = parseInt(inchesInput.value) || 0;
                    const totalInches = (ft * 12) + inc;
                    heightInput.value = totalInches > 0 ? totalInches : '';
                };

                feetInput.addEventListener('input', updateHiddenHeight);
                inchesInput.addEventListener('input', updateHiddenHeight);
            }

            function updateHeightFieldAttributes() {
                if (!heightInput) return;
                const selected = unitSelect ? String(unitSelect.value || '').toLowerCase() : 'cm';
                
                if (selected === 'inch' || selected === 'inches' || selected === 'in') {
                    // Show imperial inputs, hide metric input
                    if (imperialWrapper) {
                        imperialWrapper.style.display = 'flex';
                        heightInput.style.display = 'none';
                        heightInput.required = false; // Disable required on hidden input
                        if (feetInput) feetInput.required = true;
                        if (inchesInput) inchesInput.required = true;
                    } else {
                        // Fallback
                        heightInput.placeholder = 'Height (in)';
                        heightInput.min = '25';
                        heightInput.max = '107';
                    }
                } else {
                    // Show metric input, hide imperial inputs
                    if (imperialWrapper) {
                        imperialWrapper.style.display = 'none';
                        if (feetInput) feetInput.required = false;
                        if (inchesInput) inchesInput.required = false;
                        heightInput.style.display = 'block';
                        heightInput.required = true;
                    }
                    heightInput.placeholder = 'Height (cm)';
                    heightInput.min = '65';
                    heightInput.max = '272';
                }
            }

            updateHeightFieldAttributes();
            if (unitSelect) {
                unitSelect.addEventListener('change', updateHeightFieldAttributes);
            }

            const fileInput = form.querySelector('input[name="user_image"]');
            const uploadText = form.querySelector('.bould-widget__upload-text');
            const uploadIcon = form.querySelector('.bould-widget__upload-icon');

            if (fileInput) {
                fileInput.addEventListener('change', function () {
                    if (fileInput.files && fileInput.files[0]) {
                        if (uploadText) {
                            uploadText.textContent = fileInput.files[0].name;
                            uploadText.style.color = '#1E293B';
                            uploadText.style.fontWeight = '500';
                        }
                        if (uploadIcon) {
                            uploadIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                            uploadIcon.style.background = '#E0E7FF';
                            uploadIcon.style.color = '#4F46E5';
                            uploadIcon.style.transform = 'none';
                        }
                        const uploadContainer = form.querySelector('.bould-widget__file-upload');
                        if (uploadContainer) {
                            uploadContainer.style.borderColor = '#6366F1';
                            uploadContainer.style.background = '#EEF2FF';
                        }
                    }
                });
            }

            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                const fd = new FormData(form);
                const file = fd.get('user_image');
                const height = fd.get('height');
                const bodyUnitRaw = fd.get('body_unit');
                const bodyUnit = typeof bodyUnitRaw === 'string' ? bodyUnitRaw.toLowerCase() : 'cm';
                const productImageUrl = getProductImageUrl(container);

                if (!(file instanceof File) || !height) {
                    return showError('Missing image or height.');
                }

                if (productImageUrl) {
                    fd.set('product_image_url', productImageUrl);
                }

                let feedbackMessages = [];
                let firstFeedbackMessage = '';
                let finalFeedbackText = '';

                prepareForRequest();

                try {
                    const productId = getProductId(container);
                    const correlationId = Math.random().toString(36).slice(2, 10);
                    const endpointBase = apiService.getEndpointBase();
                    const endpoint = productId ? `${endpointBase}?product_id=${encodeURIComponent(productId)}` : endpointBase;

                    console.log('[Bould Widget] Making request to:', endpoint);
                    console.log('[Bould Widget] Form data:', {
                        hasImage: file instanceof File,
                        imageSize: file instanceof File ? file.size : 'N/A',
                        height: height,
                        imageType: file instanceof File ? file.type : 'N/A',
                        bodyUnit: bodyUnit,
                        productId,
                        correlationId,
                        productImageUrl
                    });

                    const controller = new AbortController();
                    const timeoutMs = 28000;
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

                    if (!res.ok) {
                        let errorMessage = 'Unknown server error';
                        let debugInfo = {};
                        const contentType = res.headers.get('content-type') || '';

                        if (!contentType.includes('application/json')) {
                            const text = await res.text().catch(() => '');
                            errorMessage = `Server error: ${res.status}. Received non-JSON response. This often indicates a proxy misconfiguration.`;
                            const enhancedError = new Error(errorMessage);
                            enhancedError.debugInfo = {
                                correlationId,
                                productId,
                                responseCorrelationId: resHeaders['x-correlation-id'] || resHeaders['x-request-id'],
                                hint: 'Verify Shopify App Proxy path maps to /apps/bould',
                                responseSnippet: text.slice(0, 200)
                            };
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

                            if (res.status === 404) {
                                errorMessage = 'Widget endpoint not found. Please check your configuration.';
                            } else if (res.status === 409) {
                                if (errorData.error && (errorData.error.includes('not processed') || errorData.error.includes('not been converted'))) {
                                    errorMessage = "This garment hasn't been edited.";
                                } else if (errorData.error && errorData.error.includes('processing')) {
                                    errorMessage = 'This garment is currently being processed. Please wait a few minutes and try again.';
                                } else if (errorData.error && errorData.error.includes('failed')) {
                                    errorMessage = 'Garment conversion failed. Please try converting again in the Bould app.';
                                } else {
                                    errorMessage = errorData.error || "This garment hasn't been edited.";
                                }
                            } else if (res.status === 502) {
                                errorMessage = 'Garment processing service is unavailable. Please ensure the garment has been properly converted.';
                            } else if (res.status === 504) {
                                errorMessage = 'The request timed out. Please try again in a moment.';
                            } else if (res.status === 500) {
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

                        const enhancedError = new Error(errorMessage);
                        enhancedError.debugInfo = Object.assign({
                            correlationId,
                            productId,
                            responseCorrelationId: resHeaders['x-correlation-id'] || resHeaders['x-request-id']
                        }, debugInfo || {});
                        enhancedError.statusCode = res.status;
                        throw enhancedError;
                    }

                    const data = await res.json();
                    console.log('[Bould Widget] Success response:', data);

                    const displayUnitRaw = typeof data.display_unit === 'string' ? data.display_unit : bodyUnit;
                    const displayUnit = String(displayUnitRaw || 'cm').toLowerCase() === 'inch' ? 'inch' : 'cm';
                    const matchDetails = data && typeof data === 'object' ? data.match_details || data.matchDetails || {} : {};

                    // Use preview_feedback for the loading cycle
                    feedbackMessages = Array.isArray(data.preview_feedback) && data.preview_feedback.length 
                        ? data.preview_feedback 
                        : extractFeedbackMessages(data, loadingStatusEl?.dataset.defaultText || '').slice(0, 3);
                    
                    if (!feedbackMessages.length && firstFeedbackMessage) {
                        feedbackMessages = [firstFeedbackMessage];
                    }
                    
                    // Use final_feedback for the result screen
                    finalFeedbackText = data.final_feedback || data.tailor_feedback || '';
                    if (!finalFeedbackText) {
                        finalFeedbackText = feedbackMessages.join(' ').trim();
                    }
                    
                    loadingManager.stopFeedbackCycle(false);
                    if (defaultFeedbackPromise) {
                        try {
                            await defaultFeedbackPromise;
                        } catch (defaultCycleError) {
                            console.info('[Bould Widget] Default feedback sequence ended early', defaultCycleError);
                        }
                    }
                    defaultFeedbackController = null;
                    defaultFeedbackPromise = null;

                    const tailoredMessages = (feedbackMessages.length ? feedbackMessages : [
                        DEFAULT_LOADING_FEEDBACK[DEFAULT_LOADING_FEEDBACK.length - 1]
                    ]).slice(0, 3);
                    
                    tailoredFeedbackController = loadingManager.startFeedback(tailoredMessages, {
                        loop: true,
                        holdMs: 2800,
                        fadeMs: 600,
                        initialDelay: 0,
                        hideStatus: true
                    });
                    tailoredFeedbackPromise = tailoredFeedbackController ? tailoredFeedbackController.promise : null;

                    // Handle queued responses (polling)
                    if (data && data.queued) {
                        if (!data.task_id) {
                            console.error('[Bould Widget] Queued response missing task_id:', data);
                            throw new Error('The try-on service queued your request but did not provide a task ID. Please try again or contact support.');
                        }
                        console.log('[Bould Widget] Try-on queued. Polling for completion. task_id=', data.task_id);
                        const start = Date.now();
                        const maxMs = 55000;
                        const pollDelay = 1500;
                        const taskId = data.task_id;
                        let attempt = 0;
                        while (Date.now() - start < maxMs) {
                            await new Promise(r => setTimeout(r, pollDelay));
                            attempt += 1;
                            console.log(`[Bould Widget] Polling attempt #${attempt}, elapsed: ${Date.now() - start}ms`);
                            try {
                                const statusUrl = `${endpointBase}?intent=tryon_status&task_id=${encodeURIComponent(taskId)}`;
                                console.log('[Bould Widget] Polling URL:', statusUrl);
                                const stRes = await fetch(statusUrl, { headers: { 'Accept': 'application/json', 'X-Correlation-ID': correlationId } });
                                console.log('[Bould Widget] Poll response status:', stRes.status);
                                if (stRes.ok) {
                                    const st = await stRes.json();
                                    console.log('[Bould Widget] Poll response data:', st);
                                    if (st && st.result_image_url) {
                                        console.log('[Bould Widget] Try-on complete! Image URL:', st.result_image_url);
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
                                } else {
                                    const text = await stRes.text().catch(() => '');
                                    console.warn('[Bould Widget] Status poll failed', stRes.status, text);
                                }
                            } catch (pe) {
                                console.warn('[Bould Widget] Status poll error', pe);
                            }
                        }
                        if (!data.tryOnImageUrl) {
                            console.error('[Bould Widget] Polling timed out after', Date.now() - start, 'ms');
                            throw new Error('The request timed out before the try-on image was ready. Please try again.');
                        }
                    }

                    if (!data || data.error) {
                        if (data.error && data.error.includes('not processed')) {
                            throw new Error('This garment has not been converted yet. Please run conversion in the Bould app first.');
                        }
                        throw new Error(data.error || 'Invalid response from server.');
                    }

                    const recommendedSizeRaw = data.recommended_size || data.recommendedSize || '';
                    const normalizedSize = String(recommendedSizeRaw || '').trim();
                    const unitLabelLong = displayUnit === 'inch' ? 'inches' : 'centimeters';
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

                    if (tailoredFeedbackController && typeof tailoredFeedbackController.cancel === 'function') {
                        tailoredFeedbackController.cancel(true);
                    }
                    tailoredFeedbackController = null;
                    tailoredFeedbackPromise = null;
                    loadingManager.stopFeedbackCycle(true);

                    if (modal.hidden) {
                        console.info('[Bould Widget] Modal closed before result reveal.');
                        loadingManager.reset();
                        return;
                    }

                    const resolvedImageUrl = imageResult && imageResult.loaded ? imageResult.url : '';
                    const displayFeedbackText = (finalFeedbackText || '').trim() || (loadingStatusEl ? loadingStatusEl.dataset.defaultText || '' : '');

                    const resultDetails = {
                        imageUrl: resolvedImageUrl,
                        sizeText,
                        confidenceText,
                        feedbackText: displayFeedbackText,
                        matchDetails,
                        displayUnit
                    };
                    storageService.save(resultDetails);
                    resultManager.reveal(resultDetails, showScreen);
                    loadingManager.reset();
                } catch (err) {
                    console.error('[Bould Widget] Error occurred:', err);
                    loadingManager.reset();

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

        // Initialize plan status
        ensurePlanStatus();
    });
})();
