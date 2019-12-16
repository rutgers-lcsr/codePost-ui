/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import WistiaPlayer from 'react-player/lib/players/Wistia';

/* ant imports */
import { Button, Icon, Select } from 'antd';

const { Option } = Select;

/* codePost imports */

interface IVideoSection {
  id: string;
  name: string;
  timestamp: number;
  icon: string;
}

const sections: IVideoSection[] = [
  {
    id: 'creating-assignments',
    name: 'Creating Assignments',
    timestamp: 26,
    icon: 'plus',
  },
  {
    id: 'writing-tests',
    name: 'Writing Tests',
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
    name: 'Getting Feedback',
    timestamp: 441,
    icon: 'eye',
  },
];

interface IVideoState {
  selectedSectionId: string | null;
  playedSeconds: number;
  playing: boolean;
}

/**********************************************************************************************************************/

class Video extends React.Component<{}, IVideoState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      selectedSectionId: null,
      playedSeconds: 0,
      playing: false,
    };
  }

  public componentDidMount() {
    const video = document.getElementById('video');
    console.log('vi', video);
    if (video !== null) {
      video.scrollIntoView();
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
    for (i = 0; i < sections.length - 1; i++) {
      if (state.playedSeconds < sections[0].timestamp) {
        currentSection = null;
        break;
      }
      if (state.playedSeconds >= sections[i].timestamp && state.playedSeconds < sections[i + 1].timestamp) {
        currentSection = sections[i].id;
        break;
      }
      if (i === sections.length - 2) {
        currentSection = sections[sections.length - 1].id;
        break;
      }
    }

    this.setState({ playedSeconds: state.playedSeconds, selectedSectionId: currentSection });
  };

  public seek = (seconds: number) => {
    // @ts-ignore
    this.player.seekTo(seconds);
  };
  public render() {
    return (
      <div className="video">
        <div className="video__video">
          <WistiaPlayer
            ref={this.ref}
            id="video"
            url="https://codepost.wistia.com/medias/yx1va80hcd"
            onProgress={this.handleProgress}
            height="440px"
            playing={this.state.playing}
          />
        </div>
        <div className="video__sections">
          <div style={{ paddingBottom: '20px' }}>
            <Select defaultValue="overview" size="large" style={{ width: '100%' }}>
              <Option value="overview">Overview</Option>
              <Option value="grading-teams">Grading Teams</Option>
            </Select>
          </div>
          {sections.map((section: IVideoSection) => {
            return (
              <SectionButton
                key={section.id}
                section={section}
                active={section.id === this.state.selectedSectionId}
                setSection={this.setSection}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

interface ISectionButtonProps {
  section: IVideoSection;
  active: boolean;
  setSection: (id: IVideoSection) => void;
}

const SectionButton: React.FC<ISectionButtonProps> = (props) => {
  const onClick = (e: any) => {
    props.setSection(props.section);
  };
  return (
    <div
      className={`video__sections__button video__sections__button--${props.active ? 'selected' : 'idle'}`}
      onClick={onClick}
    >
      <Icon type={props.section.icon} /> {props.section.name}
    </div>
  );
};

export default Video;
