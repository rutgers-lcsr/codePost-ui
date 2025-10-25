/**********************************************************************************************************************/
/* Legacy React Router v5 compatibility components built atop react-router v7 ***************************************/
/**********************************************************************************************************************/

/* react imports */
import { Children, ComponentType, Fragment, ReactElement, ReactNode } from 'react';

/* other library imports */
import { Navigate, Route as RRRoute, Routes } from '../../node_modules/react-router-dom/dist/index.js';

import { LegacyRouteRenderer, RouteComponentProps } from './legacy';

type PathPattern = string | undefined;

type LegacyComponentType<P> = ComponentType<P>;

interface LegacyRouteProps<P extends Record<string, string | undefined> = Record<string, string | undefined>> {
  path?: PathPattern;
  exact?: boolean;
  render?: (props: RouteComponentProps<P>) => ReactNode;
  component?: LegacyComponentType<RouteComponentProps<P>> | LegacyComponentType<any>;
  children?: ReactNode | ((props: RouteComponentProps<P>) => ReactNode);
}

const normalizePathForMatch = (path: PathPattern) => {
  if (!path) {
    return '*';
  }
  return path;
};

const normalizePathForRoute = (path: PathPattern, exact: boolean) => {
  const normalized = normalizePathForMatch(path);

  if (normalized === '*' || exact) {
    return normalized;
  }

  if (normalized.endsWith('*')) {
    return normalized;
  }

  const trimmed = normalized.replace(/\/*$/, '');
  return `${trimmed || '/'}/*`;
};

export const Route = <P extends Record<string, string | undefined> = Record<string, string | undefined>>(
  props: LegacyRouteProps<P>,
) => {
  const { path, exact = false, render, component: Component, children } = props;

  const matchPath = normalizePathForMatch(path);
  const routePath = normalizePathForRoute(path, exact);

  let element: ReactNode;

  if (render) {
    element = <LegacyRouteRenderer path={matchPath} end={exact} render={render} />;
  } else if (Component) {
    const ResolvedComponent = Component as LegacyComponentType<RouteComponentProps<P>>;
    element = (
      <LegacyRouteRenderer
        path={matchPath}
        end={exact}
        render={(routeProps: RouteComponentProps<P>) => <ResolvedComponent {...routeProps} />}
      />
    );
  } else if (typeof children === 'function') {
    element = (
      <LegacyRouteRenderer
        path={matchPath}
        end={exact}
        render={(routeProps: RouteComponentProps<P>) => children(routeProps)}
      />
    );
  } else if (children !== undefined) {
    element = <LegacyRouteRenderer path={matchPath} end={exact} render={() => <Fragment>{children}</Fragment>} />;
  } else {
    element = <LegacyRouteRenderer path={matchPath} end={exact} render={() => null} />;
  }

  return <RRRoute path={routePath} element={element as ReactElement} />;
};

interface SwitchProps {
  children?: ReactNode;
}

export const Switch: React.FC<SwitchProps> = ({ children }) => {
  const elements = Children.toArray(children);
  return <Routes>{elements as ReactElement[]}</Routes>;
};

interface RedirectProps {
  to: string;
  push?: boolean;
}

export const Redirect: React.FC<RedirectProps> = ({ to, push }) => {
  return <Navigate to={to} replace={!push} />;
};
