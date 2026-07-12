import type { RoleFamily } from "@/lib/recruiting";

export type Classification = {
  roleFamily: RoleFamily;
  isSwe: boolean;
  isFinance: boolean;
};

const SWE_PATTERN =
  /software engineer|swe intern|full.?stack|back.?end engineer|front.?end engineer|systems engineer|infrastructure engineer|platform engineer|site reliability|devops|firmware|embedded|ml engineer|machine learning engineer|data engineer|mobile engineer|ios engineer|android engineer|qa engineer|test engineer/i;

const FINANCE_PATTERN =
  /investment banking|private equity|hedge fund|equity research|corporate finance|financial analyst|\btrading\b|\btrader\b|quantitative (trader|researcher)|wealth management|asset management/i;

const ROLE_FAMILY_PATTERNS: [RegExp, RoleFamily][] = [
  [/product manager|product management|\bapm\b/i, "product_management"],
  [/business operations|biz ?ops|operations analyst|strategy ?ops|chief of staff/i, "product_ops_business_ops"],
  [/strategy|consulting|consultant/i, "strategy_consulting"],
  [/growth|business development|biz ?dev|partnerships/i, "growth_business_development"],
  [/data analy|data scien|\banalytics\b|\binsights\b|research analyst/i, "data_analytics_insights"],
  [/\bai\b|machine learning|applied ai|ai\/ml/i, "ai_adjacent_non_swe"],
  [/venture|startup studio|venture capital|\bvc\b/i, "venture_startup_ecosystem"],
];

/**
 * Deterministic keyword classification — no AI/prompt layer exists yet, and
 * PLAN.md keeps this kind of rule out of a model anyway. Good enough for a
 * first triage pass; the user still confirms/corrects via job-scoring's
 * editable dimensions once an opportunity is saved.
 */
export function classify(title: string): Classification {
  const isSwe = SWE_PATTERN.test(title);
  const isFinance = FINANCE_PATTERN.test(title);

  let roleFamily: RoleFamily = "other";
  if (!isSwe) {
    for (const [pattern, family] of ROLE_FAMILY_PATTERNS) {
      if (pattern.test(title)) {
        roleFamily = family;
        break;
      }
    }
  }

  return { roleFamily, isSwe, isFinance };
}
