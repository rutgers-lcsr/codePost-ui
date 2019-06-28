// Layout contansts and variable

// Breakpoints
const studentMobileBreakpoint = 500;
const gradeSmallScreenBreakpoint = 1000;
const adminSmallScreenBreakpoint = 1000;

// maxWidths
const homeMaxWidth = 600;
const gradeSiderMaxWidthNormal = 300; // Fat sider for grade screens
const gradeSiderMaxWidthSmallScreen = 200; // Fat sider for grade screen

const siderMaxWidthNormal = 200; // Normal sider for course management screens
const siderMaxWidthSmallScreen = 165; // Normal sider for course management screens

// minWidths, after which the page will scroll
const gradeMinWidth = 600; // minimum width of the grade content
const adminMinWidth = 700; // minimum with of the admin content

module.exports = {
  breakpoints: {
    mobile: {
      student: studentMobileBreakpoint,
    },
    smallScreen: {
      grade: gradeSmallScreenBreakpoint,
      admin: adminSmallScreenBreakpoint,
    },
  },
  maxWidths: {
    home: homeMaxWidth,
    gradeSiderNormal: gradeSiderMaxWidthNormal,
    gradeSiderSmallScreen: gradeSiderMaxWidthSmallScreen,
    siderNormal: siderMaxWidthNormal,
    siderSmallScreen: siderMaxWidthSmallScreen,
  },
  minWidths: {
    grade: gradeMinWidth,
    admin: adminMinWidth,
  },
};
