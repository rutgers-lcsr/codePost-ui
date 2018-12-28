// import * as React from 'react';
import { USER_APP } from './types/common';

export default class APIUtils {
  // Unique fetch in that it returns a tuple: [email, courses]
  public static fetchUser = (UserApp: USER_APP) => {
    let courses: string;
    switch (UserApp) {
      case USER_APP.Student:
        courses = 'studentCourses';
        break;
      case USER_APP.Grader:
        courses = 'graderCourses';
        break;
      case USER_APP.CourseAdmin:
        courses = 'adminCourses';
        break;
    }

    return fetch('/api/users/me/', {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return [json.email, json[courses]];
      });
  };

  public static fetchAssignment = (assignmentID: number) => {
    return fetch(`/api/assignments/${assignmentID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public static fetchSubmissions = (assignmentID: number, UserApp: USER_APP, email: string) => {
    let identifier: string = '';
    switch (UserApp) {
      case USER_APP.Student:
        identifier = `student=${email}`;
        break;
      case USER_APP.Grader:
        identifier = `grader=${email}`;
        break;
      case USER_APP.CourseAdmin:
        identifier = `admin=${email}`;
        break;
    }

    return fetch(`/api/assignments/${assignmentID}/submissions/?${identifier}`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public static fetchSubmission = (submissionID: number) => {
    return fetch(`/api/submissions/${submissionID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        if (json.detail === 'Not found.') {
          return undefined;
        } else {
          return json;
        }
      });
  };

  public static fetchFile = (fileID: number) => {
    return fetch(`/api/files/${fileID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public static fetchComment = (commentID: number) => {
    return fetch(`/api/comments/${commentID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public static fetchRubricCategories = (assignmentID: number) => {
    return fetch(`/api/assignments/${assignmentID}/rubric/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        console.log('json', json);
        // temp fix to conform to new api
        const categories = 'categories';
        return json[categories];
      });
  };

  public static fetchRubricComment = (rubricCommentID: number) => {
    return fetch(`/api/rubricComments/${rubricCommentID}/`, {
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
      },
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };

  public static updateSubmission = (submissionID: number, payload: any) => {
    return fetch(`/api/submissions/${submissionID}/`, {
      body: JSON.stringify(payload),
      headers: {
        Authorization: `JWT ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })
      .then((res) => {
        return res.json();
      })
      .then((json) => {
        return json;
      });
  };
}
