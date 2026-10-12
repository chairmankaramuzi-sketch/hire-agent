import { z } from 'zod';
import { CriterionKind } from '@prisma/client';

export const criterionInputSchema = z.object({
  name: z.string().min(1, 'Criterion name is required').max(150),
  description: z.string().min(1, 'Criterion description is required'),
  kind: z.nativeEnum(CriterionKind),
  weight: z.number().min(0).max(100).optional().nullable(),
  configuration: z.record(z.unknown()).optional().default({}),
}).refine(
  data => {
    if (data.kind === CriterionKind.WEIGHTED) {
      return typeof data.weight === 'number' && data.weight > 0;
    }
    return true;
  },
  {
    message: 'Weighted criteria must have a positive weight',
    path: ['weight'],
  }
);

export const createJobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  department: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  criteria: z.array(criterionInputSchema).optional().default([]),
}).refine(
  data => {
    const weighted = data.criteria.filter(c => c.kind === CriterionKind.WEIGHTED);
    if (weighted.length > 0) {
      const sum = weighted.reduce((acc, c) => acc + (c.weight ?? 0), 0);
      return Math.abs(sum - 100) < 0.01;
    }
    return true;
  },
  {
    message: 'Sum of weighted criteria weights must equal 100',
    path: ['criteria'],
  }
);

export const updateJobSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  department: z.string().max(100).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  criteria: z.array(criterionInputSchema).optional(),
}).refine(
  data => {
    if (!data.criteria) return true;
    const weighted = data.criteria.filter(c => c.kind === CriterionKind.WEIGHTED);
    if (weighted.length > 0) {
      const sum = weighted.reduce((acc, c) => acc + (c.weight ?? 0), 0);
      return Math.abs(sum - 100) < 0.01;
    }
    return true;
  },
  {
    message: 'Sum of weighted criteria weights must equal 100',
    path: ['criteria'],
  }
);

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']).optional(),
  department: z.string().optional(),
});
