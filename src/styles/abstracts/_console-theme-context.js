import * as React from 'react';

import { googlecode, tomorrowNight } from 'react-syntax-highlighter/dist/styles/hljs';

import themeVars from './_theme.js';

export const consoleThemes = {
  light: {
    text: themeVars.theme.neutralMainText,
    mainBg: '#f2f2f2',
    codeBg: '#fff',
    codeBorder: '#e3e3e3',
    commentBg: '#18191b',
    codeTheme: googlecode,
    highlight: '#ffbf00',
    highlightActive: '#c0ff00',
    commentTitle: '#fafafa',
    commentTitleText: themeVars.theme.neutralTitle,
    commentTitleBorder: 'rgb(232, 232, 232)',
    commentBody: '#fff',
    commentTextArea: '#fafafa',
    commentAuthor: themeVars.theme.neutralMainText,
    commentRubricCommentNeutral: themeVars.theme.neutralSecondaryText,
    commentShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    buttonDangerBg: '#f5f5f5',
    buttonDangerBorder: '1px solid #d9d9d9',
    buttonSecondaryBg: '#f5f5f5',
    buttonSecondaryBorder: '1px solid #d9d9d9',
    buttonSecondaryColor: themeVars.theme.neutralMainText,
    buttonDisabledBg: 'rgba(0, 0, 0, 0)',
    buttonDisabledColor: themeVars.theme.neutralDisable,
  },
  dark: {
    text: themeVars.theme.neutralDarkMainText,
    mainBg: '#212325',
    codeBg: '#17181a',
    codeBorder: 'transparent',
    commentBg: '#18191b',
    codeTheme: tomorrowNight,
    highlight: '#d3d3d3',
    highlightActive: '#fff',
    commentTitle: '#494d4f',
    commentTitleText: 'rgba(255, 255, 255, 0.85)',
    commentTitleBorder: 'rgba(0, 0, 0, 0.09)',
    commentBody: '#18191b',
    commentTextArea: '#494d4f',
    commentAuthor: themeVars.theme.neutralDarkSecondaryText,
    commentRubricCommentNeutral: themeVars.theme.neutralDarkSecondaryText,
    commentShadow: '0 2px 8px rgba(255, 255, 255, 0.7)',
    buttonDangerBg: '#202223',
    buttonDangerBorder: '1px solid #57595c',
    buttonSecondaryBg: '#202223',
    buttonSecondaryBorder: '1px solid #57595c',
    buttonSecondaryColor: themeVars.theme.neutralDarkMainText,
    buttonDisabledBg: 'rgba(0, 0, 0, 0)',
    buttonDisabledColor: themeVars.theme.neutralDarkDisable,
  },
};

function togglePlaceholder(toTheme) {
  // @ts-ignore
  // tslint:disable-next-line
  console.log('placeholder toggle');
  return;
}

export const ConsoleThemeContext = React.createContext({
  consoleTheme: consoleThemes.dark, // default value
  toggleConsoleTheme: togglePlaceholder,
});