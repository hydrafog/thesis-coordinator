import { extractPdfText } from "@/core/documents/pdf-text";
import { getObjectBuffer } from "@/core/storage/minio";
import { submissionRepository } from "@/features/submissions/data/submission-repository";
import {
  ShingleContainmentStrategy,
  type SimilarityDocument,
  type SimilarityResult,
  type SimilarityStrategy,
} from "../domain/similarity";

export interface VersionText {
  id: string;
  fileKey: string;
  extractedText: string | null;
}

export class SimilarityClient {
  constructor(private readonly strategy: SimilarityStrategy) {}

  get provider(): string {
    return this.strategy.id;
  }

  async textOf(version: VersionText): Promise<string> {
    if (version.extractedText !== null) {
      return version.extractedText;
    }
    const text = await extractPdfText(await getObjectBuffer(version.fileKey));
    await submissionRepository.saveExtractedText(version.id, text);
    return text;
  }

  compare(subject: string, corpus: SimilarityDocument[]): SimilarityResult {
    return this.strategy.compare(subject, corpus);
  }
}

export const similarityClient = new SimilarityClient(
  new ShingleContainmentStrategy(),
);
