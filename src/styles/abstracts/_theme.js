// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
///// WARNING
///// If you change a variable in this file, you must make sure to also update the
///// The references in other `.scss` files
///// Currently, those include
///// _colors, _fonts, _layouts, _typography
/////
///// Since migrating back to CRA, we no longer have the JS -> SCSS prebuild pipe

// Ant Theme Overrides
// https://ant.design/docs/react/customize-theme
// https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less

// --------------- COLORS --------------- //

// Brand Colors
const brandPrimary = '#198665';
const brandLight = '#f0fff6';
const brandVibrant = '#48cc98';
const brandDark = '#17996e';
const brandAccent = '#4e78ff';
const brandBlack = '#1b1b1b';
const brandBlackHighlight = '#0f0f0f';

// Action Colors
const actionBlue = '#1890ff';
const actionBlueFade = '#40a9ff';
const actionGreen = '#198665';
const actionGreenFade = '#48cc98'; // Should these be fades?
const actionYellow = '#ffbf00';
const actionYellowFade = '#ffd129';
const actionRed = '#f64852';
const actionRedFade = '#ff7375';

// Green Palette
const green1 = '#f0fff6'; // $brandLight
const green2 = '#caf2df';
const green3 = '#9ce6c3';
const green4 = '#71d9ac';
const green5 = '#48cc98'; // $brandVibrant
const green6 = '#198665'; // $brandPrimary (WCAG AA)
const green7 = '#17996e'; // $brandDark
const green8 = '#0d7354';
const green9 = '#034d39';
const green10 = '#02261e';

// Neutral Colors - Light Background
const neutralTitle = 'rgba(0, 0, 0, 0.8)';
const neutralMainText = 'rgba(0, 0, 0, 0.7)';
// const neutralSecondaryText = 'rgba(0, 0, 0, 0.5)';
const neutralDisable = 'rgba(0, 0, 0, 0.3)';
const neutralBorder = 'rgba(0, 0, 0, 0.2)';
const neutralDivider = 'rgba(0, 0, 0, 0.1)';
const neutralBackground = 'rgba(0, 0, 0, 0.05)';

// Neutral Colors - Dark Background
const neutralDarkTitle = 'rgba(255, 255, 255, 1)';
const neutralDarkMainText = 'rgba(255, 255, 255, 0.9)';
const neutralDarkSecondaryText = 'rgba(255, 255, 255, 0.7)';
const neutralDarkDisable = 'rgba(255, 255, 255, 0.5)';
const neutralDarkBorder = 'rgba(255, 255, 255, 0.3)';
const neutralDarkDivider = 'rgba(255, 255, 255, 0.2)';
const neutralDarkBackground = 'rgba(255, 255, 255, 0.1)';

// --------------- LAYOUT --------------- //

const headerHeight = 64; // px

// --------------- FONTS --------------- //

const fontMain = "'Plus Jakarta Sans', system-ui, sans-serif";
const fontCode = 'AndaleMono, PT Mono, monospace';
const fontLogo = 'Muli, Lato, sans-serif';

// --------------- GRADE CONSTANTS --------------- //

const subheaderHeight = 116; // px
const codeLineHeight = 20; // px
const codeFontSize = 14; // px
const pageHeight = 830; // px

// FIXME: Thes should be a function of codeFontSize and codeLineHeight
const lineNumberPadding = 14.41; // px
const highlightHeight = 16; // px

const highlight = '#ffbf00';
const highlightActive = '#c0ff00';

const marginBottom = 20; // px

const codeContainerMarginTop = 0; // px
const codeContainerMarginBottom = 0; // px
const codeContainerMarginLeft = 29; // px

const codeContainerPaddingTop = 30; // px
const codeContainerPaddingBottom = 30; // px
const codeContainerPaddingRight = 0; // px
const codeContainerPaddingLeft = 0; // px

// Comments
const arrowDisplacement = 32; // px
const commentSpacing = 10; // px
const intercomDisplacement = 90; // px

const codeTargetWidth = 775; // px
const commentsTargetWidth = 360; // px

// --------------- EXPORTS --------------- //

export default {
  ant: {
    'primary-color': brandPrimary, // primary color for all components
    'link-color': actionBlue, // link color
    'success-color': actionGreen, // success state color
    'warning-color': actionYellow, // warning state color
    'error-color': actionRed, // error state color
    'font-size-base': '14px', // major text font size
    'heading-color': neutralTitle, // heading text color
    'text-color': neutralMainText, // major text color
    // 'text-color-secondary': neutralSecondaryText, // secondary text color
    'disabled-color': neutralDisable, // disable state color
    'border-radius-base': '4px', // major border radius
    'border-color-base': '#d9d9d9', // major border color
    'box-shadow-base': '0 2px 8px rgba(0, 0, 0, 0.15)', // major shadow for layer

    'btn-border-radius-base': '3px',
    'btn-border-radius-sm': '3px',
    'btn-height-sm': '20px',

    'layout-sider-background': brandBlack,
    'layout-trigger-background': brandBlackHighlight,
    'layout-body-background': '#f2f2f2',
    'layout-header-background': brandBlack,
    'layout-header-height': `${headerHeight}px`,

    'page-header-padding-horizontal': '0px',
    'layout-header-padding': '0px 61px',

    'menu-dark-submenu-bg': brandBlackHighlight,

    'heading-4-size': '16px',

    'font-family': fontMain,
    'code-family': fontCode,
  },
  theme: {
    brandPrimary: brandPrimary,
    brandLight: brandLight,
    brandVibrant: brandVibrant,
    brandDark: brandDark,
    brandAccent: brandAccent,
    brandBlack: brandBlack,

    actionBlue: actionBlue,
    actionBlueFade: actionBlueFade,
    actionGreen: actionGreen,
    actionGreenFade: actionGreenFade,
    actionYellow: actionYellow,
    actionYellowFade: actionYellowFade,
    actionRed: actionRed,
    actionRedFade: actionRedFade,

    green1: green1,
    green2: green2,
    green3: green3,
    green4: green4,
    green5: green5,
    green6: green6,
    green7: green7,
    green8: green8,
    green9: green9,
    green10: green10,

    neutralTitle: neutralTitle,
    neutralMainText: neutralMainText,
    // neutralSecondaryText: neutralSecondaryText,
    neutralDisable: neutralDisable,
    neutralBorder: neutralBorder,
    neutralDivider: neutralDivider,
    neutralBackground: neutralBackground,

    neutralDarkTitle: neutralDarkTitle,
    neutralDarkMainText: neutralDarkMainText,
    neutralDarkSecondaryText: neutralDarkSecondaryText,
    neutralDarkDisable: neutralDarkDisable,
    neutralDarkBorder: neutralDarkBorder,
    neutralDarkDivider: neutralDarkDivider,
    neutralDarkBackground: neutralDarkBackground,

    fontMain: fontMain,
    fontCode: fontCode,
    fontLogo: fontLogo,

    headerHeight: headerHeight,

    highlightHeight: highlightHeight,
    highlight: highlight,
    highlightActive: highlightActive,
  },
  grade: {
    headerHeight: headerHeight,
    subheaderHeight: subheaderHeight,

    codeLineHeight: codeLineHeight,
    pageHeight: pageHeight,
    codeFontSize: codeFontSize,
    lineNumberPadding: lineNumberPadding,
    highlightHeight: highlightHeight,
    marginBottom: marginBottom,

    codeContainer: {
      marginTop: codeContainerMarginTop,
      marginBottom: codeContainerMarginBottom,
      marginLeft: codeContainerMarginLeft,
      paddingTop: codeContainerPaddingTop,
      paddingBottom: codeContainerPaddingBottom,
      paddingRight: codeContainerPaddingRight,
      paddingLeft: codeContainerPaddingLeft,
    },

    arrowDisplacement: arrowDisplacement,
    commentSpacing: commentSpacing,
    intercomDisplacement: intercomDisplacement,

    codeTargetWidth: codeTargetWidth,
    commentsTargetWidth: commentsTargetWidth,
  },
};
