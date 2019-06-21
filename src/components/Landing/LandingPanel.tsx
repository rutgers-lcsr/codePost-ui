import * as React from 'react';

type TextOrientation = 'right' | 'left';
type TextSize = 'big' | 'normal';

interface IProps {
  text: React.ReactNode;
  title: string;
  subTitle: React.ReactNode;
  module: React.ReactNode;
  type: TextOrientation;
  textSize: TextSize;
  moduleMaxWidth: number;
}

class LandingPanel extends React.PureComponent<IProps, {}> {
  private brandColor = '#24be85';
  private textColor = '#7F7F7F';
  private titleSize = this.props.textSize === 'big' ? 24 : 18;
  private subTitleSize = this.props.textSize === 'big' ? 22 : 20;
  private textSize = this.props.textSize === 'big' ? 16 : 15;

  public render() {
    const moduleDiv = <div style={{ maxWidth: this.props.moduleMaxWidth }}>{this.props.module}</div>;
    const textDiv = (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
        <div style={{ color: this.brandColor, fontSize: this.titleSize, paddingBottom: 20, fontWeight: 600 }}>
          {this.props.title}
        </div>
        <div style={{ color: this.textColor, fontSize: this.subTitleSize, paddingBottom: 20 }}>
          {this.props.subTitle}
        </div>
        <div style={{ color: this.textColor, fontSize: this.textSize, lineHeight: 1.7 }}>{this.props.text}</div>
      </div>
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'row' }}>
        <div>{this.props.type === 'left' ? textDiv : moduleDiv}</div>
        <div style={{ marginLeft: 50 }}>{this.props.type === 'left' ? moduleDiv : textDiv}</div>
      </div>
    );
  }
}

export default LandingPanel;
