import { getProductId, isDesignMode } from '../utils';
import { UPGRADE_MESSAGE } from '../constants';

export class ApiService {
    constructor(container) {
        this.container = container;
    }

    getEndpointBase() {
        const base = this.container.getAttribute('data-api-base');
        if (base && base !== 'use_app_route' && base !== 'use_app_proxy') {
            return base;
        }
        return '/apps/bould';
    }

    async fetchStatus() {
        const productId = getProductId(this.container);
        const designMode = isDesignMode();
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
        const statusUrl = `${this.getEndpointBase()}?${statusParams.toString()}`;
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

    getImmediateGate(designMode) {
        if (designMode) {
            return null;
        }
        // Login check removed to allow guest access
        return null;
    }

    getPreflightGate(payload, designMode) {
        if (!payload) {
            return null;
        }
        if (payload.plan && payload.plan.blocked) {
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
                    productId: payload.productId || getProductId(this.container),
                    reason: 'plan_blocked'
                }
            };
        }
        if (!designMode && payload.isProcessed === false) {
            const conversionStatus = payload.conversionStatus || 'not_ready';
            let heading = "Garment isn't ready yet";
            let message = 'This garment has not been processed yet.';
            let tone = 'warning';
            if (conversionStatus === 'processing') {
                heading = 'Garment still processing';
                message = 'We are still processing this garment. Please wait a few minutes and try again.';
            } else if (conversionStatus === 'failed') {
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
                    productId: payload.productId || getProductId(this.container),
                    conversionStatus,
                    reason: 'garment_unprocessed'
                }
            };
        }
        return null;
    }
}
