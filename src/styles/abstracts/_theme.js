// Ant Theme Overrides
// https://ant.design/docs/react/customize-theme
// https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less


// --------------- COLORS --------------- //

// Brand Colors
const brandPrimary = '#24be85';
const brandLight = '#f0fff6';
const brandVibrant = '#48cc98';
const brandDark = '#17996e';
const brandAccent = '#4e78ff';
const brandBlack = '#1b1b1b';
const brandBlackHighlight = '#0f0f0f';

// Action Colors
const actionBlue = '#1890ff';
const actionBlueFade = '#40a9ff';
const actionGreen = '#24be85';
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
const green6 = '#24be85'; // $brandPrimary
const green7 = '#17996e'; // $brandDark
const green8 = '#0d7354';
const green9 = '#034d39';
const green10 = '#02261e';

// Neutral Colors - Light Background
const neutralTitle = 'rgba(0, 0, 0, 0.8)';
const neutralMainText = 'rgba(0, 0, 0, 0.7)';
const neutralSecondaryText = 'rgba(0, 0, 0, 0.5)';
const neutralDisable = 'rgba(0, 0, 0, 0.3)';
const neutralBorder = 'rgba(0, 0, 0, 0.2)';
const neutralDivider = 'rgba(0, 0, 0, 0.1)';
const neutralBackground = 'rgba(0, 0, 0, 0.05)';

// Neutral Colors - Dark Background
const neutralDarkTitle = 'rgba(1, 1, 1, 0)';
const neutralDarkMainText = 'rgba(1, 1, 1, 0.1)';
const neutralDarkSecondaryText = 'rgba(1, 1, 1, 0.3)';
const neutralDarkDisable = 'rgba(1, 1, 1, 0.5)';
const neutralDarkBorder = 'rgba(1, 1, 1, 0.7)';
const neutralDarkDivider = 'rgba(1, 1, 1, 0.8)';
const neutralDarkBackground = 'rgba(1, 1, 1, 0.9)';

// --------------- FONTS --------------- //

const fontMain = 'Avenir Next';
const fontCode = 'AndaleMono';
const fontLogo = 'Muli';

// --------------- EXPORTS --------------- //

module.exports = {
  ant: {
    'primary-color': brandPrimary, // primary color for all components
    'link-color': actionBlue, // link color
    'success-color': actionGreen, // success state color
    'warning-color': actionYellow, // warning state color
    'error-color': actionRed, // error state color
    'font-size-base': '14px', // major text font size
    'heading-color': neutralTitle, // heading text color
    'text-color': neutralMainText, // major text color
    'text-color-secondary' : neutralSecondaryText, // secondary text color
    'disabled-color' : neutralDisable, // disable state color
    'border-radius-base': '4px', // major border radius
    'border-color-base': '#d9d9d9', // major border color
    'box-shadow-base': '0 2px 8px rgba(0, 0, 0, 0.15)', // major shadow for layer

    'layout-sider-background': brandBlack,
    'layout-trigger-background': brandBlackHighlight,
    'layout-body-background': '#f2f2f2',
    'layout-header-background': brandBlack,

    'menu-dark-submenu-bg': brandBlackHighlight,

    'page-header-padding-horizontal': '0px',
    'layout-header-padding': '0px 61px',

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
    neutralSecondaryText: neutralSecondaryText,
    neutralDisable: neutralDisable,
    neutralBorder: neutralBorder,
    neutralDivider: neutralDivider,
    neutralBackground: neutralBackground,

    neutralDarkMainText: neutralDarkMainText,
    neutralDarkSecondaryText: neutralDarkSecondaryText,
    neutralDarkDisable: neutralDarkDisable,
    neutralDarkBorder: neutralDarkBorder,
    neutralDarkDivider: neutralDarkDivider,
    neutralDarkBackground: neutralDarkBackground,

    fontMain: fontMain,
    fontCode: fontCode,
    fontLogo: fontLogo,
  }
};

