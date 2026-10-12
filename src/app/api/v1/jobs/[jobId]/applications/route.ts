import { NextRequest } from 'next/server';
import { JobStatus, ApplicationStatus, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { storageService } from '@/lib/storage';
import { submitApplicationSchema, validateCvFile } from '@/lib/validators/applicationValidators';
import { recordAuditEvent } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  // 1. Verify Job exists and is open for applications
  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
  });

  if (!job) {
    return apiError('NOT_FOUND', 'Job not found', 404, requestId);
  }

  if (job.status !== JobStatus.PUBLISHED) {
    return apiError('FORBIDDEN', 'This job is not currently open for applications', 403, requestId);
  }

  // 2. Parse Multipart Form Data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('INVALID_FORM_DATA', 'Request must be multipart/form-data', 400, requestId);
  }

  const applicantName = formData.get('applicantName') as string | null;
  const applicantEmail = formData.get('applicantEmail') as string | null;
  const cvFile = formData.get('cv') as File | null;

  const parseResult = submitApplicationSchema.safeParse({
    applicantName,
    applicantEmail,
  });

  if (!parseResult.success) {
    return apiError('VALIDATION_ERROR', 'Invalid application details', 400, requestId, parseResult.error.format());
  }

  if (!cvFile || typeof cvFile !== 'object' || !('arrayBuffer' in cvFile)) {
    return apiError('MISSING_CV_FILE', 'CV file is required in field "cv"', 400, requestId);
  }

  // 3. Validate CV file limits and formats
  const fileValidation = validateCvFile({
    name: cvFile.name,
    type: cvFile.type,
    size: cvFile.size,
  });

  if (!fileValidation.valid) {
    return apiError('INVALID_FILE', fileValidation.error ?? 'Invalid file upload', 400, requestId);
  }

  const normalizedEmail = parseResult.data.applicantEmail.toLowerCase().trim();

  // 4. Check for duplicate application for this job by applicant email
  const existingApp = await prisma.application.findFirst({
    where: {
      jobId: params.jobId,
      applicantEmail: normalizedEmail,
      status: {
        notIn: [ApplicationStatus.WITHDRAWN],
      },
    },
  });

  if (existingApp) {
    return apiError(
      'DUPLICATE_APPLICATION',
      'An application has already been submitted for this job with this email address',
      409,
      requestId
    );
  }

  // 5. Store file privately in object storage abstraction
  const fileBuffer = Buffer.from(await cvFile.arrayBuffer());
  const storedMetadata = await storageService.uploadFile({
    filename: cvFile.name,
    mimeType: cvFile.type,
    buffer: fileBuffer,
  });

  // 6. Create Application and CV Asset in atomic transaction
  const created = await prisma.$transaction(async tx => {
    // If applicant is logged in, link user ID
    const applicantUserId =
      session && session.role === UserRole.APPLICANT ? session.userId : null;

    const application = await tx.application.create({
      data: {
        jobId: params.jobId,
        applicantUserId,
        applicantName: parseResult.data.applicantName.trim(),
        applicantEmail: normalizedEmail,
        status: ApplicationStatus.SUBMITTED,
        cvAsset: {
          create: {
            storageKey: storedMetadata.storageKey,
            originalFilename: storedMetadata.originalFilename,
            detectedMimeType: storedMetadata.detectedMimeType,
            sizeBytes: BigInt(storedMetadata.sizeBytes),
            sha256Hex: storedMetadata.sha256Hex,
            scanStatus: 'CLEAN',
          },
        },
      },
      include: {
        cvAsset: true,
      },
    });

    return application;
  });

  await recordAuditEvent({
    actorUserId: session?.userId ?? null,
    action: 'APPLICATION_SUBMITTED',
    resourceType: 'APPLICATION',
    resourceId: created.id,
    requestId,
    metadata: {
      jobId: params.jobId,
      applicantEmail: normalizedEmail,
      fileSize: storedMetadata.sizeBytes,
    },
  });

  return apiSuccess(
    {
      id: created.id,
      jobId: created.jobId,
      status: created.status,
      submittedAt: created.submittedAt,
      applicantName: created.applicantName,
    },
    undefined,
    requestId,
    201
  );
}
