import React, { useRef, useEffect, cloneElement, isValidElement } from 'react';

/**
 * TransitionExpand – animates height from 0 to auto on enter, and auto to 0 on leave.
 * Wraps a single child element. The child must accept a `ref` prop.
 *
 * Usage:
 *   <TransitionExpand show={open}>
 *     <div>content</div>
 *   </TransitionExpand>
 */
interface TransitionExpandProps {
  show: boolean;
  children: React.ReactElement;
}

const TransitionExpand: React.FC<TransitionExpandProps> = ({ show, children }) => {
  const nodeRef = useRef<HTMLElement>(null);
  const prevShowRef = useRef(show);

  useEffect(() => {
    const el = nodeRef.current;
    if (!el) return;

    if (show && !prevShowRef.current) {
      // entering
      const { width } = getComputedStyle(el);
      el.style.width = width;
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.height = 'auto';
      const { height } = getComputedStyle(el);
      el.style.width = '';
      el.style.position = '';
      el.style.visibility = '';
      el.style.height = '0px';
      el.style.overflow = 'hidden';
      el.style.transition = 'height 0.2s ease-in-out';
      // force reflow
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.height = height;
      });
      const cleanup = () => {
        el.style.height = 'auto';
        el.style.overflow = '';
        el.style.transition = '';
        el.removeEventListener('transitionend', cleanup);
      };
      el.addEventListener('transitionend', cleanup);
    } else if (!show && prevShowRef.current) {
      // leaving
      const { height } = getComputedStyle(el);
      el.style.height = height;
      el.style.overflow = 'hidden';
      el.style.transition = 'height 0.2s ease-in-out';
      void el.offsetHeight;
      requestAnimationFrame(() => {
        el.style.height = '0px';
      });
    }

    prevShowRef.current = show;
  }, [show]);

  if (!show && !prevShowRef.current) return null;

  if (!isValidElement(children)) return null;

  return cloneElement(children as React.ReactElement<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>, { ref: nodeRef });
};

export default TransitionExpand;
