import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/auth';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { addNoteSchema } from '@/lib/validators/reviewValidators';

export async function POST(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  const requestId = request.headers.get('x-request-id') ?? generateRequestId();
  const session = await getSession(request);

  const authError = requireRole([UserRole.HR, UserRole.ADMIN], session, requestId);
  if (authError) return authError;

  const application = await prisma.application.findUnique({
    where: { id: params.applicationId },
  });

  if (!application) {
    return apiError('NOT_FOUND', 'Application not found', 404, requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('INVALID_JSON', 'Malformed JSON body', 400, requestId);
  }

  const parseResult = addNoteSchema.safeParse(body);
  if (!parseResult.success) {
    return apiError('VALIDATION_ERROR', 'Valid note body is required', 400, requestId, parseResult.error.format());
  }

  // Ensure author user exists
  await prisma.appUser.upsert({
    where: { id: session!.userId },
    update: {},
    create: {
      id: session!.userId,
      email: session!.email,
      displayName: session!.displayName,
      role: session!.role,
    },
  });

  const note = await prisma.reviewNote.create({
    data: {
      applicationId: params.applicationId,
      authorId: session!.userId,
      body: parseResult.data.body.trim(),
    },
    include: {
      author: {
        select: { id: true, displayName: true, email: true },
      },
    },
  });

  return apiSuccess(note, undefined, requestId, 201);
}
