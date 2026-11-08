import { SystemNotification, NotificationType } from '@/types/notification';

const STORAGE_KEY = 'talentscreen_notifications_v1';
const LAST_LOGIN_SEEN_KEY = 'talentscreen_last_login_seen_';

// Initial realistic baseline activity notifications
const BASELINE_NOTIFICATIONS: SystemNotification[] = [
  {
    id: 'notif-base-1',
    type: 'VACANCY_PUBLISHED',
    title: 'New Vacancy Published by HR',
    message: "HR Director published 'Senior Full Stack Engineer' in the Engineering department. Scoring profile and criteria v1 activated.",
    actorName: 'MR. NAHURIRA (HR Director)',
    actorRole: 'HR',
    targetId: 'job-dev-01',
    targetUrl: '/jobs/job-dev-01',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    readBy: [],
    priority: 'HIGH',
    metadata: {
      jobTitle: 'Senior Full Stack Engineer',
      department: 'Engineering',
    },
  },
  {
    id: 'notif-base-2',
    type: 'CANDIDATE_SHORTLISTED',
    title: 'Candidates Shortlisted for Technical Interview',
    message: 'HR shortlisted candidate Sarah Jenkins (Match: 94%) and Marcus Vance (Match: 88%) for Senior Full Stack Engineer.',
    actorName: 'MR. NAHURIRA (HR Director)',
    actorRole: 'HR',
    targetUrl: '/applications?queue=ELIGIBLE',
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString(), // 1 hr 15 mins ago
    readBy: [],
    priority: 'HIGH',
    metadata: {
      candidateName: 'Sarah Jenkins, Marcus Vance',
      score: 94,
    },
  },
  {
    id: 'notif-base-3',
    type: 'BATCH_CV_SCREENED',
    title: 'Batch CV Screening Completed (18 Resumes)',
    message: 'Batch CV Dropzone completed AI parsing and deterministic scoring on 18 resumes in 42 seconds. 12 Qualified, 4 Borderline, 2 Ineligible.',
    actorName: 'AI Screening Engine',
    actorRole: 'SYSTEM_AI',
    targetUrl: '/applications',
    createdAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(), // ~2 hrs ago
    readBy: [],
    priority: 'NORMAL',
    metadata: {
      candidateCount: 18,
    },
  },
  {
    id: 'notif-base-4',
    type: 'ANOMALY_FLAGGED',
    title: 'Anomaly Detected in Candidate CV',
    message: 'AI screening flagged a conflicting 14-month date overlap and heavy keyword repetition on candidate resume #104.',
    actorName: 'Red Flag Scanner',
    actorRole: 'SYSTEM_AI',
    targetUrl: '/applications?queue=NEEDS_REVIEW',
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hrs ago
    readBy: [],
    priority: 'URGENT',
    metadata: {
      reason: 'Conflicting employment dates (>12 months overlap)',
    },
  },
];

let inMemoryNotifications: SystemNotification[] = [...BASELINE_NOTIFICATIONS];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {}
  });
}

function loadPersistedNotifications(): SystemNotification[] {
  if (typeof window === 'undefined') return inMemoryNotifications;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryNotifications = parsed;
        return parsed;
      }
    }
    // If not set yet, initialize baseline
    localStorage.setItem(STORAGE_KEY, JSON.stringify(BASELINE_NOTIFICATIONS));
  } catch {}
  return inMemoryNotifications;
}

function saveNotifications(notifications: SystemNotification[]) {
  inMemoryNotifications = notifications;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {}
  }
  notifyListeners();
}

export const notificationsService = {
  subscribe(callback: () => void): () => void {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },

  getNotifications(): SystemNotification[] {
    return loadPersistedNotifications();
  },

  getUnreadCount(userId: string): number {
    const list = loadPersistedNotifications();
    return list.filter((n) => !n.readBy.includes(userId)).length;
  },

  markAsRead(notificationId: string, userId: string) {
    const list = loadPersistedNotifications();
    const updated = list.map((n) => {
      if (n.id === notificationId && !n.readBy.includes(userId)) {
        return { ...n, readBy: [...n.readBy, userId] };
      }
      return n;
    });
    saveNotifications(updated);
  },

  markAllAsRead(userId: string) {
    const list = loadPersistedNotifications();
    const updated = list.map((n) => ({
      ...n,
      readBy: n.readBy.includes(userId) ? n.readBy : [...n.readBy, userId],
    }));
    saveNotifications(updated);
  },

  addNotification(params: {
    type: NotificationType;
    title: string;
    message: string;
    actorName: string;
    actorRole: 'HR' | 'ADMIN' | 'RECRUITER' | 'SYSTEM_AI';
    targetId?: string;
    targetUrl?: string;
    priority?: 'HIGH' | 'NORMAL' | 'URGENT';
    metadata?: Record<string, unknown>;
  }): SystemNotification {
    const list = loadPersistedNotifications();
    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: params.type,
      title: params.title,
      message: params.message,
      actorName: params.actorName,
      actorRole: params.actorRole,
      targetId: params.targetId,
      targetUrl: params.targetUrl,
      createdAt: new Date().toISOString(),
      readBy: [],
      priority: params.priority || 'NORMAL',
      metadata: params.metadata,
    };

    const updated = [newNotif, ...list];
    saveNotifications(updated);
    return newNotif;
  },

  /**
   * Returns whether a user has pending alerts that should trigger the Executive Login Briefing
   */
  hasPendingLoginAlerts(userId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const lastSeen = localStorage.getItem(`${LAST_LOGIN_SEEN_KEY}${userId}`);
      if (!lastSeen) return true; // first time login or new session

      const lastSeenTime = parseInt(lastSeen, 10);
      const list = loadPersistedNotifications();
      // True if there is at least one notification created after lastSeenTime
      return list.some((n) => new Date(n.createdAt).getTime() > lastSeenTime);
    } catch {
      return true;
    }
  },

  /**
   * Retrieves the unread or recent activity alerts for the login popup
   */
  getLoginAlerts(userId: string): SystemNotification[] {
    const list = loadPersistedNotifications();
    if (typeof window === 'undefined') return list.slice(0, 5);

    try {
      const lastSeen = localStorage.getItem(`${LAST_LOGIN_SEEN_KEY}${userId}`);
      if (!lastSeen) {
        return list.slice(0, 5);
      }
      const lastSeenTime = parseInt(lastSeen, 10);
      const newItems = list.filter((n) => new Date(n.createdAt).getTime() > lastSeenTime);
      return newItems.length > 0 ? newItems : list.slice(0, 4);
    } catch {
      return list.slice(0, 4);
    }
  },

  /**
   * Records that the user has seen/dismissed the login alert popup
   */
  dismissLoginAlerts(userId: string) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${LAST_LOGIN_SEEN_KEY}${userId}`, Date.now().toString());
        this.markAllAsRead(userId);
      } catch {}
    }
  },

  /**
   * Clear and restore mock notifications
   */
  reset() {
    saveNotifications(BASELINE_NOTIFICATIONS);
  },
};
