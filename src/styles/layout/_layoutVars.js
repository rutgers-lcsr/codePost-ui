// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
// Layout contansts and variable

// Breakpoints
const studentMobileBreakpoint = 500;
const peripheralMobileBreakpoint = 500;

const gradeSmallScreenBreakpoint = 1025;
const gradeHeaderSmallScreenBreakpoint = 750; //breakpoint at which gradeHeader goes to smallest possible view

const adminSmallScreenBreakpoint = 1000;
const adminCompactBreakpoint = 800; // Compact layout for narrow/embedded views
// Below this the assignments table folds its seven row actions into one menu; from 1440 up they all fit
// beside the labelled progress column (measured: 1366 still clips the delete icon).
const assignmentActionsCompactBreakpoint = 1440;

// maxWidths
const homeMaxWidth = 600;
const gradeSiderMaxWidthNormal = 300; // Fat sider for grade screens
const gradeSiderMaxWidthSmallScreen = 200; // Fat sider for grade screen

const siderMaxWidthNormal = 220; // Normal sider for course management screens ("Environment & Tests" fits)
const siderMaxWidthSmallScreen = 165; // Normal sider for course management screens
const siderMaxWidthCompact = 130; // Compact sider for narrow embedded views

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
      adminCompact: adminCompactBreakpoint,
      assignmentActionsCompact: assignmentActionsCompactBreakpoint,
    },
  },
  maxWidths: {
    home: homeMaxWidth,
    gradeSiderNormal: gradeSiderMaxWidthNormal,
    gradeSiderSmallScreen: gradeSiderMaxWidthSmallScreen,
    siderNormal: siderMaxWidthNormal,
    siderSmallScreen: siderMaxWidthSmallScreen,
    siderCompact: siderMaxWidthCompact,
  },
  minWidths: {
    grade: gradeMinWidth,
    admin: adminMinWidth,
  },
};
