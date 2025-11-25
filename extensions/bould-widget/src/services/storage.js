import { isCustomerLoggedIn, getProductId } from '../utils';

export class StorageService {
    constructor(container) {
        this.container = container;
    }

    getStorageKey() {
        const productId = getProductId(this.container);
        return 'bould_result_' + (productId ? productId.replace(/\W/g, '_') : 'default');
    }

    save(details) {
        if (!isCustomerLoggedIn()) return;
        try {
            const key = this.getStorageKey();
            localStorage.setItem(key, JSON.stringify({
                details: details,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('[Bould Widget] Failed to save result to storage', e);
        }
    }

    load() {
        if (!isCustomerLoggedIn()) return null;
        try {
            const key = this.getStorageKey();
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const data = JSON.parse(raw);
            return data.details;
        } catch (e) {
            console.warn('[Bould Widget] Failed to load result from storage', e);
            return null;
        }
    }
}
