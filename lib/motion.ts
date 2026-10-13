/** Small browser helpers shared by the motion components. Client-side only. */

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches

/** True for mouse/trackpad devices — hover and tilt effects only run there. */
export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches

/** Phones and small tablets get lighter effects. */
export const isSmallScreen = () => typeof window !== "undefined" && window.innerWidth < 768

/* ---------- cross-component events ---------- */

export const EVENTS = {
  /** detail: boolean — pause/resume smooth scrolling while a modal is open */
  scrollLock: "rc:scroll-lock",
  /** open the hidden terminal from anywhere (footer hint, mobile menu) */
  openTerminal: "rc:open-terminal",
  /** fired once the first-visit intro has finished or been skipped */
  introDone: "rc:intro-done",
} as const

export function lockScroll(locked: boolean) {
  document.documentElement.toggleAttribute("data-scroll-locked", locked)
  window.dispatchEvent(new CustomEvent(EVENTS.scrollLock, { detail: locked }))
}

export function openTerminal() {
  window.dispatchEvent(new CustomEvent(EVENTS.openTerminal))
}

/** Resolves immediately unless the boot intro is currently playing. */
export function whenIntroDone(): Promise<void> {
  if (document.documentElement.getAttribute("data-intro") !== "play") return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener(EVENTS.introDone, () => resolve(), { once: true })
  })
}

/** requestIdleCallback with a Safari fallback. */
export function onIdle(cb: () => void, timeout = 1500): () => void {
  const w = window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
    cancelIdleCallback?: (id: number) => void
  }
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(cb, { timeout })
    return () => w.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(cb, 200)
  return () => window.clearTimeout(id)
}
