// import * as React from 'react';
// import { IComment } from '../types/common';

export default class APIUtils {
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

  public static fetchSubmissions = (assignmentId: number, identifier: string) => {
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
        return json;
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
