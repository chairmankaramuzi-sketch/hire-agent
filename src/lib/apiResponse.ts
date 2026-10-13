import { NextResponse } from 'next/server';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
    details?: unknown;
  };
}

export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    requestId: string;
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    metrics?: any;
    [key: string]: unknown;
  };
}

export function generateRequestId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function apiSuccess<T>(data: T, meta?: Omit<NonNullable<ApiSuccessResponse<T>['meta']>, 'requestId'>, requestId = generateRequestId(), status = 200) {
  const payload: ApiSuccessResponse<T> = {
    data,
    meta: {
      requestId,
      ...meta,
    },
  };
  return NextResponse.json(payload, {
    status,
    headers: {
      'x-request-id': requestId,
    },
  });
}

export function apiError(
  code: string,
  message: string,
  status = 400,
  requestId = generateRequestId(),
  details?: unknown
) {
  const payload: ApiErrorResponse = {
    error: {
      code,
      message,
      requestId,
      details,
    },
  };
  return NextResponse.json(payload, {
    status,
    headers: {
      'x-request-id': requestId,
    },
  });
}
