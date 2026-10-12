import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, canAccessApplication } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';

export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
    select: {
      id: true,
      jobId: true,
      applicantUserId: true,
      applicantEmail: true,
      status: true,
      submittedAt: true,
      updatedAt: true,
    },
  });

  if (!application) {
    return apiError('NOT_FOUND', 'Application not found', 404, requestId);
  }

  // Access check: only authorized applicant (owner) or HR/Admin
  if (session && !canAccessApplication(session, application)) {
    return apiError('FORBIDDEN', 'Access denied to application status', 403, requestId);
  }

  return apiSuccess(
    {
      applicationId: application.id,
      jobId: application.jobId,
      status: application.status,
      submittedAt: application.submittedAt,
      updatedAt: application.updatedAt,
    },
    undefined,
    requestId
  );
}
