import { z } from 'zod';

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'text/plain',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc', '.txt'];
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const submitApplicationSchema = z.object({
  applicantName: z.string().min(2, 'Applicant name must be at least 2 characters').max(150),
  applicantEmail: z.string().email('Valid email address is required').max(200),
});

export function validateCvFile(file: { name: string; type: string; size: number }): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: 'File size exceeds maximum limit of 10MB' };
  }

  if (file.size <= 0) {
    return { valid: false, error: 'File cannot be empty' };
  }

  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type) && file.type !== 'application/octet-stream') {
    return { valid: false, error: 'Invalid file MIME type. Only PDF, DOCX, DOC, or TXT allowed' };
  }

  return { valid: true };
}
