export type WhatsAppLocalTaskHelperStatus =
  | "needs-helper-input"
  | "ready"
  | "review-required"
  | "unsafe-rejected";

export interface WhatsAppLocalTaskHelperSummary {
  helperStatus: WhatsAppLocalTaskHelperStatus;
  importStatus: string;
  inputPresent: boolean;
  taskCount: number;
  safeTaskCount: number;
  reviewRequiredCount: number;
  unsafeRejectedCount: number;
  rawInputPrinted: false;
  rawChatPrinted: false;
  secretRedactionApplied: true;
}

export {};
