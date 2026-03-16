// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

export interface IWithWindowWatcherProps {
  windowwidth: number;
  windowheight: number;
}

type WithoutWindowWatcherProps<P extends IWithWindowWatcherProps> = Omit<P, keyof IWithWindowWatcherProps>;

const withWindowWatcher = <P extends IWithWindowWatcherProps>(Component: React.ComponentType<P>) => {
  return class WrappedComponent extends React.Component<
    WithoutWindowWatcherProps<P>,
    { width: number; height: number }
  > {
    public constructor(props: WithoutWindowWatcherProps<P>) {
      super(props);
      this.state = { width: 0, height: 0 };
      this.updateWindowDimensions = this.updateWindowDimensions.bind(this);
    }

    public componentDidMount() {
      this.updateWindowDimensions();
      window.addEventListener('resize', this.updateWindowDimensions);
    }

    public componentWillUnmount() {
      window.removeEventListener('resize', this.updateWindowDimensions);
    }

    public updateWindowDimensions = () => {
      this.setState({ width: window.innerWidth, height: window.innerHeight });
    };

    public render() {
      return <Component {...(this.props as P)} windowwidth={this.state.width} windowheight={this.state.height} />;
    }
  };
};

export default withWindowWatcher;
