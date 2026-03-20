// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { isDarkColor, useMarkdownTheme } from '../code-panel/useMarkdownTheme';
import type { ConsoleTheme } from '../code-panel/useMarkdownTheme';

// ---------------------------------------------------------------------------
// hexToRgb (tested indirectly via isDarkColor)
// ---------------------------------------------------------------------------
describe('isDarkColor', () => {
  // Dark colors — luminance < 0.5
  it('returns true for black (#000000)', () => {
    expect(isDarkColor('#000000')).toBe(true);
  });

  it('returns true for dark gray (#333333)', () => {
    expect(isDarkColor('#333333')).toBe(true);
  });

  it('returns true for navy (#000080)', () => {
    expect(isDarkColor('#000080')).toBe(true);
  });

  it('returns true for dark red (#8B0000)', () => {
    expect(isDarkColor('#8B0000')).toBe(true);
  });

  // Light colors — luminance >= 0.5
  it('returns false for white (#ffffff)', () => {
    expect(isDarkColor('#ffffff')).toBe(false);
  });

  it('returns false for light gray (#cccccc)', () => {
    expect(isDarkColor('#cccccc')).toBe(false);
  });

  it('returns false for yellow (#ffff00)', () => {
    expect(isDarkColor('#ffff00')).toBe(false);
  });

  it('returns false for cyan (#00ffff)', () => {
    expect(isDarkColor('#00ffff')).toBe(false);
  });

  // Edge cases — hexToRgb returns null
  it('returns false for undefined', () => {
    expect(isDarkColor(undefined)).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isDarkColor('')).toBe(false);
  });

  it('returns false for invalid hex string', () => {
    expect(isDarkColor('not-hex')).toBe(false);
  });

  it('returns false for 2-char hex', () => {
    expect(isDarkColor('#AB')).toBe(false);
  });

  it('returns false for 5-char hex', () => {
    expect(isDarkColor('#12345')).toBe(false);
  });

  // Short hex (3-char)
  it('supports 3-char hex — dark (#000)', () => {
    expect(isDarkColor('#000')).toBe(true);
  });

  it('supports 3-char hex — light (#fff)', () => {
    expect(isDarkColor('#fff')).toBe(false);
  });

  it('supports 3-char hex — dark (#333)', () => {
    expect(isDarkColor('#333')).toBe(true);
  });

  // Without the # prefix
  it('handles hex without # prefix', () => {
    expect(isDarkColor('000000')).toBe(true);
    expect(isDarkColor('ffffff')).toBe(false);
  });

  // Leading/trailing whitespace
  it('handles whitespace around hex', () => {
    expect(isDarkColor('  #000000  ')).toBe(true);
    expect(isDarkColor('  #ffffff  ')).toBe(false);
  });

  // Invalid hex digits (NaN from parseInt)
  it('returns false when hex has non-hex characters', () => {
    expect(isDarkColor('#ZZZZZZ')).toBe(false);
  });

  it('returns false for partially valid hex (#GG0000)', () => {
    // parseInt('GG0000', 16) is NaN
    expect(isDarkColor('#GG0000')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// useMarkdownTheme hook
// ---------------------------------------------------------------------------
describe('useMarkdownTheme', () => {
  const lightTheme: Partial<ConsoleTheme> = {
    mainBg: '#ffffff',
    text: '#1f1f1f',
    commentCode: '#f6f6f6',
    codeBorder: '#e8e8e8',
    highlight: '#DB1A1A',
    codeBg: '#f2f2f2',
    commentBody: '#f8f8f8',
    commentRubricCommentNeutral: '#ddd',
    subheaderBg: '#fafafa',
    subheaderBorderBottom: '#e8e8e8',
    highlightActive: '#0958d9',
  } as ConsoleTheme;

  const darkTheme: Partial<ConsoleTheme> = {
    mainBg: '#1e1e1e',
    text: '#d4d4d4',
    commentCode: '#2d2d2d',
    codeBorder: '#3c3c3c',
    highlight: '#ce9178',
    codeBg: '#1e1e1e',
    commentBody: '#252526',
    commentRubricCommentNeutral: '#555',
    subheaderBg: '#252526',
    subheaderBorderBottom: '#3c3c3c',
    highlightActive: '#4fc1ff',
  } as ConsoleTheme;

  it('returns isDarkTheme=false for a light theme', () => {
    const { result } = renderHook(() => useMarkdownTheme(lightTheme as ConsoleTheme));
    expect(result.current.isDarkTheme).toBe(false);
  });

  it('returns isDarkTheme=true for a dark theme', () => {
    const { result } = renderHook(() => useMarkdownTheme(darkTheme as ConsoleTheme));
    expect(result.current.isDarkTheme).toBe(true);
  });

  it('returns markdownTheme with all expected keys', () => {
    const { result } = renderHook(() => useMarkdownTheme(lightTheme as ConsoleTheme));
    const keys = Object.keys(result.current.markdownTheme);
    expect(keys).toContain('text');
    expect(keys).toContain('background');
    expect(keys).toContain('blockHighlightBackground');
    expect(keys).toContain('blockEmptyBorderColor');
    expect(keys).toContain('tableBorderColor');
  });

  it('populates rootStyle with CSS variables', () => {
    const { result } = renderHook(() => useMarkdownTheme(lightTheme as ConsoleTheme));
    const style = result.current.rootStyle;
    expect(style['--markdown-text-color']).toBeDefined();
    expect(style['--markdown-bg-color']).toBeDefined();
    expect(style['--markdown-link-color']).toBeDefined();
  });

  it('handles null consoleTheme gracefully', () => {
    const { result } = renderHook(() => useMarkdownTheme(null));
    expect(result.current.isDarkTheme).toBe(false);
    // Should use default fallback colors
    expect(result.current.markdownTheme.text).toBe('#1f1f1f');
    expect(result.current.markdownTheme.background).toBe('#ffffff');
  });

  it('uses dark-specific block highlight colors for dark themes', () => {
    const { result } = renderHook(() => useMarkdownTheme(darkTheme as ConsoleTheme));
    expect(result.current.markdownTheme.blockHighlightBorderColor).toContain('rgba(36, 190, 133');
    expect(result.current.markdownTheme.blockEmptyBorderColor).toContain('rgba(255, 255, 255');
  });

  it('uses light-specific block highlight colors for light themes', () => {
    const { result } = renderHook(() => useMarkdownTheme(lightTheme as ConsoleTheme));
    expect(result.current.markdownTheme.blockHighlightBorderColor).toContain('rgba(46, 125, 50');
    expect(result.current.markdownTheme.blockEmptyBorderColor).toBe('white');
  });

  it('uses theme text/bg from consoleTheme properties', () => {
    const { result } = renderHook(() => useMarkdownTheme(darkTheme as ConsoleTheme));
    expect(result.current.markdownTheme.text).toBe('#d4d4d4');
    expect(result.current.markdownTheme.background).toBe('#1e1e1e');
  });
});
