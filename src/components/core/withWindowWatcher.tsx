import * as React from 'react';

export interface IWithWindowWatcherProps {
  windowwidth: number;
  windowheight: number;
}

const withWindowWatcher = <P extends IWithWindowWatcherProps>(Component: React.ComponentType<P>) => {
  return class WrappedComponent extends React.Component<
    // @ts-expect-error: legacy-ts-ignore
    Subtract<P, IWithWindowWatcherProps>,
    any
  > {
    public constructor(props: any) {
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
