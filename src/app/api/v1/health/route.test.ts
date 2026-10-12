import { describe, it, expect, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/health/route';
import { redactSensitiveData, logger } from '@/lib/logger';
import { apiSuccess, apiError, generateRequestId } from '@/lib/apiResponse';
import { getEnv } from '@/lib/env';

describe('Phase 1 Foundation Tests', () => {
  describe('Environment Validation', () => {
    it('returns valid environment variables with default values', () => {
      const env = getEnv();
      expect(env.NODE_ENV).toBeDefined();
      expect(env.DATABASE_URL).toBeDefined();
      expect(env.STORAGE_BUCKET_NAME).toBe('cv-documents');
    });
  });

  describe('Logger Redaction', () => {
    it('redacts sensitive fields in objects', () => {
      const sensitivePayload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'supersecretpassword',
        token: 'bearer-xyz',
        cv_text: 'Confidential resume content',
        nested: {
          apiKey: 'secret-key-123',
          publicInfo: 'visible',
        },
      };

      const redacted = redactSensitiveData(sensitivePayload) as Record<string, unknown>;

      expect(redacted.name).toBe('Jane Doe');
      expect(redacted.email).toBe('[REDACTED]');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.token).toBe('[REDACTED]');
      expect(redacted.cv_text).toBe('[REDACTED]');
      expect((redacted.nested as Record<string, unknown>).apiKey).toBe('[REDACTED]');
      expect((redacted.nested as Record<string, unknown>).publicInfo).toBe('visible');
    });

    it('logs structured JSON without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      logger.info('Test info log', { key: 'value' }, 'req_123');
      expect(consoleSpy).toHaveBeenCalled();
      const loggedJson = JSON.parse(consoleSpy.mock.calls[0][0]);
      expect(loggedJson.level).toBe('info');
      expect(loggedJson.message).toBe('Test info log');
      expect(loggedJson.requestId).toBe('req_123');
      consoleSpy.mockRestore();
    });
  });

  describe('API Response Helpers', () => {
    it('creates standardized success response with requestId', async () => {
      const res = apiSuccess({ test: true }, undefined, 'test-req-id', 200);
      expect(res.status).toBe(200);
      expect(res.headers.get('x-request-id')).toBe('test-req-id');

      const body = await res.json();
      expect(body.data).toEqual({ test: true });
      expect(body.meta.requestId).toBe('test-req-id');
    });

    it('creates standardized error response', async () => {
      const res = apiError('INVALID_INPUT', 'Bad request', 400, 'err-req-id', { field: 'email' });
      expect(res.status).toBe(400);
      expect(res.headers.get('x-request-id')).toBe('err-req-id');

      const body = await res.json();
      expect(body.error.code).toBe('INVALID_INPUT');
      expect(body.error.message).toBe('Bad request');
      expect(body.error.requestId).toBe('err-req-id');
      expect(body.error.details).toEqual({ field: 'email' });
    });
  });

  describe('Health Route Handler', () => {
    it('returns healthy status with x-request-id header', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/health', {
        headers: {
          'x-request-id': 'custom-health-req',
        },
      });

      const response = await GET(req);
      expect(response.status).toBe(200);
      expect(response.headers.get('x-request-id')).toBe('custom-health-req');

      const json = await response.json();
      expect(json.data.status).toBe('healthy');
      expect(json.data.environment).toBeDefined();
      expect(json.meta.requestId).toBe('custom-health-req');
    });
  });
});
