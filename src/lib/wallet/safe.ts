export function isInSafeIframe(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.parent !== window && document.referrer.includes("app.safe.global")
  } catch {
    return false
  }
}
