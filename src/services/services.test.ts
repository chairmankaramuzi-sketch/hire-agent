import { describe, it, expect, beforeEach } from 'vitest';
import { jobsService } from './jobs';
import { applicationsService } from './applications';

describe('Phase 1 Mock Services & Domain Logic', () => {
  beforeEach(() => {
    jobsService.resetState();
    applicationsService.resetState();
  });

  describe('jobsService', () => {
    it('returns seeded mock jobs with criteria', async () => {
      const jobs = await jobsService.getJobs();
      expect(jobs.length).toBeGreaterThan(0);
      const devJob = jobs.find((j) => j.id === 'job-dev-01');
      expect(devJob).toBeDefined();
      expect(devJob?.criteria.length).toBe(5);
    });

    it('validates that scored criteria must sum to exactly 100', async () => {
      await expect(
        jobsService.createJob({
          title: 'QA Engineer',
          department: 'Engineering',
          description: 'Automated test suite maintenance',
          status: 'DRAFT',
          criteria: [
            {
              name: 'Vitest experience',
              description: 'Unit testing knowledge',
              criterionType: 'SCORED',
              weight: 60, // sum is 60, not 100
            },
          ],
        })
      ).rejects.toThrow(/weights must sum to exactly 100%/);
    });

    it('creates a new job when criteria weights are valid', async () => {
      const created = await jobsService.createJob({
        title: 'Cloud DevOps Specialist',
        department: 'Infrastructure',
        description: 'Terraform and Kubernetes infrastructure',
        status: 'PUBLISHED',
        criteria: [
          {
            name: 'Years Experience',
            description: '3+ years Linux sysadmin',
            criterionType: 'MANDATORY',
          },
          {
            name: 'Docker / K8s',
            description: 'Container orchestration',
            criterionType: 'SCORED',
            weight: 60,
          },
          {
            name: 'Terraform',
            description: 'IaC provisioning',
            criterionType: 'SCORED',
            weight: 40,
          },
        ],
      });

      expect(created.id).toBeDefined();
      expect(created.criteria.length).toBe(3);
      const fetched = await jobsService.getJobById(created.id);
      expect(fetched?.title).toBe('Cloud DevOps Specialist');
    });
  });

  describe('applicationsService', () => {
    it('returns applications with distinct edge cases', async () => {
      const res = await applicationsService.getApplications();
      expect(res.total).toBe(5);

      // Verify Eligible high scorer
      const eligible = res.items.find((a) => a.id === 'app-001');
      expect(eligible?.screeningRun?.mandatoryStatus).toBe('MEETS');
      expect(eligible?.screeningRun?.totalScore).toBe(92);

      // Verify Ineligible high scorer (fails mandatory)
      const ineligible = res.items.find((a) => a.id === 'app-002');
      expect(ineligible?.screeningRun?.mandatoryStatus).toBe('DOES_NOT_MEET');
      expect(ineligible?.screeningRun?.overallStatus).toBe('INELIGIBLE');
      expect(ineligible?.screeningRun?.totalScore).toBe(84); // High score must not override mandatory failure

      // Verify Uncertain / Needs Review case
      const uncertain = res.items.find((a) => a.id === 'app-003');
      expect(uncertain?.screeningRun?.mandatoryStatus).toBe('UNKNOWN');
      expect(uncertain?.status).toBe('NEEDS_REVIEW');

      // Verify Failed Processing case
      const failed = res.items.find((a) => a.id === 'app-004');
      expect(failed?.processingStatus).toBe('FAILED');
      expect(failed?.processingError).toBeDefined();
    });

    it('requires a reason when recording an HR review decision', async () => {
      await expect(
        applicationsService.addReviewDecision({
          applicationId: 'app-005',
          reviewerId: 'usr-hr-001',
          reviewerName: 'Sarah Jenkins',
          decision: 'SHORTLIST',
          reason: '   ', // Blank reason
        })
      ).rejects.toThrow(/reason is required/i);
    });

    it('successfully records an HR decision with an audit entry', async () => {
      const updated = await applicationsService.addReviewDecision({
        applicationId: 'app-005',
        reviewerId: 'usr-hr-001',
        reviewerName: 'Sarah Jenkins',
        decision: 'SHORTLIST',
        reason: 'Strong healthcare experience and verified degree.',
      });

      expect(updated.status).toBe('SHORTLISTED');
      expect(updated.reviewDecisions[0].reason).toContain('Strong healthcare experience');
    });

    it('allows retrying failed CV processing tasks idempotently', async () => {
      const recovered = await applicationsService.retryProcessing('app-004');
      expect(recovered.processingStatus).toBe('COMPLETED');
      expect(recovered.processingError).toBeUndefined();
    });
  });
});
