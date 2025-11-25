import { FEEDBACK_VISIBLE_MS, FEEDBACK_FADE_MS, FEEDBACK_FINAL_SETTLE_MS } from '../constants';

export class LoadingManager {
    constructor(elements) {
        this.loadingScreen = elements.loadingScreen;
        this.loadingStatusEl = elements.loadingStatusEl;
        this.loadingFeedbackEl = elements.loadingFeedbackEl;
        this.loadingGeneratingEl = elements.loadingGeneratingEl;
        this.activeFeedbackCycle = null;
        this.defaultText = this.loadingStatusEl ? this.loadingStatusEl.dataset.defaultText || this.loadingStatusEl.textContent : '';

        if (this.loadingStatusEl && !this.loadingStatusEl.dataset.defaultText) {
            this.loadingStatusEl.dataset.defaultText = this.defaultText;
        }
    }

    setGeneratingActive(active) {
        if (!this.loadingGeneratingEl) {
            return;
        }
        if (active) {
            this.loadingGeneratingEl.hidden = false;
            this.loadingGeneratingEl.removeAttribute('hidden');
            this.loadingGeneratingEl.classList.add('is-active');
            this.loadingGeneratingEl.setAttribute('aria-hidden', 'false');
        } else {
            this.loadingGeneratingEl.classList.remove('is-active');
            this.loadingGeneratingEl.setAttribute('aria-hidden', 'true');
            this.loadingGeneratingEl.hidden = true;
        }
    }

    stopFeedbackCycle(forceHide) {
        if (this.activeFeedbackCycle && typeof this.activeFeedbackCycle.cancel === 'function') {
            this.activeFeedbackCycle.cancel(!!forceHide);
        }
        this.activeFeedbackCycle = null;
    }

    reset() {
        this.stopFeedbackCycle(true);
        if (this.loadingStatusEl) {
            this.loadingStatusEl.hidden = false;
            const fallbackText = this.loadingStatusEl.dataset.defaultText || this.defaultText;
            if (fallbackText) {
                this.loadingStatusEl.textContent = fallbackText;
            }
        }
        if (this.loadingFeedbackEl) {
            this.loadingFeedbackEl.hidden = true;
            this.loadingFeedbackEl.classList.remove('is-visible');
            this.loadingFeedbackEl.textContent = '';
        }
        this.setGeneratingActive(true);
    }

    startFeedback(messages, options) {
        const normalized = Array.isArray(messages)
            ? messages
                .map(msg => typeof msg === 'string' ? msg.replace(/\s+/g, ' ').trim() : '')
                .filter(Boolean)
            : [];

        if (!this.loadingFeedbackEl || !normalized.length) {
            const fallbackMessage = normalized.length ? normalized[normalized.length - 1] : '';
            return {
                promise: Promise.resolve({ finalMessage: fallbackMessage || '', cancelled: false }),
                cancel: function () { }
            };
        }

        const opts = Object.assign(
            {
                loop: false,
                holdMs: FEEDBACK_VISIBLE_MS,
                fadeMs: FEEDBACK_FADE_MS,
                finalHoldMs: FEEDBACK_FINAL_SETTLE_MS,
                initialDelay: 30,
                hideStatus: true,
                loopCount: null
            },
            options || {}
        );

        const displayEl = this.loadingFeedbackEl;
        if (opts.hideStatus && this.loadingStatusEl) {
            this.loadingStatusEl.hidden = true;
        }
        displayEl.hidden = false;
        displayEl.classList.remove('is-visible');
        displayEl.textContent = '';

        let resolved = false;
        let resolveRef = null;
        const timers = [];
        const maxLoops = typeof opts.loopCount === 'number' && opts.loopCount > 0 ? opts.loopCount : null;
        let loopsCompleted = 0;

        const clearTimers = () => {
            while (timers.length) {
                clearTimeout(timers.pop());
            }
        };

        const finish = (cancelled, explicitMessage) => {
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
        };

        const showMessage = (index) => {
            if (resolved) return;
            if (!normalized.length) {
                finish(true, '');
                return;
            }

            const safeIndex = index % normalized.length;
            const message = normalized[safeIndex];

            // Step 1: Ensure we're faded out and set the new text while invisible
            displayEl.classList.remove('is-visible');
            displayEl.textContent = message;

            // Step 2: Fade in after a brief delay to ensure text is set
            timers.push(setTimeout(() => {
                if (resolved) return;
                displayEl.classList.add('is-visible');

                // Step 3: Hold the visible message
                timers.push(setTimeout(() => {
                    if (resolved) return;

                    const isLast = safeIndex === normalized.length - 1;
                    const nextIndex = (safeIndex + 1) % normalized.length;

                    // Check if we should continue looping
                    if (opts.loop) {
                        const completesCycle = nextIndex === 0;
                        if (completesCycle) {
                            loopsCompleted += 1;
                            if (maxLoops && loopsCompleted >= maxLoops) {
                                finish(false, message);
                                return;
                            }
                        }

                        // Step 4: Fade out
                        displayEl.classList.remove('is-visible');

                        // Step 5: Wait for fade out to complete, then show next message
                        timers.push(setTimeout(() => {
                            if (resolved) return;
                            showMessage(nextIndex);
                        }, opts.fadeMs));

                    } else if (!isLast) {
                        // Non-looping mode: fade out and show next
                        displayEl.classList.remove('is-visible');

                        timers.push(setTimeout(() => {
                            if (resolved) return;
                            showMessage(safeIndex + 1);
                        }, opts.fadeMs));

                    } else {
                        // Last message in non-looping mode
                        finish(false, message);
                    }
                }, opts.holdMs));
            }, 50));
        };

        const sequencePromise = new Promise((resolve) => {
            resolveRef = resolve;
            timers.push(
                setTimeout(() => {
                    showMessage(0);
                }, Math.max(0, opts.initialDelay))
            );
        });

        const controller = {
            promise: sequencePromise.then((result) => {
                if (this.activeFeedbackCycle === controller) {
                    this.activeFeedbackCycle = null;
                }
                return result;
            }),
            cancel: (forceHide) => {
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

        this.activeFeedbackCycle = controller;
        return controller;
    }
}
