/**
 * Calendar service for generating real Google Calendar, Outlook, and .ics calendar invites
 */

export interface CalendarEvent {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  organizerName: string;
  organizerEmail: string;
  candidateName: string;
  candidateEmail: string;
}

function formatDateToICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generates standard RFC 5545 iCalendar (.ics) format compatible with Apple Calendar, Outlook, and Google
 */
export function generateICSContent(event: CalendarEvent): string {
  const uid = `interview-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@hire-agent.internal`;
  const now = formatDateToICS(new Date());
  const start = formatDateToICS(event.startTime);
  const end = formatDateToICS(event.endTime);

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HIRE~Agent//Enterprise Recruitment Platform//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location}`,
    `ORGANIZER;CN=${event.organizerName}:mailto:${event.organizerEmail}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${event.candidateName}:mailto:${event.candidateEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview Reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads a real .ics file directly in the user's browser
 */
export function downloadICSFile(event: CalendarEvent, filename = 'interview-invite.ics') {
  if (typeof window === 'undefined') return;
  const ics = generateICSContent(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates direct one-click web URL for Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const start = formatDateToICS(event.startTime);
  const end = formatDateToICS(event.endTime);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: `${event.description}\n\nCandidate: ${event.candidateName} (${event.candidateEmail})`,
    location: event.location,
    add: event.candidateEmail,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generates direct one-click web URL for Microsoft Outlook Calendar
 */
export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    body: `${event.description}\n\nCandidate: ${event.candidateName} (${event.candidateEmail})`,
    location: event.location,
    to: event.candidateEmail,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
