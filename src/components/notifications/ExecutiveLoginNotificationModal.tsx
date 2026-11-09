'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Briefcase,
  UserCheck,
  FileCheck2,
  AlertTriangle,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { notificationsService } from '@/services/notifications';
import { SystemNotification, NotificationType } from '@/types/notification';
import { User } from '@/types';
import { HireAgentLogo } from '@/components/brand/HireAgentLogo';

interface ExecutiveLoginNotificationModalProps {
  currentUser: User;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ExecutiveLoginNotificationModal({
  currentUser,
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
}: ExecutiveLoginNotificationModalProps) {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<SystemNotification[]>([]);

  const isControlled = controlledIsOpen !== undefined;
  const showModal = isControlled ? controlledIsOpen : internalIsOpen;

  const handleClose = () => {
    if (isControlled && controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
    if (currentUser?.id) {
      notificationsService.dismissLoginAlerts(currentUser.id);
    }
  };

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    // Load recent activity alerts for this user
    const recent = notificationsService.getLoginAlerts(currentUser.id);
    setAlerts(recent);

    // If not controlled externally, check if user should see the login alert popup
    if (!isControlled) {
      const isStaff =
        currentUser.role === 'ADMIN' ||
        currentUser.role === 'HR' ||
        currentUser.name?.toLowerCase().includes('kalamuzi') ||
        currentUser.name?.toLowerCase().includes('nahurira') ||
        currentUser.name?.toLowerCase().includes('rose') ||
        currentUser.name?.toLowerCase().includes('admin') ||
        currentUser.name?.toLowerCase().includes('recruiter') ||
        currentUser.name?.toLowerCase().includes('director');

      if (isStaff) {
        const hasPending = notificationsService.hasPendingLoginAlerts(currentUser.id);
        const sessionChecked = sessionStorage.getItem(`login_modal_shown_${currentUser.id}`);

        if (hasPending || !sessionChecked) {
          setInternalIsOpen(true);
          sessionStorage.setItem(`login_modal_shown_${currentUser.id}`, 'true');
        }
      }
    }

    const unsubscribe = notificationsService.subscribe(() => {
      setAlerts(notificationsService.getLoginAlerts(currentUser.id));
    });

    return () => unsubscribe();
  }, [currentUser, isControlled]);

  if (!showModal || alerts.length === 0) return null;

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'VACANCY_PUBLISHED':
        return <Briefcase className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'CANDIDATE_SHORTLISTED':
        return <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'BATCH_CV_SCREENED':
        return <FileCheck2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'ANOMALY_FLAGGED':
        return <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'VACANCY_PUBLISHED':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'CANDIDATE_SHORTLISTED':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'BATCH_CV_SCREENED':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'ANOMALY_FLAGGED':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  const handleCardClick = (url?: string) => {
    handleClose();
    if (url) {
      router.push(url);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Executive Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 dark:from-slate-900 dark:via-indigo-950/20 dark:to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HireAgentLogo size="md" showText={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-600 text-white shadow-xs">
                  <Bell className="w-3 h-3 animate-pulse" />
                  Executive Alert
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {currentUser.role} Notification Briefing
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                Welcome back, {currentUser.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader info strip */}
        <div className="px-5 py-2.5 sm:px-6 bg-slate-100/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>{alerts.length} new activities performed across recruitment pipelines</span>
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Live Status: Up-to-date</span>
        </div>

        {/* Notifications Scrollable List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {alerts.map((item) => (
            <div
              key={item.id}
              onClick={() => handleCardClick(item.targetUrl)}
              className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group shadow-xs relative"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0 group-hover:scale-105 transition-transform">
                  {getTypeIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getTypeBadge(
                        item.type
                      )}`}
                    >
                      {item.type.replace(/_/g, ' ')}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(item.createdAt)}
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium ml-auto">
                      By: {item.actorName}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {item.targetUrl && (
                    <div className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                      <span>Click to review details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Executive Quick Actions Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/applications?queue=ELIGIBLE"
              onClick={handleClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Review Shortlisted</span>
            </Link>

            <Link
              href="/jobs"
              onClick={handleClose}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Briefcase className="w-4 h-4" />
              <span>View Vacancies</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            Dismiss & Mark as Seen
          </button>
        </div>
      </div>
    </div>
  );
}
