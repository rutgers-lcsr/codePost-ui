// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
interface ICourseRef {
  name: string;
  period: string;
}

interface IAssignmentNameRef {
  name: string;
}

// React-router automatically encodes URI components.
//
// However, there is no isomorphism between the space of possible URLs.
// For example, consider a variable called 'foo/bar'.
// Let's use this variable to index into a route: www.myapp.com/objects/foo/bar
// The URL will by default consider foo/bar to represent two index: foo and bar.
// Only we as the app owner can disambiguate. To do this, we pre-emptively encode
// foo/bar according to https://www.w3schools.com/tags/ref_urlencode.asp
// React Router will brake routing if space is encoded.
const encodeMap: Record<string, string> = {
  '%': '%25',
  '/': '%2F',
  '#': '%23',
  '?': '%3F',
  '&': '%26',
  '+': '%2B',
  ',': '%2C',
  '(': '%28',
  ')': '%29',
};
const encodeRe = /[%/#?&+,()]/g;

export const encodeForLink = (pathComponent: string) => pathComponent.replace(encodeRe, (ch) => encodeMap[ch]);

// Characters that are special in React Router path syntax and must be escaped.
// '/' would split into separate segments, '(' and ')' are used for optional segments.
const routeEncodeMap: Record<string, string> = {
  '/': '%2F',
  '(': '%28',
  ')': '%29',
};
const routeEncodeRe = /[/()]/g;

// Parentheses must be escaped to use literally in a route
// https://github.com/ReactTraining/react-router/blob/v3/docs/guides/RouteMatching.md
// React Router v7 decodes URL segments before matching, so route paths must use
// decoded characters except for path-syntax-significant ones (/, parens).
export const encodeForRoute = (pathComponent: string) => {
  return pathComponent.replace(routeEncodeRe, (ch) => routeEncodeMap[ch]);
};

export const getRubricURL = (course: ICourseRef, assignment: IAssignmentNameRef) => {
  return `admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}/assignments/rubrics/${encodeForLink(
    assignment.name,
  )}`;
};

export const getUploadSubmissionsURL = (course: ICourseRef, assignment: IAssignmentNameRef) => {
  return `admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}/assignments/${encodeForLink(
    assignment.name,
  )}/upload/single`;
};

export const getRosterURL = (course: ICourseRef) => {
  return `admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}/roster`;
};

export const getTestsURL = (course: ICourseRef, assignment: IAssignmentNameRef) => {
  return `admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}/assignments/tests/${encodeForLink(
    assignment.name,
  )}/edit/environment`;
};

export const getSettingsURL = (course: ICourseRef, assignment: IAssignmentNameRef) => {
  return `admin/${encodeForLink(course.name)}/${encodeForLink(course.period)}/assignments/${encodeForLink(
    assignment.name,
  )}/settings`;
};
