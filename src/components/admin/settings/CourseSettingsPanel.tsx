/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Col, Input, message, Row, Select, Switch, Table, Typography } from 'antd';
const { Text, Title } = Typography;

type alignType = 'left' | 'right' | 'center';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { CoursePatchType, CourseType } from '../../../infrastructure/course';

import { timezones } from '../other/timezones';

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
  updateSettings: (newCourse: CoursePatchType) => Promise<CourseType>;
}

/* local copies of all course settings we want to expose in this page */
interface IState {
  name: string;
  period: string;
  sendReleasedSubmissionsToBack: boolean;
  showStudentsStatistics: boolean;
  timezone: string;
  emailNewUsers: boolean;
  anonymousGradingDefault: boolean;
  isLoading: boolean;
}

class CourseSettingsPanel extends React.Component<IProps, IState> {
  public constructor(props: IProps) {
    super(props);
    const currentCourse = this.props.currentCourse;
    this.state = {
      name: currentCourse.name,
      period: currentCourse.period,
      sendReleasedSubmissionsToBack: currentCourse.sendReleasedSubmissionsToBack,
      showStudentsStatistics: currentCourse.showStudentsStatistics,
      timezone: currentCourse.timezone,
      emailNewUsers: currentCourse.emailNewUsers,
      anonymousGradingDefault: currentCourse.anonymousGradingDefault,
      isLoading: false,
    };
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.currentCourse.id !== this.props.currentCourse.id) {
      const currentCourse = this.props.currentCourse;
      this.setState({
        name: currentCourse.name,
        period: currentCourse.period,
        sendReleasedSubmissionsToBack: currentCourse.sendReleasedSubmissionsToBack,
        showStudentsStatistics: currentCourse.showStudentsStatistics,
        timezone: currentCourse.timezone,
        emailNewUsers: currentCourse.emailNewUsers,
        anonymousGradingDefault: currentCourse.anonymousGradingDefault,
        isLoading: false,
      });
    }
  }

  public changesMade = () => {
    const original = this.props.currentCourse;
    return (
      original.sendReleasedSubmissionsToBack !== this.state.sendReleasedSubmissionsToBack ||
      original.showStudentsStatistics !== this.state.showStudentsStatistics ||
      original.timezone !== this.state.timezone ||
      original.emailNewUsers !== this.state.emailNewUsers ||
      original.anonymousGradingDefault !== this.state.anonymousGradingDefault ||
      original.name !== this.state.name ||
      original.period !== this.state.period
    );
  };

  /* for binary state variables only */
  public toggleValue = (label: string) => {
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = !this.state[label];
      return newState;
    });
  };

  public updateInput = (label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = newValue;
      return newState;
    });
  };

  public handleChange = (label: string, selected: string) => {
    const value = selected;
    this.setState((prevstate) => {
      const newState = { ...prevstate };
      newState[label] = value;
      return newState;
    });
  };

  public updateSettings = (e: any) => {
    this.setState({ isLoading: true }, () => {
      e.preventDefault();
      const { currentCourse } = this.props;
      const payload = {
        id: currentCourse.id, // codePost convention
        name: this.state.name,
        period: this.state.period,
        sendReleasedSubmissionsToBack: this.state.sendReleasedSubmissionsToBack,
        showStudentsStatistics: this.state.showStudentsStatistics,
        timezone: this.state.timezone,
        emailNewUsers: this.state.emailNewUsers,
        allowGradersToEditRubric: currentCourse.allowGradersToEditRubric,
        assignments: [], // ignored by API
        sections: [], // ignored by API
        anonymousGradingDefault: this.state.anonymousGradingDefault,
      };

      this.props
        .updateSettings(payload)
        .then(() => {
          message.success('Your settings were saved!');
        })
        .catch((reason) => {
          console.log(reason); /* FIXME: render error response to user */
        });
      this.setState({ isLoading: false });
    });
  };

  public render() {
    /* create misc. settings table */
    const aligner: alignType = 'center';
    const columns = [
      {
        title: 'Setting',
        dataIndex: 'setting',
        key: 'setting',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
      },
      {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        align: aligner,
      },
    ];

    /* UPDATE TABLE HERE */
    const data = [
      {
        key: '1',
        setting: <Text strong>Show statistics to students</Text>,
        description: 'Selecting will show assignment mean and median to students when the assignment is released.',
        action: (
          <Switch
            checked={this.state.showStudentsStatistics}
            onChange={this.toggleValue.bind(this.props, 'showStudentsStatistics')}
          />
        ),
      },
      {
        key: '2',
        setting: <Text strong>Send released submissions to back of grader queue</Text>,
        description: `Selecting will move released assignments to the back of the course queue, preventing
         situations in which a grader reclaims a submission that was just released. For more information see our
         docs.`,
        action: (
          <Switch
            checked={this.state.sendReleasedSubmissionsToBack}
            onChange={this.toggleValue.bind(this.props, 'sendReleasedSubmissionsToBack')}
          />
        ),
      },
      {
        key: '3',
        setting: <Text strong>Email users when added to roster</Text>,
        description: `If selected, emails will be sent to users notifying them that they have been added
         to this course's roster. New codePost users will be prompted to create an account.`,
        action: (
          <Switch checked={this.state.emailNewUsers} onChange={this.toggleValue.bind(this.props, 'emailNewUsers')} />
        ),
      },
      {
        key: '4',
        setting: <Text strong>Default to Anonymous Grading Mode</Text>,
        description: `If selected, new Assignments will default to Anonymous Grading Mode. You can
          toggle this setting at the assignment level from Assignment settings.`,
        action: (
          <Switch
            checked={this.state.anonymousGradingDefault}
            onChange={this.toggleValue.bind(this.props, 'anonymousGradingDefault')}
          />
        ),
      },
      {
        key: '5',
        setting: <Text strong>Course timezone</Text>,
        description: 'Timezone in which all time fields for this course (for all users) will appear.',
        action: (
          <Select
            value={this.state.timezone}
            onChange={this.handleChange.bind(this, 'timezone')}
            style={{ width: 200 }}
          >
            {timezones.map((tz, i) => {
              return (
                <Select.Option key={i} value={tz}>
                  {tz}
                </Select.Option>
              );
            })}
          </Select>
        ),
      },
    ];

    const tableTitle = () => <Title level={4}>Misc. settings</Title>;

    const content = (
      <div>
        <Row>
          <Col span={10}>
            <Input
              addonBefore={'Course name:'}
              onChange={this.updateInput.bind(this, 'name')}
              value={this.state.name}
            />
          </Col>
        </Row>
        <br />
        <Row>
          <Col span={10}>
            <Input
              addonBefore={'Course period:'}
              onChange={this.updateInput.bind(this, 'period')}
              defaultValue={this.state.period}
            />
          </Col>
        </Row>
        <br />
        <br />
        <Table title={tableTitle} pagination={false} columns={columns} dataSource={data} />
      </div>
    );

    const actions = [
      <CPButton
        key={1}
        loading={this.state.isLoading}
        cpType={this.changesMade() ? 'primary' : 'disabled'}
        onClick={this.updateSettings}
      >
        Save changes
      </CPButton>,
    ];

    return (
      <CPAdminDetail
        goBack={null}
        title={`Settings: ${this.props.currentCourse.name} | ${this.props.currentCourse.period}`}
        actions={actions}
        content={content}
        breadcrumbs={
          <Breadcrumb>
            <Breadcrumb.Item>Course Settings</Breadcrumb.Item>
          </Breadcrumb>
        }
      />
    );
  }
}
export default CourseSettingsPanel;
