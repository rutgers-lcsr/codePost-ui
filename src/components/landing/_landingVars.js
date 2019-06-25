// Landing constants and variables

// Breakpoints
const mobileBreakpont = 450;
const headerBreakPoint = 750; // point at which header switches to collapsible panel
const heroBreakPoint = 850; // point at which hero switches to vertical
const verticalPanelsBreakpoint = 1000; // point at which horizontal panels change to vertical
const removeModuleBreakpoint = 600; // point at which modules specified for removal on small screens are removed
const testimonialBreakPoint = 900;
const getStartedBreakpoint = 625;

// Maximum Widths
const panelMaxWidth = 1100; // Maximum width for the panels to keep narrow look
const headerMaxWidth = 1150; // Maximum width for the header
const whyPanelMaxWidth = 1250; // The why panel is a bit larger and needs more space than other panels
const footerMaxWidth = 1200;
const backgroundImageWidthNormal = 1750; // This is the width of the images normally
const backgroundImageWidthMobile = 450; // This is the width of the images on mobile (when  mobileBreakpoint is triggered)
const heroTextMaxWidth = 500; // Maximum width of hero text (left side)
const heroImgMaxWidthNormal = 615;
const heroImgMaxWidthSmallScreen = 500;
const apiExampleMaxWidth = 900;

// Panel Background Colors
const heroColor = 'rgba(0,0,0,0)';
const whyPanelColor = 'rgba(0,0,0,0)';
const panelOneColor = 'rgba(0,0,0,0)';
const panelTwoColor = 'rgba(0,0,0,0)';
const panelThreeColor = 'rgba(0,0,0,0)';
const GetStartedColor = 'rgba(0,0,0,0)';
const footerColor = '#EBEBEB';

// Vertical Padding
const panelVPaddingNormal = 50;
const panelVPaddingSmallScreen = 25;
const headerVPaddingNormal = 50;
const headerVPaddingSmallScreen = 20;
const getStartedVPaddingNormal = 50;

// horizontal padding
const testimonialHPadding = 25;
const panelHPadding = 50;

// Background Image offsets -- These are the vertical offsets for the background images,
// in number of pixels relative to the start of their respective panel
const testimonialImgOffset = 25;
const whyPanelImgOffset = 175;
const panelOneImgOffset = 100;
const panelTwoImgOffset = 300;
const panelThreeImgOffset = 200;
const testimonialImgOffsetMobile = 25;
const whyPanelImgOffsetMobile = 50;
const panelOneImgOffsetMobile = 325;
const panelTwoImgOffsetMobile = 515;
const panelThreeImgOffsetMobile = 250;

module.exports = {
  breakpoints: {
    mobile: mobileBreakpont,
    header: headerBreakPoint,
    hero: heroBreakPoint,
    verticalPanels: verticalPanelsBreakpoint,
    removeModule: removeModuleBreakpoint,
    testimonial: testimonialBreakPoint,
    getStarted: getStartedBreakpoint,
  },
  backgrounds: {
    hero: heroColor,
    whyPanel: whyPanelColor,
    panelOne: panelOneColor,
    panelTwo: panelTwoColor,
    panelThree: panelThreeColor,
    getStarted: GetStartedColor,
    footer: footerColor,
  },
  maxWidths: {
    panel: panelMaxWidth,
    header: headerMaxWidth,
    whyPanel: whyPanelMaxWidth,
    footer: footerMaxWidth,
    backgroundImageNormal: backgroundImageWidthNormal,
    backgroundImageMobile: backgroundImageWidthMobile,
    heroText: heroTextMaxWidth,
    heroImgNormal: heroImgMaxWidthNormal,
    heroImgSmallScreen: heroImgMaxWidthSmallScreen,
    apiExample: apiExampleMaxWidth,
  },
  Vpadding: {
    panelNormal: panelVPaddingNormal,
    panelSmallScreen: panelVPaddingSmallScreen,
    headerNormal: headerVPaddingNormal,
    headerSmallScreen: headerVPaddingSmallScreen,
    getStartedNormal: getStartedVPaddingNormal,
  },
  Hpadding: {
    testimonial: testimonialHPadding,
    panel: panelHPadding,
  },
  backgroundOffsets: {
    testimonial: testimonialImgOffset,
    whyPanel: whyPanelImgOffset,
    panelOne: panelOneImgOffset,
    panelTwo: panelTwoImgOffset,
    panelThree: panelThreeImgOffset,
    testimonialMobile: testimonialImgOffsetMobile,
    whyPanelMobile: whyPanelImgOffsetMobile,
    panelOneMobile: panelOneImgOffsetMobile,
    panelTwoMobile: panelTwoImgOffsetMobile,
    panelThreeMobile: panelThreeImgOffsetMobile,
  },
};
