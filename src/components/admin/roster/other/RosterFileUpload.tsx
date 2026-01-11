/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';

/* style imports */
import { UserAddOutlined } from '@ant-design/icons';
import { Alert, Button, Divider, Modal, Result, Steps, Table } from 'antd';

import { colors } from '../../../../theme/colors';

/* codePost imports */

import { rosterToCsv } from './DownloadRoster';

import RosterInput from './RosterInput';

// type definitions
import { CourseType } from '../../../../infrastructure/course';
import { SectionType } from '../../../../infrastructure/section';
import { USER_APP, USER_TYPE } from '../../../../types/common';

import CPButton from '../../../../components/core/CPButton';
import CPTooltip from '../../../../components/core/CPTooltip';
import { tooltips } from '../../../../components/core/tooltips';

import { sendSlack } from '../../../../components/core/slack';

/**********************************************************************************************************************/

/*****************************************************/
/* Here's how this component works:
/* (1) Accept .json or .csv
/* (2) Parse file for errors
/* (3) If no errors, calculate diff between uploaded file and existing roster
/* (4) If user accepts diff, execute changes
/*****************************************************/

/* keep track of which step we're on  */
enum UPLOAD_STATUS {
  UPLOAD,
  REVIEW,
  SAVE,
}

interface IUserProperties {
  section?: string | null; // null = No section, undefined = not set
}

interface IUserMap {
  [email: string]: IUserProperties;
}

/* format in which we store information about the difference between two rosters:
 * the one uploaded by the user, and the one currently saved in codePost.
 */
interface IChangeType {
  deleted: IUserMap;
  added: IUserMap;

  /* old and new keys map to objects which can store arbitrary properties of
   * users, which have changed. For now, the object corresponds to {section: sectionName}
   */
  changed: {
    [studentEmail: string]: { old: IUserProperties; new: IUserProperties };
  };
}

interface IProps {
  /* data */
  students: string[];
  graders: string[];
  admins: string[];
  sections: SectionType[];
  sectionsByStudent: { [studentEmail: string]: SectionType };

  course: CourseType;

  /* UI control */
  isDisabled: boolean;
  emailNewUsers: boolean;

  /* object level REST operations */
  changeRoster: (adds: string[], deletes: string[], userType: USER_APP) => Promise<void>;
  updateSection: (section: SectionType) => Promise<void>;
  createSection: (sectionName: string) => Promise<SectionType>;

  /* role type we are editing through this component */
  roleType: 'student' | 'grader' | 'admin';

  buttonText?: string;
}

const validateEmail = (email: string) => {
  // 🙏 https://stackoverflow.com/questions/46155/how-to-validate-an-email-address-in-javascript
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

const RosterFileUpload: React.FC<IProps> = (props) => {
  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [updatingRoster, setUpdatingRoster] = useState<boolean>(false);
  const [updates, setUpdates] = useState<IChangeType>({ deleted: {}, changed: {}, added: {} });
  const [status, setStatus] = useState<UPLOAD_STATUS>(UPLOAD_STATUS.UPLOAD);
  const [newRoster, setNewRoster] = useState<IUserMap | undefined>(undefined);
  const [rosterInput, setRosterInput] = useState<string>('');

  // Initial roster input calculation
  useEffect(() => {
    setRosterInput(
      rosterToCsv(
        props.sectionsByStudent,
        true,
        props.roleType === 'student'
          ? USER_TYPE.STUDENT
          : props.roleType === 'grader'
            ? USER_TYPE.GRADER
            : USER_TYPE.ADMIN,
        props.admins,
        props.graders,
        props.students,
      ).join('\n'),
    );
  }, [props.sectionsByStudent, props.roleType, props.admins, props.graders, props.students]);

  // Clean up on dialog close
  useEffect(() => {
    if (!dialogVisible) {
      setUploadErrors([]);
      setStatus(UPLOAD_STATUS.UPLOAD);
      setUpdates({ deleted: {}, changed: {}, added: {} });
      setUpdatingRoster(false);
      setNewRoster(undefined);
    }
  }, [dialogVisible]);

  const toggleDialog = () => {
    setDialogVisible(!dialogVisible);
  };

  const convertCSVtoJSON = useCallback(
    (csv: string) => {
      const csvLines = csv.split('\n');

      /* is file empty */
      if (csvLines.length === 0) {
        throw new Error('Uploaded file is empty');
      }

      const parsedNewRoster: IUserMap = {};
      const errors: string[] = [];
      csvLines.forEach((line, i) => {
        // skip empty lines and lines containing only space chars
        if (line.replace(/\s/g, '').length === 0) {
          return;
        }

        const tokens = line.replace(/['"]+/g, '').split(',');

        if (!validateEmail(tokens[0])) {
          errors.push(`Invalid email detected: row ${i}| ${tokens[0]}`);
        }

        switch (props.roleType) {
          case 'student':
            switch (tokens.length) {
              case 1:
                parsedNewRoster[tokens[0].trim()] = {};
                break;
              case 2: {
                let sectionName = null;
                if (tokens[1] !== 'null' && tokens[1] !== '') {
                  // remove leading and trailing whitespace
                  sectionName = tokens[1].trim();
                }
                parsedNewRoster[tokens[0].trim()] = { section: sectionName };
                break;
              }
              default:
                errors.push(`Invalid row detected: row ${i}| ${line}`);
            }
            break;
          case 'grader':
          case 'admin':
            if (tokens.length > 1) {
              errors.push(`Invalid row detected: row ${i}| ${line}`);
            }
            parsedNewRoster[tokens[0].trim()] = {};
            break;
        }
      });
      return { newRoster: parsedNewRoster, errors };
    },
    [props.roleType],
  );

  const getSectionIDFromName = useCallback(
    (sectionName: string) => {
      if (typeof sectionName === 'undefined' || sectionName === null) {
        return undefined;
      }

      const thisSection = props.sections.find((section) => {
        return section.name.trim() === sectionName.trim();
      });
      return thisSection ? thisSection.id : undefined;
    },
    [props.sections],
  );

  const updateRoster = useCallback(() => {
    const diff = updates;
    const { students } = props;

    setUpdatingRoster(true);

    // we don't want to declare success until all the work below completes
    const promises: Array<Promise<void>> = [];

    if (props.roleType === 'student') {
      /* remove and add users */
      const toAdd = Object.keys(diff.added);
      const toRemove = Object.keys(diff.deleted);
      const toChange = Object.keys(diff.changed);

      sendSlack(
        'Updated roster',
        `${toAdd.length} ${props.roleType}s | ${props.course.name} ${props.course.period}\n
          _[${toAdd.join(', ')}]_`,
        colors.brandPrimary,
        '#user_notifications',
        props.course.id,
      );

      promises.push(
        props.changeRoster(toAdd, toRemove, USER_APP.Student).then(() => {
          // build new sections
          const sectionMap: any = {};
          const innerPromises: Array<Promise<any>> = [];

          // Pre-fill sections to account for students whose sections we aren't
          // updating.
          for (const student of students) {
            if (toAdd.indexOf(student) === -1 && toChange.indexOf(student) === -1 && toRemove.indexOf(student) === -1) {
              const section = props.sectionsByStudent[student];
              const sectionValue = section ? section.name : undefined;
              if (sectionValue !== null && sectionValue !== undefined) {
                if (sectionMap[sectionValue] === undefined) {
                  sectionMap[sectionValue] = [student];
                } else {
                  sectionMap[sectionValue] = [...sectionMap[sectionValue], student];
                }
              }
            }
          }

          // Pull information from added students
          for (const student of toAdd) {
            const sectionValue = diff.added[student]['section'];
            if (sectionValue !== null && sectionValue !== undefined) {
              if (sectionMap[sectionValue] === undefined) {
                sectionMap[sectionValue] = [student];
              } else {
                sectionMap[sectionValue] = [...sectionMap[sectionValue], student];
              }
            }
          }

          // Pull information from changed students
          for (const student of toChange) {
            const sectionValue = diff.changed[student].new['section'];
            if (sectionValue !== null && sectionValue !== undefined) {
              if (sectionMap[sectionValue] === undefined) {
                sectionMap[sectionValue] = [student];
              } else {
                sectionMap[sectionValue] = [...sectionMap[sectionValue], student];
              }
            }
          }

          // At this point, sectionMap.keys contains only sections with > 0
          // students, as defined by the uploaded roster.
          // This ignores a corner case: sections which had students in the old roster,
          // but have 0 students in the new roster.

          // Example:
          // SectionA.students = [student1, student2]
          // Then in the new roster, student1.section = null and student2.section = null
          // So far, these students won't be removed from SectionA, since SectionA won't
          // be updated with new students

          // To solve this, add sections with empty student lists to the section map
          for (const oldSection of props.sections) {
            if (sectionMap[oldSection.name] === undefined) {
              sectionMap[oldSection.name] = [];
            }
          }

          // Set section lists (for sections with students)
          for (const sectionName of Object.keys(sectionMap)) {
            const sectionObj = props.sections.find((el) => {
              return el.name === sectionName;
            });

            if (sectionObj !== undefined) {
              // If section exists, set students to list we just created
              const toClone = { ...sectionObj };
              toClone.students = [...sectionMap[sectionName]];
              innerPromises.push(props.updateSection(toClone));
            } else {
              // Otherwise, create section before settings its student list
              innerPromises.push(
                props.createSection(sectionName).then((newSection) => {
                  const toClone = { ...newSection };
                  toClone.students = [...sectionMap[sectionName]];
                  return props.updateSection(toClone);
                }),
              );
            }
          }

          return Promise.all(innerPromises).then(() => {
            setStatus(UPLOAD_STATUS.SAVE);
          });
        }),
      );
    }

    if (props.roleType === 'grader') {
      const toAdd = Object.keys(diff.added);
      const toRemove = Object.keys(diff.deleted);
      sendSlack(
        'Updated roster',
        `${toAdd.length} ${props.roleType}s | ${props.course.name} ${props.course.period}\n
          _[${toAdd.join(', ')}]_`,
        colors.brandPrimary,
        '#user_notifications',
        props.course.id,
      );
      promises.push(props.changeRoster(toAdd, toRemove, USER_APP.Grader));
    }

    if (props.roleType === 'admin') {
      const toAdd = Object.keys(diff.added);
      const toRemove = Object.keys(diff.deleted);
      sendSlack(
        'Updated roster',
        `${Object.keys(diff.added).length} ${props.roleType}s | ${props.course.name} ${props.course.period}\n
          _[${Object.keys(diff.added).join(', ')}]_`,
        colors.brandPrimary,
        '#user_notifications',
        props.course.id,
      );
      promises.push(props.changeRoster(toAdd, toRemove, USER_APP.CourseAdmin));
    }

    /* update status */
    Promise.all(promises).then(() => {
      setUpdatingRoster(false);
      setStatus(UPLOAD_STATUS.SAVE);
    });
  }, [updates, props]);

  const rosterDiff = useCallback(
    (oldRoster: IUserMap, nextRoster: IUserMap) => {
      const oldList: string[] = Array.from(Object.keys(oldRoster));
      const newList: string[] = Array.from(Object.keys(nextRoster));

      /* calculate changed users and removed users */
      const deletedList: any = {};
      const changedList: any = {};
      for (const user of oldList) {
        if (!newList.includes(user)) {
          deletedList[user] = oldRoster[user];
        } else {
          if (props.roleType === 'student') {
            if (nextRoster[user].section !== undefined) {
              if (nextRoster[user].section !== oldRoster[user].section) {
                changedList[user] = {
                  old: oldRoster[user],
                  new: nextRoster[user],
                };
              }
            }
          }
        }
      }

      /* calculate added users */
      const addedList: any = {};
      for (const user of newList) {
        if (!oldList.includes(user)) {
          addedList[user] = nextRoster[user];
        }
      }

      return {
        deleted: deletedList,
        added: addedList,
        changed: changedList,
      };
    },
    [props.roleType],
  );

  const checkRoster = useCallback((roster: IUserMap) => {
    const keys = Object.keys(roster);

    /* check to make sure uploaded roster isn't empty */
    if (keys.length === 0) {
      return ['Uploaded roster is empty.'];
    }

    return [];
  }, []);

  const transformOldRoster = useCallback(
    (userType: string, users: string[], sectionsByStudent: { [studentEmail: string]: SectionType }): IUserMap => {
      const userMap: any = {};
      users.forEach((user) => {
        switch (userType) {
          case 'student':
            userMap[user] = {
              section: sectionsByStudent[user] ? sectionsByStudent[user].name : null,
            };
            break;
          case 'grader':
          case 'admin':
            userMap[user] = {};
        }
      });

      return userMap;
    },
    [],
  );

  const onRosterUpload = useCallback(
    (result: string) => {
      setRosterInput(result);
      setUpdates({ deleted: {}, changed: {}, added: {} });
      setNewRoster(undefined);

      const { newRoster: parsedRoster, errors } = convertCSVtoJSON(result);

      /* make sure newRoster is free of errors */
      const currentUploadErrors = errors.concat(checkRoster(parsedRoster));

      if (currentUploadErrors.length > 0) {
        setStatus(UPLOAD_STATUS.REVIEW);
        setUploadErrors(currentUploadErrors);
        return;
      }

      /* calculate diff between old and new roster */
      let oldRoster = {};
      switch (props.roleType) {
        case 'student':
          oldRoster = transformOldRoster('student', props.students, props.sectionsByStudent);
          break;
        case 'grader':
          oldRoster = transformOldRoster('grader', props.graders, {});
          break;
        case 'admin':
          oldRoster = transformOldRoster('admin', props.admins, {});
          break;
      }
      const diff = rosterDiff(oldRoster, parsedRoster);

      setStatus(UPLOAD_STATUS.REVIEW);
      setUpdates(diff);
      setNewRoster(parsedRoster);
      setUploadErrors([]);
    },
    [
      convertCSVtoJSON,
      checkRoster,
      props.roleType,
      props.students,
      props.sectionsByStudent,
      props.graders,
      props.admins,
      transformOldRoster,
      rosterDiff,
    ],
  );

  const changedStudentsToJSX = (changes: IChangeType) => {
    const diffItems = [
      {
        title: 'Removed from roster and will be unenrolled: ',
        items: Object.keys(changes.deleted),
        key: 'deleted',
      },
      {
        title: `Added (${props.emailNewUsers ? 'will' : "won't"} be notified via email, per your course settings):`,
        items: Object.keys(changes.added),
        key: 'added',
      },
      {
        title: 'Changed: ',
        items: Object.keys(changes.changed),
        changedKey: 'sections',
        key: 'changed',
      },
    ];

    let addingSections = false;

    return (
      <div>
        {diffItems.map((diffItem, i) => {
          if (diffItem.items.length === 0) {
            return (
              <div key={i} style={{ margin: '10px 0px' }}>
                <h4>{diffItem.title}</h4>
                <div>none</div>
              </div>
            );
          }

          let columns = [
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
            },
          ];

          if (diffItem.key === 'changed') {
            columns = [
              ...columns,
              {
                title: 'Changed from',
                dataIndex: 'from',
                key: 'from',
              },
              {
                title: 'Changed to',
                dataIndex: 'to',
                key: 'to',
              },
            ];
          } else {
            columns = [
              ...columns,
              {
                title: 'Section',
                dataIndex: 'section',
                key: 'section',
              },
            ];
          }

          const dataSource = diffItem.items.map((el: string) => {
            if (diffItem.title === 'Changed: ') {
              let toSectionName = changes.changed[el].new.section;
              if (toSectionName === null || toSectionName === undefined) {
                toSectionName = 'No section';
              } else if (!getSectionIDFromName(toSectionName)) {
                toSectionName = `${toSectionName}*`;
                addingSections = true;
              }

              let fromSectionName = changes.changed[el].old['section'];
              if (fromSectionName === null) {
                fromSectionName = 'No section';
              }

              return {
                email: el,
                from: `Section: ${fromSectionName}`,
                to: `Section: ${toSectionName}`,
              };
            } else {
              // @ts-expect-error: legacy-ts-ignore
              let sectionName = changes[diffItem.key][el].section;
              if (sectionName === null || sectionName === undefined) {
                sectionName = 'No section';
              } else if (!getSectionIDFromName(sectionName)) {
                sectionName = `${sectionName}*`;
                addingSections = true;
              }
              return { email: el, section: sectionName };
            }
          });

          return (
            <div key={i} style={{ margin: '10px 0px' }}>
              <h4>{diffItem.title}</h4>
              <Table
                pagination={dataSource.length > 3 ? { position: ['bottomCenter'], defaultPageSize: 3 } : false}
                size="small"
                style={{ lineHeight: 1 }}
                dataSource={dataSource}
                columns={columns}
              />
            </div>
          );
        })}
        <span>
          {addingSections ? (
            <div>
              <br />
              <p>* these sections will be created if you continue</p>
            </div>
          ) : null}
        </span>
      </div>
    );
  };

  const changesToJSX = (changes: IChangeType) => {
    const diffItems = [
      {
        title: 'Deleted: ',
        items: Object.keys(changes.deleted),
      },
      {
        title: `Added (${props.emailNewUsers ? 'will' : "won't"} be emailed):`,
        items: Object.keys(changes.added),
      },
    ];

    return (
      <div>
        {diffItems.map((diffItem, i) => {
          if (diffItem.items.length === 0) {
            return (
              <div key={i} style={{ margin: '10px 0px' }}>
                <h4>{diffItem.title}</h4>
                <div>none</div>
              </div>
            );
          }

          const columns = [
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
            },
          ];

          const dataSource = diffItem.items.map((el: string) => {
            return { email: el };
          });

          return (
            <div key={i}>
              <br />
              <h4>{diffItem.title}</h4>
              <Table
                pagination={dataSource.length > 3 ? { position: ['bottomCenter'], defaultPageSize: 3 } : false}
                style={{ lineHeight: 1 }}
                dataSource={dataSource}
                columns={columns}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const steps = [
    {
      title: 'Upload',
    },
    {
      title: 'Review',
    },
    {
      title: 'Save',
    },
  ];

  // content encodes the modal's content BELOW the steps component
  let content;
  switch (status) {
    case UPLOAD_STATUS.UPLOAD:
      content = (
        <RosterInput
          onRosterUpload={onRosterUpload}
          roleType={props.roleType}
          sections={props.sections}
          rosterInput={rosterInput}
          emailNewUsers={props.emailNewUsers}
        />
      );
      break;
    case UPLOAD_STATUS.REVIEW:
      if (uploadErrors.length === 0) {
        const uploadedUsers = newRoster;
        let sectionContent: React.ReactNode;
        switch (props.roleType) {
          case 'student':
            sectionContent = changedStudentsToJSX(updates);
            break;
          case 'grader':
          case 'admin':
            sectionContent = changesToJSX(updates);
            break;
        }

        content = (
          <div>
            <Divider titlePlacement="left">Overview</Divider>
            <b>Total {props.roleType}s parsed: </b>
            <em>{Object.keys(uploadedUsers!).length}</em>
            <Divider titlePlacement="left">Changes</Divider>
            {sectionContent}
          </div>
        );
      } else {
        content = (
          <div>
            <Alert
              message="Your roster contains some errors. Check out the area below to get them fixed."
              type="error"
            />
            <br />
            <b>Errors:</b>
            <ul>
              {uploadErrors.map((el, i) => {
                if (el.split('|').length > 1) {
                  return (
                    <li key={i}>
                      {el.split('|')[0]}
                      {' | '}
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 500,
                          backgroundColor: '#ececec',
                          borderRadius: '2px',
                        }}
                      >
                        {el.split('|')[1]}
                      </span>
                    </li>
                  );
                }
                return <li key={i}>{el}</li>;
              })}
            </ul>
          </div>
        );
      }
      break;
    case UPLOAD_STATUS.SAVE:
      content = (
        <Result
          status="success"
          title="Your roster was successfully updated!"
          subTitle="Click Close below to continue."
        />
      );
      break;
  }

  // modal's back button
  let goBackButton;
  switch (status) {
    case UPLOAD_STATUS.UPLOAD:
      goBackButton = (
        <Button key="back" onClick={toggleDialog}>
          Cancel
        </Button>
      );
      break;
    case UPLOAD_STATUS.REVIEW:
      goBackButton = (
        <Button key="back" onClick={() => setStatus(UPLOAD_STATUS.UPLOAD)}>
          Back
        </Button>
      );
      break;
    case UPLOAD_STATUS.SAVE:
      goBackButton = (
        <Button key="back" type="primary" onClick={toggleDialog} disabled={updatingRoster}>
          Close
        </Button>
      );
      break;
  }

  // modal's forward button
  let goForwardButton = null;
  if (status === UPLOAD_STATUS.REVIEW) {
    if (uploadErrors.length > 0) {
      goForwardButton = (
        <CPTooltip key="submit" title={tooltips.admin.uploadRoster.error}>
          <Button key="submit" type="primary" disabled={true}>
            Continue
          </Button>
        </CPTooltip>
      );
    } else {
      goForwardButton = (
        <Button key="submit" type="primary" onClick={updateRoster} loading={updatingRoster}>
          Confirm
        </Button>
      );
    }
  }

  return (
    <div>
      <CPButton icon={<UserAddOutlined />} cpType="primary" onClick={toggleDialog}>
        {props.buttonText || `Add ${props.roleType}s`}
      </CPButton>
      <Modal
        open={dialogVisible}
        onCancel={toggleDialog}
        title={`Upload roster: ${props.roleType[0].toUpperCase() + props.roleType.slice(1)}s`}
        width={700}
        footer={[goBackButton, goForwardButton]}
        destroyOnHidden={true}
      >
        <Steps
          size="small"
          current={status}
          items={steps.map((item) => ({
            key: item.title,
            title: item.title,
          }))}
        />
        <br />
        <br />
        {content}
      </Modal>
    </div>
  );
};
export default RosterFileUpload;
