/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import queryString from 'query-string';
import * as React from 'react';
import { WistiaPlayer } from '@wistia/wistia-player-react';

import {
  PlusOutlined,
  ToolOutlined,
  UploadOutlined,
  HighlightOutlined,
  LineChartOutlined,
  EyeOutlined,
  UserAddOutlined,
  CoffeeOutlined,
  FolderOutlined,
  PullRequestOutlined,
} from '@ant-design/icons';

/* ant imports */
import { Select } from 'antd';

/* codePost imports */
import withWindowWatcher, { IWithWindowWatcherProps } from '../core/withWindowWatcher';

// Icon mapping for modern antd icons
const iconMap: Record<string, React.ReactNode> = {
  plus: <PlusOutlined />,
  tool: <ToolOutlined />,
  upload: <UploadOutlined />,
  highlight: <HighlightOutlined />,
  'line-chart': <LineChartOutlined />,
  eye: <EyeOutlined />,
  'user-add': <UserAddOutlined />,
  coffee: <CoffeeOutlined />,
  folder: <FolderOutlined />,
  'pull-request': <PullRequestOutlined />,
};

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
    timestamp: 35,
    icon: 'user-add',
  },
  {
    id: 'grader-experience',
    name: 'Grader Experience',
    timestamp: 131,
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
    timestamp: 304,
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

interface IVideoProps extends IWithWindowWatcherProps {
  location: { search: string };
  containerWidth?: number;
}

/**********************************************************************************************************************/

class Video extends React.Component<IVideoProps, IVideoState> {
  private player?: unknown;

  public constructor(props: IVideoProps) {
    super(props);

    // This blob helps prevent a broken ref for the ReactPlayer onload
    const values = queryString.parse(props.location.search);
    let initialVideo = 'overview';
    if (values.video !== undefined) {
      if (values.video !== '1') {
        initialVideo = 'management';
      }
    }

    this.state = {
      selectedVideo: initialVideo,
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

  public ref = (player: unknown) => {
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
    // @ts-expect-error - player is typed as unknown but has seekTo method
    this.player.seekTo(seconds);
  };
  public render() {
    let videoWidth;

    let windowwidth = this.props.windowwidth || 1024;
    if (this.props.containerWidth) {
      windowwidth = this.props.containerWidth;
    }

    if (windowwidth > 1024) {
      videoWidth = windowwidth - 460;
    } else {
      videoWidth = windowwidth - 100;
    }

    const videoHeight = (videoWidth * 540) / 960;

    const url = this.state.selectedVideo === 'management' ? 'dkb5k6nmgb' : 'yx1va80hcd';

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
        {windowwidth < 1024 ? videoSelect : null}
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
              mediaId={url}
              height={videoHeight}
              width={videoWidth}
              style={{ transform: 'translateX(-2px)' }}
            />
          </div>
          {windowwidth > 1024 ? (
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
  const onClick = () => {
    props.setSection(props.section);
  };
  return (
    <div
      className={`video__sections__button video__sections__button--${props.active ? 'selected' : 'idle'}`}
      style={{ height: `${props.height}px`, minWidth: '260px' }}
      onClick={onClick}
    >
      {iconMap[props.section.icon]}
      <div style={{ display: 'inline-block', width: '4px' }} />
      {props.section.name}
    </div>
  );
};

export default withWindowWatcher(Video);
