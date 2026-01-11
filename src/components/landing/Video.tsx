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
import { colors } from '../../theme/colors';

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
  location?: { search: string };
  containerWidth?: number;
}

/**********************************************************************************************************************/

class Video extends React.Component<IVideoProps, IVideoState> {
  private player?: unknown;

  public constructor(props: IVideoProps) {
    super(props);

    // This blob helps prevent a broken ref for the ReactPlayer onload
    // Use window.location.search as fallback if location prop is not provided
    const searchString = props.location?.search ?? window.location.search;
    const values = queryString.parse(searchString);
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

    const searchString = this.props.location?.search ?? window.location.search;
    const values = queryString.parse(searchString);
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

    // For large screens, use a max width to prevent the video from getting too wide
    const maxVideoWidth = 900;

    if (windowwidth > 1024) {
      videoWidth = Math.min(windowwidth - 200, maxVideoWidth);
    } else {
      videoWidth = windowwidth - 100;
    }

    const videoHeight = (videoWidth * 540) / 960;

    const url = this.state.selectedVideo === 'management' ? 'dkb5k6nmgb' : 'yx1va80hcd';

    const videoSelect = (
      <div style={{ paddingBottom: '20px' }}>
        <Select
          value={this.state.selectedVideo}
          size="large"
          style={{ width: '100%' }}
          onChange={this.handleChange}
          aria-label="Select video topic"
        >
          <Select.Option value="overview">Overview</Select.Option>
          <Select.Option value="management">Managing a large course</Select.Option>
        </Select>
      </div>
    );

    // Horizontal tabs for large screens
    const horizontalTabs = (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '20px',
          maxWidth: `${videoWidth}px`,
        }}
      >
        <div style={{ width: '200px', marginRight: '16px' }}>{videoSelect}</div>
        {this.state.videoSections.map((section: IVideoSection) => {
          const isActive = section.id === this.state.selectedSectionId;
          return (
            <div
              key={section.id}
              onClick={() => this.setSection(section)}
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                borderBottom: isActive ? `3px solid ${colors.brandPrimary}` : '3px solid transparent',
                color: isActive ? colors.brandPrimary : '#333',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              {iconMap[section.icon]}
              {section.name}
            </div>
          );
        })}
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {windowwidth < 1024 ? videoSelect : horizontalTabs}
        <div
          className="video__video"
          style={{
            width: `${videoWidth - 4}px`,
            height: `${videoHeight - 1}px`,
            borderRadius: '6px',
            border: `2px solid ${colors.brandPrimary}`,
            overflow: 'hidden',
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
      </div>
    );
  }
}

export default withWindowWatcher(Video);
