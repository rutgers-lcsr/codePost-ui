// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { googlecode, tomorrowNight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

import themeVars from './_theme.js';

export const consoleThemes = {
  light: {
    text: themeVars.theme.neutralMainText,
    mainBg: '#f2f2f2',
    codeBg: '#fff',
    codeHeaderBg: '#e3e3e3',
    codeBorder: '#e3e3e3',
    commentBg: '#18191b',
    codeTheme: googlecode,
    highlight: '#0F172A',
    highlightActive: '#020617',
    highlightOpacity: 0.2,
    commentTitle: '#fafafa',
    commentTitleText: themeVars.theme.neutralTitle,
    commentTitleBorder: 'rgb(232, 232, 232)',
    commentBody: '#fff',
    commentTextArea: '#fafafa',
    commentAuthor: themeVars.theme.neutralMainText,
    commentRubricCommentNeutral: themeVars.theme.neutralSecondaryText,
    commentShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
    commentShadowFocused: 'rgba(0, 0, 0, 0.25) 0px 14px 28px, rgba(0, 0, 0, 0.22) 0px 10px 10px, rgba(36, 190, 133, 0.5) 0px 0px 0px 2px',
    commentBorderFocused: '#24be85',
    commentBodyFocused: '#f0fdf6',
    commentCode: 'rgba(27,31,35,.05)',
    buttonDangerBg: '#f5f5f5',
    buttonDangerBorder: '1px solid #d9d9d9',
    buttonSecondaryBg: '#f5f5f5',
    buttonSecondaryBorder: '1px solid #d9d9d9',
    buttonSecondaryColor: themeVars.theme.neutralMainText,
    buttonDisabledBg: 'rgba(0, 0, 0, 0)',
    buttonDisabledColor: themeVars.theme.neutralDisable,
    subheaderBg: '#fff',
    subheaderBorderBottom: '1px solid #e9e9e9',
    subheaderTitle: themeVars.theme.neutralTitle,
    subheaderDate: themeVars.theme.neutralMainText,
    subheaderStudents: themeVars.theme.neutralMainText,
    subheaderGrade: themeVars.theme.neutralDisable,
    siderBg: '#fff',
    siderTitle: themeVars.theme.neutralTitle,
    siderMenuItemColor: 'rgba(0, 0, 0, 0.65)',
    siderSubmenuTitleBg: '#fafafa',
    siderSubmenuTitleColor: themeVars.theme.neutralMainText,
    siderSubmenuBorder: '1px solid #e8e8e8',
    avatarBackground: '#ccc',
    resizerTrack: '#e9e9e9',
    resizerTrackActive: themeVars.theme.neutralBackground,
    templateCode: '#fafafa',
  },
  dark: {
    text: '#c9d1d9', // GitHub Dark Text
    mainBg: '#0d1117', // GitHub Dark Code Bg
    codeBg: '#161b22', // GitHub Dark Main Bg
    codeHeaderBg: 'rgba(255,255,255,0.03)',
    codeBorder: '#6e7681', // Accessible dark border (>= 3:1 against dark surfaces)
    commentBg: '#161b22',
    codeTheme: tomorrowNight,
    highlight: '#d3d3d3',
    highlightActive: '#24be85',
    highlightOpacity: 0.15,
    commentTitle: '#161b22', // Match commentBg
    commentTitleText: '#c9d1d9',
    commentTitleBorder: '#6e7681',
    commentBody: '#161b22',
    commentTextArea: '#0d1117',
    commentAuthor: '#8b949e', // GitHub Dark Secondary Text
    commentRubricCommentNeutral: '#8b949e',
    commentShadow: 'rgba(0,0,0,0.5) 0px 4px 12px',
    commentShadowFocused: 'rgba(0, 0, 0, 0.7) 0px 16px 32px, rgba(36, 190, 133, 0.6) 0px 0px 0px 2px',
    commentBorderFocused: '#24be85',
    commentBodyFocused: '#0f291e',

    commentCode: '#21262d',
    buttonDangerBg: '#21262d',
    buttonDangerBorder: '1px solid #6e7681',
    buttonSecondaryBg: '#21262d',
    buttonSecondaryBorder: '1px solid #6e7681',
    buttonSecondaryColor: '#c9d1d9',
    buttonDisabledBg: 'rgba(255,255,255,0.04)',
    buttonDisabledColor: 'rgba(255,255,255,0.2)',
    subheaderBg: '#161b22',
    subheaderBorderBottom: '1px solid #6e7681',
    subheaderTitle: '#c9d1d9',
    subheaderDate: '#8b949e',
    subheaderStudents: '#8b949e',
    subheaderGrade: '#9da7b3',
    siderBg: '#0d1117',
    siderTitle: '#c9d1d9',
    siderMenuItemColor: '#8b949e',
    siderSubmenuTitleBg: '#161b22',
    siderSubmenuTitleColor: '#c9d1d9',
    siderSubmenuBorder: '1px solid #6e7681',
    avatarBackground: '#238636', // GitHub Green
    resizerTrack: '#21262d',
    resizerTrackActive: '#6e7681',
    templateCode: '#21262d',
  },
};

function togglePlaceholder(_toTheme) {
  // @ts-ignore
  // tslint:disable-next-line
  console.log('placeholder toggle');
  return;
}

export const ConsoleThemeContext = React.createContext({
  consoleTheme: consoleThemes.light, // default value
  toggleConsoleTheme: togglePlaceholder,
});
