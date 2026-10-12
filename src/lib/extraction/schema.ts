import { z } from 'zod';
import { CriterionResult } from '@prisma/client';

export const extractedFactSchema = z.object({
  fieldKey: z.string().min(1),
  normalizedValue: z.unknown().optional().nullable(),
  evidenceText: z.string().optional().nullable(),
  pageNumber: z.number().int().positive().optional().nullable(),
  confidence: z.number().min(0).max(1).optional().nullable(),
  evidenceStatus: z.nativeEnum(CriterionResult).default(CriterionResult.UNKNOWN),
});

export const extractionOutputSchema = z.object({
  schemaVersion: z.number().int().default(1),
  candidateName: z.string().optional().nullable(),
  totalYearsExperience: z.number().min(0).optional().nullable(),
  highestDegree: z.string().optional().nullable(),
  skills: z.array(z.string()).default([]),
  facts: z.array(extractedFactSchema).default([]),
});

export type ExtractedFact = z.infer<typeof extractedFactSchema>;
export type ExtractionOutput = z.infer<typeof extractionOutputSchema>;
