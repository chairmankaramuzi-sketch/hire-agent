import { GoogleGenAI } from '@google/genai';
import { ExtractionOutput, extractionOutputSchema } from './schema';
import { CriterionResult } from '@prisma/client';
import { getEnv } from '@/lib/env';
import { logger } from '@/lib/logger';

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
 * Live Google Gemini extraction provider using official @google/genai SDK.
 */
export class GeminiExtractionProvider implements IExtractionProvider {
  name = 'google-gemini';
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey ?? getEnv().AI_API_KEY;
    if (!key) {
      throw new Error('AI_API_KEY is not configured for Gemini extraction provider');
    }
    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async extract(request: ExtractionRequest): Promise<ExtractionOutput> {
    const env = getEnv();
    const model = env.AI_MODEL_NAME || 'gemini-1.5-flash';

    const criteriaText = request.criteriaSummary
      ? request.criteriaSummary.map(c => `- ${c.name} (${c.kind}): ${c.description}`).join('\n')
      : 'Extract all relevant professional skills, degrees, and experience.';

    const systemPrompt = `You are an expert recruitment CV parsing system.
Extract objective, factual information from the candidate's CV relevant to the target job position.
Target Job: ${request.jobTitle ?? 'General Position'}

Job Criteria:
${criteriaText}

Rules:
1. Extract candidateName, totalYearsExperience (number), highestDegree, and skills list.
2. For each relevant job requirement, extract a structured fact with:
   - fieldKey: the name of the requirement/skill
   - normalizedValue: parsed numerical or text value
   - evidenceText: exact quote/sentence from the resume proving this
   - pageNumber: integer if detectable
   - confidence: number between 0 and 1
   - evidenceStatus: 'MET' if clearly present, 'NOT_MET' if explicitly missing, or 'UNKNOWN' if ambiguous or unmentioned.
3. NEVER infer or output protected demographic characteristics (race, gender, age, religion, ethnicity, photos).
4. Output strict JSON matching the requested structure only.`;

    const base64Data = request.documentBuffer.toString('base64');

    const response = await this.ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: request.mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() ?? '{}';

    try {
      const parsedJson = JSON.parse(responseText);
      return extractionOutputSchema.parse(parsedJson);
    } catch (err) {
      logger.error('Gemini extraction failed schema validation', err, {
        model,
        responsePreview: responseText.slice(0, 200),
      });
      throw new Error(`Failed to parse structured CV output: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  }
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

    return extractionOutputSchema.parse(combined);
  }
}
