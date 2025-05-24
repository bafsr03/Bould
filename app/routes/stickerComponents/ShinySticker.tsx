import React, { useRef, useState, useEffect, CSSProperties } from 'react';
import { Spinner } from '@shopify/polaris';

// Simplified Pointer hook for mouse/touch position
function usePointer() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    let didUnmount = false;

    function onPointerMove(e: PointerEvent) {
      if (!didUnmount) {
        setPos({ x: e.clientX, y: e.clientY });
      }
    }
    window.addEventListener('pointermove', onPointerMove, true);

    return () => {
      didUnmount = true;
      window.removeEventListener('pointermove', onPointerMove, true);
    };
  }, []);

  return pos;
}


// Cap helper
function cap(n: number, min = -15, max = 15) {
  return Math.max(min, Math.min(max, n));
}
const ROTATION_CAP_MIN = -30;
const ROTATION_CAP_MAX = 30;
// Increased max tilt for touch animation to make it more noticeable
const TOUCH_ANIMATION_ROTATION_MAX = 25; 
const TOUCH_ANIMATION_DURATION = 700; // ms

// Ease helper
function ease(rawTarget: number, prev: number, easing = 0.05, minCap = -15, maxCap = 15) {
  const cappedTarget = cap(rawTarget, minCap, maxCap);
  return prev + (cappedTarget - prev) * easing;
}

export interface ShinyStickerProps {
  url: string;
  rotate?: string;
  width?: string;
}

const RESTING_STATE = {
  xR: 0,
  yR: 0,
  b: 0.25,
  xN: 0.5,
  yN: 0.5,
};


export function ShinySticker({
  url,
  rotate = '0deg',
  width = '100%',
}: ShinyStickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer();
  const [isHovering, setIsHovering] = useState(false);

  const [xRot, setXRot] = useState(RESTING_STATE.xR);
  const [yRot, setYRot] = useState(RESTING_STATE.yR);
  const [brightness, setBrightness] = useState(RESTING_STATE.b);
  const [xNorm, setXNorm] = useState(RESTING_STATE.xN);
  const [yNorm, setYNorm] = useState(RESTING_STATE.yN);

  const [center, setCenter] = useState<{ x: number; y: number } | null>(null);
  const elementRectRef = useRef<DOMRect | null>(null);

  const animationStateRef = useRef({ ...RESTING_STATE });
  const targetValuesRef = useRef({ ...RESTING_STATE });

  const [hasTouchSupport, setHasTouchSupport] = useState(false);
  const [touchAnimationActive, setTouchAnimationActive] = useState(false);
  const animatedTargetRotationRef = useRef({ xR: 0, yR: 0 });
  const touchAnimationTimeoutIdRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    setHasTouchSupport(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0));
  }, []);


  useEffect(() => {
    animationStateRef.current = { xR: xRot, yR: yRot, b: brightness, xN: xNorm, yN: yNorm };
  }, [xRot, yRot, brightness, xNorm, yNorm]);

  useEffect(() => {
    const calculateAndSetCenter = () => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          elementRectRef.current = rect;
          setCenter({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        } else {
           elementRectRef.current = null;
           setCenter(null);
        }
      } else {
        elementRectRef.current = null;
        setCenter(null);
      }
    };
    calculateAndSetCenter();
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && wrapperRef.current) {
            requestAnimationFrame(calculateAndSetCenter);
        }
    }, {threshold: 0.1});

    if(wrapperRef.current) observer.observe(wrapperRef.current);
    window.addEventListener('resize', calculateAndSetCenter);
    window.addEventListener('scroll', calculateAndSetCenter, true);
    
    return () => {
      if(wrapperRef.current) observer.unobserve(wrapperRef.current);
      window.removeEventListener('resize', calculateAndSetCenter);
      window.removeEventListener('scroll', calculateAndSetCenter, true);
      if (touchAnimationTimeoutIdRef.current) {
        clearTimeout(touchAnimationTimeoutIdRef.current);
      }
    }
  }, []);

  useEffect(() => {
    let tXR: number, tYR: number, tB: number;
    let tXN: number, tYN: number;

    if (hasTouchSupport) {
      if (isHovering) { 
          const rect = elementRectRef.current;
          if (rect && rect.width > 0) {
              const currentPointerX = pointer.x;
              const currentPointerY = pointer.y;
              tXN = cap((currentPointerX - rect.left) / rect.width, 0, 1);
              tYN = cap((currentPointerY - rect.top) / rect.height, 0, 1);
              const distToGlint = Math.hypot(currentPointerX - (tXN * rect.width + rect.left), currentPointerY - (tYN * rect.height + rect.top));
              tB = cap(1.1 - (distToGlint / 200), RESTING_STATE.b + 0.1, 0.60);
          } else {
              tXN = RESTING_STATE.xN;
              tYN = RESTING_STATE.yN;
              tB = RESTING_STATE.b;
          }

          if (touchAnimationActive) {
              tXR = animatedTargetRotationRef.current.xR;
              tYR = animatedTargetRotationRef.current.yR;
          } else {
              tXR = RESTING_STATE.xR;
              tYR = RESTING_STATE.yR;
          }
      } else { 
          tXR = RESTING_STATE.xR;
          tYR = RESTING_STATE.yR;
          tXN = RESTING_STATE.xN;
          tYN = RESTING_STATE.yN;
          tB = RESTING_STATE.b;
      }
    } else { 
      if (!isHovering || !center || !elementRectRef.current || elementRectRef.current.width === 0) {
        tXR = RESTING_STATE.xR;
        tYR = RESTING_STATE.yR;
        tB = RESTING_STATE.b;
        tXN = RESTING_STATE.xN;
        tYN = RESTING_STATE.yN;
      } else {
        const rect = elementRectRef.current;
        const currentPointerX = pointer.x;
        const currentPointerY = pointer.y;
        tXR = (center.y - currentPointerY) * 0.18;
        tYR = -(center.x - currentPointerX) * 0.18;
        tXN = cap((currentPointerX - rect.left) / rect.width, 0, 1);
        tYN = cap((currentPointerY - rect.top) / rect.height, 0, 1);
        const distToGlint = Math.hypot(currentPointerX - (tXN * rect.width + rect.left), currentPointerY - (tYN * rect.height + rect.top));
        tB = cap(1.1 - (distToGlint / 200), RESTING_STATE.b + 0.1, 0.60);
      }
    }
    targetValuesRef.current = { xR: tXR, yR: tYR, b: tB, xN: tXN, yN: tYN };
  }, [pointer, center, isHovering, hasTouchSupport, touchAnimationActive]);

  useEffect(() => {
    let animationFrameId: number;
    const precision = 0.001;
    const rotPrecision = 0.01;

    const updateAnimatedValue = (
        setter: React.Dispatch<React.SetStateAction<number>>,
        currentVal: number,
        targetVal: number,
        easedNextVal: number,
        valPrecision: number,
    ) => {
        if (Math.abs(easedNextVal - targetVal) < valPrecision && currentVal !== targetVal) {
            setter(targetVal);
        }
        else if (Math.abs(currentVal - easedNextVal) > valPrecision) {
            setter(easedNextVal);
        }
    };

    const animate = () => {
      const current = animationStateRef.current;
      const target = targetValuesRef.current;
      
      const nextXR = ease(target.xR, current.xR, 0.09, ROTATION_CAP_MIN, ROTATION_CAP_MAX);
      const nextYR = ease(target.yR, current.yR, 0.09, ROTATION_CAP_MIN, ROTATION_CAP_MAX);
      const nextB = ease(target.b, current.b, 0.12, 0.1, 1.0);
      const nextXN = ease(target.xN, current.xN, 0.12, 0, 1);
      const nextYN = ease(target.yN, current.yN, 0.12, 0, 1);

      updateAnimatedValue(setXRot, current.xR, cap(target.xR, ROTATION_CAP_MIN, ROTATION_CAP_MAX), nextXR, rotPrecision);
      updateAnimatedValue(setYRot, current.yR, cap(target.yR, ROTATION_CAP_MIN, ROTATION_CAP_MAX), nextYR, rotPrecision);
      updateAnimatedValue(setBrightness, current.b, cap(target.b, 0.1, 1.0), nextB, precision);
      updateAnimatedValue(setXNorm, current.xN, cap(target.xN, 0, 1), nextXN, precision);
      updateAnimatedValue(setYNorm, current.yN, cap(target.yN, 0, 1), nextYN, precision);
      
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleTouchStart = () => {
    if (!hasTouchSupport) return;
    setIsHovering(true);

    if (touchAnimationTimeoutIdRef.current) {
      clearTimeout(touchAnimationTimeoutIdRef.current);
    }

    // Generate a random angle and a strong magnitude for the tilt
    const randomAngle = Math.random() * Math.PI * 2; // Full circle random angle
    // Tilt magnitude will be between 60% and 100% of TOUCH_ANIMATION_ROTATION_MAX
    const randomMagnitudeFactor = 0.6 + Math.random() * 0.4; 
    const tiltMagnitude = randomMagnitudeFactor * TOUCH_ANIMATION_ROTATION_MAX;

    const newXR = Math.cos(randomAngle) * tiltMagnitude;
    const newYR = Math.sin(randomAngle) * tiltMagnitude;
    
    animatedTargetRotationRef.current = { xR: newXR, yR: newYR };
    
    setTouchAnimationActive(true);

    touchAnimationTimeoutIdRef.current = setTimeout(() => {
      setTouchAnimationActive(false);
    }, TOUCH_ANIMATION_DURATION);
  };

  const handleTouchEndCancel = () => {
    if (!hasTouchSupport) return;
    setIsHovering(false);
    setTouchAnimationActive(false); 
    if (touchAnimationTimeoutIdRef.current) {
      clearTimeout(touchAnimationTimeoutIdRef.current);
      touchAnimationTimeoutIdRef.current = null;
    }
  };

  const stickerInnerStyle: CSSProperties = {
    '--x-rot': `${xRot}`,
    '--y-rot': `${yRot}`,
    '--brightness': `${brightness}`,
    '--x-norm': `${xNorm}`,
    '--y-norm': `${yNorm}`,
    '--rotate-base': rotate,
  } as React.CSSProperties;

  return (
    <div
      ref={wrapperRef}
      className="shiny-sticker-wrapper"
      style={{ 
        width, 
        position: 'relative', 
        touchAction: 'manipulation', 
        display: 'inline-block', 
        verticalAlign: 'middle',
        userSelect: 'none', 
        WebkitTapHighlightColor: 'transparent',
      }}
      onMouseEnter={() => {
        if (!hasTouchSupport) setIsHovering(true);
      }}
      onMouseLeave={() => {
        if (!hasTouchSupport) setIsHovering(false);
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEndCancel}
      onTouchCancel={handleTouchEndCancel}
    >
      <div className="sticker" style={stickerInnerStyle}>
        {!url ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%', minHeight: '100px' }}>
            <Spinner accessibilityLabel="Loading sticker" size="large" />
          </div>
        ) : (
          <>
            <img className="sticker-image drop-shadow-lg" src={url} alt="Shiny sticker" />
            <div className="shine absolute inset-0" />
          </>
        )}
      </div>
      <style jsx>{`
        /* Styles are unchanged */
        .shiny-sticker-wrapper {}
        .sticker {
          transform: perspective(350px)
            rotateX(calc(var(--x-rot) * 1deg))
            rotateY(calc(var(--y-rot) * 1deg));
          will-change: transform;
          width: 100%; 
          height: 100%;
          position: relative;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .sticker-image {
          display: block;
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          transform: rotate(var(--rotate-base));
          filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.07)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.15));
        }
        .shine {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          mask-image: url(${url});
          mask-size: contain;
          mask-position: center;
          mask-repeat: no-repeat;
          transform: rotate(var(--rotate-base));
          
          background-image:
            radial-gradient(
              circle at calc(var(--x-norm) * 100%) calc(var(--y-norm) * 100%),
              rgba(255, 240, 255, 0.95) 0%,
              rgba(210, 235, 255, 0.75) 18%,
              rgba(220, 255, 220, 0.55) 35%,
              transparent 65%
            ),
            repeating-linear-gradient(
              -45deg,
              transparent 0%,
              rgba(255, 255, 255, 0.2) 1.5%,
              transparent 3.5%
            ),
            url(https://upload.wikimedia.org/wikipedia/commons/7/7a/2k_Dissolve_Noise_Texture.png);

          background-size:
            200% 200%,
            70px 70px,
            cover;

          background-position:
            calc((var(--x-norm) - 0.5) * -30%) calc((var(--y-norm) - 0.5) * -30%),
            calc(var(--y-rot) * 0.4% - 20%) calc(var(--x-rot) * 0.4% - 20%),
            center center;

          background-blend-mode: screen, overlay;
          mix-blend-mode: color-dodge;
          filter: brightness(var(--brightness)) contrast(2.5);
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}