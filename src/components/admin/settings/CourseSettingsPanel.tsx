/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Breadcrumb, Form, Input, message, Select, Switch, Table, Typography } from 'antd';
import { FormComponentProps } from 'antd/lib/form';

import CPButton from '../../../components/core/CPButton';
import CPAdminDetail from '../other/CPAdminDetail';

/* codePost imports */
import { CoursePatchType, CourseType } from '../../../infrastructure/course';

import { timezones } from '../other/timezones';

type alignType = 'left' | 'right' | 'center';

const { Text, Title } = Typography;

/**********************************************************************************************************************/

interface IProps {
  currentCourse: CourseType;
  updateSettings: (newCourse: CoursePatchType) => Promise<CourseType>;
}

interface IState {
  isLoading: boolean;
  isDirty: boolean;
}

class CourseSettingsPanel extends React.Component<IProps, IState> {
  private formRef: React.RefObject<FormComponentProps> = React.createRef();

  public constructor(props: IProps) {
    super(props);
    this.state = {
      isLoading: false,
      isDirty: false,
    };
  }

  public componentDidUpdate(oldProps: IProps) {
    if (oldProps.currentCourse.id !== this.props.currentCourse.id) {
      this.setState({
        isLoading: false,
        isDirty: false,
      });

      const formRefCast: any = this.formRef;
      const form = formRefCast.props.form;
      form.resetFields();
    }
  }

  public saveFormRef = (formRef: React.RefObject<FormComponentProps>) => {
    this.formRef = formRef;
  };

  public resetForm = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.resetFields();
    this.setState({ isDirty: false });
  };

  public handleSave = () => {
    const formRefCast: any = this.formRef;
    const form = formRefCast.props.form;
    form.validateFields((err: any, values: any) => {
      if (err) {
        return;
      }

      this.updateSettings(values);
    });
  };

  public updateSettings = (values: any) => {
    this.setState({ isLoading: true }, () => {
      const { currentCourse } = this.props;
      const payload = {
        id: currentCourse.id, // codePost convention
        name: values.name,
        period: values.period,
        sendReleasedSubmissionsToBack: values.sendReleasedSubmissionsToBack,
        showStudentsStatistics: values.showStudentsStatistics,
        timezone: values.timezone,
        emailNewUsers: values.emailNewUsers,
        allowGradersToEditRubric: values.allowGradersToEditRubric,
        anonymousGradingDefault: values.anonymousGradingDefault,
        assignments: [], // ignored by API
        sections: [], // ignored by API
        archived: values.archived,
      };

      this.props.updateSettings(payload).then(() => {
        message.success('Your settings were saved!');
        this.setState({ isLoading: false, isDirty: false });
      });
    });
  };

  public makeDirty = () => {
    this.setState({ isDirty: true });
  };

  public render() {
    const content = (
      <SettingsForm
        thisCourse={this.props.currentCourse}
        wrappedComponentRef={this.saveFormRef}
        makeDirty={this.makeDirty}
      />
    );

    const actions = [
      <CPButton
        key={0}
        disabled={!this.state.isDirty || this.state.isLoading}
        icon="redo"
        cpType="secondary"
        onClick={this.resetForm}
      >
        Undo
      </CPButton>,
      <CPButton
        key={1}
        loading={this.state.isLoading}
        cpType="primary"
        onClick={this.handleSave}
        disabled={!this.state.isDirty}
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

/***********************************************************************************/
/* Form component
/***********************************************************************************/

interface IFormProps extends FormComponentProps {
  thisCourse: CourseType;
  makeDirty: () => void;
}

const SettingsForm: any = Form.create()(
  class extends React.Component<IFormProps, {}> {
    public render() {
      const { getFieldDecorator } = this.props.form;
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
            <Form.Item>
              {getFieldDecorator('showStudentsStatistics', {
                initialValue: this.props.thisCourse.showStudentsStatistics,
                valuePropName: 'checked',
              })(<Switch onChange={this.props.makeDirty} />)}
            </Form.Item>
          ),
        },
        {
          key: '2',
          setting: <Text strong>Send released submissions to back of grader queue</Text>,
          description: `Selecting will move released assignments to the back of the course queue, preventing
         situations in which a grader reclaims a submission that was just released. For more information see our
         docs.`,
          action: (
            <Form.Item>
              {getFieldDecorator('sendReleasedSubmissionsToBack', {
                initialValue: this.props.thisCourse.sendReleasedSubmissionsToBack,
                valuePropName: 'checked',
              })(<Switch onChange={this.props.makeDirty} />)}
            </Form.Item>
          ),
        },
        {
          key: '3',
          setting: <Text strong>Email users when added to roster</Text>,
          description: `If selected, emails will be sent to users notifying them that they have been added
         to this course's roster. New codePost users will be prompted to create an account.`,
          action: (
            <Form.Item>
              {getFieldDecorator('emailNewUsers', {
                initialValue: this.props.thisCourse.emailNewUsers,
                valuePropName: 'checked',
              })(<Switch onChange={this.props.makeDirty} />)}
            </Form.Item>
          ),
        },
        {
          key: '4',
          setting: <Text strong>Default to Anonymous Grading Mode</Text>,
          description: `If selected, new Assignments will default to Anonymous Grading Mode. You can
          toggle this setting at the assignment level from Assignment settings.`,
          action: (
            <Form.Item>
              {getFieldDecorator('anonymousGradingDefault', {
                initialValue: this.props.thisCourse.anonymousGradingDefault,
                valuePropName: 'checked',
              })(<Switch onChange={this.props.makeDirty} />)}
            </Form.Item>
          ),
        },
        {
          key: '5',
          setting: <Text strong>Course timezone</Text>,
          description: 'Timezone in which all time fields for this course (for all users) will appear.',
          action: (
            <Form.Item>
              {getFieldDecorator('timezone', {
                initialValue: this.props.thisCourse.timezone,
              })(
                <Select style={{ width: 200 }} onChange={this.props.makeDirty}>
                  {timezones.map((tz, i) => {
                    return (
                      <Select.Option key={i} value={tz}>
                        {tz}
                      </Select.Option>
                    );
                  })}
                </Select>,
              )}
            </Form.Item>
          ),
        },
        {
          key: '6',
          setting: <Text strong>Archived</Text>,
          description: 'When a Course is Archived, its content will not be editable.',
          action: (
            <Form.Item>
              {getFieldDecorator('archived', {
                initialValue: this.props.thisCourse.archived,
                valuePropName: 'checked',
              })(<Switch onChange={this.props.makeDirty} />)}
            </Form.Item>
          ),
        },
      ];

      const tableTitle = () => <Title level={4}>Misc. settings</Title>;

      return (
        <Form layout="horizontal" hideRequiredMark={true} onChange={this.props.makeDirty}>
          <div style={{ width: 500 }}>
            <Form.Item>
              {getFieldDecorator('name', {
                initialValue: this.props.thisCourse.name,
                rules: [
                  {
                    required: true,
                    message: 'Please enter a course name with at least 4 characters',
                    min: 4,
                  },
                  {
                    message: 'Course name cannot exceed 36 characters',
                    max: 36,
                  },
                ],
              })(<Input addonBefore="Course name" />)}
            </Form.Item>
            <Form.Item>
              {getFieldDecorator('period', {
                initialValue: this.props.thisCourse.period,
                rules: [
                  { required: true, message: 'Please enter a course period.' },
                  {
                    message: 'Course period cannot exceed 32 characters',
                    max: 32,
                  },
                ],
              })(<Input addonBefore="Course period" />)}
            </Form.Item>
          </div>
          <Table title={tableTitle} pagination={false} columns={columns} dataSource={data} />
        </Form>
      );
    }
  },
);

export default CourseSettingsPanel;
