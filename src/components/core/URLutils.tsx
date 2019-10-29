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
    .replace('%', '%25')
    .replace('/', '%2F')
    .replace('#', '%23')
    .replace('?', '%3F')
    .replace('&', '%26')
    .replace('+', '%2B')
    .replace(',', '%2C');
};

// Parentheses must be esscaped to use literally in a route
// https://github.com/ReactTraining/react-router/blob/v3/docs/guides/RouteMatching.md
export const encodeForRoute = (pathComponent: string) => {
  return encodeForLink(pathComponent)
    .replace('(', '\\(')
    .replace(')', '\\)');
};
