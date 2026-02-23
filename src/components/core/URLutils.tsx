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
export const encodeForLink = (pathComponent: string) => {
  return pathComponent
    .replace(/%/g, '%25')
    .replace(/\//g, '%2F')
    .replace(/#/g, '%23')
    .replace(/\?/g, '%3F')
    .replace(/&/g, '%26')
    .replace(/\+/g, '%2B')
    .replace(/,/g, '%2C')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
};

// Parentheses must be esscaped to use literally in a route
// https://github.com/ReactTraining/react-router/blob/v3/docs/guides/RouteMatching.md
export const encodeForRoute = (pathComponent: string) => {
  return encodeForLink(pathComponent);
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
