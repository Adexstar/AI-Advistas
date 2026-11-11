type BrowserSignals = {
  mobile?: boolean;
  userAgent?: string;
};

/** Phones only. A narrow desktop window stays desktop, and "Desktop site" on a phone does too. */
export function isMobileBrowser(signals?: BrowserSignals): boolean {
  const mobile = signals?.mobile ?? readUserAgentDataMobile();
  if (typeof mobile === "boolean") return mobile;
  const ua = signals?.userAgent ?? (typeof navigator === "undefined" ? "" : navigator.userAgent);
  return /Android|iPhone|iPod|webOS|BlackBerry|IEMobile|Opera Mini|Windows Phone|Mobile/i.test(ua);
}

function readUserAgentDataMobile(): boolean | undefined {
  if (typeof navigator === "undefined") return undefined;
  const data = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  return typeof data?.mobile === "boolean" ? data.mobile : undefined;
}
