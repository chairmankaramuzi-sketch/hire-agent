/**
 * Client-safe list of seeded staff accounts (no Prisma imports).
 * These accounts are recreated by "Reset System to Baseline" and "Restore Test Users".
 * TEST ENVIRONMENT ONLY – change or remove before going live with real staff.
 */
export interface StaffAccount {
  id: string;
  email: string;
  username: string;
  password: string;
  displayName: string;
  jobTitle: string;
  role: 'ADMIN' | 'HR';
}

export const staffAccounts: StaffAccount[] = [
  {
    id: 'usr-admin-001',
    email: 'kalamuzi@company.com',
    username: 'kalamuzi',
    password: 'Admin@2026',
    displayName: 'MR. KALAMUZI',
    jobTitle: 'Executive Administrator',
    role: 'ADMIN',
  },
  {
    id: 'usr-hr-001',
    email: 'nahurira@company.com',
    username: 'nahurira',
    password: 'HrDirector@2026',
    displayName: 'MR. NAHURIRA',
    jobTitle: 'HR Director',
    role: 'HR',
  },
  {
    id: 'usr-hr-002',
    email: 'rose@company.com',
    username: 'rose',
    password: 'Recruiter@2026',
    displayName: 'MRS. ROSE',
    jobTitle: 'Recruiter',
    role: 'HR',
  },
  {
    id: 'usr-hr-003',
    email: 'amara.okafor@company.com',
    username: 'amara.okafor',
    password: 'Talent@2026',
    displayName: 'Amara Okafor',
    jobTitle: 'Talent Acquisition Partner',
    role: 'HR',
  },
  {
    id: 'usr-hr-004',
    email: 'david.chen@company.com',
    username: 'david.chen',
    password: 'Hiring@2026',
    displayName: 'David Chen',
    jobTitle: 'Engineering Hiring Manager',
    role: 'HR',
  },
];

/** Shared password for seeded applicant accounts (no HR portal access). */
export const APPLICANT_SEED_PASSWORD = 'Applicant@2026';
