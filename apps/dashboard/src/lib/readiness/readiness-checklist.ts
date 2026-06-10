import type { ReadinessCategory, ReadinessStatus } from "./readiness-types";

export interface ReadinessCheck {
  category: ReadinessCategory;
  title: string;
  status: ReadinessStatus;
  evidence: string;
}

export declare const READINESS_CHECKLIST: ReadinessCheck[];
export declare const REQUIRED_BEFORE_PRODUCTION: string[];
