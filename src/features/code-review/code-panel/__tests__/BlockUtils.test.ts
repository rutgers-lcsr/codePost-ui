// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBlockClassName, findBlockElement, getPDFStartPlacement } from '../BlockUtils';

describe('BlockUtils', () => {
  describe('getBlockClassName', () => {
    it('returns empty + active for no comments and editable', () => {
      const result = getBlockClassName([], false, 1);
      expect(result).toBe('markdown-block markdown-block--empty active');
    });

    it('returns empty + readonly for no comments and readOnly', () => {
      const result = getBlockClassName([], true, 1);
      expect(result).toBe('markdown-block markdown-block--empty readonly');
    });

    it('returns commented + active when comment exists at index', () => {
      const comments = [{ startLine: 5 }] as any[];
      const result = getBlockClassName(comments, false, 5);
      expect(result).toBe('markdown-block markdown-block--commented active');
    });

    it('returns commented + readonly when comment at index and readOnly', () => {
      const comments = [{ startLine: 3 }] as any[];
      const result = getBlockClassName(comments, true, 3);
      expect(result).toBe('markdown-block markdown-block--commented readonly');
    });

    it('returns empty when comments exist but not at this index', () => {
      const comments = [{ startLine: 1 }, { startLine: 2 }] as any[];
      const result = getBlockClassName(comments, false, 99);
      expect(result).toBe('markdown-block markdown-block--empty active');
    });
  });

  describe('findBlockElement', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('queries by data-page-number for PDF files', () => {
      const spy = vi.spyOn(document, 'querySelector').mockReturnValue(null);
      const file = { name: 'test.pdf', extension: 'pdf' } as any;
      findBlockElement(file, 3);
      expect(spy).toHaveBeenCalledWith('[data-page-number="3"]');
    });

    it('queries by index-number for non-PDF files', () => {
      const spy = vi.spyOn(document, 'querySelector').mockReturnValue(null);
      const file = { name: 'test.py', extension: 'py' } as any;
      findBlockElement(file, 7);
      expect(spy).toHaveBeenCalledWith('[index-number="7"]');
    });
  });

  describe('getPDFStartPlacement', () => {
    it('calculates placement based on startLine', () => {
      const comment = { startLine: 1 } as any;
      // pageHeight is 830, so (1 - 1) * 830 = 0
      expect(getPDFStartPlacement(comment)).toBe(0);
    });

    it('calculates placement for later pages', () => {
      const comment = { startLine: 3 } as any;
      // (3 - 1) * 830 = 1660
      expect(getPDFStartPlacement(comment)).toBe(1660);
    });
  });
});
