import * as React from 'react';

const withWindowWatcher = (Component: React.ComponentType<any>) => {
  return class WrappedComponent extends React.Component<any, any> {
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
      return <Component {...this.props} windowWidth={this.state.width} windowHeight={this.state.height} />;
    }
  };
};

export default withWindowWatcher;
