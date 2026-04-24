// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * Pure file-extension utility functions with zero external dependencies.
 * Extracted from `file.ts` to avoid circular imports between `file.ts` and
 * the file type registry (which needs these helpers for extension-based detection).
 */

export interface FileNameLike {
  name: string;
  extension: string;
}

/** Extract the extension from a filename string (without leading dot, lowercase). */
export const fileExtension = (filename: string): string => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
};

/**
 * Normalize a file extension from a file-like object or plain string.
 * Always returns a lowercase extension without a leading dot.
 */
export const normalizedExtension = (
  fileOrName: Pick<FileNameLike, 'name' | 'extension'> | string | null | undefined,
): string => {
  if (!fileOrName) return '';

  if (typeof fileOrName === 'string') {
    const fromName = fileExtension(fileOrName);
    if (fromName) return fromName;
    return fileOrName.trim().toLowerCase().replace(/^\./, '');
  }

  const fromName = fileExtension(fileOrName.name || '');
  if (fromName) return fromName;

  return String(fileOrName.extension || '')
    .trim()
    .toLowerCase()
    .replace(/^\./, '');
};
