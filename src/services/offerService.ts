import { OfferPackage, OfferStatus } from '@/types/offer';
import { notificationsService } from './notifications';
import { emailService } from './emailService';

const OFFERS_STORAGE_KEY = 'talentscreen_offers_v1';

// Initial pre-configured seed offer for instant demonstration
const INITIAL_OFFERS: Record<string, OfferPackage> = {
  'app-001': {
    offerId: 'off-001',
    applicationId: 'app-001',
    candidateName: 'Sarah Jenkins',
    candidateEmail: 'sarah.jenkins@example.com',
    jobTitle: 'Senior Full Stack Engineer',
    department: 'Engineering',
    annualSalary: 145000,
    currency: 'USD',
    signingBonus: 15000,
    equityShares: '10,000 ISO Shares (4-year vesting)',
    startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString().split('T')[0], // 3 weeks out
    probationMonths: 3,
    reportingManager: 'Jane Doe, VP of Engineering',
    workLocation: 'Hybrid (HQ Innovation Hub & 2 Days Remote)',
    benefits: [
      'Comprehensive Executive Health, Dental & Vision (100% employer paid)',
      '401(k) / Pension Match up to 6% with immediate vesting',
      '$3,500 Annual Continuous Learning & Tech Conference Stipend',
      '28 Days Annual Paid Time Off + 12 Public Holidays',
      'Top-tier Apple M3 Max Developer Rig + $1,000 Home Office Setup',
    ],
    customTerms:
      'This appointment is subject to standard background verification and authorization granted by Executive Administration.',
    status: 'ISSUED',
    issuedBy: 'MR. KALAMUZI (Executive Admin)',
    issuedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    contractToken: 'tok-sarah-jenkins-7782',
  },
};

type OfferListener = () => void;
const listeners: Set<OfferListener> = new Set();

function emitChange() {
  listeners.forEach((l) => {
    try {
      l();
    } catch {}
  });
}

function loadOffers(): Record<string, OfferPackage> {
  if (typeof window === 'undefined') return INITIAL_OFFERS;
  try {
    const raw = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(INITIAL_OFFERS));
  } catch {}
  return INITIAL_OFFERS;
}

function saveOffers(data: Record<string, OfferPackage>) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(data));
      emitChange();
    } catch {}
  }
}

export const offerService = {
  subscribe(listener: OfferListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getOfferByApplicationId(applicationId: string): OfferPackage | null {
    const all = loadOffers();
    return all[applicationId] || null;
  },

  getOfferByToken(token: string): OfferPackage | null {
    const all = loadOffers();
    const found = Object.values(all).find((o) => o.contractToken === token);
    return found || null;
  },

  createOrUpdateOffer(params: {
    applicationId: string;
    candidateName: string;
    candidateEmail?: string;
    jobTitle?: string;
    department?: string;
    annualSalary?: number;
    currency?: string;
    signingBonus?: number;
    equityShares?: string;
    startDate?: string;
    probationMonths?: number;
    reportingManager?: string;
    workLocation?: string;
    benefits?: string[];
    customTerms?: string;
    issuedBy?: string;
  }): OfferPackage {
    const all = loadOffers();
    const existing = all[params.applicationId];

    const slug = encodeURIComponent(params.candidateName.toLowerCase().replace(/\s+/g, '-'));
    const token = existing?.contractToken || `tok-${slug}-${params.applicationId.slice(-4)}`;

    const updated: OfferPackage = {
      offerId: existing?.offerId || `off-${Date.now()}`,
      applicationId: params.applicationId,
      candidateName: params.candidateName,
      candidateEmail: params.candidateEmail || existing?.candidateEmail || 'candidate@example.com',
      jobTitle: params.jobTitle || existing?.jobTitle || 'Senior Full Stack Engineer',
      department: params.department || existing?.department || 'Engineering',
      annualSalary: params.annualSalary ?? existing?.annualSalary ?? 145000,
      currency: params.currency || existing?.currency || 'USD',
      signingBonus: params.signingBonus ?? existing?.signingBonus ?? 10000,
      equityShares: params.equityShares || existing?.equityShares || '5,000 Options',
      startDate:
        params.startDate ||
        existing?.startDate ||
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split('T')[0],
      probationMonths: params.probationMonths ?? existing?.probationMonths ?? 3,
      reportingManager: params.reportingManager || existing?.reportingManager || 'Jane Doe, VP of Engineering',
      workLocation: params.workLocation || existing?.workLocation || 'Hybrid / HQ & Remote',
      benefits: params.benefits ||
        existing?.benefits || [
          'Full Medical, Dental & Vision Insurance Coverage',
          '401(k) / Retirement Pension Matching (5%)',
          'Annual $2,500 Learning & Training Allowance',
          '25 Days Paid Vacation + Statutory Bank Holidays',
        ],
      customTerms: params.customTerms || existing?.customTerms,
      status: existing?.status || 'DRAFT',
      issuedBy: params.issuedBy || existing?.issuedBy || 'MR. KALAMUZI (Executive Admin)',
      issuedAt: existing?.issuedAt || new Date().toISOString(),
      contractToken: token,
    };

    all[params.applicationId] = updated;
    saveOffers(all);
    return updated;
  },

  issueOffer(applicationId: string, issuedBy = 'MR. KALAMUZI (Executive Admin)'): OfferPackage {
    const all = loadOffers();
    let offer = all[applicationId];

    if (!offer) {
      offer = this.createOrUpdateOffer({
        applicationId,
        candidateName: 'Candidate',
        issuedBy,
      });
    }

    offer.status = 'ISSUED';
    offer.issuedBy = issuedBy;
    offer.issuedAt = new Date().toISOString();

    all[applicationId] = offer;
    saveOffers(all);

    // Notify Directors & Recruiters
    notificationsService.addNotification({
      type: 'OFFER_GENERATED',
      title: 'Official Offer Letter Issued',
      message: `${issuedBy} generated and issued the official appointment offer to ${offer.candidateName} for '${offer.jobTitle}' ($${offer.annualSalary.toLocaleString()}/yr).`,
      actorName: issuedBy,
      actorRole: 'ADMIN',
      targetId: applicationId,
      targetUrl: `/applications/${applicationId}`,
      priority: 'HIGH',
      metadata: {
        candidateName: offer.candidateName,
        jobTitle: offer.jobTitle,
        salary: offer.annualSalary,
      },
    });

    // Dispatch real email invite with signing link
    const signingLink = this.generateSigningLink(offer.contractToken);
    emailService.sendEmail({
      toEmail: offer.candidateEmail,
      toName: offer.candidateName,
      fromName: 'Executive Talent Acquisition',
      fromEmail: 'offers@company.com',
      subject: `Official Appointment Offer: ${offer.jobTitle} - TalentScreen`,
      body: `Dear ${offer.candidateName},\n\nWe are pleased to extend an official offer of employment for the position of ${offer.jobTitle}.\n\nPlease review your formal offer package and complete your digital signature via the secure candidate portal below:\n\n${signingLink}\n\nWarm regards,\n${issuedBy}`,
    }).catch(() => null);

    return offer;
  },

  signOffer(
    token: string,
    candidateSignature: string,
    candidateName: string,
    ipAddress = '127.0.0.1'
  ): OfferPackage | null {
    const all = loadOffers();
    const appKey = Object.keys(all).find((k) => all[k].contractToken === token);
    if (!appKey) return null;

    const offer = all[appKey];
    offer.status = 'SIGNED';
    offer.candidateSignature = candidateSignature;
    offer.signedAt = new Date().toISOString();
    offer.signatureIp = ipAddress;

    all[appKey] = offer;
    saveOffers(all);

    // Broadcast High-Priority Alert to All Executive Logins
    notificationsService.addNotification({
      type: 'OFFER_SIGNED',
      title: '🎉 Employment Offer Accepted & Digitally Signed!',
      message: `${candidateName} has officially accepted and digitally signed the offer for '${offer.jobTitle}'. Employment agreement sealed in executive archive.`,
      actorName: candidateName,
      actorRole: 'SYSTEM_AI',
      targetId: offer.applicationId,
      targetUrl: `/applications/${offer.applicationId}`,
      priority: 'URGENT',
      metadata: {
        candidateName,
        jobTitle: offer.jobTitle,
        signedAt: offer.signedAt,
      },
    });

    return offer;
  },

  generateSigningLink(token: string): string {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/offers/${token}`;
    }
    return `https://hire-agent-rk6w.vercel.app/offers/${token}`;
  },
};
