export type OfferStatus = 'DRAFT' | 'ISSUED' | 'SIGNED' | 'DECLINED';

export interface OfferPackage {
  offerId: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  department: string;
  annualSalary: number;
  currency: string;
  signingBonus: number;
  equityShares?: string;
  startDate: string;
  probationMonths: number;
  reportingManager: string;
  workLocation: string;
  benefits: string[];
  customTerms?: string;
  status: OfferStatus;
  issuedBy: string;
  issuedAt: string;
  candidateSignature?: string;
  signedAt?: string;
  signatureIp?: string;
  contractToken: string;
}
