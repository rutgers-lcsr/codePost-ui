/**********************************************************************************************************************/
/* Legacy routing helpers built on top of react-router v7 *************************************************************/
/**********************************************************************************************************************/

/* react imports */
import { ComponentType, createContext, ReactElement, ReactNode, useContext, useMemo } from 'react';

/* other library imports */
import {
  createPath,
  matchPath,
  resolvePath,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
} from 'react-router-dom';

import type { Location, NavigationType, To } from 'react-router-dom';

/**********************************************************************************************************************/

type StringMap = Record<string, string | undefined>;

const sanitizePath = (path: string): string => {
  if (!path) {
    return '/';
  }
  if (path === '*') {
    return '*';
  }
  if (path.endsWith('/*')) {
    const trimmed = path.slice(0, -2);
    return trimmed.length === 0 ? '/' : trimmed;
  }
  return path;
};

/**********************************************************************************************************************/

export interface LegacyMatch<P extends StringMap = StringMap> {
  params: P;
  isExact: boolean;
  path: string;
  url: string;
}

export interface LegacyHistory<State = unknown> {
  length: number;
  action: NavigationType;
  location: Location & { state: State };
  push: (to: To, state?: State) => void;
  replace: (to: To, state?: State) => void;
  go: (delta: number) => void;
  goBack: () => void;
  goForward: () => void;
  listen: (_listener: () => void) => () => void;
  block: (_prompt: unknown) => () => void;
  createHref: (to: To) => string;
}

export interface LegacyRouteComponentProps<P extends StringMap = StringMap, State = unknown> {
  history: LegacyHistory<State>;
  location: Location & { state: State };
  match: LegacyMatch<P>;
  staticContext?: unknown;
}

export type RouteComponentProps<P extends StringMap = StringMap, State = unknown> = LegacyRouteComponentProps<P, State>;

/**********************************************************************************************************************/

const LegacyRouteContext = createContext<LegacyRouteComponentProps<any, any> | null>(null);

/**********************************************************************************************************************/

const useLegacyRouteProps = <P extends StringMap = StringMap, State = unknown>(
  rawPath: string,
  endMatch = false,
): LegacyRouteComponentProps<P, State> => {
  const path = sanitizePath(rawPath);
  const hasWildcard = rawPath.includes('*');
  const navigate = useNavigate();
  const navigationType = useNavigationType();
  const params = useParams() as unknown as P;
  const location = useLocation() as Location & { state: State };

  // Try to match the current location against the path
  const matchResult = useMemo(() => {
    try {
      // For wildcard paths, always use end: false
      const result = matchPath({ path, end: hasWildcard ? false : endMatch }, location.pathname);
      return result;
    } catch {
      return null;
    }
  }, [path, hasWildcard, endMatch, location.pathname]);

  const match: LegacyMatch<P> = useMemo(() => {
    if (!matchResult) {
      return {
        params,
        isExact: location.pathname === path,
        path,
        url: location.pathname,
      };
    }

    return {
      params: (matchResult.params as P) || params,
      isExact: location.pathname === matchResult.pathname,
      path: matchResult.pattern.path ?? path,
      url: matchResult.pathname,
    };
  }, [matchResult, params, location.pathname, path]);

  const history: LegacyHistory<State> = useMemo(() => {
    const createHref = (to: To) => createPath(resolvePath(to, location.pathname));

    return {
      length: window.history.length,
      action: navigationType,
      location,
      push: (to, state) => navigate(to, { state }),
      replace: (to, state) => navigate(to, { replace: true, state }),
      go: (delta) => navigate(delta),
      goBack: () => navigate(-1),
      goForward: () => navigate(1),
      listen: () => () => {
        /* noop listener */
      },
      block: () => () => {
        /* noop blocker */
      },
      createHref,
    };
  }, [navigate, navigationType, location]);

  return { history, location, match };
};

/**********************************************************************************************************************/

interface LegacyRouteRendererProps<P extends StringMap = StringMap, State = unknown> {
  path: string;
  end?: boolean;
  render: (props: LegacyRouteComponentProps<P, State>) => ReactNode;
}

export const LegacyRouteRenderer = <P extends StringMap = StringMap, State = unknown>(
  props: LegacyRouteRendererProps<P, State>,
): ReactElement => {
  const { path, end = false, render } = props;
  const routeProps = useLegacyRouteProps<P, State>(path, end);
  const element = render(routeProps);

  return <LegacyRouteContext.Provider value={routeProps}>{element}</LegacyRouteContext.Provider>;
};

/**********************************************************************************************************************/

export const useHistory = <State = unknown,>(): LegacyHistory<State> => {
  const context = useContext(LegacyRouteContext) as LegacyRouteComponentProps<any, State> | null;
  const location = useLocation() as Location & { state: State };

  if (context) {
    return context.history;
  }

  return useLegacyRouteProps(location.pathname || '/', true).history;
};

export const useRouteMatch = <P extends StringMap = StringMap>(pattern?: string | string[]): LegacyMatch<P> | null => {
  const context = useContext(LegacyRouteContext);
  const location = useLocation();

  return useMemo(() => {
    if (!pattern) {
      return (
        (context?.match as LegacyMatch<P>) ?? {
          params: {} as P,
          isExact: true,
          path: location.pathname,
          url: location.pathname,
        }
      );
    }

    const patterns = Array.isArray(pattern) ? pattern : [pattern];

    for (const candidate of patterns) {
      const sanitized = sanitizePath(candidate);
      const result = matchPath({ path: sanitized, end: !candidate.endsWith('*') }, location.pathname);

      if (result) {
        return {
          params: result.params as P,
          isExact: location.pathname === result.pathname,
          path: result.pattern.path ?? sanitized,
          url: result.pathname,
        };
      }
    }

    return null;
  }, [pattern, context, location.pathname]);
};

export const withRouter = <OwnProps extends Record<string, unknown>, P extends StringMap = StringMap, State = unknown>(
  Component: ComponentType<OwnProps & RouteComponentProps<P, State>>,
) => {
  const Wrapped = (props: OwnProps) => {
    const context = useContext(LegacyRouteContext) as RouteComponentProps<P, State> | null;
    const location = useLocation() as Location & { state: State };
    const routeProps = context ?? useLegacyRouteProps<P, State>(location.pathname || '/', true);

    return <Component {...props} {...routeProps} />;
  };

  Wrapped.displayName = `withRouter(${Component.displayName ?? Component.name ?? 'Component'})`;

  return Wrapped;
};

/**********************************************************************************************************************/
