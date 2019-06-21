import { Divider } from 'antd';

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
  private heroColor = 'rgba(0,0,0,0)';
  private whyPanelColor = 'rgba(0,0,0,0)';
  private panelOneColor = 'rgba(0,0,0,0)';
  private panelTwoColor = 'rgba(0,0,0,0)';
  private panelThreeColor = 'rgba(0,0,0,0)';
  private GetStartedColor = 'rgba(0,0,0,0)';
  private footerColor = '#EBEBEB';

  private flexDirectionColumn: any = 'row';
  private sectionStyle = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    flexDirection: this.flexDirectionColumn,
  };

  private panelStyle = {
    maxWidth: this.maxWidth,
    paddingTop: 100,
    paddingBottom: 100,
    paddingLeft: 50,
    paddingRight: 50,
  };

  private absolutePosition: any = 'absolute';
  private backgroundImageStyle = {
    zIndex: -1,
    position: this.absolutePosition,
    width: 1750,
  };

  public render() {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          overflowX: 'hidden',
          position: 'relative',
          scrollSnapType: 'y mandatory',
          overflowY: 'scroll',
          display: 'flex',
          flexDirection: 'column',
        }}
        id="LandingLayout"
      >
        <div style={{ ...this.sectionStyle, background: this.heroColor, scrollSnapAlign: 'start' }}>
          <div style={{ maxWidth: this.maxWidth + 50, width: '100%', paddingTop: 70, paddingBottom: 70 }}>
            {this.props.topBar}
          </div>
        </div>
        <div style={{ scrollSnapAlign: 'center' }}>
          <div style={{ ...this.sectionStyle, background: this.heroColor, paddingLeft: 75, paddingRight: 75 }}>
            <div style={{ maxWidth: this.maxWidth, paddingTop: 50, display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ maxWidth: 500 }}>{this.props.hero}</div>
              <div style={{ maxWidth: 615 }}>
                <img style={{ maxWidth: '100%' }} src={require('./landing_illustration.png')} />
              </div>
            </div>
          </div>
          <div style={{ ...this.sectionStyle, background: this.heroColor }}>
            <img
              src={require('../../img/landing/backgrounds/testimonial_background.png')}
              style={{ ...this.backgroundImageStyle, paddingTop: 25 }}
            />
            <div
              style={{
                paddingTop: 100,
                paddingBottom: 0,
                paddingLeft: 25,
                paddingRight: 25,
                width: '100%',
                maxWidth: this.maxWidth,
              }}
            >
              {this.props.testimonial}
            </div>
          </div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.whyPanelColor, scrollSnapAlign: 'center' }}>
          <img
            src={require('../../img/landing/backgrounds/whyPanel_background.png')}
            style={{ ...this.backgroundImageStyle, paddingTop: 175 }}
          />
          <div style={{ ...this.panelStyle, maxWidth: this.maxWidth + 150 }}>{this.props.whyPanel}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.panelOneColor, scrollSnapAlign: 'center' }}>
          <img
            src={require('../../img/landing/backgrounds/panelOne_background.png')}
            style={{ ...this.backgroundImageStyle, paddingTop: 100 }}
          />
          <div style={this.panelStyle}>{this.props.panelOne}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.panelTwoColor, scrollSnapAlign: 'center' }}>
          <img
            src={require('../../img/landing/backgrounds/panelTwo_background.png')}
            style={{ ...this.backgroundImageStyle, paddingTop: 300 }}
          />
          <div style={this.panelStyle}>{this.props.panelTwo}</div>
        </div>
        <div style={{ ...this.sectionStyle, background: this.panelThreeColor }}>
          <img
            src={require('../../img/landing/backgrounds/panelThree_background.png')}
            style={{ ...this.backgroundImageStyle, paddingTop: 200 }}
          />
          <div style={{ ...this.panelStyle, paddingBottom: 25 }}>{this.props.panelThree}</div>
        </div>
        <div style={{ scrollSnapAlign: 'start' }}>
          <Divider />
          <div style={{ ...this.sectionStyle, background: this.GetStartedColor }}>
            <div style={{ maxWidth: this.maxWidth, width: '100%', paddingTop: 50, paddingBottom: 50 }}>
              {this.props.getStarted}
            </div>
          </div>
          <div style={{ ...this.sectionStyle, background: this.footerColor }}>
            <div style={{ maxWidth: 1200, width: '100%' }}>{this.props.footer}</div>
          </div>
        </div>
      </div>
    );
  }
}

export default LandingLayout;
