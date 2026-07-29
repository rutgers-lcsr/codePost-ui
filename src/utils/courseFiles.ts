// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
//
// Helpers for CourseFile content, which is stored inline: text as UTF-8, binary as a
// base64 `data:` URI. Shared by the admin Course Files manager and the student file
// directory.
import type { CourseFile } from '../api-client';

/** MIME declared in a stored data: URI ("data:<mime>;base64,..."). */
export const dataUriMime = (data: string): string =>
  data.slice(5, data.indexOf(',')).split(';')[0] || 'application/octet-stream';

/** Decoded byte size of stored content (base64 data: URI or UTF-8 text). */
export const dataBytes = (data?: string | null): number => {
  if (!data) return 0;
  if (data.startsWith('data:')) {
    const comma = data.indexOf(',');
    const b64 = comma >= 0 ? data.slice(comma + 1) : '';
    return Math.floor((b64.length * 3) / 4);
  }
  return new Blob([data]).size;
};

export const formatBytes = (n: number): string =>
  n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;

/** Client-side download from the stored content — works for private files too (the
 *  public raw URL only exists for files flipped to Public). */
export const downloadCourseFile = (file: CourseFile): void => {
  const data = file.data ?? '';
  let blob: Blob;
  if (data.startsWith('data:')) {
    const bytes = atob(data.slice(data.indexOf(',') + 1));
    const buf = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
    blob = new Blob([buf], { type: dataUriMime(data) });
  } else {
    blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
};
