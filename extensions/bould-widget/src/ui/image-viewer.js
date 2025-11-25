export class ImageViewer {
    constructor(widgetId) {
        this.widgetId = widgetId;
        this.viewer = null;
        this.image = null;
        this.frame = null;
        this.closeBtn = null;
        this.hideTimer = null;
        this.returnFocusEl = null;
        this.handleKeydown = this.handleKeydown.bind(this);

        this.init();
    }

    init() {
        this.viewer = this.createViewer();
        if (this.viewer) {
            this.image = this.viewer.querySelector('.bould-widget__image-viewer__img');
            this.frame = this.viewer.querySelector('.bould-widget__image-viewer__frame');
            this.closeBtn = this.viewer.querySelector('.bould-widget__image-viewer__close');

            this.bindEvents();
        }
    }

    createViewer() {
        if (typeof document === 'undefined' || !document.body) {
            return null;
        }
        if (this.widgetId) {
            const candidates = document.querySelectorAll('.bould-widget__image-viewer');
            for (let i = 0; i < candidates.length; i += 1) {
                const candidate = candidates[i];
                if (candidate && candidate.getAttribute('data-widget-id') === this.widgetId) {
                    return candidate;
                }
            }
        }
        const viewer = document.createElement('div');
        viewer.className = 'bould-widget__image-viewer';
        if (this.widgetId) {
            viewer.setAttribute('data-widget-id', this.widgetId);
        }
        viewer.hidden = true;
        viewer.setAttribute('aria-hidden', 'true');

        const frame = document.createElement('div');
        frame.className = 'bould-widget__image-viewer__frame';
        frame.setAttribute('role', 'dialog');
        frame.setAttribute('aria-modal', 'true');
        frame.setAttribute('aria-label', 'Result preview');
        frame.tabIndex = -1;

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = 'bould-widget__image-viewer__close';
        closeButton.setAttribute('aria-label', 'Close result preview');
        closeButton.textContent = '×';

        const image = document.createElement('img');
        image.className = 'bould-widget__image-viewer__img';
        image.alt = 'Try on result preview';

        frame.appendChild(closeButton);
        frame.appendChild(image);
        viewer.appendChild(frame);
        document.body.appendChild(viewer);
        return viewer;
    }

    bindEvents() {
        if (this.viewer) {
            this.viewer.addEventListener('click', (event) => {
                if (!this.frame || event.target === this.viewer || !this.frame.contains(event.target)) {
                    this.close();
                }
            });
        }

        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', (event) => {
                if (event) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                this.close();
            });
        }

        if (this.frame) {
            this.frame.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
    }

    open(src, altText, originEl) {
        if (!this.viewer || !this.image || !src) {
            return;
        }
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.returnFocusEl = originEl instanceof HTMLElement ? originEl : null;
        this.image.src = src;
        this.image.alt = altText || 'Try on result';
        if (this.frame) {
            this.frame.setAttribute('aria-label', altText ? 'Result preview: ' + altText : 'Result preview');
        }
        this.viewer.hidden = false;
        this.viewer.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => {
            this.viewer.classList.add('is-visible');
        });
        document.addEventListener('keydown', this.handleKeydown);
        if (this.closeBtn && typeof this.closeBtn.focus === 'function') {
            setTimeout(() => {
                try {
                    this.closeBtn.focus({ preventScroll: true });
                } catch (e) {
                    this.closeBtn.focus();
                }
            }, 50);
        }
    }

    close(forceImmediate) {
        if (!this.viewer || this.viewer.hidden) {
            return;
        }
        if (this.hideTimer) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }
        this.viewer.classList.remove('is-visible');
        document.removeEventListener('keydown', this.handleKeydown);
        const finalize = () => {
            this.hideTimer = null;
            if (this.image) {
                this.image.removeAttribute('src');
            }
            this.viewer.setAttribute('aria-hidden', 'true');
            this.viewer.hidden = true;
            if (this.returnFocusEl && typeof this.returnFocusEl.focus === 'function') {
                try {
                    this.returnFocusEl.focus({ preventScroll: true });
                } catch (e) {
                    this.returnFocusEl.focus();
                }
            }
            this.returnFocusEl = null;
        };
        if (forceImmediate) {
            finalize();
        } else {
            this.hideTimer = setTimeout(finalize, 200);
        }
    }

    handleKeydown(event) {
        if (!event) return;
        if (event.key === 'Escape' || event.key === 'Esc') {
            event.preventDefault();
            this.close();
        }
    }
}
