import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type MediaRecord = {
  path: string;
  description: string | null;
};

/**
 * In-memory registry mapping a generated media id to the uploaded file's
 * path (and alt text) until it's attached to an outgoing post. Kept as a
 * small closure so the server layer can hold one instance per process.
 */
export type MediaStore = {
  save(file: File, description: string | null): Promise<{ id: string; record: MediaRecord }>;
  get(id: string): MediaRecord | undefined;
  /** Remember which outgoing message carries which upload's alt text, so later reads can show it too. */
  tagMessage(msgId: number, description: string | null): void;
  descriptionForMessage(msgId: number): string | null;
};

const SUPPORTED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export const isSupportedImageMime = (mime: string): boolean => SUPPORTED_IMAGE_MIME.has(mime);

export const createMediaStore = (uploadDir = join(tmpdir(), 'deltanet-uploads')): MediaStore => {
  const records = new Map<string, MediaRecord>();
  const descriptionsByMsgId = new Map<number, string | null>();

  return {
    save: async (file, description) => {
      await mkdir(uploadDir, { recursive: true });
      const id = randomUUID();
      const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '';
      const path = join(uploadDir, `${id}${ext}`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      await writeFile(path, bytes);
      const record: MediaRecord = { path, description };
      records.set(id, record);
      return { id, record };
    },
    get: (id) => records.get(id),
    tagMessage: (msgId, description) => {
      if (description) descriptionsByMsgId.set(msgId, description);
    },
    descriptionForMessage: (msgId) => descriptionsByMsgId.get(msgId) ?? null,
  };
};
