/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import WistiaPlayer from 'react-player/lib/players/Wistia';
import queryString from 'query-string';

/* ant imports */
import { Icon, Select } from 'antd';

/* codePost imports */
import withWindowWatcher from '../core/withWindowWatcher';

interface IVideoSection {
  id: string;
  name: string;
  timestamp: number;
  icon: string;
}

const overviewSections: IVideoSection[] = [
  {
    id: 'creating-assignments',
    name: 'Creating Assignments',
    timestamp: 26,
    icon: 'plus',
  },
  {
    id: 'writing-tests',
    name: 'Writing Automated Tests',
    timestamp: 41,
    icon: 'tool',
  },
  {
    id: 'student-submission',
    name: 'Student Submission',
    timestamp: 164,
    icon: 'upload',
  },
  {
    id: 'manual-review',
    name: 'Manual Review',
    timestamp: 229,
    icon: 'highlight',
  },
  {
    id: 'post-grading',
    name: 'Post Grading',
    timestamp: 399,
    icon: 'line-chart',
  },
  {
    id: 'getting-feedback',
    name: 'Returning Feedback',
    timestamp: 441,
    icon: 'eye',
  },
];

const managementSections: IVideoSection[] = [
  {
    id: 'adding-staff',
    name: 'Adding Staff',
    timestamp: 34,
    icon: 'user-add',
  },
  {
    id: 'grader-experience',
    name: 'Grader Experience',
    timestamp: 130,
    icon: 'coffee',
  },
  {
    id: 'sections',
    name: 'Sections',
    timestamp: 243,
    icon: 'folder',
  },
  {
    id: 'quality-control',
    name: 'Quality Control',
    timestamp: 303,
    icon: 'pull-request',
  },
];

interface IVideoState {
  selectedVideo: string;
  videoSections: IVideoSection[];
  selectedSectionId: string | null;
  playedSeconds: number;
  playing: boolean;
}

/**********************************************************************************************************************/

class Video extends React.Component<any, IVideoState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      selectedVideo: 'overview',
      videoSections: overviewSections,
      selectedSectionId: null,
      playedSeconds: 0,
      playing: false,
    };
  }

  public componentDidMount() {
    const video = document.getElementById('video');

    // URL setup
    // codepost.io/?video=1&section=post-grading

    const values = queryString.parse(this.props.location.search);
    if (values.video !== undefined && video !== null) {
      video.scrollIntoView();

      if (values.video !== '1') {
        const sections = managementSections;
        this.setState({ selectedVideo: 'management', videoSections: managementSections });

        if (values.section !== undefined) {
          const section = sections.filter((s: IVideoSection) => {
            return s.id === values.section;
          });

          if (section.length > 0) {
            this.setSection(section[0]);
          }
        }
      } else {
        if (values.section !== undefined) {
          const section = this.state.videoSections.filter((s: IVideoSection) => {
            return s.id === values.section;
          });

          if (section.length > 0) {
            this.setSection(section[0]);
          }
        }
      }
    }
  }

  public setSection = (section: IVideoSection) => {
    this.setState({ selectedSectionId: section.id });
    this.seek(section.timestamp);
    this.play();
  };

  public ref = (player: any) => {
    // @ts-ignore
    this.player = player;
  };

  public play = () => {
    this.setState({ playing: true });
  };

  public pause = () => {
    this.setState({ playing: false });
  };

  public handleProgress = (state: { playedSeconds: number; played: number }) => {
    let currentSection = null;
    let i;
    for (i = 0; i < this.state.videoSections.length - 1; i++) {
      if (state.playedSeconds < this.state.videoSections[0].timestamp) {
        currentSection = null;
        break;
      }
      if (
        state.playedSeconds >= this.state.videoSections[i].timestamp &&
        state.playedSeconds < this.state.videoSections[i + 1].timestamp
      ) {
        currentSection = this.state.videoSections[i].id;
        break;
      }
      if (i === this.state.videoSections.length - 2) {
        currentSection = this.state.videoSections[this.state.videoSections.length - 1].id;
        break;
      }
    }

    this.setState({ playedSeconds: state.playedSeconds, selectedSectionId: currentSection });
  };

  public handleChange = (selectedVideo: string) => {
    const videoSections = selectedVideo === 'management' ? managementSections : overviewSections;
    this.setState({ selectedVideo, videoSections });
  };

  public seek = (seconds: number) => {
    // @ts-ignore
    this.player.seekTo(seconds);
  };
  public render() {
    let videoWidth;

    if (this.props.windowwidth > 1024) {
      videoWidth = this.props.windowwidth - 460;
    } else {
      videoWidth = this.props.windowwidth - 100;
    }

    const videoHeight = (videoWidth * 540) / 960;

    const url =
      this.state.selectedVideo === 'management'
        ? 'https://codepost.wistia.com/medias/dkb5k6nmgb'
        : 'https://codepost.wistia.com/medias/yx1va80hcd';

    const videoSelect = (
      <div style={{ paddingBottom: '20px' }}>
        <Select value={this.state.selectedVideo} size="large" style={{ width: '100%' }} onChange={this.handleChange}>
          <Select.Option value="overview">Overview</Select.Option>
          <Select.Option value="management">Managing a large course</Select.Option>
        </Select>
      </div>
    );

    return (
      <div>
        {this.props.windowwidth < 1024 ? videoSelect : null}
        <div className="video">
          <div
            className="video__video"
            style={{
              width: `${videoWidth - 4}px`,
              height: `${videoHeight - 1}px`,
              borderRadius: '6px',
              border: '2px solid #24be85',
              overflow: 'hidden',
              display: 'inline-block',
            }}
          >
            <WistiaPlayer
              ref={this.ref}
              id="video"
              url={url}
              onProgress={this.handleProgress}
              height={`${videoHeight}px`}
              width={`${videoWidth}px`}
              playing={this.state.playing}
              style={{ transform: 'translateX(-2px)' }}
            />
          </div>
          {this.props.windowwidth > 1024 ? (
            <div className="video__sections" style={{ display: 'inline-block' }}>
              {videoSelect}
              {this.state.videoSections.map((section: IVideoSection) => {
                return (
                  <SectionButton
                    key={section.id}
                    section={section}
                    active={section.id === this.state.selectedSectionId}
                    setSection={this.setSection}
                    height={videoHeight / this.state.videoSections.length - 62 / this.state.videoSections.length}
                  />
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
}

interface ISectionButtonProps {
  section: IVideoSection;
  active: boolean;
  setSection: (id: IVideoSection) => void;
  height: number;
}

const SectionButton: React.FC<ISectionButtonProps> = (props) => {
  const onClick = (e: any) => {
    props.setSection(props.section);
  };
  return (
    <div
      className={`video__sections__button video__sections__button--${props.active ? 'selected' : 'idle'}`}
      style={{ height: `${props.height}px`, minWidth: '260px' }}
      onClick={onClick}
    >
      <Icon type={props.section.icon} />
      <div style={{ display: 'inline-block', width: '4px' }} />
      {props.section.name}
    </div>
  );
};

export default withWindowWatcher(Video);
