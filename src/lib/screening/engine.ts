import { CriterionKind, CriterionResult } from '@prisma/client';

export interface CriterionEvaluationInput {
  id: string;
  name: string;
  description: string;
  kind: CriterionKind;
  weight: number | null;
  configuration?: Record<string, unknown>;
}

export interface FactEvidenceInput {
  fieldKey: string;
  normalizedValue?: unknown;
  evidenceText?: string | null;
  confidence?: number | null;
  evidenceStatus?: CriterionResult;
  scoreFactor?: number | null;
}

export interface CriterionResultDetail {
  criterionId: string;
  criterionName: string;
  kind: CriterionKind;
  weight: number | null;
  status: CriterionResult;
  pointsAwarded: number;
  maxPoints: number;
  evidence: string | null;
  notes: string;
}

export interface ScreeningEvaluationResult {
  criteriaVersion: number;
  outcome: 'RECOMMENDED' | 'NOT_RECOMMENDED' | 'NEEDS_MANUAL_REVIEW';
  mandatoryPassed: boolean;
  hasUnknownMandatory: boolean;
  totalScore: number;
  maxScore: number;
  scorePercentage: number;
  breakdown: CriterionResultDetail[];
}

/**
 * Pure, deterministic screening engine.
 * Given criteria and evidence, computes explainable results without non-deterministic LLM calls.
 * Never scores protected/demographic characteristics.
 * Never auto-rejects candidates; produces recommendations and routes UNKNOWNs to manual review.
 */
export function evaluateScreening(
  criteriaVersion: number,
  criteria: CriterionEvaluationInput[],
  evidenceList: FactEvidenceInput[]
): ScreeningEvaluationResult {
  const breakdown: CriterionResultDetail[] = [];
  let totalPoints = 0;
  let maxPoints = 0;
  let mandatoryPassed = true;
  let hasUnknownMandatory = false;

  // Build lookup index for evidence
  const evidenceMap = new Map<string, FactEvidenceInput>();
  for (const ev of evidenceList) {
    evidenceMap.set(ev.fieldKey.toLowerCase(), ev);
  }

  for (const criterion of criteria) {
    const key = criterion.name.toLowerCase();
    // Match evidence by fieldKey, substring, or configuration field
    const matchedEvidence =
      evidenceMap.get(key) ||
      Array.from(evidenceMap.values()).find(
        e => e.fieldKey.toLowerCase().includes(key) || key.includes(e.fieldKey.toLowerCase())
      );

    let status: CriterionResult = CriterionResult.UNKNOWN;
    let pointsAwarded = 0;
    const criterionMaxPoints = criterion.kind === CriterionKind.WEIGHTED ? Number(criterion.weight ?? 0) : 0;
    let notes = '';

    if (!matchedEvidence) {
      status = CriterionResult.UNKNOWN;
      notes = 'No direct evidence found in extracted CV facts.';
    } else if (matchedEvidence.evidenceStatus === CriterionResult.MET) {
      status = CriterionResult.MET;
      const factor = typeof matchedEvidence.scoreFactor === 'number'
        ? Math.min(1.0, Math.max(0.05, matchedEvidence.scoreFactor))
        : 1.0;
      pointsAwarded = Number((criterionMaxPoints * factor).toFixed(1));
      notes = factor < 1.0
        ? `Evidence confirms requirement partially met (${Math.round(factor * 100)}% match).`
        : 'Evidence confirms requirement fully met.';
    } else if (matchedEvidence.evidenceStatus === CriterionResult.NOT_MET) {
      status = CriterionResult.NOT_MET;
      const factor = typeof matchedEvidence.scoreFactor === 'number'
        ? Math.min(0.35, Math.max(0.0, matchedEvidence.scoreFactor))
        : 0;
      pointsAwarded = Number((criterionMaxPoints * factor).toFixed(1));
      notes = factor > 0
        ? `Evidence indicates requirement was mostly not met (${Math.round(factor * 100)}% partial credit).`
        : 'Evidence indicates requirement was not met.';
    } else {
      status = CriterionResult.UNKNOWN;
      const factor = typeof matchedEvidence.scoreFactor === 'number'
        ? Math.min(0.65, Math.max(0.2, matchedEvidence.scoreFactor))
        : 0;
      pointsAwarded = Number((criterionMaxPoints * factor).toFixed(1));
      notes = 'Evidence is ambiguous or requires HR human review.';
    }

    if (criterion.kind === CriterionKind.MANDATORY) {
      if (status === CriterionResult.NOT_MET) {
        mandatoryPassed = false;
      } else if (status === CriterionResult.UNKNOWN) {
        hasUnknownMandatory = true;
      }
    } else if (criterion.kind === CriterionKind.WEIGHTED) {
      totalPoints += pointsAwarded;
      maxPoints += criterionMaxPoints;
    }

    breakdown.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      kind: criterion.kind,
      weight: criterion.weight,
      status,
      pointsAwarded,
      maxPoints: criterionMaxPoints,
      evidence: matchedEvidence?.evidenceText ?? null,
      notes,
    });
  }

  const scorePercentage = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 100;

  let outcome: ScreeningEvaluationResult['outcome'];
  if (hasUnknownMandatory) {
    outcome = 'NEEDS_MANUAL_REVIEW';
  } else if (!mandatoryPassed) {
    outcome = 'NOT_RECOMMENDED';
  } else if (scorePercentage >= 70) {
    outcome = 'RECOMMENDED';
  } else {
    outcome = 'NOT_RECOMMENDED';
  }

  return {
    criteriaVersion,
    outcome,
    mandatoryPassed,
    hasUnknownMandatory,
    totalScore: Number(totalPoints.toFixed(2)),
    maxScore: Number(maxPoints.toFixed(2)),
    scorePercentage: Number(scorePercentage.toFixed(2)),
    breakdown,
  };
}
