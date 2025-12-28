import * as React from 'react';
import { consoleThemes } from '../../../styles/abstracts/_console-theme-context.js';

export type ConsoleTheme = typeof consoleThemes.light;

export interface MarkdownThemeValues {
    text: string;
    background: string;
    inlineCodeBg: string;
    inlineCodeBorder: string;
    inlineCodeColor: string;
    codeBackground: string;
    codeBorder: string;
    outputBackground: string;
    outputBorder: string;
    blockQuoteBorder: string;
    statusBackground: string;
    statusBorder: string;
    linkColor: string;
    hoverLinkColor: string;
    jupyterCellBorder: string;
    blockBackground: string;
    blockHighlightBackground: string;
    blockHighlightShadow: string;
    blockHighlightBorderColor: string;
    blockHighlightHoverBackground: string;
    blockHighlightHoverBorderColor: string;
    blockHighlightHoverShadow: string;
    blockCommentedBackground: string;
    blockCommentedBorderColor: string;
    blockFocusedBackground: string;
    blockFocusedBorderColor: string;
    blockFocusedShadow: string;
    blockEmptyBorderColor: string;
    blockEmptyHoverBorderColor: string;
    tableBorderColor: string;
}

export type MarkdownCSSVariable =
    | '--markdown-text-color'
    | '--markdown-bg-color'
    | '--markdown-block-bg'
    | '--markdown-highlight-bg'
    | '--markdown-highlight-shadow'
    | '--markdown-highlight-border-color'
    | '--markdown-highlight-hover-bg'
    | '--markdown-highlight-hover-border-color'
    | '--markdown-highlight-hover-shadow'
    | '--markdown-commented-bg'
    | '--markdown-commented-border-color'
    | '--markdown-focused-bg'
    | '--markdown-focused-border-color'
    | '--markdown-focused-shadow'
    | '--markdown-empty-border-color'
    | '--markdown-empty-hover-border-color'
    | '--markdown-table-border-color'
    | '--markdown-link-color'
    | '--markdown-link-hover-color';

export type MarkdownCSSProperties = React.CSSProperties & Record<MarkdownCSSVariable, string>;

function hexToRgb(hexColor: string | undefined): { r: number; g: number; b: number } | null {
    if (!hexColor) {
        return null;
    }

    const normalized = hexColor.trim().replace('#', '');
    if (normalized.length !== 3 && normalized.length !== 6) {
        return null;
    }

    const expanded =
        normalized.length === 3
            ? normalized
                .split('')
                .map((char) => char + char)
                .join('')
            : normalized;

    const numeric = Number.parseInt(expanded, 16);
    if (Number.isNaN(numeric)) {
        return null;
    }

    return {
        r: (numeric >> 16) & 255,
        g: (numeric >> 8) & 255,
        b: numeric & 255,
    };
}

export function isDarkColor(hexColor: string | undefined): boolean {
    const rgb = hexToRgb(hexColor);
    if (!rgb) {
        return false;
    }

    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance < 0.5;
}

export function useMarkdownTheme(consoleTheme: ConsoleTheme | null): {
    markdownTheme: MarkdownThemeValues;
    isDarkTheme: boolean;
    rootStyle: MarkdownCSSProperties
} {
    const isDarkTheme = React.useMemo(() => isDarkColor(consoleTheme?.mainBg), [consoleTheme?.mainBg]);

    const markdownTheme = React.useMemo<MarkdownThemeValues>(
        () => ({
            text: consoleTheme?.text ?? '#1f1f1f',
            background: consoleTheme?.mainBg ?? '#ffffff',
            inlineCodeBg: consoleTheme?.commentCode ?? '#f6f6f6',
            inlineCodeBorder: consoleTheme?.codeBorder ?? '#e8e8e8',
            inlineCodeColor: consoleTheme?.highlight ?? '#DB1A1A',
            codeBackground: consoleTheme?.codeBg ?? '#f2f2f2',
            codeBorder: consoleTheme?.codeBorder ?? '#e3e3e3',
            outputBackground: consoleTheme?.commentBody ?? '#f8f8f8',
            outputBorder: consoleTheme?.codeBorder ?? '#d9d9d9',
            blockQuoteBorder: consoleTheme?.commentRubricCommentNeutral ?? '#ddd',
            statusBackground: consoleTheme?.subheaderBg ?? '#fafafa',
            statusBorder: consoleTheme?.subheaderBorderBottom ?? '#e8e8e8',
            linkColor: consoleTheme?.highlight ?? '#1677ff',
            hoverLinkColor: consoleTheme?.highlightActive ?? '#0958d9',
            jupyterCellBorder: consoleTheme?.codeBorder ?? '#cccccc',
            blockBackground: 'transparent',
            blockHighlightBackground: isDarkTheme
                ? 'linear-gradient(90deg, rgba(36, 190, 133, 0.08) 0%, rgba(36, 190, 133, 0.24) 100%)'
                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 20%, rgba(255, 255, 255, 0.95) 100%), linear-gradient(90deg, rgba(255, 248, 225, 0.75) 0%, rgba(255, 236, 179, 0.65) 28%, rgba(46, 125, 50, 0.15) 100%)',
            blockHighlightShadow: isDarkTheme
                ? 'inset 0 0 0 1px rgba(36, 190, 133, 0.35), 0 1px 2px rgba(0, 0, 0, 0.35)'
                : 'inset 0 0 0 1px rgba(46, 125, 50, 0.2), 0 1px 2px rgba(0, 0, 0, 0.08)',
            blockHighlightBorderColor: isDarkTheme ? 'rgba(36, 190, 133, 0.45)' : 'rgba(46, 125, 50, 0.32)',
            blockHighlightHoverBackground: isDarkTheme
                ? 'linear-gradient(90deg, rgba(36, 190, 133, 0.22) 0%, rgba(36, 190, 133, 0.38) 100%)'
                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 18%, rgba(255, 255, 255, 0.94) 100%), linear-gradient(90deg, rgba(255, 213, 79, 0.7) 0%, rgba(255, 213, 79, 0.55) 28%, rgba(255, 143, 0, 0.28) 100%)',
            blockHighlightHoverBorderColor: isDarkTheme ? 'rgba(36, 190, 133, 0.65)' : 'rgba(255, 167, 38, 0.55)',
            blockHighlightHoverShadow: isDarkTheme
                ? 'inset 0 0 0 1.5px rgba(36, 190, 133, 0.55), 0 4px 12px rgba(36, 190, 133, 0.35)'
                : 'inset 0 0 0 1.5px rgba(255, 167, 38, 0.55), 0 4px 12px rgba(255, 213, 79, 0.35)',
            blockCommentedBackground: isDarkTheme
                ? 'linear-gradient(90deg, rgba(36, 190, 133, 0.16) 0%, rgba(36, 190, 133, 0.28) 100%)'
                : 'linear-gradient(90deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.95) 100%)',
            blockCommentedBorderColor: isDarkTheme ? 'rgba(36, 190, 133, 0.45)' : 'rgba(46, 125, 50, 0.18)',
            blockFocusedBackground: isDarkTheme
                ? 'linear-gradient(90deg, rgba(36, 190, 133, 0.32) 0%, rgba(36, 190, 133, 0.48) 100%)'
                : 'linear-gradient(90deg, rgba(255, 253, 218, 0.9) 0%, rgba(255, 248, 196, 0.98) 45%, rgba(255, 241, 118, 0.9) 100%)',
            blockFocusedBorderColor: isDarkTheme ? 'rgba(36, 190, 133, 0.7)' : 'rgba(255, 167, 38, 0.65)',
            blockFocusedShadow: isDarkTheme
                ? '0px 6px 16px rgba(36, 190, 133, 0.28)'
                : '0px 6px 16px rgba(255, 213, 79, 0.28)',
            blockEmptyBorderColor: isDarkTheme ? 'rgba(255, 255, 255, 0.15)' : 'white',
            blockEmptyHoverBorderColor: isDarkTheme ? 'rgba(64, 169, 255, 0.65)' : '#bdbdbd',
            tableBorderColor: consoleTheme?.codeBorder ?? '#f2f2f2',
        }),
        [consoleTheme, isDarkTheme],
    );

    const rootStyle = React.useMemo<MarkdownCSSProperties>(
        () => ({
            padding: '5px 0px',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden',
            color: markdownTheme.text,
            backgroundColor: markdownTheme.background,
            '--markdown-text-color': markdownTheme.text,
            '--markdown-bg-color': markdownTheme.background,
            '--markdown-block-bg': markdownTheme.blockBackground,
            '--markdown-highlight-bg': markdownTheme.blockHighlightBackground,
            '--markdown-highlight-shadow': markdownTheme.blockHighlightShadow,
            '--markdown-highlight-border-color': markdownTheme.blockHighlightBorderColor,
            '--markdown-highlight-hover-bg': markdownTheme.blockHighlightHoverBackground,
            '--markdown-highlight-hover-border-color': markdownTheme.blockHighlightHoverBorderColor,
            '--markdown-highlight-hover-shadow': markdownTheme.blockHighlightHoverShadow,
            '--markdown-commented-bg': markdownTheme.blockCommentedBackground,
            '--markdown-commented-border-color': markdownTheme.blockCommentedBorderColor,
            '--markdown-focused-bg': markdownTheme.blockFocusedBackground,
            '--markdown-focused-border-color': markdownTheme.blockFocusedBorderColor,
            '--markdown-focused-shadow': markdownTheme.blockFocusedShadow,
            '--markdown-empty-border-color': markdownTheme.blockEmptyBorderColor,
            '--markdown-empty-hover-border-color': markdownTheme.blockEmptyHoverBorderColor,
            '--markdown-table-border-color': markdownTheme.tableBorderColor,
            '--markdown-link-color': markdownTheme.linkColor,
            '--markdown-link-hover-color': markdownTheme.hoverLinkColor,
        }),
        [markdownTheme],
    );

    return { markdownTheme, isDarkTheme, rootStyle };
}
