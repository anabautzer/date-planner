'use client';

import { useEffect, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface Placement {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

// Renders `children` into document.body, positioned under (or, if there's
// not enough room, above) `anchorRef` — instead of as a normal descendant.
//
// Needed because our tab content sits inside a Framer Motion wrapper that
// creates its own CSS stacking context — no z-index inside it can ever
// paint above a sibling like the sticky TabBar. Portaling to <body> escapes
// that trap, while leaving normal (non-portaled) content exactly where it
// was, so the tab bar stays clickable everywhere else.
//
// Being fixed-position means it's clipped by the *viewport*, not the page —
// so we measure available space and cap height / flip side accordingly,
// rather than letting the browser silently cut it off.
export default function PortalDropdown({
  anchorRef,
  open,
  children,
}: {
  anchorRef: RefObject<HTMLElement>;
  open: boolean;
  children: ReactNode;
}) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open || !anchorRef.current) {
      setPlacement(null);
      return;
    }
    const MARGIN = 12;
    const MIN_HEIGHT = 140;

    const update = () => {
      const r = anchorRef.current?.getBoundingClientRect();
      if (!r) return;
      const spaceBelow = window.innerHeight - r.bottom - MARGIN;
      const spaceAbove = r.top - MARGIN;
      const openAbove = spaceBelow < MIN_HEIGHT && spaceAbove > spaceBelow;

      setPlacement({
        left: r.left,
        width: r.width,
        maxHeight: Math.max(MIN_HEIGHT, openAbove ? spaceAbove : spaceBelow),
        top: openAbove ? undefined : r.bottom + 8,
        bottom: openAbove ? window.innerHeight - r.top + 8 : undefined,
      });
    };
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, anchorRef]);

  if (!mounted || !open || !placement) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: placement.top,
        bottom: placement.bottom,
        left: placement.left,
        width: placement.width,
        maxHeight: placement.maxHeight,
        overflowY: 'auto',
        zIndex: 9999,
      }}
    >
      {children}
    </div>,
    document.body
  );
}
