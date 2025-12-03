export class ResultManager {
    constructor(elements) {
        this.resultScreen = elements.resultScreen;
        this.resultImageEl = elements.resultImageEl;
        this.resultSizeEl = elements.resultSizeEl;
        this.resultConfidenceEl = elements.resultConfidenceEl;
        this.resultFeedbackEl = elements.resultFeedbackEl;
        this.resultStageEls = elements.resultStageEls || [];
    }

    reset() {
        this.resultStageEls.forEach(el => {
            if (!el) return;
            el.classList.remove('is-visible');
        });
        if (this.resultImageEl) {
            this.resultImageEl.removeAttribute('src');
            this.resultImageEl.hidden = false;
        }
        if (this.resultSizeEl) {
            this.resultSizeEl.textContent = '';
            this.resultSizeEl.hidden = false;
        }
        if (this.resultConfidenceEl) {
            this.resultConfidenceEl.textContent = '';
            this.resultConfidenceEl.hidden = false;
        }
        if (this.resultFeedbackEl) {
            this.resultFeedbackEl.textContent = '';
            this.resultFeedbackEl.hidden = false;
            this.resultFeedbackEl.classList.remove('is-visible');
        }
    }

    reveal(details, showScreenCallback) {
        if (!this.resultScreen) {
            return;
        }
        if (this.resultImageEl) {
            if (details.imageUrl) {
                this.resultImageEl.hidden = false;
                if (this.resultImageEl.src !== details.imageUrl) {
                    this.resultImageEl.src = details.imageUrl;
                }
            } else {
                this.resultImageEl.removeAttribute('src');
                this.resultImageEl.hidden = true;
            }
        }
        if (this.resultSizeEl) {
            if (details.sizeText) {
                this.resultSizeEl.textContent = details.sizeText;
                this.resultSizeEl.hidden = false;
            } else {
                this.resultSizeEl.textContent = '';
                this.resultSizeEl.hidden = true;
            }
        }
        if (this.resultConfidenceEl) {
            this.resultConfidenceEl.hidden = true;
        }
        if (this.resultFeedbackEl) {
            if (details.feedbackText) {
                this.resultFeedbackEl.textContent = details.feedbackText;
                this.resultFeedbackEl.hidden = false;
            } else {
                this.resultFeedbackEl.textContent = '';
                this.resultFeedbackEl.hidden = true;
            }
            this.resultFeedbackEl.classList.remove('is-visible');
        }

        if (typeof showScreenCallback === 'function') {
            showScreenCallback('result');
        }

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.resultStageEls.forEach(el => {
                    if (!el) return;
                    if (el === this.resultImageEl && !details.imageUrl) {
                        el.classList.remove('is-visible');
                        return;
                    }
                    el.classList.add('is-visible');
                });
                if (this.resultFeedbackEl && this.resultFeedbackEl.classList.contains('bould-widget__fade-text') && details.feedbackText) {
                    this.resultFeedbackEl.classList.add('is-visible');
                }
            });
        });
    }
}
