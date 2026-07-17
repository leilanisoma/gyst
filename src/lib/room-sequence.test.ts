import { describe, expect, it } from "vitest";
import { adjacentRoomHrefs, roomSequenceIndex, slideDirection } from "./room-sequence";

describe("roomSequenceIndex", () => {
  it("finds each sequence route's position", () => {
    expect(roomSequenceIndex("/wellness")).toBe(0);
    expect(roomSequenceIndex("/")).toBe(1);
    expect(roomSequenceIndex("/school")).toBe(2);
    expect(roomSequenceIndex("/recruiting")).toBe(3);
  });

  it("returns -1 for routes outside the slidable sequence", () => {
    expect(roomSequenceIndex("/gmail")).toBe(-1);
    expect(roomSequenceIndex("/settings")).toBe(-1);
    expect(roomSequenceIndex("/inbox")).toBe(-1);
  });
});

describe("adjacentRoomHrefs", () => {
  it("has no prev at the start of the sequence", () => {
    expect(adjacentRoomHrefs("/wellness")).toEqual({ prev: null, next: "/" });
  });

  it("has both neighbors in the middle", () => {
    expect(adjacentRoomHrefs("/")).toEqual({ prev: "/wellness", next: "/school" });
    expect(adjacentRoomHrefs("/school")).toEqual({ prev: "/", next: "/recruiting" });
  });

  it("has no next at the end of the sequence", () => {
    expect(adjacentRoomHrefs("/recruiting")).toEqual({ prev: "/school", next: null });
  });

  it("returns nulls for an off-sequence route", () => {
    expect(adjacentRoomHrefs("/gmail")).toEqual({ prev: null, next: null });
  });
});

describe("slideDirection", () => {
  it("is 1 when moving to a later room", () => {
    expect(slideDirection("/wellness", "/")).toBe(1);
    expect(slideDirection("/", "/recruiting")).toBe(1);
  });

  it("is -1 when moving to an earlier room", () => {
    expect(slideDirection("/recruiting", "/school")).toBe(-1);
    expect(slideDirection("/school", "/wellness")).toBe(-1);
  });

  it("is 0 when either side is off-sequence", () => {
    expect(slideDirection("/gmail", "/")).toBe(0);
    expect(slideDirection("/", "/settings")).toBe(0);
  });

  it("is 0 for the same route", () => {
    expect(slideDirection("/school", "/school")).toBe(0);
  });
});
