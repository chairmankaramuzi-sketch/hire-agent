import { z } from 'zod';
import { DecisionKind } from '@prisma/client';

export const hrDecisionSchema = z.object({
  decision: z.nativeEnum(DecisionKind),
  reason: z.string().min(5, 'A clear reason of at least 5 characters is required for HR decisions').max(1000),
});

export const addNoteSchema = z.object({
  body: z.string().min(2, 'Note body must be at least 2 characters').max(2000),
});

export const listJobApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum([
    'SUBMITTED',
    'PROCESSING',
    'READY_FOR_REVIEW',
    'NEEDS_MANUAL_REVIEW',
    'SHORTLISTED',
    'REJECTED',
    'WITHDRAWN',
  ]).optional(),
});
