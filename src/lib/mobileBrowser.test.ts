import { describe, expect, it } from "vitest";
import { isMobileBrowser } from "./mobileBrowser";

describe("isMobileBrowser", () => {
  it("shows the bottom bar on a phone", () => {
    expect(isMobileBrowser({ mobile: true })).toBe(true);
    expect(isMobileBrowser({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
    })).toBe(true);
  });

  it("hides the bottom bar on a desktop browser", () => {
    expect(isMobileBrowser({ mobile: false })).toBe(false);
    expect(isMobileBrowser({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    })).toBe(false);
  });

  it("hides the bottom bar when a phone requests the desktop site", () => {
    expect(isMobileBrowser({ mobile: false, userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36" })).toBe(false);
    expect(isMobileBrowser({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    })).toBe(false);
  });
});
