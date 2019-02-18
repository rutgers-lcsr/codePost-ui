import * as React from 'react';
import { Button } from 'react-md';

interface ISlide {
  title: string;
  imgLink: string;
  text: string;
}

interface IProps {
  content: ISlide[];
  defaultIndex: number;
  isVisible: boolean;
  closeModal: () => void;
}

interface IState {
  index: number;
}

class ModalCarousel extends React.Component<IProps, IState> {
  public state: Readonly<IState> = {
    index: this.props.defaultIndex,
  };

  public slideRight = () => {
    const oldIndex = this.state.index;
    this.setState({ index: oldIndex + 1 });
  };

  public slideLeft = () => {
    const oldIndex = this.state.index;
    if (oldIndex > 0) {
      this.setState({ index: oldIndex - 1 });
    }
  };

  public close = () => {
    this.props.closeModal();
  };

  public render() {
    const { content } = this.props;
    const { index } = this.state;

    const navDot = <div className="carousel__navDots__navDot" />;

    const navDots = Array(content.length)
      .fill(navDot)
      .map((elem, i) => {
        console.log(i);
        if (i === index) {
          return <div className="carousel__navDots__navDot--active" />;
        }
        return elem;
      });

    const thisSlide = content[index];
    if (this.props.isVisible) {
      return (
        <div className="carousel">
          <div className="carousel__close" onClick={this.close} />
          <div className="carousel__box">
            <Button
              raised
              onClick={this.slideLeft}
              flat={true}
              icon={true}
              forceIconFontSize={true}
              forceIconSize={32}
              className={`carousel__leftBtn${this.state.index === 0 ? '--hidden' : ''}`}
            >
              keyboard_arrow_left
            </Button>
            <div className="carousel__content">
              <div>
                <img className="carousel__content__image" src={thisSlide.imgLink} />
              </div>
              <div className="carousel__content__text">{thisSlide.text}</div>
            </div>
            <Button
              raised
              onClick={this.slideRight}
              flat={true}
              icon={true}
              forceIconFontSize={true}
              forceIconSize={32}
              className={`carousel__rightBtn${this.state.index === this.props.content.length - 1 ? '--hidden' : ''}`}
            >
              keyboard_arrow_right
            </Button>
          </div>
          <div className="carousel__navDots">{navDots}</div>
        </div>
      );
    } else {
      return <div />;
    }
  }
}

const adminCarouselContent = [
  {
    title: 'Get Started',
    imgLink: require('../../img/Admin-onboarding/Course-Selector.png'),
    text: 'Get started by choosing a course to view.',
  },
  {
    title: 'Submissions',
    imgLink: require('../../img/Admin-onboarding/Submissions-Student.png'),
    text: 'View all submissions by student and grader.',
  },
  {
    title: 'Submissions - By Student or Grader',
    imgLink: require('../../img/Admin-onboarding/Submissions-Student-DoubleClick.png'),
    text: 'Double click on any student or grader to get more details about his/her submissions.',
  },
  {
    title: 'Assignments',
    imgLink: require('../../img/Admin-onboarding/Assignments.png'),
    text: 'Keep track of all assignments, including real-time data on statistics.',
  },
  {
    title: 'Assignments - Rubric',
    imgLink: require('../../img/Admin-onboarding/Assignments-Rubric.png'),
    text: 'Maintain standard assignment rubrics, to be used as a scoring guideline by graders.',
  },
  {
    title: 'Roster',
    imgLink: require('../../img/Admin-onboarding/Roster-Students.png'),
    text: 'Manage the course roster of students, graders, administrators, and sections.',
  },
  {
    title: 'Roster - Grader Priviliges',
    imgLink: require('../../img/Admin-onboarding/Roster-Sections.png'),
    text: 'Manage grader privileges, such as the ability to manage all students in a section.',
  },
  {
    title: 'Create Course',
    imgLink: require('../../img/Admin-onboarding/CreateCourse.png'),
    text: 'Replicate new courses each semester from historical courses, copying all assignments and rubrics.',
  },
  {
    title: 'codePost API',
    imgLink: require('../../img/Admin-onboarding/Api-Docs.png'),
    text:
      "Write scripts to interact with codePost's api for complete course control. \
      See the documentation at https://docs.codepost.io. \
      A unique API key is provided in user settings. ",
  },
];
export { ModalCarousel, adminCarouselContent };
