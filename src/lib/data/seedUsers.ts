import { UserRole } from '@prisma/client';
import { sample30Candidates } from './sampleCandidates';
import { staffAccounts, APPLICANT_SEED_PASSWORD } from './staffAccounts';

export { APPLICANT_SEED_PASSWORD };

export interface SeedUser {
  id: string;
  email: string;
  username: string;
  password: string;
  displayName: string;
  jobTitle: string;
  role: UserRole;
}

/** Staff accounts with HR portal access. */
export const seedStaffUsers: SeedUser[] = staffAccounts.map(s => ({
  ...s,
  role: s.role === 'ADMIN' ? UserRole.ADMIN : UserRole.HR,
}));

/** One applicant account per candidate in the 30-CV dossier, linked to their application. */
export const seedApplicantUsers: SeedUser[] = sample30Candidates.map((c, idx) => ({
  id: `usr-app-${String(idx + 1).padStart(3, '0')}`,
  email: c.email.toLowerCase(),
  username: c.email.toLowerCase().split('@')[0],
  password: APPLICANT_SEED_PASSWORD,
  displayName: c.name,
  jobTitle: c.title,
  role: UserRole.APPLICANT,
}));

export const allSeedUsers: SeedUser[] = [...seedStaffUsers, ...seedApplicantUsers];

export const testCredentials = staffAccounts;
