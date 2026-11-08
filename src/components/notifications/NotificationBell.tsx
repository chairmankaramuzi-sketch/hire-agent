'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Briefcase,
  UserCheck,
  FileCheck2,
  AlertTriangle,
  CheckCheck,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { notificationsService } from '@/services/notifications';
import { SystemNotification, NotificationType } from '@/types/notification';
import { User } from '@/types';

interface NotificationBellProps {
  currentUser: User;
  onOpenBriefing?: () => void;
}

export function NotificationBell({ currentUser, onOpenBriefing }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'ALL' | 'SHORTLIST' | 'VACANCY' | 'ANOMALY'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadData = () => {
    if (!currentUser || !currentUser.id) return;
    const list = notificationsService.getNotifications();
    setNotifications(list);
    setUnreadCount(notificationsService.getUnreadCount(currentUser.id));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = notificationsService.subscribe(loadData);
    return () => unsubscribe();
  }, [currentUser]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = () => {
    if (currentUser?.id) {
      notificationsService.markAllAsRead(currentUser.id);
    }
  };

  const handleItemClick = (item: SystemNotification) => {
    if (currentUser?.id) {
      notificationsService.markAsRead(item.id, currentUser.id);
    }
    setIsOpen(false);
    if (item.targetUrl) {
      router.push(item.targetUrl);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'SHORTLIST') return n.type === 'CANDIDATE_SHORTLISTED';
    if (filter === 'VACANCY') return n.type === 'VACANCY_PUBLISHED';
    if (filter === 'ANOMALY') return n.type === 'ANOMALY_FLAGGED';
    return true;
  });

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'VACANCY_PUBLISHED':
        return <Briefcase className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'CANDIDATE_SHORTLISTED':
        return <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'BATCH_CV_SCREENED':
        return <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'ANOMALY_FLAGGED':
        return <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all focus:outline-none"
        title="View Notifications"
        aria-label="View notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-xs animate-in zoom-in-50">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-850">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 dark:text-white">Alerts & Activity</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs bg-white dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                filter === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('SHORTLIST')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                filter === 'SHORTLIST'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Shortlists
            </button>
            <button
              type="button"
              onClick={() => setFilter('VACANCY')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                filter === 'VACANCY'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Vacancies
            </button>
            <button
              type="button"
              onClick={() => setFilter('ANOMALY')}
              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                filter === 'ANOMALY'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Red Flags
            </button>
          </div>

          {/* Notifications Scroll List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No notifications in this category.
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = !item.readBy.includes(currentUser.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer flex items-start gap-3 relative ${
                      isUnread ? 'bg-indigo-50/30 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getTypeIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p
                          className={`text-xs truncate ${
                            isUnread
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'font-medium text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(item.createdAt)}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-slate-500 dark:text-slate-400 truncate">
                          {item.actorName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Executive Briefing Button */}
          {onOpenBriefing && (
            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenBriefing();
                }}
                className="w-full py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Open Executive Login Briefing</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
