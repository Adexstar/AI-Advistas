export type ReviewDecision = "approved" | "rejected";

export interface TemplatePublication {
  is_active: boolean;
  review_status: string | null;
}

/** The public library only lists rows that passed review and are still published. */
export function isPublishedTemplate(template: TemplatePublication) {
  return template.is_active === true && template.review_status === "approved";
}

export function reviewQueue(template: TemplatePublication): "published" | "rejected" | "review" {
  if (template.review_status === "rejected") return "rejected";
  if (isPublishedTemplate(template)) return "published";
  return "review";
}

/** Payload written by the admin review API. Approval is what makes a template public. */
export function reviewPatch(decision: ReviewDecision, note?: string, reviewedAt = new Date().toISOString()) {
  if (decision === "approved") {
    return {
      is_active: true,
      review_status: "approved" as const,
      reviewed_at: reviewedAt,
      review_note: note ?? null,
    };
  }
  return {
    is_active: false,
    review_status: "rejected" as const,
    reviewed_at: reviewedAt,
    review_note: note ?? null,
  };
}
