import * as React from 'react';
interface IProps {
  topBar: React.ReactNode;
  hero: React.ReactNode;
  testimonial: React.ReactNode;
  whyPanel: React.ReactNode;
  panelOne: React.ReactNode;
  panelTwo: React.ReactNode;
  panelThree: React.ReactNode;
  getStarted: React.ReactNode;
  footer: React.ReactNode;
}

class LandingLayout extends React.PureComponent<IProps, {}> {
  private maxWidth = 1100;

  // Panel Background Colors
  private heroColor = '#F9F9F9';
  private whyPanelColor = '#FFFFFF';
  private panelOneColor = '#F9F9F9';
  private panelTwoColor = '#EBEBEB';
  private panelThreeColor = '#F9F9F9';
  private GetStartedColor = '#FFFFFF';
  private footerColor = '#EBEBEB';

  private flexDirectionColumn: any = 'row';
  private sectionStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: this.flexDirectionColumn,
    paddingRight: 25,
    paddingLeft: 25,
  };

  private panelStyle = {
    maxWidth: this.maxWidth,
    paddingTop: 100,
    paddingBottom: 100,
    paddingLeft: 50,
    paddingRight: 50,
  };

  public render() {
    return (
      <div style={{ width: '100vw' }}>
        <div style={{ ...this.sectionStyle, background: this.heroColor }}>
          <div style={{ maxWidth: this.maxWidth + 50, width: '100%', paddingTop: 50, paddingBottom: 25 }}>
            {this.props.topBar}
          </div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.heroColor, paddingLeft: 75, paddingRight: 75 }}>
          <div style={{ maxWidth: this.maxWidth, paddingTop: 50, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ maxWidth: 500 }}>{this.props.hero}</div>
            <div style={{ maxWidth: 615 }}>
              <img style={{ maxWidth: '100%' }} src={require('./landing_illustration.png')} />
            </div>
          </div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.heroColor }}>
          <div
            style={{
              paddingTop: 75,
              paddingBottom: 50,
              paddingLeft: 25,
              paddingRight: 25,
              width: '100%',
              maxWidth: this.maxWidth,
            }}
          >
            {this.props.testimonial}
          </div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.whyPanelColor }}>
          <div style={this.panelStyle}>{this.props.whyPanel}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.panelOneColor }}>
          <div style={this.panelStyle}>{this.props.panelOne}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.panelTwoColor }}>
          <div style={this.panelStyle}>{this.props.panelTwo}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.panelThreeColor }}>
          <div style={this.panelStyle}>{this.props.panelThree}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.GetStartedColor }}>
          <div style={{ maxWidth: this.maxWidth, width: '100%', paddingTop: 50, paddingBottom: 50 }}>
            {this.props.getStarted}
          </div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.footerColor }}>
          <div style={{ maxWidth: 1200, width: '100%' }}>{this.props.footer}</div>
        </div>
      </div>
    );
  }
}

export default LandingLayout;
