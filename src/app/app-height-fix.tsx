"use client";

import { useEffect } from "react";

export default function AppHeightFix() {
  useEffect(() => {
    // iOS Safari's dvh unit can get stuck at the wrong value on pages that
    // never scroll (nothing triggers it to reconcile with the toolbar's
    // current state), leaving a blank gap at the edge of the screen. Track
    // the real visible height ourselves via visualViewport/innerHeight
    // instead, so the color screen always fills exactly what's visible —
    // including right after the user pinch-zooms back out.
    //
    // visualViewport.height also shrinks when the user pinch-zooms (it
    // reports the smaller visible slice of the page, with .scale > 1), even
    // though the page's own layout viewport (innerHeight) hasn't changed.
    // Following it in that case would shrink the color block to less than
    // the full window, so only trust it while scale is ~1.
    function setAppHeight() {
      const vv = window.visualViewport;
      const height = vv && vv.scale <= 1 ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
    }
    setAppHeight();
    window.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("resize", setAppHeight);
    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("resize", setAppHeight);
    };
  }, []);

  return null;
}
