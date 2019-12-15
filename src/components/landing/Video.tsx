/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import WistiaPlayer from 'react-player/lib/players/Wistia';

/* ant imports */
import { Button, Select } from 'antd';

const { Option } = Select;

/* codePost imports */

interface IVideoSection {
  id: string;
  name: string;
  timestamp: number;
}

const sections: IVideoSection[] = [
  {
    id: 'start',
    name: 'Get Started',
    timestamp: 0,
  },
  {
    id: 'add-roster',
    name: 'Add Roster',
    timestamp: 60,
  },
  {
    id: 'write-tests',
    name: 'Write Tests',
    timestamp: 120,
  },
  {
    id: 'review-code',
    name: 'Review Code',
    timestamp: 180,
  },
];

interface IVideoState {
  selectedSectionId: string;
}

/**********************************************************************************************************************/

class Video extends React.Component<{}, IVideoState> {
  public constructor(props: any) {
    super(props);

    this.state = {
      selectedSectionId: sections[0].id,
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
  };

  public ref = (player: any) => {
    // @ts-ignore
    this.player = player;
  };

  public seek = (seconds: number) => {
    // @ts-ignore
    this.player.seekTo(seconds);
  };
  public render() {
    return (
      <div className="video">
        <div className="video__video">
          <WistiaPlayer ref={this.ref} id="video" url="https://codepost.wistia.com/medias/n0ja8jbpny" />
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
      {props.section.name}
    </div>
  );
};

export default Video;
