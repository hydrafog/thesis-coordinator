import { DomainError } from "@/core/errors/domain-error";

export interface SimilarityDocument {
  id: string;
  text: string;
}

export type SimilarityMatch = {
  documentId: string;
  ratio: number;
};

export type SimilarityMetadata = {
  algorithm: string;
  algorithmVersion: string;
  shingleSize: number;
  corpusSize: number;
};

export type SimilarityResult = {
  score: number;
  matches: SimilarityMatch[];
  metadata: SimilarityMetadata;
};

export interface SimilarityStrategy {
  readonly id: string;
  readonly version: string;
  compare(subject: string, corpus: SimilarityDocument[]): SimilarityResult;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .split(" ")
    .filter((token) => token !== "");
}

function hash53(value: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function shingles(tokens: string[], size: number): Set<number> {
  const hashes = new Set<number>();
  for (let start = 0; start + size <= tokens.length; start += 1) {
    hashes.add(hash53(tokens.slice(start, start + size).join(" ")));
  }
  return hashes;
}

const SHINGLE_SIZE = 5;
const MAX_REPORTED_MATCHES = 5;

function percent(value: number): number {
  return Math.round(value * 1000) / 10;
}

export class ShingleContainmentStrategy implements SimilarityStrategy {
  readonly id = "local-shingle-containment";
  readonly version = "1";

  compare(subject: string, corpus: SimilarityDocument[]): SimilarityResult {
    const subjectShingles = shingles(tokenize(subject), SHINGLE_SIZE);
    if (subjectShingles.size === 0) {
      throw new DomainError(
        "validation_failed",
        "The document has too little text to compare.",
      );
    }

    const covered = new Set<number>();
    const matches: SimilarityMatch[] = [];
    for (const document of corpus) {
      const documentShingles = shingles(tokenize(document.text), SHINGLE_SIZE);
      let shared = 0;
      for (const hash of subjectShingles) {
        if (documentShingles.has(hash)) {
          shared += 1;
          covered.add(hash);
        }
      }
      if (shared > 0) {
        matches.push({
          documentId: document.id,
          ratio: percent(shared / subjectShingles.size),
        });
      }
    }
    matches.sort((a, b) => b.ratio - a.ratio);

    return {
      score: percent(covered.size / subjectShingles.size),
      matches: matches.slice(0, MAX_REPORTED_MATCHES),
      metadata: {
        algorithm: this.id,
        algorithmVersion: this.version,
        shingleSize: SHINGLE_SIZE,
        corpusSize: corpus.length,
      },
    };
  }
}
