import { describe, expect, it } from "vitest";
import { isPublishedTemplate, reviewPatch, reviewQueue } from "./review";

describe("template review", () => {
  it("publishes only an active approved template", () => {
    expect(isPublishedTemplate({ is_active: true, review_status: "approved" })).toBe(true);
    expect(isPublishedTemplate({ is_active: true, review_status: "pending" })).toBe(false);
    expect(isPublishedTemplate({ is_active: false, review_status: "approved" })).toBe(false);
    expect(isPublishedTemplate({ is_active: false, review_status: "rejected" })).toBe(false);
  });

  it("approves by marking the row active and approved", () => {
    const patch = reviewPatch("approved", "ready", "2026-11-05T20:00:00.000Z");
    expect(patch).toEqual({
      is_active: true,
      review_status: "approved",
      reviewed_at: "2026-11-05T20:00:00.000Z",
      review_note: "ready",
    });
    expect(isPublishedTemplate(patch)).toBe(true);
  });

  it("rejects by taking the template off the public library", () => {
    const patch = reviewPatch("rejected");
    expect(patch.is_active).toBe(false);
    expect(patch.review_status).toBe("rejected");
    expect(reviewQueue(patch)).toBe("rejected");
    expect(isPublishedTemplate(patch)).toBe(false);
  });

  it("keeps unpublished and pending templates in the review queue", () => {
    expect(reviewQueue({ is_active: false, review_status: "pending" })).toBe("review");
    expect(reviewQueue({ is_active: true, review_status: "pending" })).toBe("review");
    expect(reviewQueue({ is_active: true, review_status: "approved" })).toBe("published");
  });
});
