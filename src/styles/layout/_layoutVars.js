// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// Layout contansts and variable

// Breakpoints
const studentMobileBreakpoint = 500;
const peripheralMobileBreakpoint = 500;

const gradeSmallScreenBreakpoint = 1025;
const gradeHeaderSmallScreenBreakpoint = 750; //breakpoint at which gradeHeader goes to smallest possible view

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

export default {
  breakpoints: {
    mobile: {
      student: studentMobileBreakpoint,
      peripheral: peripheralMobileBreakpoint,
    },
    smallScreen: {
      grade: gradeSmallScreenBreakpoint,
      gradeHeader: gradeHeaderSmallScreenBreakpoint,
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
