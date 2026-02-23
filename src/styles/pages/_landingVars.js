// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// Landing constants and variables

// Breakpoints
const mobileBreakpont = 450;
const headerBreakPoint = 872; // point at which header switches to collapsible panel
const heroBreakPoint = 1000; // point at which hero switches to vertical
const verticalPanelsBreakpoint = 1000; // point at which horizontal panels change to vertical
const removeModuleBreakpoint = 600; // point at which modules specified for removal on small screens are removed
const testimonialBreakPoint = 900;
const getStartedBreakpoint = 625; //point at which buttons and text become a column
const faqBreakpoint = 700; // point at which FAQ turns into one column
const whyUseBreakPont = 900;

// Maximum Widths
const panelMaxWidth = 1150; // Maximum width for the panels to keep narrow look
const headerMaxWidth = 1200; // Maximum width for the header
const whyPanelMaxWidth = 1125;
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
const panelVPaddingNormal = 75;
const panelVPaddingSmallScreen = 25;
const whyPanelVPaddingNormal = 25;
const whyPanelVPaddingSmallScreen = 25;
const headerVPaddingNormal = 0;
const headerVPaddingSmallScreen = 20;
const getStartedVPaddingNormal = 70;
const heroVPaddingNormal = 50;
const heroVPaddingSmallScreen = 25;

// horizontal padding
const testimonialHPadding = 25;
const panelHPaddingNormal = 50;
const panelHPaddingMobile = 25;

// Background Image offsets -- These are the vertical offsets for the background images,
// in number of pixels relative to the start of their respective panel
const testimonialImgOffset = 75;
const whyPanelImgOffset = 450;
const panelOneImgOffset = 250;
const panelTwoImgOffset = 0;
const panelThreeImgOffset = 200;
const testimonialImgOffsetMobile = 25;
const whyPanelImgOffsetMobile = 50;
const panelOneImgOffsetMobile = 545;
const panelTwoImgOffsetMobile = 450;
const panelThreeImgOffsetMobile = 250;

export default {
  breakpoints: {
    mobile: mobileBreakpont,
    header: headerBreakPoint,
    hero: heroBreakPoint,
    verticalPanels: verticalPanelsBreakpoint,
    removeModule: removeModuleBreakpoint,
    testimonial: testimonialBreakPoint,
    getStarted: getStartedBreakpoint,
    faq: faqBreakpoint,
    whyUse: whyUseBreakPont,
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
    heroNormal: heroVPaddingNormal,
    heroImgSmallScreen: heroVPaddingSmallScreen,
    whyPanelNormal: whyPanelVPaddingNormal,
    whyPanelSmallScreen: whyPanelVPaddingSmallScreen,
  },
  Hpadding: {
    testimonial: testimonialHPadding,
    panelNormal: panelHPaddingNormal,
    panelMobile: panelHPaddingMobile,
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
