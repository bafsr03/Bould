export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function formatMessage(value) {
    return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

export function isDesignMode() {
    try {
        return !!(window.Shopify && window.Shopify.designMode);
    } catch (e) {
        return false;
    }
}

export function isPhoneDevice() {
    try {
        if (navigator?.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') {
            return navigator.userAgentData.mobile;
        }
    } catch (e) { }
    const ua = (navigator.userAgent || navigator.vendor || (window.opera && window.opera.toString && window.opera.toString()) || '').toLowerCase();
    const matchesUa = /(android|iphone|ipad|ipod|windows phone|blackberry|bb10|mobile)/i.test(ua);
    const coarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    const narrow = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 820px)').matches;
    return matchesUa || (coarse && narrow);
}

export function splitIntoSentences(value) {
    if (!value) return [];
    const matches = String(value)
        .replace(/\s+/g, ' ')
        .match(/[^.!?]+[.!?]*/g);
    if (!matches) {
        return [String(value).trim()];
    }
    return matches.map(function (part) {
        return part.trim();
    }).filter(Boolean);
}

export function formatMetricName(metric) {
    return String(metric || '')
        .split('_')
        .map(function (part) {
            if (!part) return '';
            return part.charAt(0).toUpperCase() + part.slice(1);
        })
        .filter(Boolean)
        .join(' ');
}

export function summarizeSlack(matchDetails, preferredUnit) {
    if (!matchDetails || typeof matchDetails !== 'object') return '';
    const unitKey = preferredUnit === 'inch' ? 'slacks_in' : 'slacks_cm';
    const slackObj = matchDetails[unitKey];
    if (!slackObj || typeof slackObj !== 'object') return '';
    const entries = Object.entries(slackObj)
        .map(function (entry) {
            const metric = entry[0];
            const rawValue = Number(entry[1]);
            if (!metric || Number.isNaN(rawValue)) return null;
            return [metric, rawValue];
        })
        .filter(Boolean)
        .sort(function (a, b) {
            return Math.abs(b[1]) - Math.abs(a[1]);
        });
    if (!entries.length) return '';
    const topEntries = entries.slice(0, 3).map(function (entry) {
        const metric = formatMetricName(entry[0]);
        const value = entry[1];
        const formatted = (value > 0 ? '+' : '') + value.toFixed(1);
        return metric + ' ' + formatted;
    });
    const unitLabel = preferredUnit === 'inch' ? 'in' : 'cm';
    return 'Slack (' + unitLabel + '): ' + topEntries.join(', ');
}

export function extractFeedbackMessages(data, fallbackText = '') {
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
        .map(function (msg) {
            return String(msg || '').replace(/\s+/g, ' ').trim();
        })
        .filter(Boolean);

    if (!messages.length && fallbackText) {
        messages = [fallbackText];
    }

    if (messages.length === 1) {
        const first = messages[0];
        const newlineParts = first.split(/\n+/).map(function (part) {
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
    messages.forEach(function (msg) {
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

export function loadImageAsset(url) {
    if (!url) {
        return Promise.resolve({ url: '', loaded: false });
    }
    return new Promise(function (resolve) {
        const testImg = new Image();
        testImg.decoding = 'async';
        testImg.onload = function () {
            resolve({ url, loaded: true });
        };
        testImg.onerror = function () {
            resolve({ url, loaded: false });
        };
        testImg.src = url;
    });
}

export function loadImageCandidates(urls) {
    const candidates = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (!candidates.length) {
        return Promise.resolve({ url: '', loaded: false });
    }
    let index = 0;
    return new Promise(function (resolve) {
        function attempt() {
            const currentUrl = candidates[index];
            loadImageAsset(currentUrl).then(function (result) {
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

export function getProductId(container) {
    const fromAttr = container.getAttribute('data-product-id') || '';
    if (fromAttr) return fromAttr;
    try {
        const numId = (window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product && window.ShopifyAnalytics.meta.product.id) || null;
        if (numId) return `gid://shopify/Product/${numId}`;
    } catch (e) { }
    return '';
}

export function getProductImageUrl(container) {
    const fromAttr = container.getAttribute('data-product-image') || '';
    if (fromAttr) return fromAttr;
    try {
        const analyticsProduct = window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product;
        if (analyticsProduct) {
            if (typeof analyticsProduct.image_url === 'string' && analyticsProduct.image_url) {
                return analyticsProduct.image_url;
            }
            if (Array.isArray(analyticsProduct.images) && analyticsProduct.images.length > 0) {
                return analyticsProduct.images[0];
            }
        }
    } catch (e) { }
    return '';
}

export function isCustomerLoggedIn() {
    try {
        const shopifyCustomer = window.Shopify && window.Shopify.customer;
        if (shopifyCustomer && (shopifyCustomer.id || shopifyCustomer.email)) {
            return true;
        }
    } catch (e) { }
    try {
        const analyticsMeta = window.ShopifyAnalytics && window.ShopifyAnalytics.meta;
        if (analyticsMeta) {
            if (analyticsMeta.page && analyticsMeta.page.customerId) {
                return true;
            }
            if (analyticsMeta.customerId) {
                return true;
            }
        }
    } catch (e) { }
    try {
        const cookies = document.cookie ? document.cookie.split(';') : [];
        for (let i = 0; i < cookies.length; i += 1) {
            const cookie = cookies[i].trim();
            if (!cookie) continue;
            const eqIndex = cookie.indexOf('=');
            if (eqIndex === -1) continue;
            const name = cookie.slice(0, eqIndex);
            const value = cookie.slice(eqIndex + 1);
            if (name === 'customer_signed_in') {
                const normalized = value.toLowerCase();
                if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
                    return true;
                }
            }
        }
    } catch (e) { }
    return false;
}
