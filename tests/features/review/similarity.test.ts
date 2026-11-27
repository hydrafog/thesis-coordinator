import { describe, it, expect } from "vitest";
import {
  ShingleContainmentStrategy,
  tokenize,
} from "../../../src/features/review/domain/similarity";

const strategy = new ShingleContainmentStrategy();

function words(prefix: string, count: number): string {
  return Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(
    " ",
  );
}

describe("shingle containment similarity", () => {
  it("normalizes case and punctuation", () => {
    expect(tokenize("Hello,   WORLD! 42")).toEqual(["hello", "world", "42"]);
  });

  it("scores identical text at 100 and unrelated text at 0", () => {
    const text = words("alpha", 30);
    expect(strategy.compare(text, [{ id: "a", text }]).score).toBe(100);
    expect(
      strategy.compare(text, [{ id: "b", text: words("beta", 30) }]).score,
    ).toBe(0);
  });

  it("reports the covered share of the submission", () => {
    const subject = words("w", 20);
    const copied = words("w", 10);
    const result = strategy.compare(subject, [{ id: "doc", text: copied }]);
    expect(result.score).toBe(37.5);
    expect(result.matches).toEqual([{ documentId: "doc", ratio: 37.5 }]);
  });

  it("counts text shared with several documents once", () => {
    const subject = words("w", 20);
    const result = strategy.compare(subject, [
      { id: "one", text: words("w", 10) },
      { id: "two", text: words("w", 10) },
    ]);
    expect(result.score).toBe(37.5);
    expect(result.matches).toHaveLength(2);
  });

  it("is insensitive to formatting differences", () => {
    const result = strategy.compare("The quick brown fox jumps over the dog", [
      { id: "x", text: "THE QUICK, brown fox -- jumps over the dog." },
    ]);
    expect(result.score).toBe(100);
  });

  it("rejects documents with too little text", () => {
    expect(() => strategy.compare("too short", [])).toThrowError(
      "too little text",
    );
  });

  it("records algorithm metadata", () => {
    const result = strategy.compare(words("w", 10), []);
    expect(result.metadata).toMatchObject({
      algorithm: "local-shingle-containment",
      corpusSize: 0,
    });
  });
});
