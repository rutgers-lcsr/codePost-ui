import * as React from 'react';
import TopBar from './components/TopBar'
import './styles/index.scss';

class Grader extends React.Component {
  public render() {
    return (
      <div className="App">
        <TopBar />
        <p>
          This is the grader page
        </p>
      </div>
    );
  }

  // private loadCourses = () => {
  //   $.ajax({
  //     beforeSend: (xhr: any) => {
  //       xhr.setRequestHeader("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
  //     },
  //     cache: true,
  //     dataType: 'json',
  //     error: (xhr: any, status: any, err: any) => {
  //       console.error(xhr, status, err.toString());
  //     },
  //     success: (data: any) => {
  //       this.setState({ courses: data });
  //     },
  //     url: '/api/courses/me/?app=student'
  //   });
  // };

  // private loadSubmission = (id: string | number) => {
  //   $.ajax({
  //     beforeSend: (xhr: any) => {
  //       xhr.setRequestHeader("Authorization", "Basic " + btoa("rjfreling@gmail.com:pass"));
  //     },
  //     cache: true,
  //     dataType: 'json',
  //     error: (xhr: any, status: any, err: any) => {
  //       console.error(xhr, status, err.toString());
  //     },
  //     success: (data: any) => {
  //       if (data.length > 0) {
  //         this.setState({ currentSubmission: data[0] });
  //       }
  //       else {
  //         this.setState({ currentSubmission: undefined });
  //       }
  //     },
  //     url: `/api/assignments/${id}/submissions/`
  //   });
  // };

}

export default Grader;