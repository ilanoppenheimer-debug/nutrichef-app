import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useBottomSheet — manages open/close state with smooth enter/exit animations
 * and optional swipe-down-to-close via a drag handle.
 *
 * Animation strategy:
 *  - Keep DOM mounted during the exit transition (unmount only after 280ms).
 *  - Entry:  translateY 100% → 0  (280ms ease-out)
 *  - Exit:   translateY 0    → 100% (280ms ease-out) then unmount
 *  - Drag:   translateY follows finger in real-time (transition disabled)
 *  - Snap:   if drag released below CLOSE_THRESHOLD → exit, else snap back
 *
 * Usage:
 *   const bs = useBottomSheet({ onClosed });
 *
 *   // Open/close from outside:
 *   bs.open();
 *   bs.close();
 *
 *   // In JSX:
 *   {bs.mounted && (
 *     <div>
 *       <div ref={bs.backdropRef} onClick={bs.close} />
 *       <div style={bs.sheetStyle}>
 *         <div {...bs.handleProps} />   ← drag handle
 *         ...content...
 *       </div>
 *     </div>
 *   )}
 */

const CLOSE_THRESHOLD_PX = 90;   // pixels dragged before auto-close
const CLOSE_VELOCITY = 0.45;     // px/ms — fast flick closes regardless of distance
const ANIM_DURATION = 280;       // ms — must match the CSS transition below

export function useBottomSheet({ onClosed } = {}) {
  // `mounted`  — whether the DOM node exists (true during open + closing animation)
  // `visible`  — whether the sheet is in its "shown" position (controls CSS translate)
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  // Swipe tracking
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const closeTimerRef = useRef(null);

  // ── Open / close ────────────────────────────────────────────────────────────

  const open = useCallback(() => {
    clearTimeout(closeTimerRef.current);
    setDragY(0);
    setMounted(true);
    // Wait one frame so the mount registers before starting the transition
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const close = useCallback(() => {
    setVisible(false); // Trigger exit animation
    setDragY(0);
    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
      onClosed?.();
    }, ANIM_DURATION);
  }, [onClosed]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  // ── Touch handlers (attach only to the drag handle element) ─────────────────

  const onHandleTouchStart = useCallback((e) => {
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    setIsDragging(true);
  }, []);

  const onHandleTouchMove = useCallback((e) => {
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) setDragY(delta); // Only allow downward drag
  }, []);

  const onHandleTouchEnd = useCallback(() => {
    setIsDragging(false);
    const elapsed = Math.max(Date.now() - startTimeRef.current, 1);
    const velocity = dragY / elapsed;

    if (dragY > CLOSE_THRESHOLD_PX || velocity > CLOSE_VELOCITY) {
      close();
    } else {
      setDragY(0); // Snap back
    }
  }, [dragY, close]);

  // ── Derived styles ──────────────────────────────────────────────────────────

  // Combine visible/hidden state with live drag offset.
  // When visible=false: sheet sits 100% below its own height (off-screen).
  // When visible=true + dragging: sheet is at dragY px below resting position.
  const sheetStyle = {
    transform: visible
      ? `translateY(${dragY}px)`
      : 'translateY(100%)',
    transition: isDragging ? 'none' : `transform ${ANIM_DURATION}ms cubic-bezier(0.32, 0.72, 0, 1)`,
    willChange: 'transform',
  };

  const backdropStyle = {
    opacity: visible ? 1 : 0,
    transition: `opacity ${ANIM_DURATION}ms ease`,
  };

  return {
    mounted,
    visible,
    open,
    close,
    sheetStyle,
    backdropStyle,
    /** Spread these onto the drag-handle element only */
    handleProps: {
      onTouchStart: onHandleTouchStart,
      onTouchMove: onHandleTouchMove,
      onTouchEnd: onHandleTouchEnd,
    },
  };
}
