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
    email: 'kalamuzi.hire@admin.com',
    username: 'kalamuzi.hire@admin.com',
    password: 'chairman175',
    displayName: 'ADMIN',
    jobTitle: 'Executive Administrator',
    role: 'ADMIN',
  },
  {
    id: 'usr-hr-001',
    email: 'nahurira.hire@hrdirector.com',
    username: 'nahurira.hire@hrdirector.com',
    password: 'nahurira009',
    displayName: 'HR. DIRECTOR',
    jobTitle: 'HR Director',
    role: 'HR',
  },
  {
    id: 'usr-hr-002',
    email: 'rose.hire@recruiter.com',
    username: 'rose.hire@recruiter.com',
    password: 'Recruiter@2026',
    displayName: 'RECRUITER',
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
