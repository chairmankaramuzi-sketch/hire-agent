import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole, canAccessApplication } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  if (!session) {
    return apiError('UNAUTHORIZED', 'Authentication required', 401, requestId);
  }

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    include: {
      job: {
        select: { id: true, title: true, department: true, status: true },
      },
      cvAsset: {
        select: {
          id: true,
          originalFilename: true,
          detectedMimeType: true,
          sizeBytes: true,
          scanStatus: true,
          createdAt: true,
        },
      },
      screenings: {
        orderBy: { criteriaVersion: 'desc' },
      },
      decisions: {
        orderBy: { createdAt: 'desc' },
        include: {
          decider: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: { id: true, displayName: true, email: true },
          },
        },
      },
    },
  });

  if (!application) {
    return apiError('NOT_FOUND', 'Application not found', 404, requestId);
  }

  if (!canAccessApplication(session, application)) {
    return apiError('FORBIDDEN', 'Access denied to application details', 403, requestId);
  }

  // If requester is APPLICANT, return sanitized self-service view without internal HR notes/scoring breakdowns
  if (session.role === UserRole.APPLICANT) {
    return apiSuccess(
      {
        id: application.id,
        jobId: application.jobId,
        jobTitle: application.job.title,
        applicantName: application.applicantName,
        status: application.status,
        submittedAt: application.submittedAt,
        withdrawnAt: application.withdrawnAt,
      },
      undefined,
      requestId
    );
  }

  // Return full HR detail
  return apiSuccess(
    {
      ...application,
      cvAsset: application.cvAsset
        ? {
            ...application.cvAsset,
            sizeBytes: application.cvAsset.sizeBytes.toString(),
          }
        : null,
    },
    undefined,
    requestId
  );
}
