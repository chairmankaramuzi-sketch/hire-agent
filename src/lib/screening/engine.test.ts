import { describe, it, expect } from 'vitest';
import { evaluateScreening, CriterionEvaluationInput, FactEvidenceInput } from '@/lib/screening/engine';
import { CriterionKind, CriterionResult } from '@prisma/client';

describe('Phase 6 Deterministic Screening Engine Tests', () => {
  const criteria: CriterionEvaluationInput[] = [
    {
      id: 'c-mand-1',
      name: 'Degree in Computer Science',
      description: 'Must have BS or equivalent in Computer Science',
      kind: CriterionKind.MANDATORY,
      weight: null,
    },
    {
      id: 'c-weight-1',
      name: 'Years Experience',
      description: 'At least 3 years required',
      kind: CriterionKind.WEIGHTED,
      weight: 60,
    },
    {
      id: 'c-weight-2',
      name: 'React Skills',
      description: 'Demonstrated experience with React framework',
      kind: CriterionKind.WEIGHTED,
      weight: 40,
    },
  ];

  it('produces identical score and breakdown for identical inputs (determinism)', () => {
    const evidence: FactEvidenceInput[] = [
      {
        fieldKey: 'Degree in Computer Science',
        evidenceText: 'Holds a BSc in Computer Science',
        evidenceStatus: CriterionResult.MET,
      },
      {
        fieldKey: 'Years Experience',
        evidenceText: 'Has 4 years of engineering experience',
        evidenceStatus: CriterionResult.MET,
      },
      {
        fieldKey: 'React Skills',
        evidenceText: 'Extensive production React development',
        evidenceStatus: CriterionResult.MET,
      },
    ];

    const run1 = evaluateScreening(1, criteria, evidence);
    const run2 = evaluateScreening(1, criteria, evidence);

    expect(run1).toEqual(run2);
    expect(run1.outcome).toBe('RECOMMENDED');
    expect(run1.totalScore).toBe(100);
    expect(run1.scorePercentage).toBe(100);
    expect(run1.mandatoryPassed).toBe(true);
  });

  it('routes to NEEDS_MANUAL_REVIEW when a mandatory criterion has UNKNOWN status', () => {
    const evidence: FactEvidenceInput[] = [
      {
        fieldKey: 'Degree in Computer Science',
        evidenceText: 'Listed college coursework, degree completion unclear',
        evidenceStatus: CriterionResult.UNKNOWN,
      },
      {
        fieldKey: 'Years Experience',
        evidenceStatus: CriterionResult.MET,
      },
      {
        fieldKey: 'React Skills',
        evidenceStatus: CriterionResult.MET,
      },
    ];

    const result = evaluateScreening(1, criteria, evidence);

    expect(result.outcome).toBe('NEEDS_MANUAL_REVIEW');
    expect(result.hasUnknownMandatory).toBe(true);
    const degreeCheck = result.breakdown.find(b => b.criterionId === 'c-mand-1');
    expect(degreeCheck?.status).toBe(CriterionResult.UNKNOWN);
  });

  it('marks NOT_RECOMMENDED when mandatory criterion is NOT_MET without rejecting candidate outright', () => {
    const evidence: FactEvidenceInput[] = [
      {
        fieldKey: 'Degree in Computer Science',
        evidenceText: 'High school diploma only, no university degree',
        evidenceStatus: CriterionResult.NOT_MET,
      },
      {
        fieldKey: 'Years Experience',
        evidenceStatus: CriterionResult.MET,
      },
      {
        fieldKey: 'React Skills',
        evidenceStatus: CriterionResult.MET,
      },
    ];

    const result = evaluateScreening(1, criteria, evidence);

    expect(result.outcome).toBe('NOT_RECOMMENDED');
    expect(result.mandatoryPassed).toBe(false);
    expect(result.hasUnknownMandatory).toBe(false);
  });

  it('correctly calculates partial weighted scores', () => {
    const evidence: FactEvidenceInput[] = [
      {
        fieldKey: 'Degree in Computer Science',
        evidenceStatus: CriterionResult.MET,
      },
      {
        fieldKey: 'Years Experience',
        evidenceStatus: CriterionResult.MET, // 60 points
      },
      {
        fieldKey: 'React Skills',
        evidenceStatus: CriterionResult.NOT_MET, // 0 points out of 40
      },
    ];

    const result = evaluateScreening(1, criteria, evidence);

    expect(result.mandatoryPassed).toBe(true);
    expect(result.totalScore).toBe(60);
    expect(result.maxScore).toBe(100);
    expect(result.scorePercentage).toBe(60);
    expect(result.outcome).toBe('NOT_RECOMMENDED'); // below 70% threshold
  });
});
