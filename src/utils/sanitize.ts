// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import DOMPurify from 'dompurify';

/**
 * Sanitize an HTML string to prevent XSS attacks.
 * Centralizes DOMPurify configuration so allowed tags/attributes
 * can be adjusted in one place.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}
