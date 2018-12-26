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

  public static fetchAssignment = (assignmentId: number) => {
    return fetch(`/api/assignments/${assignmentId}/`, {
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

  public static fetchSubmissions = (assignmentId: number, UserApp: USER_APP, email: string) => {
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

    return fetch(`/api/assignments/${assignmentId}/submissions/?${identifier}`, {
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

  public static fetchSubmission = (submissionId: number) => {
    return fetch(`/api/submissions/${submissionId}/`, {
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

  public static fetchFile = (fileId: number) => {
    return fetch(`/api/files/${fileId}/`, {
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

  public static fetchComment = (commentId: number) => {
    return fetch(`/api/comments/${commentId}/`, {
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

  public static fetchRubricCategories = (assignmentId: number) => {
    return fetch(`/api/assignments/${assignmentId}/rubric/`, {
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

  public static fetchRubricComment = (rubricCommentId: number) => {
    return fetch(`/api/rubricComments/${rubricCommentId}/`, {
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
}
