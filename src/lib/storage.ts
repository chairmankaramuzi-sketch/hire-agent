import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { logger } from './logger';

export interface FileUploadPayload {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}

export interface StoredFileMetadata {
  storageKey: string;
  originalFilename: string;
  detectedMimeType: string;
  sizeBytes: number;
  sha256Hex: string;
}

export interface IStorageService {
  uploadFile(file: FileUploadPayload): Promise<StoredFileMetadata>;
  getFile(storageKey: string): Promise<Buffer | null>;
  deleteFile(storageKey: string): Promise<boolean>;
  generateSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string>;
}

// Local filesystem adapter with private non-public directory
export class LocalPrivateStorageService implements IStorageService {
  private baseDir: string;

  constructor(baseDir?: string) {
    // Serverless platforms (Vercel/Lambda) only allow writes under the OS temp dir
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const root = isServerless ? os.tmpdir() : process.cwd();
    this.baseDir = baseDir ?? path.join(root, 'storage', 'private', 'cvs');
  }

  private async ensureBaseDir() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async uploadFile(file: FileUploadPayload): Promise<StoredFileMetadata> {
    await this.ensureBaseDir();

    const sha256Hex = crypto.createHash('sha256').update(file.buffer).digest('hex');
    const ext = path.extname(file.filename);
    const storageKey = `cv_${Date.now()}_${crypto.randomBytes(8).toString('hex')}${ext}`;
    const filePath = path.join(this.baseDir, storageKey);

    await fs.writeFile(filePath, file.buffer);

    logger.info('File stored privately', {
      storageKey,
      sizeBytes: file.buffer.length,
      mimeType: file.mimeType,
    });

    return {
      storageKey,
      originalFilename: file.filename,
      detectedMimeType: file.mimeType,
      sizeBytes: file.buffer.length,
      sha256Hex,
    };
  }

  async getFile(storageKey: string): Promise<Buffer | null> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.baseDir, safeKey);
    try {
      return await fs.readFile(filePath);
    } catch {
      return null;
    }
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.baseDir, safeKey);
    try {
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async generateSignedUrl(storageKey: string, expiresInSeconds = 300): Promise<string> {
    const token = crypto.randomBytes(24).toString('hex');
    const expiresAt = Date.now() + expiresInSeconds * 1000;
    // Generated access token URL that goes through authorized server download route
    return `/api/v1/cv-download?key=${encodeURIComponent(storageKey)}&token=${token}&expires=${expiresAt}`;
  }
}

export const storageService: IStorageService = new LocalPrivateStorageService();
