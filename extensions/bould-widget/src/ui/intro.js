export class IntroManager {
    constructor(elements) {
        this.introScreen = elements.introScreen;
        this.introSteps = elements.introSteps || [];
        this.introActions = elements.introActions;
        this.animationTimers = [];
        this.heightLock = { width: 0, height: 0 };
        this.resizeObserver = null;

        this.init();
    }

    init() {
        if (typeof ResizeObserver === 'function' && this.introScreen) {
            this.resizeObserver = new ResizeObserver(() => {
                if (!this.introScreen || this.introScreen.hidden) {
                    return;
                }
                this.lockHeight(false);
            });
            this.resizeObserver.observe(this.introScreen);
        }
    }

    clearAnimation() {
        if (this.animationTimers.length) {
            this.animationTimers.forEach(timer => clearTimeout(timer));
            this.animationTimers = [];
        }
        if (this.introSteps.length) {
            this.introSteps.forEach(step => {
                step.classList.remove('is-visible', 'is-highlight');
                step.setAttribute('aria-hidden', 'true');
                step.style.opacity = '0';
                step.style.visibility = 'hidden';
                step.style.transitionDelay = '';
                step.classList.remove('is-active-intro');
                this.setProgress(step, 0);
            });
        }
        if (this.introActions) {
            this.introActions.classList.remove('is-visible');
            this.introActions.hidden = true;
            this.introActions.setAttribute('hidden', '');
            this.introActions.setAttribute('aria-hidden', 'true');
        }
        if (this.introScreen) {
            this.unlockHeight();
            this.introScreen.classList.remove('is-animating');
        }
        this.heightLock = { width: 0, height: 0 };
    }

    queueTimeout(callback, delay) {
        const timerId = setTimeout(callback, Math.max(0, delay));
        this.animationTimers.push(timerId);
        return timerId;
    }

    setProgress(step, value) {
        if (!step) return;
        const numeric = typeof value === 'number' ? value : parseFloat(value);
        const clamped = Math.max(0, Math.min(1, Number.isFinite(numeric) ? numeric : 0));
        step.style.setProperty('--intro-progress', clamped.toFixed(3));
    }

    updateProgress(activeIndex) {
        if (!this.introSteps.length) return;
        const active = typeof activeIndex === 'number' ? activeIndex : -1;
        this.introSteps.forEach((step, index) => {
            let target = 0;
            if (active >= 0) {
                if (index === active) {
                    target = 1;
                    step.classList.add('is-active-intro');
                } else if (index < active) {
                    const distance = active - index;
                    if (distance === 1) {
                        target = 0.64;
                    } else if (distance === 2) {
                        target = 0.44;
                    } else {
                        target = 0.3;
                    }
                    step.classList.remove('is-active-intro');
                } else {
                    target = 0;
                    step.classList.remove('is-active-intro');
                }
            } else {
                step.classList.remove('is-active-intro');
            }
            this.setProgress(step, target);
        });
    }

    measureNaturalHeight() {
        if (!this.introScreen) return 0;
        const referenceRect = this.introScreen.getBoundingClientRect();
        const clone = this.introScreen.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.top = '-9999px';
        clone.style.left = '0';
        clone.style.visibility = 'hidden';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0';
        clone.style.transform = 'none';
        clone.style.height = 'auto';
        clone.style.minHeight = '0';
        if (referenceRect && referenceRect.width) {
            clone.style.width = Math.round(referenceRect.width) + 'px';
        }
        clone.classList.remove('is-animating');
        clone.querySelectorAll('[hidden]').forEach(el => {
            el.hidden = false;
            el.removeAttribute('hidden');
        });
        clone.querySelectorAll('.bould-widget__intro-step').forEach(step => {
            step.classList.add('is-visible', 'is-active-intro');
            step.classList.remove('is-highlight');
            step.removeAttribute('style');
            step.style.setProperty('--intro-progress', '1');
        });
        const cloneActions = clone.querySelector('.bould-widget__actions--intro');
        if (cloneActions) {
            cloneActions.hidden = false;
            cloneActions.removeAttribute('hidden');
            cloneActions.classList.add('is-visible');
            cloneActions.removeAttribute('style');
            cloneActions.setAttribute('aria-hidden', 'false');
        }
        const parent = this.introScreen.parentNode;
        if (!parent) return 0;
        parent.insertBefore(clone, this.introScreen);
        const measurement = clone.getBoundingClientRect();
        parent.removeChild(clone);
        return measurement && measurement.height ? Math.ceil(measurement.height) : 0;
    }

    lockHeight(force) {
        if (!this.introScreen) return;
        const rect = this.introScreen.getBoundingClientRect();
        const width = rect && rect.width ? Math.round(rect.width) : 0;
        if (width <= 0) {
            if (this.heightLock.height) {
                this.introScreen.style.minHeight = this.heightLock.height + 'px';
                this.introScreen.style.height = this.heightLock.height + 'px';
            }
            return;
        }
        if (!force && this.heightLock.height && this.heightLock.width === width) {
            this.introScreen.style.minHeight = this.heightLock.height + 'px';
            this.introScreen.style.height = this.heightLock.height + 'px';
            return;
        }
        const measured = this.measureNaturalHeight();
        if (measured > 0) {
            this.heightLock = { width: width, height: measured };
            this.introScreen.style.minHeight = measured + 'px';
            this.introScreen.style.height = measured + 'px';
            this.introScreen.setAttribute('data-height-lock', 'true');
        }
    }

    unlockHeight() {
        if (!this.introScreen) return;
        this.introScreen.style.height = '';
        this.introScreen.style.minHeight = '';
        this.introScreen.removeAttribute('data-height-lock');
    }

    runAnimation() {
        if (!this.introScreen) return;
        this.clearAnimation();
        this.lockHeight(false);
        this.updateProgress(-1);
        if (!this.introSteps.length) {
            if (this.introActions) {
                this.introActions.hidden = false;
                this.introActions.removeAttribute('hidden');
                this.introActions.classList.add('is-visible');
                this.introActions.setAttribute('aria-hidden', 'false');
            }
            this.unlockHeight();
            return;
        }
        const prefersReducedMotion =
            typeof window.matchMedia === 'function' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (prefersReducedMotion) {
            this.lockHeight(true);
            this.introSteps.forEach(step => {
                step.setAttribute('aria-hidden', 'false');
                step.style.visibility = '';
                step.style.opacity = '';
                step.classList.add('is-visible');
                this.setProgress(step, 1);
                step.classList.add('is-active-intro');
            });
            if (this.introActions) {
                this.introActions.hidden = false;
                this.introActions.removeAttribute('hidden');
                this.introActions.classList.add('is-visible');
                this.introActions.setAttribute('aria-hidden', 'false');
            }
            if (this.introScreen) {
                this.introScreen.classList.remove('is-animating');
                requestAnimationFrame(() => {
                    this.unlockHeight();
                });
            } else {
                this.unlockHeight();
            }
            return;
        }

        this.introScreen.classList.add('is-animating');
        const baseDelay = 220;
        const stepRevealGap = 1000;
        const revealDuration = 620;
        const finalSettleDelay = 360;
        this.lockHeight(false);
        let delay = baseDelay;

        this.introSteps.forEach((step, index) => {
            this.queueTimeout(() => {
                requestAnimationFrame(() => {
                    step.style.transitionDelay = '0ms';
                    step.setAttribute('aria-hidden', 'false');
                    step.style.visibility = '';
                    step.style.opacity = '';
                    step.classList.add('is-visible');
                    this.updateProgress(index);
                });
            }, delay);

            if (index === this.introSteps.length - 1) {
                this.queueTimeout(() => {
                    if (this.introActions) {
                        this.introActions.hidden = false;
                        this.introActions.removeAttribute('hidden');
                        this.introActions.classList.add('is-visible');
                        this.introActions.setAttribute('aria-hidden', 'false');
                    }
                    if (this.introScreen) {
                        this.introScreen.classList.remove('is-animating');
                        requestAnimationFrame(() => {
                            this.unlockHeight();
                        });
                    } else {
                        this.unlockHeight();
                    }
                }, delay + revealDuration + finalSettleDelay);
            }
            delay += stepRevealGap;
        });
    }
}
