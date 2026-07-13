import { describe, expect, it } from "vitest";
import { classifyAssessmentCandidate } from "./assessment-candidates";

describe("classifyAssessmentCandidate", () => {
  it("classifies a final exam at high confidence when points clear the threshold", () => {
    expect(classifyAssessmentCandidate({ name: "Final Exam", points_possible: 100 })).toEqual({
      kind: "final",
      confidence: 0.9,
    });
  });

  it("classifies a midterm", () => {
    expect(classifyAssessmentCandidate({ name: "Midterm 1", points_possible: 50 })).toMatchObject({
      kind: "midterm",
    });
  });

  it("treats a standalone 'exam' as midterm-tier", () => {
    expect(classifyAssessmentCandidate({ name: "Exam 2", points_possible: 30 })).toMatchObject({
      kind: "midterm",
    });
  });

  it("does not match 'examine' or 'example' as an exam", () => {
    expect(classifyAssessmentCandidate({ name: "Examine your process", points_possible: 50 })).toBeNull();
    expect(classifyAssessmentCandidate({ name: "Example problems", points_possible: 50 })).toBeNull();
  });

  it("does not match 'finalize' as final", () => {
    expect(classifyAssessmentCandidate({ name: "Finalize your topic", points_possible: 50 })).toBeNull();
  });

  it("lowers confidence for a keyword match below the points threshold", () => {
    expect(classifyAssessmentCandidate({ name: "Quiz 3", points_possible: 2 })).toEqual({
      kind: "quiz",
      confidence: 0.7,
    });
  });

  it("flags a large untitled deliverable at low confidence with no keyword match", () => {
    expect(classifyAssessmentCandidate({ name: "Deliverable 4", points_possible: 150 })).toEqual({
      kind: "other",
      confidence: 0.5,
    });
  });

  it("returns null for an ordinary problem set", () => {
    expect(classifyAssessmentCandidate({ name: "Problem Set 2", points_possible: 20 })).toBeNull();
  });

  it("returns null when points_possible is missing and no keyword matches", () => {
    expect(classifyAssessmentCandidate({ name: "Reading response", points_possible: null })).toBeNull();
  });
});
