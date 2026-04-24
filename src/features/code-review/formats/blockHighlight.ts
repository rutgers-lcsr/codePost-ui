// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.

/**
 * Shared block-level focus/blur helpers for rich file types (markdown, jupyter, image).
 *
 * These are used as `focusBlock` / `blurBlock` implementations on file type definitions
 * that use block-level commenting with the `markdown-block` CSS class convention.
 */

/** Apply visual focus styling to a markdown/jupyter/image block element. */
export const focusRichBlock = (element: HTMLElement, mode: 'readonly' | 'active'): void => {
  const opposite = mode === 'readonly' ? 'active' : 'readonly';
  element.classList.add('markdown-block');
  element.classList.remove(opposite);
  element.classList.remove('markdown-block--empty');
  element.classList.remove('markdown-block--commented');
  element.classList.add('markdown-block--focused');
  element.classList.add(mode);
};

/** Remove visual focus styling from a markdown/jupyter/image block element. */
export const blurRichBlock = (element: HTMLElement, mode: 'readonly' | 'active'): void => {
  const opposite = mode === 'readonly' ? 'active' : 'readonly';
  element.classList.remove('markdown-block--focused');
  element.classList.remove('markdown-block--empty');
  if (!element.classList.contains('markdown-block--commented')) {
    element.classList.add('markdown-block--commented');
  }
  element.classList.add('markdown-block');
  element.classList.remove(opposite);
  element.classList.add(mode);
};
