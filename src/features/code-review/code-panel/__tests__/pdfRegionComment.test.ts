// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { isRegionComment, encodeRegion, decodeRegion } from '../pdfRegionComment';

describe('isRegionComment', () => {
  it('returns false for page-level comments (startChar=0, endChar=0)', () => {
    expect(isRegionComment({ startChar: 0, endChar: 0 })).toBe(false);
  });

  it('returns false for text-offset comments', () => {
    expect(isRegionComment({ startChar: 15, endChar: 42 })).toBe(false);
  });

  it('returns false for null startChar/endChar', () => {
    expect(isRegionComment({ startChar: null, endChar: null })).toBe(false);
  });

  it('returns false for undefined startChar/endChar', () => {
    expect(isRegionComment({})).toBe(false);
  });

  it('returns true for region-encoded comments', () => {
    const { startChar, endChar } = encodeRegion(10, 20, 50, 60);
    expect(isRegionComment({ startChar, endChar })).toBe(true);
  });

  it('returns false when only startChar is in region range', () => {
    expect(isRegionComment({ startChar: 1_000_100, endChar: 50 })).toBe(false);
  });
});

describe('encodeRegion', () => {
  it('encodes a basic bounding box', () => {
    const { startChar, endChar } = encodeRegion(10, 20, 50, 60);
    expect(startChar).toBeGreaterThanOrEqual(1_000_000);
    expect(endChar).toBeGreaterThanOrEqual(1_000_000);
  });

  it('roundtrips through decode', () => {
    const { startChar, endChar } = encodeRegion(10, 20, 50, 60);
    const { leftPct, topPct, rightPct, bottomPct } = decodeRegion(startChar, endChar);
    expect(leftPct).toBe(10);
    expect(topPct).toBe(20);
    expect(rightPct).toBe(50);
    expect(bottomPct).toBe(60);
  });

  it('roundtrips edge case: full page (0,0,100,100)', () => {
    const { startChar, endChar } = encodeRegion(0, 0, 100, 100);
    const decoded = decodeRegion(startChar, endChar);
    expect(decoded).toEqual({ leftPct: 0, topPct: 0, rightPct: 100, bottomPct: 100 });
  });

  it('roundtrips edge case: top-left corner', () => {
    const { startChar, endChar } = encodeRegion(0, 0, 10, 10);
    const decoded = decodeRegion(startChar, endChar);
    expect(decoded).toEqual({ leftPct: 0, topPct: 0, rightPct: 10, bottomPct: 10 });
  });

  it('roundtrips edge case: bottom-right corner', () => {
    const { startChar, endChar } = encodeRegion(90, 90, 100, 100);
    const decoded = decodeRegion(startChar, endChar);
    expect(decoded).toEqual({ leftPct: 90, topPct: 90, rightPct: 100, bottomPct: 100 });
  });

  it('clamps values above 100 to 100', () => {
    const { startChar, endChar } = encodeRegion(150, 200, 300, 400);
    const decoded = decodeRegion(startChar, endChar);
    expect(decoded).toEqual({ leftPct: 100, topPct: 100, rightPct: 100, bottomPct: 100 });
  });

  it('clamps negative values to 0', () => {
    const { startChar, endChar } = encodeRegion(-10, -20, -5, -5);
    const decoded = decodeRegion(startChar, endChar);
    expect(decoded).toEqual({ leftPct: 0, topPct: 0, rightPct: 0, bottomPct: 0 });
  });

  it('rounds fractional percentages', () => {
    const { startChar, endChar } = encodeRegion(10.4, 20.6, 50.5, 60.3);
    const decoded = decodeRegion(startChar, endChar);
    expect(decoded).toEqual({ leftPct: 10, topPct: 21, rightPct: 51, bottomPct: 60 });
  });
});

describe('decodeRegion', () => {
  it('decodes manually computed values', () => {
    // left=25, top=30 → startChar = 1_000_000 + 25*101 + 30 = 1_002_555
    // right=75, bottom=80 → endChar = 1_000_000 + 75*101 + 80 = 1_007_655
    const decoded = decodeRegion(1_002_555, 1_007_655);
    expect(decoded).toEqual({ leftPct: 25, topPct: 30, rightPct: 75, bottomPct: 80 });
  });

  it('decodes zero region (top-left point)', () => {
    const decoded = decodeRegion(1_000_000, 1_000_000);
    expect(decoded).toEqual({ leftPct: 0, topPct: 0, rightPct: 0, bottomPct: 0 });
  });
});
