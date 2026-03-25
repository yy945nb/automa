import React, { useRef, useEffect, cloneElement, isValidElement } from 'react';

type SlideDirection = 'top' | 'left' | 'right' | 'bottom';

/**
 * TransitionSlide – animates a translateX/Y slide on enter and leave.
 *
 * Usage:
 *   <TransitionSlide show={open} direction="left">
 *     <div>content</div>
 *   </TransitionSlide>
 */
interface TransitionSlideProps {
  show: boolean;
  direction?: SlideDirection;
  children: React.ReactElement;
}

const translateValues: Record<number, string> = {
  0: '-100%',
  1: '100%',
};

const directionsKey: Record<SlideDirection, number> = {
  top: 0,
  left: 0,
  right: 1,
  bottom: 1,
};

function getTranslateStyle(direction: SlideDirection, key = 0): string {
  const isHorizontal = ['left', 'right'].includes(direction);
  const value = translateValues[directionsKey[direction] + key];
  return isHorizontal ? `translateX(${value})` : `translateY(${value})`;
}

const TransitionSlide: React.FC<TransitionSlideProps> = ({
  show,
  direction = 'left',
  children,
}) => {
  const nodeRef = useRef<HTMLElement>(null);
  const prevShowRef = useRef(show);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    if (show && !prevShowRef.current) {
      // entering
      el.style.transition = 'transform 0.25s ease-out';
      el.style.transform = getTranslateStyle(direction);
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.transform = 'translate(0, 0)';
      });
      const cleanup = () => {
        el.style.transition = '';
        el.removeEventListener('transitionend', cleanup);
      };
      el.addEventListener('transitionend', cleanup);
    } else if (!show && prevShowRef.current) {
      // leaving
      el.style.transition = 'transform 0.25s ease-out';
      el.style.transform = getTranslateStyle(direction, 1);
    }

    prevShowRef.current = show;
  }, [show, direction]);

  if (!show && !prevShowRef.current) return null;

  if (!isValidElement(children)) return null;

  return cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>, { ref: nodeRef });
};

export default TransitionSlide;
