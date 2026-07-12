import { describe, expect, it } from "vitest";
import { classify, isInternshipTitle } from "./classify";

describe("isInternshipTitle", () => {
  it("matches internship titles but not words that merely contain \"intern\"", () => {
    expect(isInternshipTitle("Product Intern")).toBe(true);
    expect(isInternshipTitle("Summer Internship Program")).toBe(true);
    expect(isInternshipTitle("Manager, International Growth")).toBe(false);
    expect(isInternshipTitle("Internal Audit Analyst")).toBe(false);
  });
});

describe("classify", () => {
  it("flags pure software engineering titles", () => {
    expect(classify("Software Engineer Intern").isSwe).toBe(true);
    expect(classify("Machine Learning Engineer Intern").isSwe).toBe(true);
  });

  it("flags finance titles", () => {
    expect(classify("Investment Banking Summer Analyst").isFinance).toBe(true);
    expect(classify("Quantitative Trader Intern").isFinance).toBe(true);
  });

  it("maps keywords to role families when not SWE/finance", () => {
    expect(classify("Product Manager Intern").roleFamily).toBe("product_management");
    expect(classify("Business Operations Intern").roleFamily).toBe("product_ops_business_ops");
    expect(classify("Strategy & Consulting Intern").roleFamily).toBe("strategy_consulting");
    expect(classify("Growth Marketing Intern").roleFamily).toBe("growth_business_development");
    expect(classify("Data Analytics Intern").roleFamily).toBe("data_analytics_insights");
    expect(classify("Applied AI Intern").roleFamily).toBe("ai_adjacent_non_swe");
    expect(classify("Venture Capital Intern").roleFamily).toBe("venture_startup_ecosystem");
  });

  it("falls back to other for unrecognized titles and never role-classifies SWE titles", () => {
    expect(classify("Facilities Coordinator").roleFamily).toBe("other");
    expect(classify("Software Engineer Intern").roleFamily).toBe("other");
  });
});
