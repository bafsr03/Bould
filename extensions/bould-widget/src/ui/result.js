export class ResultManager {
    constructor(elements) {
        this.resultScreen = elements.resultScreen;
        this.resultImageEl = elements.resultImageEl;
        this.resultSizeEl = elements.resultSizeEl;
        this.resultConfidenceEl = elements.resultConfidenceEl;
        this.resultFeedbackEl = elements.resultFeedbackEl;
        this.resultStageEls = elements.resultStageEls || [];
        this.matchDetails = {};
        this.currentUnit = 'cm';
        this.handleToggle = this.handleToggle.bind(this);
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
        this.matchDetails = {};
        this.currentUnit = 'cm';
    }

    handleToggle() {
        this.currentUnit = this.currentUnit === 'cm' ? 'inch' : 'cm';
        this.renderMeasurements();
    }

    renderMeasurements() {
        if (!this.resultConfidenceEl) return;

        const unitLabelShort = this.currentUnit === 'inch' ? 'in' : 'cm';
        let text = '';

        // Add slack measurements if available
        const slacks = (this.matchDetails && this.matchDetails.slacks) ? this.matchDetails.slacks : {};
        const sourceUnit = (this.matchDetails && this.matchDetails.unit) ? this.matchDetails.unit : 'cm';
        
        const convertedSlacks = {};
        for (const [key, val] of Object.entries(slacks)) {
            if (sourceUnit === 'cm' && this.currentUnit === 'inch') {
                convertedSlacks[key] = val / 2.54;
            } else if (sourceUnit === 'inch' && this.currentUnit === 'cm') {
                convertedSlacks[key] = val * 2.54;
            } else {
                convertedSlacks[key] = val;
            }
        }

        const slackEntries = Object.entries(convertedSlacks)
            .filter(([k, v]) => k && !Number.isNaN(v))
            .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
            .slice(0, 3);

        if (slackEntries.length > 0) {
            const slackParts = slackEntries.map(([k, v]) => {
                const label = k.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                const sign = v > 0 ? '+' : '';
                return `${label} ${sign}${v.toFixed(1)}`;
            });
            text = `Slack (${unitLabelShort}): ${slackParts.join(', ')}`;
        }

        this.resultConfidenceEl.textContent = text;
        this.resultConfidenceEl.hidden = !text;
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
            this.matchDetails = details.matchDetails || {};
            this.currentUnit = details.displayUnit || 'cm';
            this.renderMeasurements();
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
