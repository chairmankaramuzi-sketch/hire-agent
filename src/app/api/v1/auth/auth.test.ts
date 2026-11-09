import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as resetHandler } from '@/app/api/v1/system/reset/route';
import { POST as purgeAppsHandler } from '@/app/api/v1/system/purge-applications/route';
import { POST as seedBatchHandler } from '@/app/api/v1/system/seed-batch/route';
import { POST as loginHandler } from '@/app/api/v1/auth/login/route';
import { POST as logoutHandler } from '@/app/api/v1/auth/logout/route';

describe('System Danger Zone & Authentication APIs', () => {
  it('POST /api/v1/auth/login logs in valid demo user and sets session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hr@company.com', password: 'HrDirector@2026' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(['hr@company.com', 'nahurira@company.com', 'nahurira.hire@hrdirector.com']).toContain(json.data.user.email);
    expect(json.data.token).toBeDefined();

    // Check cookie
    const cookies = res.cookies.get('ts_session');
    expect(cookies).toBeDefined();
  });

  it('POST /api/v1/auth/login logs in using username instead of email', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'jane.doe', password: 'HrDirector@2026' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(['hr@company.com', 'nahurira@company.com', 'nahurira.hire@hrdirector.com']).toContain(json.data.user.email);
  });

  it('POST /api/v1/auth/login rejects incorrect password', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hr@company.com', password: 'WrongPassword!99' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/auth/login rejects empty password', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hr@company.com', password: '' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(400);
  });

  it('POST /api/v1/auth/login logs in ADMIN with kalamuzi.hire@admin.com and chairman175', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kalamuzi.hire@admin.com', password: 'chairman175' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.role).toBe('ADMIN');
  });

  it('POST /api/v1/auth/login logs in HR. DIRECTOR with nahurira.hire@hrdirector.com and nahurira009', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nahurira.hire@hrdirector.com', password: 'nahurira009' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.role).toBe('HR');
  });

  it('POST /api/v1/auth/login logs in RECRUITER with rose.hire@recruiter.com and Recruiter@2026', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rose.hire@recruiter.com', password: 'Recruiter@2026' }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.user.role).toBe('HR');
  });

  it('POST /api/v1/auth/logout clears session cookie', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/auth/logout', {
      method: 'POST',
    });

    const res = await logoutHandler(req);
    expect(res.status).toBe(200);
    const cookie = res.cookies.get('ts_session');
    expect(cookie?.value).toBe('');
  });
});
