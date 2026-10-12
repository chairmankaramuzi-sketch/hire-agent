import { ExtractionOutput, extractionOutputSchema } from './schema';
import { CriterionResult } from '@prisma/client';

export interface ExtractionRequest {
  documentBuffer: Buffer;
  mimeType: string;
  jobTitle?: string;
  criteriaSummary?: Array<{ name: string; description: string; kind: string }>;
}

export interface IExtractionProvider {
  name: string;
  extract(request: ExtractionRequest): Promise<ExtractionOutput>;
}

/**
 * Mock extraction provider for deterministic unit and integration testing.
 */
export class MockExtractionProvider implements IExtractionProvider {
  name = 'mock-ai-provider';

  constructor(
    private mockOutput?: Partial<ExtractionOutput>,
    private errorToThrow?: Error
  ) {}

  async extract(_request: ExtractionRequest): Promise<ExtractionOutput> {
    if (this.errorToThrow) {
      throw this.errorToThrow;
    }

    const defaultOutput: ExtractionOutput = {
      schemaVersion: 1,
      candidateName: 'Candidate Name',
      totalYearsExperience: 4.5,
      highestDegree: "Bachelor's in Computer Science",
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      facts: [
        {
          fieldKey: 'experience_years',
          normalizedValue: 4.5,
          evidenceText: 'Senior Software Engineer with 4.5 years building web applications.',
          pageNumber: 1,
          confidence: 0.95,
          evidenceStatus: CriterionResult.MET,
        },
        {
          fieldKey: 'degree',
          normalizedValue: 'BSc Computer Science',
          evidenceText: 'Graduated with BSc in Computer Science from University.',
          pageNumber: 2,
          confidence: 0.9,
          evidenceStatus: CriterionResult.MET,
        },
      ],
    };

    const combined = {
      ...defaultOutput,
      ...this.mockOutput,
    };

    // Strict validation ensuring provider adheres to schema contract
    return extractionOutputSchema.parse(combined);
  }
}
