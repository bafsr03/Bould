import { escapeHtml } from '../utils';
import { UPGRADE_MESSAGE } from '../constants';

export class NoticeManager {
    constructor(container, openBtn) {
        this.container = container;
        this.openBtn = openBtn;
    }

    ensureStateNotice() {
        let notice = this.container.querySelector('.bould-widget__state');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'bould-widget__state';
            notice.hidden = true;
            if (this.openBtn && typeof this.openBtn.insertAdjacentElement === 'function') {
                this.openBtn.insertAdjacentElement('afterend', notice);
            } else {
                this.container.appendChild(notice);
            }
        }
        return notice;
    }

    showInline(message, tone) {
        const notice = this.ensureStateNotice();
        notice.className = 'bould-widget__state';
        if (tone === 'warning') {
            notice.classList.add('bould-widget__state--warning');
        } else if (tone === 'error') {
            notice.classList.add('bould-widget__state--error');
        }
        notice.innerHTML = `<p>${escapeHtml(message)}</p>`;
        notice.hidden = false;
    }

    clearInline() {
        const notice = this.container.querySelector('.bould-widget__state');
        if (notice) {
            notice.className = 'bould-widget__state';
            notice.innerHTML = '';
            notice.hidden = true;
        }
    }

    ensureUpgradeNotice() {
        let notice = this.container.querySelector('.bould-widget__upgrade');
        if (!notice) {
            notice = document.createElement('div');
            notice.className = 'bould-widget__upgrade';
            this.container.appendChild(notice);
        }
        return notice;
    }

    applyPlanState(payload) {
        const plan = payload && payload.plan ? payload.plan : null;
        const blocked = !!(plan && plan.blocked);
        const existingNotice = this.container.querySelector('.bould-widget__upgrade');
        const designMode = !!(window.Shopify && window.Shopify.designMode);

        if (blocked) {
            const message = plan && plan.message ? plan.message : UPGRADE_MESSAGE;

            if (designMode) {
                const notice = existingNotice || this.ensureUpgradeNotice();
                notice.textContent = message;
                notice.hidden = false;
            } else if (existingNotice) {
                existingNotice.textContent = '';
                existingNotice.hidden = true;
            }

            this.container.setAttribute('data-plan-blocked', 'true');

            if (this.openBtn) {
                this.openBtn.disabled = true;
                this.openBtn.classList.add('bould-widget__open--disabled');
                this.openBtn.style.display = designMode ? '' : 'none';
                this.openBtn.setAttribute('data-disabled-reason', 'plan-blocked');
                this.openBtn.setAttribute('title', message);
                this.openBtn.setAttribute('aria-disabled', 'true');
            }
        } else {
            this.container.removeAttribute('data-plan-blocked');
            if (existingNotice) {
                existingNotice.textContent = '';
                existingNotice.hidden = true;
            }
            if (this.openBtn) {
                this.openBtn.style.display = '';
                this.openBtn.disabled = false;
                this.openBtn.classList.remove('bould-widget__open--disabled');
                this.openBtn.removeAttribute('data-disabled-reason');
                this.openBtn.removeAttribute('title');
                this.openBtn.removeAttribute('aria-disabled');
            }
        }
    }

    setOpenButtonDisabled(disabled, reason, title) {
        if (!this.openBtn) return;
        if (!disabled && this.container.getAttribute('data-plan-blocked') === 'true') {
            return;
        }
        if (disabled) {
            this.openBtn.disabled = true;
            this.openBtn.classList.add('bould-widget__open--disabled');
            this.openBtn.setAttribute('aria-disabled', 'true');
            if (reason) {
                this.openBtn.setAttribute('data-disabled-reason', reason);
            }
            if (title) {
                this.openBtn.setAttribute('title', title);
            }
        } else {
            this.openBtn.disabled = false;
            this.openBtn.classList.remove('bould-widget__open--disabled');
            this.openBtn.removeAttribute('aria-disabled');
            if (!reason || this.openBtn.getAttribute('data-disabled-reason') === reason) {
                this.openBtn.removeAttribute('data-disabled-reason');
            }
            if (!title || this.openBtn.getAttribute('title') === title) {
                this.openBtn.removeAttribute('title');
            }
        }
    }

    renderDebugInfo(debugInfo) {
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
}
