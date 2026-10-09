// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { systemApi } from '../api-client/clients';
import type { UploadLimits } from '../api-client/models';

const MIB = 1024 * 1024;

/**
 * Upload caps the server enforces, in bytes. The defaults mirror core/constants.py in
 * codePost-api; `loadUploadLimits()` replaces them with GET /system/uploadLimits/ once
 * after sign-in so a server-side change never needs a UI release to stay in step.
 * Per-file limits are on the decoded file (what `File.size` reports), not its base64 form.
 */
export const DEFAULT_UPLOAD_LIMITS: UploadLimits = {
  maxSubmissionFileBytes: 10 * MIB,
  maxSubmissionTotalBytes: 30 * MIB,
  maxAssignmentFileBytes: 10 * MIB,
  maxCourseFileBytes: 25 * MIB,
  maxDatasetBytes: 1024 * MIB,
  maxQuizImageBytes: 5 * MIB,
  maxRequestBodyBytes: 50 * MIB,
};

let current: UploadLimits = DEFAULT_UPLOAD_LIMITS;
let loading: Promise<UploadLimits> | null = null;

/** The limits as currently known (defaults until `loadUploadLimits()` resolves). */
export const getUploadLimits = (): UploadLimits => current;

/** Fetch the live limits once; safe to call from anywhere, repeated calls share one request. */
export function loadUploadLimits(): Promise<UploadLimits> {
  if (!loading) {
    loading = systemApi
      .uploadLimitsRetrieve()
      .then((limits) => {
        current = limits;
        return limits;
      })
      .catch(() => {
        loading = null; // let a later call retry
        return current;
      });
  }
  return loading;
}

/** "10 MB" / "1 GB" — binary units, labelled the way the docs and the API's messages do. */
export function formatLimit(bytes: number): string {
  if (bytes >= 1024 * MIB && bytes % (1024 * MIB) === 0) return `${bytes / (1024 * MIB)} GB`;
  return `${Math.round(bytes / MIB)} MB`;
}

/** A file's size for display, e.g. "12.3 MB", in the same units as `formatLimit`. */
export function formatFileSize(bytes: number): string {
  return `${(bytes / MIB).toFixed(1)} MB`;
}

/** Decoded size of a file's `data` string, the way the API measures it (a base64 data: URI
 *  is counted as the bytes it decodes to, text as its UTF-8 bytes). */
export function contentSizeBytes(data: string): number {
  if (data.startsWith('data:')) {
    const comma = data.indexOf(',');
    const encoded = comma === -1 ? '' : data.slice(comma + 1);
    const padding = encoded.endsWith('==') ? 2 : encoded.endsWith('=') ? 1 : 0;
    return Math.floor((encoded.length * 3) / 4) - padding;
  }
  return new TextEncoder().encode(data).length;
}

/** Hint shown wherever an instructor hits the assignment-file cap. */
export const DATASET_HINT = 'For large or binary inputs, use Datasets instead.';
