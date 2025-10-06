// From: https://serverless-stack.com/chapters/code-splitting-in-create-react-app.html

import Loading from '../core/Loading';

const RouterLoading = (isLoading: any, error: any) => {
  // Handle the loading state
  if (isLoading) {
    return <Loading />;
  }
  // Handle the error state
  if (error) {
    return <div>Sorry, there was a problem loading the page.</div>;
  }

  return null;
};

export default RouterLoading;
