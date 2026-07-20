"use client";

import { useEffect } from "react";

// body's own background stays white/black (see globals.css) since it's
// static CSS with no idea whether the SÍ/NO screen is red or green.
// Whenever the screen doesn't exactly cover the visual viewport — under
// Safari's status bar/safe area, or for a frame during toolbar animations
// — the browser paints that gap with body's background, so we keep it in
// sync with the current screen color here instead of leaving it white/black.
export default function BodyBgSync({
  light,
  dark,
}: {
  light: string;
  dark: string;
}) {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function update() {
      document.body.style.backgroundColor = media.matches ? dark : light;
    }
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [light, dark]);

  return null;
}
