(function() {
  "use strict";
  const DEFAULT_ERROR_HEADING = "Something went wrong";
  const FALLBACK_DIALOG_LABEL = "Bould fit assistant";
  const HEADER_CONFIG = {
    intro: {
      title: "Find your best fit",
      subtitle: "Upload a T-pose photo to unlock a personalized size recommendation.",
      compact: false,
      describe: true
    },
    loading: {
      title: "",
      subtitle: "",
      compact: true,
      describe: false
    },
    form: {
      compact: true,
      ariaLabel: "Bould fit assistant form"
    },
    result: {
      compact: true,
      ariaLabel: "Bould fit assistant result"
    },
    error: {
      compact: true,
      ariaLabel: "Bould fit assistant error"
    }
  };
  const FEEDBACK_VISIBLE_MS = 2600;
  const FEEDBACK_FADE_MS = 600;
  const FEEDBACK_FINAL_SETTLE_MS = 220;
  const DEFAULT_LOADING_FEEDBACK = [
    "Sizing assistant is reviewing your fit details...",
    "Hang tight - preparing your personalized fit notes."
  ];
  const UPGRADE_MESSAGE = "Upgrade to continue using Bould.";
  function updateHeaderForScreen(name, elements) {
    const { header, headerEyebrow, headerTitle, headerSubtitle, modal, headerDefaults } = elements;
    const config = HEADER_CONFIG[name] || HEADER_CONFIG.form || {};
    const eyebrowText = typeof config.eyebrow === "string" ? config.eyebrow : "";
    const titleText = typeof config.title === "string" ? config.title : "";
    const subtitleText = typeof config.subtitle === "string" ? config.subtitle : "";
    const describe = !!config.describe;
    if (header) {
      header.classList.toggle("bould-widget__header--compact", !!config.compact);
    }
    if (headerEyebrow) {
      if (eyebrowText) {
        headerEyebrow.hidden = false;
        headerEyebrow.textContent = eyebrowText;
      } else {
        headerEyebrow.hidden = true;
        headerEyebrow.textContent = headerDefaults.eyebrow;
      }
    }
    if (headerTitle) {
      if (titleText) {
        headerTitle.hidden = false;
        headerTitle.textContent = titleText;
      } else {
        headerTitle.hidden = true;
        headerTitle.textContent = "";
      }
    }
    if (headerSubtitle) {
      if (subtitleText) {
        headerSubtitle.hidden = false;
        headerSubtitle.textContent = subtitleText;
      } else {
        headerSubtitle.hidden = true;
        headerSubtitle.textContent = "";
      }
    }
    if (modal) {
      if (titleText && headerTitle && !headerTitle.hidden) {
        modal.setAttribute("aria-labelledby", headerTitle.id);
        modal.removeAttribute("aria-label");
      } else {
        modal.removeAttribute("aria-labelledby");
        modal.setAttribute("aria-label", config.ariaLabel || FALLBACK_DIALOG_LABEL);
      }
      if (describe && headerSubtitle && !headerSubtitle.hidden) {
        modal.setAttribute("aria-describedby", headerSubtitle.id);
      } else {
        modal.removeAttribute("aria-describedby");
      }
    }
  }
  class IntroManager {
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
      if (typeof ResizeObserver === "function" && this.introScreen) {
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
        this.animationTimers.forEach((timer) => clearTimeout(timer));
        this.animationTimers = [];
      }
      if (this.introSteps.length) {
        this.introSteps.forEach((step) => {
          step.classList.remove("is-visible", "is-highlight");
          step.setAttribute("aria-hidden", "true");
          step.style.opacity = "0";
          step.style.visibility = "hidden";
          step.style.transitionDelay = "";
          step.classList.remove("is-active-intro");
          this.setProgress(step, 0);
        });
      }
      if (this.introActions) {
        this.introActions.classList.remove("is-visible");
        this.introActions.hidden = true;
        this.introActions.setAttribute("hidden", "");
        this.introActions.setAttribute("aria-hidden", "true");
      }
      if (this.introScreen) {
        this.unlockHeight();
        this.introScreen.classList.remove("is-animating");
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
      const numeric = typeof value === "number" ? value : parseFloat(value);
      const clamped = Math.max(0, Math.min(1, Number.isFinite(numeric) ? numeric : 0));
      step.style.setProperty("--intro-progress", clamped.toFixed(3));
    }
    updateProgress(activeIndex) {
      if (!this.introSteps.length) return;
      const active = typeof activeIndex === "number" ? activeIndex : -1;
      this.introSteps.forEach((step, index) => {
        let target = 0;
        if (active >= 0) {
          if (index === active) {
            target = 1;
            step.classList.add("is-active-intro");
          } else if (index < active) {
            const distance = active - index;
            if (distance === 1) {
              target = 0.64;
            } else if (distance === 2) {
              target = 0.44;
            } else {
              target = 0.3;
            }
            step.classList.remove("is-active-intro");
          } else {
            target = 0;
            step.classList.remove("is-active-intro");
          }
        } else {
          step.classList.remove("is-active-intro");
        }
        this.setProgress(step, target);
      });
    }
    measureNaturalHeight() {
      if (!this.introScreen) return 0;
      const referenceRect = this.introScreen.getBoundingClientRect();
      const clone = this.introScreen.cloneNode(true);
      clone.style.position = "absolute";
      clone.style.top = "-9999px";
      clone.style.left = "0";
      clone.style.visibility = "hidden";
      clone.style.pointerEvents = "none";
      clone.style.opacity = "0";
      clone.style.transform = "none";
      clone.style.height = "auto";
      clone.style.minHeight = "0";
      if (referenceRect && referenceRect.width) {
        clone.style.width = Math.round(referenceRect.width) + "px";
      }
      clone.classList.remove("is-animating");
      clone.querySelectorAll("[hidden]").forEach((el) => {
        el.hidden = false;
        el.removeAttribute("hidden");
      });
      clone.querySelectorAll(".bould-widget__intro-step").forEach((step) => {
        step.classList.add("is-visible", "is-active-intro");
        step.classList.remove("is-highlight");
        step.removeAttribute("style");
        step.style.setProperty("--intro-progress", "1");
      });
      const cloneActions = clone.querySelector(".bould-widget__actions--intro");
      if (cloneActions) {
        cloneActions.hidden = false;
        cloneActions.removeAttribute("hidden");
        cloneActions.classList.add("is-visible");
        cloneActions.removeAttribute("style");
        cloneActions.setAttribute("aria-hidden", "false");
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
          this.introScreen.style.minHeight = this.heightLock.height + "px";
          this.introScreen.style.height = this.heightLock.height + "px";
        }
        return;
      }
      if (!force && this.heightLock.height && this.heightLock.width === width) {
        this.introScreen.style.minHeight = this.heightLock.height + "px";
        this.introScreen.style.height = this.heightLock.height + "px";
        return;
      }
      const measured = this.measureNaturalHeight();
      if (measured > 0) {
        this.heightLock = { width, height: measured };
        this.introScreen.style.minHeight = measured + "px";
        this.introScreen.style.height = measured + "px";
        this.introScreen.setAttribute("data-height-lock", "true");
      }
    }
    unlockHeight() {
      if (!this.introScreen) return;
      this.introScreen.style.height = "";
      this.introScreen.style.minHeight = "";
      this.introScreen.removeAttribute("data-height-lock");
    }
    runAnimation() {
      if (!this.introScreen) return;
      this.clearAnimation();
      this.lockHeight(false);
      this.updateProgress(-1);
      if (!this.introSteps.length) {
        if (this.introActions) {
          this.introActions.hidden = false;
          this.introActions.removeAttribute("hidden");
          this.introActions.classList.add("is-visible");
          this.introActions.setAttribute("aria-hidden", "false");
        }
        this.unlockHeight();
        return;
      }
      const prefersReducedMotion = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        this.lockHeight(true);
        this.introSteps.forEach((step) => {
          step.setAttribute("aria-hidden", "false");
          step.style.visibility = "";
          step.style.opacity = "";
          step.classList.add("is-visible");
          this.setProgress(step, 1);
          step.classList.add("is-active-intro");
        });
        if (this.introActions) {
          this.introActions.hidden = false;
          this.introActions.removeAttribute("hidden");
          this.introActions.classList.add("is-visible");
          this.introActions.setAttribute("aria-hidden", "false");
        }
        if (this.introScreen) {
          this.introScreen.classList.remove("is-animating");
          requestAnimationFrame(() => {
            this.unlockHeight();
          });
        } else {
          this.unlockHeight();
        }
        return;
      }
      this.introScreen.classList.add("is-animating");
      const baseDelay = 220;
      const stepRevealGap = 1e3;
      const revealDuration = 620;
      const finalSettleDelay = 360;
      this.lockHeight(false);
      let delay = baseDelay;
      this.introSteps.forEach((step, index) => {
        this.queueTimeout(() => {
          requestAnimationFrame(() => {
            step.style.transitionDelay = "0ms";
            step.setAttribute("aria-hidden", "false");
            step.style.visibility = "";
            step.style.opacity = "";
            step.classList.add("is-visible");
            this.updateProgress(index);
          });
        }, delay);
        if (index === this.introSteps.length - 1) {
          this.queueTimeout(() => {
            if (this.introActions) {
              this.introActions.hidden = false;
              this.introActions.removeAttribute("hidden");
              this.introActions.classList.add("is-visible");
              this.introActions.setAttribute("aria-hidden", "false");
            }
            if (this.introScreen) {
              this.introScreen.classList.remove("is-animating");
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
  class ImageViewer {
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
        this.image = this.viewer.querySelector(".bould-widget__image-viewer__img");
        this.frame = this.viewer.querySelector(".bould-widget__image-viewer__frame");
        this.closeBtn = this.viewer.querySelector(".bould-widget__image-viewer__close");
        this.bindEvents();
      }
    }
    createViewer() {
      if (typeof document === "undefined" || !document.body) {
        return null;
      }
      if (this.widgetId) {
        const candidates = document.querySelectorAll(".bould-widget__image-viewer");
        for (let i = 0; i < candidates.length; i += 1) {
          const candidate = candidates[i];
          if (candidate && candidate.getAttribute("data-widget-id") === this.widgetId) {
            return candidate;
          }
        }
      }
      const viewer = document.createElement("div");
      viewer.className = "bould-widget__image-viewer";
      if (this.widgetId) {
        viewer.setAttribute("data-widget-id", this.widgetId);
      }
      viewer.hidden = true;
      viewer.setAttribute("aria-hidden", "true");
      const frame = document.createElement("div");
      frame.className = "bould-widget__image-viewer__frame";
      frame.setAttribute("role", "dialog");
      frame.setAttribute("aria-modal", "true");
      frame.setAttribute("aria-label", "Result preview");
      frame.tabIndex = -1;
      const closeButton = document.createElement("button");
      closeButton.type = "button";
      closeButton.className = "bould-widget__image-viewer__close";
      closeButton.setAttribute("aria-label", "Close result preview");
      closeButton.textContent = "×";
      const image = document.createElement("img");
      image.className = "bould-widget__image-viewer__img";
      image.alt = "Try on result preview";
      frame.appendChild(closeButton);
      frame.appendChild(image);
      viewer.appendChild(frame);
      document.body.appendChild(viewer);
      return viewer;
    }
    bindEvents() {
      if (this.viewer) {
        this.viewer.addEventListener("click", (event) => {
          if (!this.frame || event.target === this.viewer || !this.frame.contains(event.target)) {
            this.close();
          }
        });
      }
      if (this.closeBtn) {
        this.closeBtn.addEventListener("click", (event) => {
          if (event) {
            event.preventDefault();
            event.stopPropagation();
          }
          this.close();
        });
      }
      if (this.frame) {
        this.frame.addEventListener("click", (event) => {
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
      this.image.alt = altText || "Try on result";
      if (this.frame) {
        this.frame.setAttribute("aria-label", altText ? "Result preview: " + altText : "Result preview");
      }
      this.viewer.hidden = false;
      this.viewer.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        this.viewer.classList.add("is-visible");
      });
      document.addEventListener("keydown", this.handleKeydown);
      if (this.closeBtn && typeof this.closeBtn.focus === "function") {
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
      this.viewer.classList.remove("is-visible");
      document.removeEventListener("keydown", this.handleKeydown);
      const finalize = () => {
        this.hideTimer = null;
        if (this.image) {
          this.image.removeAttribute("src");
        }
        this.viewer.setAttribute("aria-hidden", "true");
        this.viewer.hidden = true;
        if (this.returnFocusEl && typeof this.returnFocusEl.focus === "function") {
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
      if (event.key === "Escape" || event.key === "Esc") {
        event.preventDefault();
        this.close();
      }
    }
  }
  class LoadingManager {
    constructor(elements) {
      this.loadingScreen = elements.loadingScreen;
      this.loadingStatusEl = elements.loadingStatusEl;
      this.loadingFeedbackEl = elements.loadingFeedbackEl;
      this.loadingGeneratingEl = elements.loadingGeneratingEl;
      this.activeFeedbackCycle = null;
      this.defaultText = this.loadingStatusEl ? this.loadingStatusEl.dataset.defaultText || this.loadingStatusEl.textContent : "";
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
        this.loadingGeneratingEl.removeAttribute("hidden");
        this.loadingGeneratingEl.classList.add("is-active");
        this.loadingGeneratingEl.setAttribute("aria-hidden", "false");
      } else {
        this.loadingGeneratingEl.classList.remove("is-active");
        this.loadingGeneratingEl.setAttribute("aria-hidden", "true");
        this.loadingGeneratingEl.hidden = true;
      }
    }
    stopFeedbackCycle(forceHide) {
      if (this.activeFeedbackCycle && typeof this.activeFeedbackCycle.cancel === "function") {
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
        this.loadingFeedbackEl.classList.remove("is-visible");
        this.loadingFeedbackEl.textContent = "";
      }
      this.setGeneratingActive(true);
    }
    startFeedback(messages, options) {
      const normalized = Array.isArray(messages) ? messages.map((msg) => typeof msg === "string" ? msg.replace(/\s+/g, " ").trim() : "").filter(Boolean) : [];
      if (!this.loadingFeedbackEl || !normalized.length) {
        const fallbackMessage = normalized.length ? normalized[normalized.length - 1] : "";
        return {
          promise: Promise.resolve({ finalMessage: fallbackMessage || "", cancelled: false }),
          cancel: function() {
          }
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
      displayEl.classList.remove("is-visible");
      displayEl.textContent = "";
      let resolved = false;
      let resolveRef = null;
      const timers = [];
      const maxLoops = typeof opts.loopCount === "number" && opts.loopCount > 0 ? opts.loopCount : null;
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
        const finalMessage = explicitMessage !== void 0 && explicitMessage !== null && explicitMessage !== "" ? explicitMessage : displayEl.textContent || normalized[normalized.length - 1] || "";
        if (resolveRef) {
          resolveRef({ finalMessage, cancelled });
        }
      };
      const showMessage = (index) => {
        if (resolved) return;
        if (!normalized.length) {
          finish(true, "");
          return;
        }
        const safeIndex = index % normalized.length;
        const message = normalized[safeIndex];
        displayEl.classList.remove("is-visible");
        displayEl.textContent = message;
        timers.push(setTimeout(() => {
          if (resolved) return;
          displayEl.classList.add("is-visible");
          timers.push(setTimeout(() => {
            if (resolved) return;
            const isLast = safeIndex === normalized.length - 1;
            const nextIndex = (safeIndex + 1) % normalized.length;
            if (opts.loop) {
              const completesCycle = nextIndex === 0;
              if (completesCycle) {
                loopsCompleted += 1;
                if (maxLoops && loopsCompleted >= maxLoops) {
                  finish(false, message);
                  return;
                }
              }
              displayEl.classList.remove("is-visible");
              timers.push(setTimeout(() => {
                if (resolved) return;
                showMessage(nextIndex);
              }, opts.fadeMs));
            } else if (!isLast) {
              displayEl.classList.remove("is-visible");
              timers.push(setTimeout(() => {
                if (resolved) return;
                showMessage(safeIndex + 1);
              }, opts.fadeMs));
            } else {
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
              displayEl.classList.remove("is-visible");
            }
            return;
          }
          if (forceHide) {
            displayEl.classList.remove("is-visible");
          }
          finish(true);
        }
      };
      this.activeFeedbackCycle = controller;
      return controller;
    }
  }
  class ResultManager {
    constructor(elements) {
      this.resultScreen = elements.resultScreen;
      this.resultImageEl = elements.resultImageEl;
      this.resultSizeEl = elements.resultSizeEl;
      this.resultConfidenceEl = elements.resultConfidenceEl;
      this.resultFeedbackEl = elements.resultFeedbackEl;
      this.resultStageEls = elements.resultStageEls || [];
    }
    reset() {
      this.resultStageEls.forEach((el) => {
        if (!el) return;
        el.classList.remove("is-visible");
      });
      if (this.resultImageEl) {
        this.resultImageEl.removeAttribute("src");
        this.resultImageEl.hidden = false;
      }
      if (this.resultSizeEl) {
        this.resultSizeEl.textContent = "";
        this.resultSizeEl.hidden = false;
      }
      if (this.resultConfidenceEl) {
        this.resultConfidenceEl.textContent = "";
        this.resultConfidenceEl.hidden = false;
      }
      if (this.resultFeedbackEl) {
        this.resultFeedbackEl.textContent = "";
        this.resultFeedbackEl.hidden = false;
        this.resultFeedbackEl.classList.remove("is-visible");
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
          this.resultImageEl.removeAttribute("src");
          this.resultImageEl.hidden = true;
        }
      }
      if (this.resultSizeEl) {
        if (details.sizeText) {
          this.resultSizeEl.textContent = details.sizeText;
          this.resultSizeEl.hidden = false;
        } else {
          this.resultSizeEl.textContent = "";
          this.resultSizeEl.hidden = true;
        }
      }
      if (this.resultConfidenceEl) {
        if (details.confidenceText) {
          this.resultConfidenceEl.textContent = details.confidenceText;
          this.resultConfidenceEl.hidden = false;
        } else {
          this.resultConfidenceEl.textContent = "";
          this.resultConfidenceEl.hidden = true;
        }
      }
      if (this.resultFeedbackEl) {
        if (details.feedbackText) {
          this.resultFeedbackEl.textContent = details.feedbackText;
          this.resultFeedbackEl.hidden = false;
        } else {
          this.resultFeedbackEl.textContent = "";
          this.resultFeedbackEl.hidden = true;
        }
        this.resultFeedbackEl.classList.remove("is-visible");
      }
      if (typeof showScreenCallback === "function") {
        showScreenCallback("result");
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.resultStageEls.forEach((el) => {
            if (!el) return;
            if (el === this.resultImageEl && !details.imageUrl) {
              el.classList.remove("is-visible");
              return;
            }
            el.classList.add("is-visible");
          });
          if (this.resultFeedbackEl && this.resultFeedbackEl.classList.contains("bould-widget__fade-text") && details.feedbackText) {
            this.resultFeedbackEl.classList.add("is-visible");
          }
        });
      });
    }
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  function formatMessage(value) {
    return escapeHtml(value).replace(/\r?\n/g, "<br />");
  }
  function isDesignMode() {
    try {
      return !!(window.Shopify && window.Shopify.designMode);
    } catch (e) {
      return false;
    }
  }
  function isPhoneDevice() {
    try {
      if ((navigator == null ? void 0 : navigator.userAgentData) && typeof navigator.userAgentData.mobile === "boolean") {
        return navigator.userAgentData.mobile;
      }
    } catch (e) {
    }
    const ua = (navigator.userAgent || navigator.vendor || window.opera && window.opera.toString && window.opera.toString() || "").toLowerCase();
    const matchesUa = /(android|iphone|ipad|ipod|windows phone|blackberry|bb10|mobile)/i.test(ua);
    const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    const narrow = typeof window.matchMedia === "function" && window.matchMedia("(max-width: 820px)").matches;
    return matchesUa || coarse && narrow;
  }
  function splitIntoSentences(value) {
    if (!value) return [];
    const matches = String(value).replace(/\s+/g, " ").match(/[^.!?]+[.!?]*/g);
    if (!matches) {
      return [String(value).trim()];
    }
    return matches.map(function(part) {
      return part.trim();
    }).filter(Boolean);
  }
  function formatMetricName(metric) {
    return String(metric || "").split("_").map(function(part) {
      if (!part) return "";
      return part.charAt(0).toUpperCase() + part.slice(1);
    }).filter(Boolean).join(" ");
  }
  function summarizeSlack(matchDetails, preferredUnit) {
    if (!matchDetails || typeof matchDetails !== "object") return "";
    const unitKey = preferredUnit === "inch" ? "slacks_in" : "slacks_cm";
    const slackObj = matchDetails[unitKey];
    if (!slackObj || typeof slackObj !== "object") return "";
    const entries = Object.entries(slackObj).map(function(entry) {
      const metric = entry[0];
      const rawValue = Number(entry[1]);
      if (!metric || Number.isNaN(rawValue)) return null;
      return [metric, rawValue];
    }).filter(Boolean).sort(function(a, b) {
      return Math.abs(b[1]) - Math.abs(a[1]);
    });
    if (!entries.length) return "";
    const topEntries = entries.slice(0, 3).map(function(entry) {
      const metric = formatMetricName(entry[0]);
      const value = entry[1];
      const formatted = (value > 0 ? "+" : "") + value.toFixed(1);
      return metric + " " + formatted;
    });
    const unitLabel = preferredUnit === "inch" ? "in" : "cm";
    return "Slack (" + unitLabel + "): " + topEntries.join(", ");
  }
  function extractFeedbackMessages(data, fallbackText = "") {
    if (!data || typeof data !== "object") {
      return ["We're reviewing your fit details...", "Hang tight - we're rendering your try-on preview now."];
    }
    const raw = data.tailor_feedback_sequence || data.tailor_feedbacks || data.tailorFeedbackSequence || data.tailorFeedbacks || data.tailor_feedback || data.tailorFeedback;
    let messages = [];
    if (Array.isArray(raw)) {
      messages = raw;
    } else if (raw && typeof raw === "object" && Array.isArray(raw.messages)) {
      messages = raw.messages;
    } else if (raw !== void 0 && raw !== null) {
      messages = [raw];
    }
    messages = messages.map(function(msg) {
      return String(msg || "").replace(/\s+/g, " ").trim();
    }).filter(Boolean);
    if (!messages.length && fallbackText) {
      messages = [fallbackText];
    }
    if (messages.length === 1) {
      const first = messages[0];
      const newlineParts = first.split(/\n+/).map(function(part) {
        return part.replace(/\s+/g, " ").trim();
      }).filter(Boolean);
      if (newlineParts.length >= 2) {
        messages = [newlineParts[0], newlineParts.slice(1).join(" ").trim()];
      } else {
        const sentences = splitIntoSentences(first);
        if (sentences.length >= 2) {
          const remainder = sentences.slice(1).join(" ").trim();
          if (remainder) {
            messages = [sentences[0], remainder];
          }
        }
      }
    }
    const seen = /* @__PURE__ */ new Set();
    const deduped = [];
    messages.forEach(function(msg) {
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
  function loadImageAsset(url) {
    if (!url) {
      return Promise.resolve({ url: "", loaded: false });
    }
    return new Promise(function(resolve) {
      const testImg = new Image();
      testImg.decoding = "async";
      testImg.onload = function() {
        resolve({ url, loaded: true });
      };
      testImg.onerror = function() {
        resolve({ url, loaded: false });
      };
      testImg.src = url;
    });
  }
  function loadImageCandidates(urls) {
    const candidates = Array.isArray(urls) ? urls.filter(Boolean) : [];
    if (!candidates.length) {
      return Promise.resolve({ url: "", loaded: false });
    }
    let index = 0;
    return new Promise(function(resolve) {
      function attempt() {
        const currentUrl = candidates[index];
        loadImageAsset(currentUrl).then(function(result) {
          if (result.loaded) {
            resolve(result);
            return;
          }
          if (index < candidates.length - 1) {
            console.warn("[Bould Widget] Try-on image failed to load, trying next candidate", currentUrl);
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
  function getProductId(container) {
    const fromAttr = container.getAttribute("data-product-id") || "";
    if (fromAttr) return fromAttr;
    try {
      const numId = window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product && window.ShopifyAnalytics.meta.product.id || null;
      if (numId) return `gid://shopify/Product/${numId}`;
    } catch (e) {
    }
    return "";
  }
  function getProductImageUrl(container) {
    const fromAttr = container.getAttribute("data-product-image") || "";
    if (fromAttr) return fromAttr;
    try {
      const analyticsProduct = window.ShopifyAnalytics && window.ShopifyAnalytics.meta && window.ShopifyAnalytics.meta.product;
      if (analyticsProduct) {
        if (typeof analyticsProduct.image_url === "string" && analyticsProduct.image_url) {
          return analyticsProduct.image_url;
        }
        if (Array.isArray(analyticsProduct.images) && analyticsProduct.images.length > 0) {
          return analyticsProduct.images[0];
        }
      }
    } catch (e) {
    }
    return "";
  }
  function isCustomerLoggedIn() {
    try {
      const shopifyCustomer = window.Shopify && window.Shopify.customer;
      if (shopifyCustomer && (shopifyCustomer.id || shopifyCustomer.email)) {
        return true;
      }
    } catch (e) {
    }
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
    } catch (e) {
    }
    try {
      const cookies = document.cookie ? document.cookie.split(";") : [];
      for (let i = 0; i < cookies.length; i += 1) {
        const cookie = cookies[i].trim();
        if (!cookie) continue;
        const eqIndex = cookie.indexOf("=");
        if (eqIndex === -1) continue;
        const name = cookie.slice(0, eqIndex);
        const value = cookie.slice(eqIndex + 1);
        if (name === "customer_signed_in") {
          const normalized = value.toLowerCase();
          if (normalized === "true" || normalized === "1" || normalized === "yes") {
            return true;
          }
        }
      }
    } catch (e) {
    }
    return false;
  }
  class NoticeManager {
    constructor(container, openBtn) {
      this.container = container;
      this.openBtn = openBtn;
    }
    ensureStateNotice() {
      let notice = this.container.querySelector(".bould-widget__state");
      if (!notice) {
        notice = document.createElement("div");
        notice.className = "bould-widget__state";
        notice.hidden = true;
        if (this.openBtn && typeof this.openBtn.insertAdjacentElement === "function") {
          this.openBtn.insertAdjacentElement("afterend", notice);
        } else {
          this.container.appendChild(notice);
        }
      }
      return notice;
    }
    showInline(message, tone) {
      const notice = this.ensureStateNotice();
      notice.className = "bould-widget__state";
      if (tone === "warning") {
        notice.classList.add("bould-widget__state--warning");
      } else if (tone === "error") {
        notice.classList.add("bould-widget__state--error");
      }
      notice.innerHTML = `<p>${escapeHtml(message)}</p>`;
      notice.hidden = false;
    }
    clearInline() {
      const notice = this.container.querySelector(".bould-widget__state");
      if (notice) {
        notice.className = "bould-widget__state";
        notice.innerHTML = "";
        notice.hidden = true;
      }
    }
    ensureUpgradeNotice() {
      let notice = this.container.querySelector(".bould-widget__upgrade");
      if (!notice) {
        notice = document.createElement("div");
        notice.className = "bould-widget__upgrade";
        this.container.appendChild(notice);
      }
      return notice;
    }
    applyPlanState(payload) {
      const plan = payload && payload.plan ? payload.plan : null;
      const blocked = !!(plan && plan.blocked);
      const existingNotice = this.container.querySelector(".bould-widget__upgrade");
      const designMode = !!(window.Shopify && window.Shopify.designMode);
      if (blocked) {
        const message = plan && plan.message ? plan.message : UPGRADE_MESSAGE;
        if (designMode) {
          const notice = existingNotice || this.ensureUpgradeNotice();
          notice.textContent = message;
          notice.hidden = false;
        } else if (existingNotice) {
          existingNotice.textContent = "";
          existingNotice.hidden = true;
        }
        this.container.setAttribute("data-plan-blocked", "true");
        if (this.openBtn) {
          this.openBtn.disabled = true;
          this.openBtn.classList.add("bould-widget__open--disabled");
          this.openBtn.style.display = designMode ? "" : "none";
          this.openBtn.setAttribute("data-disabled-reason", "plan-blocked");
          this.openBtn.setAttribute("title", message);
          this.openBtn.setAttribute("aria-disabled", "true");
        }
      } else {
        this.container.removeAttribute("data-plan-blocked");
        if (existingNotice) {
          existingNotice.textContent = "";
          existingNotice.hidden = true;
        }
        if (this.openBtn) {
          this.openBtn.style.display = "";
          this.openBtn.disabled = false;
          this.openBtn.classList.remove("bould-widget__open--disabled");
          this.openBtn.removeAttribute("data-disabled-reason");
          this.openBtn.removeAttribute("title");
          this.openBtn.removeAttribute("aria-disabled");
        }
      }
    }
    setOpenButtonDisabled(disabled, reason, title) {
      if (!this.openBtn) return;
      if (!disabled && this.container.getAttribute("data-plan-blocked") === "true") {
        return;
      }
      if (disabled) {
        this.openBtn.disabled = true;
        this.openBtn.classList.add("bould-widget__open--disabled");
        this.openBtn.setAttribute("aria-disabled", "true");
        if (reason) {
          this.openBtn.setAttribute("data-disabled-reason", reason);
        }
        if (title) {
          this.openBtn.setAttribute("title", title);
        }
      } else {
        this.openBtn.disabled = false;
        this.openBtn.classList.remove("bould-widget__open--disabled");
        this.openBtn.removeAttribute("aria-disabled");
        if (!reason || this.openBtn.getAttribute("data-disabled-reason") === reason) {
          this.openBtn.removeAttribute("data-disabled-reason");
        }
        if (!title || this.openBtn.getAttribute("title") === title) {
          this.openBtn.removeAttribute("title");
        }
      }
    }
    renderDebugInfo(debugInfo) {
      if (!debugInfo) return "";
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
      if (!lines.length) return "";
      return `<div class="bould-widget__debug-info"><strong>Debug Information:</strong><br>${lines.join("<br>")}</div>`;
    }
  }
  class StorageService {
    constructor(container) {
      this.container = container;
    }
    getStorageKey() {
      const productId = getProductId(this.container);
      return "bould_result_" + (productId ? productId.replace(/\W/g, "_") : "default");
    }
    save(details) {
      if (!isCustomerLoggedIn()) return;
      try {
        const key = this.getStorageKey();
        localStorage.setItem(key, JSON.stringify({
          details,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("[Bould Widget] Failed to save result to storage", e);
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
        console.warn("[Bould Widget] Failed to load result from storage", e);
        return null;
      }
    }
  }
  class ApiService {
    constructor(container) {
      this.container = container;
    }
    getEndpointBase() {
      const base = this.container.getAttribute("data-api-base");
      if (base && base !== "use_app_route" && base !== "use_app_proxy") {
        return base;
      }
      return "/apps/bould";
    }
    async fetchStatus() {
      const productId = getProductId(this.container);
      const designMode = isDesignMode();
      if (!productId && !designMode) {
        return null;
      }
      const correlationId = Math.random().toString(36).slice(2, 10);
      const statusParams = new URLSearchParams();
      statusParams.set("intent", "status");
      if (productId) {
        statusParams.set("product_id", productId);
      }
      if (designMode) {
        statusParams.set("design_mode", "1");
      }
      const statusUrl = `${this.getEndpointBase()}?${statusParams.toString()}`;
      const res = await fetch(statusUrl, {
        headers: {
          "Accept": "application/json",
          "X-Correlation-ID": correlationId
        }
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("[Bould Widget] Status check failed", res.status, text);
        return null;
      }
      return res.json();
    }
    getImmediateGate(designMode) {
      if (designMode) {
        return null;
      }
      return null;
    }
    getPreflightGate(payload, designMode) {
      var _a, _b;
      if (!payload) {
        return null;
      }
      if (payload.plan && payload.plan.blocked) {
        return {
          heading: "Upgrade required",
          message: payload.plan.message || UPGRADE_MESSAGE,
          tone: "warning",
          action: "close",
          blockButton: true,
          code: "plan-blocked",
          debug: {
            requestId: (_a = payload == null ? void 0 : payload.debug) == null ? void 0 : _a.requestId,
            planId: payload.plan.id,
            productId: payload.productId || getProductId(this.container),
            reason: "plan_blocked"
          }
        };
      }
      if (!designMode && payload.isProcessed === false) {
        const conversionStatus = payload.conversionStatus || "not_ready";
        let heading = "Garment isn't ready yet";
        let message = "This garment has not been processed yet.";
        let tone = "warning";
        if (conversionStatus === "processing") {
          heading = "Garment still processing";
          message = "We are still processing this garment. Please wait a few minutes and try again.";
        } else if (conversionStatus === "failed") {
          heading = "Garment conversion failed";
          message = "This garment is not available for try-on.";
          tone = "error";
        }
        return {
          heading,
          message,
          tone,
          action: "close",
          blockButton: false,
          code: "garment-unprocessed",
          debug: {
            requestId: (_b = payload == null ? void 0 : payload.debug) == null ? void 0 : _b.requestId,
            productId: payload.productId || getProductId(this.container),
            conversionStatus,
            reason: "garment_unprocessed"
          }
        };
      }
      return null;
    }
  }
  (function() {
    document.querySelectorAll("[data-bould-widget]").forEach(function(container) {
      const openBtn = container.querySelector(".bould-widget__open");
      const modal = container.querySelector(".bould-widget");
      const closeBtn = container.querySelector(".bould-widget__close");
      const header = modal ? modal.querySelector(".bould-widget__header") : null;
      const headerEyebrow = header ? header.querySelector(".bould-widget__eyebrow") : null;
      const headerTitle = header ? header.querySelector(".bould-widget__title") : null;
      const headerSubtitle = header ? header.querySelector(".bould-widget__subtitle") : null;
      const headerDefaults = {
        eyebrow: headerEyebrow ? headerEyebrow.textContent.trim() : "",
        title: headerTitle ? headerTitle.textContent.trim() : "",
        subtitle: headerSubtitle ? headerSubtitle.textContent.trim() : ""
      };
      const loadingScreen = modal ? modal.querySelector(".bould-widget__screen--loading") : null;
      const loadingStatusEl = loadingScreen ? loadingScreen.querySelector(".bould-widget__loading-text") : null;
      const loadingFeedbackEl = loadingScreen ? loadingScreen.querySelector("[data-loading-feedback]") : null;
      const loadingGeneratingEl = loadingScreen ? loadingScreen.querySelector("[data-loading-generating]") : null;
      const resultScreen = modal ? modal.querySelector(".bould-widget__screen--result") : null;
      const resultImageEl = resultScreen ? resultScreen.querySelector(".bould-widget__result-image") : null;
      const resultSizeEl = resultScreen ? resultScreen.querySelector(".bould-widget__size") : null;
      const resultConfidenceEl = resultScreen ? resultScreen.querySelector(".bould-widget__confidence") : null;
      const resultFeedbackEl = resultScreen ? resultScreen.querySelector(".bould-widget__feedback") : null;
      const resultStageEls = resultScreen ? Array.from(resultScreen.querySelectorAll(".bould-widget__result-stage")) : [];
      const introScreen = modal ? modal.querySelector(".bould-widget__screen--intro") : null;
      const introSteps = introScreen ? Array.from(introScreen.querySelectorAll(".bould-widget__intro-step")) : [];
      const introActions = introScreen ? introScreen.querySelector(".bould-widget__actions--intro") : null;
      const errorActionButton = modal ? modal.querySelector(".bould-widget__screen--error [data-action]") : null;
      const errorActionDefaults = errorActionButton ? {
        label: errorActionButton.textContent || "Try again",
        action: errorActionButton.getAttribute("data-action") || "back-to-form"
      } : { label: "Try again", action: "back-to-form" };
      if (container && container.classList && !container.classList.contains("bould-widget--enhanced")) {
        container.classList.add("bould-widget--enhanced");
      }
      const widgetIdRaw = container.getAttribute("data-block-id") || "";
      const widgetViewerId = widgetIdRaw || Math.random().toString(36).slice(2, 8);
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
      let statusPromise = null;
      let defaultFeedbackController = null;
      let defaultFeedbackPromise = null;
      let tailoredFeedbackController = null;
      let tailoredFeedbackPromise = null;
      const headerElements = { header, headerEyebrow, headerTitle, headerSubtitle, modal, headerDefaults };
      updateHeaderForScreen("intro", headerElements);
      function showScreen(name) {
        if (modal) {
          modal.querySelectorAll(".bould-widget__screen").forEach(function(s) {
            s.hidden = s.dataset.screen !== name;
          });
        }
        updateHeaderForScreen(name, headerElements);
        if (name === "intro") {
          introManager.runAnimation();
        } else {
          introManager.clearAnimation();
        }
        loadingManager.setGeneratingActive(name === "loading");
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
            console.warn("[Bould Widget] Failed to determine plan status", error);
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
          loadingFeedbackEl.classList.remove("is-visible");
          loadingFeedbackEl.textContent = "";
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
        showScreen("loading");
      }
      async function open() {
        const designMode = isDesignMode();
        const immediateGate = apiService.getImmediateGate(designMode);
        if (immediateGate) {
          noticeManager.showInline(immediateGate.message, immediateGate.tone || "warning");
          if (immediateGate.blockButton) {
            noticeManager.setOpenButtonDisabled(true, immediateGate.code || "immediate-gate", immediateGate.message);
          }
          if (immediateGate.debug) {
            console.info("[Bould Widget] Immediate gate triggered", immediateGate.debug);
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
          noticeManager.showInline(preflightGate.message, preflightGate.tone || "warning");
          if (preflightGate.blockButton) {
            noticeManager.setOpenButtonDisabled(true, preflightGate.code || "preflight-gate", preflightGate.message);
          } else {
            noticeManager.setOpenButtonDisabled(false);
          }
          if (preflightGate.debug) {
            console.info("[Bould Widget] Preflight gate triggered", preflightGate.debug);
          }
          return;
        }
        noticeManager.clearInline();
        noticeManager.setOpenButtonDisabled(false);
        if (!modal.parentElement || modal.parentElement !== document.body) {
          document.body.appendChild(modal);
        }
        modal.hidden = false;
        modal.setAttribute("data-state", "opening");
        const savedResult = storageService.load();
        if (savedResult) {
          resultManager.reveal(savedResult, showScreen);
          loadingManager.reset();
          setTimeout(function() {
            modal.removeAttribute("data-state");
          }, 250);
          return;
        }
        showScreen("intro");
        setTimeout(function() {
          modal.removeAttribute("data-state");
        }, 250);
      }
      function close() {
        modal.hidden = true;
        imageViewer.close(true);
        loadingManager.stopFeedbackCycle();
        loadingManager.reset();
        introManager.clearAnimation();
      }
      function showError(message, debugInfo = null, options = {}) {
        const errorScreen = modal.querySelector(".bould-widget__screen--error");
        if (!errorScreen) {
          return;
        }
        const titleEl = errorScreen.querySelector("h3");
        if (titleEl) {
          titleEl.textContent = options.heading || DEFAULT_ERROR_HEADING;
        }
        if (errorActionButton) {
          if (options.action === "close") {
            errorActionButton.textContent = options.actionLabel || "Close";
            errorActionButton.setAttribute("data-action", "close");
          } else {
            errorActionButton.textContent = errorActionDefaults.label;
            errorActionButton.setAttribute("data-action", errorActionDefaults.action);
          }
        }
        const pre = errorScreen.querySelector(".bould-widget__error");
        if (pre) {
          pre.className = "bould-widget__error";
          pre.classList.add("bould-widget__error--danger");
          if (options.tone === "info") {
            pre.classList.remove("bould-widget__error--danger");
            pre.classList.add("bould-widget__error--info");
          } else if (options.tone === "warning") {
            pre.classList.remove("bould-widget__error--danger");
            pre.classList.add("bould-widget__error--warn");
          } else if (options.tone === "error") {
            pre.classList.add("bould-widget__error--danger");
          }
          const parts = [`<div class="bould-widget__error-content">${formatMessage(message)}</div>`];
          const debugHtml = noticeManager.renderDebugInfo(debugInfo);
          if (debugHtml) {
            parts.push(debugHtml);
          }
          pre.innerHTML = parts.join("");
        }
        showScreen("error");
      }
      openBtn && openBtn.addEventListener("click", open);
      closeBtn && closeBtn.addEventListener("click", close);
      modal && modal.addEventListener("click", function(e) {
        if (e.target === modal) close();
      });
      modal && modal.addEventListener("click", function(e) {
        const t = e.target;
        if (!(t instanceof HTMLElement)) return;
        if (t.matches('[data-action="continue"]')) {
          showScreen("form");
        } else if (t.matches('[data-action="close"]')) {
          close();
        } else if (t.matches('[data-action="back-to-form"]')) {
          showScreen("form");
        } else if (t.matches('[data-action="retake"]')) {
          showScreen("form");
        }
      });
      if (resultImageEl) {
        resultImageEl.addEventListener("click", function() {
          const src = resultImageEl.getAttribute("src");
          if (!src) return;
          const altText = resultImageEl.getAttribute("alt") || "Try on result";
          if (isPhoneDevice()) {
            imageViewer.open(src, altText, resultImageEl);
            return;
          }
          const popup = window.open(src, "_blank", "noopener");
          if (popup && typeof popup === "object") {
            try {
              popup.opener = null;
            } catch (e) {
            }
          } else {
            window.location.href = src;
          }
        });
      }
      const form = container.querySelector(".bould-widget__form");
      if (form) {
        let updateHeightFieldAttributes = function() {
          if (!heightInput) return;
          const selected = unitSelect ? String(unitSelect.value || "").toLowerCase() : "cm";
          if (selected === "inch" || selected === "inches" || selected === "in") {
            heightInput.placeholder = "Height (in)";
            heightInput.min = "31";
            heightInput.max = "99";
          } else {
            heightInput.placeholder = "Height (cm)";
            heightInput.min = "80";
            heightInput.max = "250";
          }
        };
        const heightInput = form.querySelector('input[name="height"]');
        const unitSelect = form.querySelector('select[name="body_unit"]');
        updateHeightFieldAttributes();
        if (unitSelect) {
          unitSelect.addEventListener("change", updateHeightFieldAttributes);
        }
        const fileInput = form.querySelector('input[name="user_image"]');
        const uploadText = form.querySelector(".bould-widget__upload-text");
        const uploadIcon = form.querySelector(".bould-widget__upload-icon");
        if (fileInput) {
          fileInput.addEventListener("change", function() {
            if (fileInput.files && fileInput.files[0]) {
              if (uploadText) {
                uploadText.textContent = fileInput.files[0].name;
                uploadText.style.color = "#1E293B";
                uploadText.style.fontWeight = "500";
              }
              if (uploadIcon) {
                uploadIcon.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                uploadIcon.style.background = "#E0E7FF";
                uploadIcon.style.color = "#4F46E5";
                uploadIcon.style.transform = "none";
              }
              const uploadContainer = form.querySelector(".bould-widget__file-upload");
              if (uploadContainer) {
                uploadContainer.style.borderColor = "#6366F1";
                uploadContainer.style.background = "#EEF2FF";
              }
            }
          });
        }
        form.addEventListener("submit", async function(e) {
          e.preventDefault();
          const fd = new FormData(form);
          const file = fd.get("user_image");
          const height = fd.get("height");
          const bodyUnitRaw = fd.get("body_unit");
          const bodyUnit = typeof bodyUnitRaw === "string" ? bodyUnitRaw.toLowerCase() : "cm";
          const productImageUrl = getProductImageUrl(container);
          if (!(file instanceof File) || !height) {
            return showError("Missing image or height.");
          }
          if (productImageUrl) {
            fd.set("product_image_url", productImageUrl);
          }
          let feedbackMessages = [];
          let firstFeedbackMessage = "";
          let finalFeedbackText = "";
          prepareForRequest();
          try {
            const productId = getProductId(container);
            const correlationId = Math.random().toString(36).slice(2, 10);
            const endpointBase = apiService.getEndpointBase();
            const endpoint = productId ? `${endpointBase}?product_id=${encodeURIComponent(productId)}` : endpointBase;
            console.log("[Bould Widget] Making request to:", endpoint);
            console.log("[Bould Widget] Form data:", {
              hasImage: file instanceof File,
              imageSize: file instanceof File ? file.size : "N/A",
              height,
              imageType: file instanceof File ? file.type : "N/A",
              bodyUnit,
              productId,
              correlationId,
              productImageUrl
            });
            const controller = new AbortController();
            const timeoutMs = 28e3;
            const timeout = setTimeout(() => controller.abort(), timeoutMs);
            const res = await fetch(endpoint, {
              method: "POST",
              body: fd,
              headers: { "Accept": "application/json", "X-Correlation-ID": correlationId },
              signal: controller.signal
            }).finally(() => clearTimeout(timeout));
            console.log("[Bould Widget] Response status:", res.status);
            const resHeaders = Object.fromEntries(res.headers.entries());
            console.log("[Bould Widget] Response headers:", resHeaders);
            if (!res.ok) {
              let errorMessage = "Unknown server error";
              let debugInfo = {};
              const contentType = res.headers.get("content-type") || "";
              if (!contentType.includes("application/json")) {
                const text = await res.text().catch(() => "");
                errorMessage = `Server error: ${res.status}. Received non-JSON response. This often indicates a proxy misconfiguration.`;
                const enhancedError2 = new Error(errorMessage);
                enhancedError2.debugInfo = {
                  correlationId,
                  productId,
                  responseCorrelationId: resHeaders["x-correlation-id"] || resHeaders["x-request-id"],
                  hint: "Verify Shopify App Proxy path maps to /apps/bould",
                  responseSnippet: text.slice(0, 200)
                };
                enhancedError2.statusCode = res.status;
                throw enhancedError2;
              }
              try {
                const errorData = await res.json();
                console.log("[Bould Widget] Error response data:", errorData);
                if (errorData.debug) {
                  debugInfo = errorData.debug;
                  console.log("[Bould Widget] Debug info:", debugInfo);
                }
                if (res.status === 404) {
                  errorMessage = "Widget endpoint not found. Please check your configuration.";
                } else if (res.status === 409) {
                  if (errorData.error && (errorData.error.includes("not processed") || errorData.error.includes("not been converted"))) {
                    errorMessage = "This garment hasn't been edited.";
                  } else if (errorData.error && errorData.error.includes("processing")) {
                    errorMessage = "This garment is currently being processed. Please wait a few minutes and try again.";
                  } else if (errorData.error && errorData.error.includes("failed")) {
                    errorMessage = "Garment conversion failed. Please try converting again in the Bould app.";
                  } else {
                    errorMessage = errorData.error || "This garment hasn't been edited.";
                  }
                } else if (res.status === 502) {
                  errorMessage = "Garment processing service is unavailable. Please ensure the garment has been properly converted.";
                } else if (res.status === 504) {
                  errorMessage = "The request timed out. Please try again in a moment.";
                } else if (res.status === 500) {
                  errorMessage = errorData.error || "Internal server error. Please try again later.";
                } else {
                  errorMessage = errorData.error || `Server error: ${res.status}`;
                }
              } catch (parseError) {
                console.error("[Bould Widget] Failed to parse error response:", parseError);
                errorMessage = res.status === 504 ? "The request timed out at the edge (504). Please try again." : `Server error: ${res.status} - Unable to parse error response`;
              }
              const enhancedError = new Error(errorMessage);
              enhancedError.debugInfo = Object.assign({
                correlationId,
                productId,
                responseCorrelationId: resHeaders["x-correlation-id"] || resHeaders["x-request-id"]
              }, debugInfo || {});
              enhancedError.statusCode = res.status;
              throw enhancedError;
            }
            const data = await res.json();
            console.log("[Bould Widget] Success response:", data);
            const displayUnitRaw = typeof data.display_unit === "string" ? data.display_unit : bodyUnit;
            const displayUnit = String(displayUnitRaw || "cm").toLowerCase() === "inch" ? "inch" : "cm";
            const matchDetails = data && typeof data === "object" ? data.match_details || data.matchDetails || {} : {};
            feedbackMessages = extractFeedbackMessages(data, (loadingStatusEl == null ? void 0 : loadingStatusEl.dataset.defaultText) || "").slice(0, 3);
            if (!feedbackMessages.length && firstFeedbackMessage) {
              feedbackMessages = [firstFeedbackMessage];
            }
            firstFeedbackMessage = feedbackMessages[0] || firstFeedbackMessage || "";
            finalFeedbackText = feedbackMessages.join(" ").trim();
            if (!finalFeedbackText) {
              finalFeedbackText = firstFeedbackMessage || (loadingStatusEl ? loadingStatusEl.dataset.defaultText || "" : "");
            }
            loadingManager.stopFeedbackCycle(false);
            if (defaultFeedbackPromise) {
              try {
                await defaultFeedbackPromise;
              } catch (defaultCycleError) {
                console.info("[Bould Widget] Default feedback sequence ended early", defaultCycleError);
              }
            }
            defaultFeedbackController = null;
            defaultFeedbackPromise = null;
            const tailoredMessages = (feedbackMessages.length ? feedbackMessages : [
              finalFeedbackText || firstFeedbackMessage || DEFAULT_LOADING_FEEDBACK[DEFAULT_LOADING_FEEDBACK.length - 1]
            ]).slice(0, 3);
            tailoredFeedbackController = loadingManager.startFeedback(tailoredMessages, {
              loop: true,
              holdMs: 2800,
              fadeMs: 600,
              initialDelay: 0,
              hideStatus: true
            });
            tailoredFeedbackPromise = tailoredFeedbackController ? tailoredFeedbackController.promise : null;
            if (data && data.queued) {
              if (!data.task_id) {
                console.error("[Bould Widget] Queued response missing task_id:", data);
                throw new Error("The try-on service queued your request but did not provide a task ID. Please try again or contact support.");
              }
              console.log("[Bould Widget] Try-on queued. Polling for completion. task_id=", data.task_id);
              const start = Date.now();
              const maxMs = 55e3;
              const pollDelay = 1500;
              const taskId = data.task_id;
              let attempt = 0;
              while (Date.now() - start < maxMs) {
                await new Promise((r) => setTimeout(r, pollDelay));
                attempt += 1;
                console.log(`[Bould Widget] Polling attempt #${attempt}, elapsed: ${Date.now() - start}ms`);
                try {
                  const statusUrl = `${endpointBase}?intent=tryon_status&task_id=${encodeURIComponent(taskId)}`;
                  console.log("[Bould Widget] Polling URL:", statusUrl);
                  const stRes = await fetch(statusUrl, { headers: { "Accept": "application/json", "X-Correlation-ID": correlationId } });
                  console.log("[Bould Widget] Poll response status:", stRes.status);
                  if (stRes.ok) {
                    const st = await stRes.json();
                    console.log("[Bould Widget] Poll response data:", st);
                    if (st && st.result_image_url) {
                      console.log("[Bould Widget] Try-on complete! Image URL:", st.result_image_url);
                      data.tryOnImageUrl = st.result_image_url;
                      break;
                    }
                    if (st && st.status) {
                      console.log("[Bould Widget] Try-on status:", st.status);
                      const statusLower = String(st.status).toLowerCase();
                      if (["fail", "failed", "error"].includes(statusLower)) {
                        const reason = st.error || "The try-on provider reported a failure.";
                        throw new Error(`Try-on failed: ${reason}`);
                      }
                    }
                  } else {
                    const text = await stRes.text().catch(() => "");
                    console.warn("[Bould Widget] Status poll failed", stRes.status, text);
                  }
                } catch (pe) {
                  console.warn("[Bould Widget] Status poll error", pe);
                }
              }
              if (!data.tryOnImageUrl) {
                console.error("[Bould Widget] Polling timed out after", Date.now() - start, "ms");
                throw new Error("The request timed out before the try-on image was ready. Please try again.");
              }
            }
            if (!data || data.error) {
              if (data.error && data.error.includes("not processed")) {
                throw new Error("This garment has not been converted yet. Please run conversion in the Bould app first.");
              }
              throw new Error(data.error || "Invalid response from server.");
            }
            const recommendedSizeRaw = data.recommended_size || data.recommendedSize || "";
            const normalizedSize = String(recommendedSizeRaw || "").trim();
            const unitLabelLong = displayUnit === "inch" ? "inches" : "centimeters";
            const sizeText = "Recommended size: " + (normalizedSize || "-");
            let confidenceText = "";
            if (data.confidence !== void 0 && data.confidence !== null && data.confidence !== "") {
              const numericConfidence = Number(data.confidence);
              if (!Number.isNaN(numericConfidence)) {
                confidenceText = "Confidence: " + numericConfidence.toFixed(2) + "%";
              }
            }
            const slackSummary = summarizeSlack(matchDetails, displayUnit);
            if (confidenceText) {
              confidenceText += " • Measurements in " + unitLabelLong;
            } else {
              confidenceText = "Measurements in " + unitLabelLong;
            }
            if (slackSummary) {
              confidenceText += " • " + slackSummary;
            }
            const imageCandidates = [];
            if (data.tryOnImageUrl) imageCandidates.push(data.tryOnImageUrl);
            if (data.try_on_image_url && data.try_on_image_url !== data.tryOnImageUrl) imageCandidates.push(data.try_on_image_url);
            if (data.tryonImageUrl && data.tryonImageUrl !== data.tryOnImageUrl) imageCandidates.push(data.tryonImageUrl);
            if (data.debug && data.debug.measurement_vis_url) imageCandidates.push(data.debug.measurement_vis_url);
            const imageResult = await loadImageCandidates(imageCandidates);
            if (tailoredFeedbackController && typeof tailoredFeedbackController.cancel === "function") {
              tailoredFeedbackController.cancel(true);
            }
            tailoredFeedbackController = null;
            tailoredFeedbackPromise = null;
            loadingManager.stopFeedbackCycle(true);
            if (modal.hidden) {
              console.info("[Bould Widget] Modal closed before result reveal.");
              loadingManager.reset();
              return;
            }
            const resolvedImageUrl = imageResult && imageResult.loaded ? imageResult.url : "";
            const displayFeedbackText = (finalFeedbackText || "").trim() || (loadingStatusEl ? loadingStatusEl.dataset.defaultText || "" : "");
            const resultDetails = {
              imageUrl: resolvedImageUrl,
              sizeText,
              confidenceText,
              feedbackText: displayFeedbackText
            };
            storageService.save(resultDetails);
            resultManager.reveal(resultDetails, showScreen);
            loadingManager.reset();
          } catch (err) {
            console.error("[Bould Widget] Error occurred:", err);
            loadingManager.reset();
            let message = err && err.message ? err.message : "Unknown error occurred. Please try again.";
            if (err && err.name === "AbortError") {
              message = "The request timed out before completing. Please try again in a moment.";
            }
            let debugInfo = err && err.debugInfo ? { ...err.debugInfo } : null;
            if (err && err.statusCode) {
              if (!debugInfo) {
                debugInfo = {};
              }
              debugInfo.statusCode = err.statusCode;
            }
            if (debugInfo) {
              console.log("[Bould Widget] Debug information:", debugInfo);
            }
            const errorOptions = {};
            if (err && err.statusCode === 409) {
              errorOptions.tone = "warning";
              errorOptions.heading = "Action needed";
              errorOptions.action = "close";
            } else if (err && err.statusCode && err.statusCode >= 500) {
              errorOptions.tone = "error";
            }
            showError(message, debugInfo, errorOptions);
            if (err && err.statusCode === 409) {
              ensurePlanStatus();
            }
          }
        });
      }
      ensurePlanStatus();
    });
  })();
})();
