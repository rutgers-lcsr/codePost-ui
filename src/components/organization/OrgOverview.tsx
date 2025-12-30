import * as React from 'react';
import { Card, Descriptions, Statistic, Row, Col, Spin } from 'antd';
import { OrganizationType, Organization } from '../../infrastructure/organization';
import { TeamOutlined, BookOutlined, FileOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';

interface IProps {
    organization: OrganizationType;
    userCount?: number;
    courseCount?: number;
}

interface Analytics {
    total_users: number;
    active_users: number;
    total_courses: number;
    active_courses: number;
    total_assignments: number;
    total_submissions: number;
    submissions_this_month: number;
}

const OrgOverview: React.FC<IProps> = ({ organization }) => {
    const [analytics, setAnalytics] = React.useState<Analytics | null>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await Organization.getAnalytics(organization.id);
                setAnalytics(data);
            } catch (error) {
                console.error('Failed to fetch analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [organization.id]);

    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Organization Details" bordered={false}>
                        <Descriptions column={2}>
                            <Descriptions.Item label="Name">{organization.name}</Descriptions.Item>
                            <Descriptions.Item label="Short Name">{organization.shortname}</Descriptions.Item>
                            <Descriptions.Item label="Email Domain">{organization.emailDomain || 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="SSO Enabled">{organization.sso_enabled ? 'Yes' : 'No'}</Descriptions.Item>
                            {organization.sso_enabled && (
                                <>
                                    <Descriptions.Item label="SSO Provider">{organization.sso_provider}</Descriptions.Item>
                                </>
                            )}
                        </Descriptions>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col span={24}>
                    <Card title="Analytics" bordered={false}>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
                        ) : analytics ? (
                            <Row gutter={[16, 16]}>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Users"
                                        value={analytics.total_users}
                                        prefix={<TeamOutlined />}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Active Users (30d)"
                                        value={analytics.active_users}
                                        valueStyle={{ color: '#3f8600' }}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Courses"
                                        value={analytics.total_courses}
                                        prefix={<BookOutlined />}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Active Courses"
                                        value={analytics.active_courses}
                                        valueStyle={{ color: '#3f8600' }}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Assignments"
                                        value={analytics.total_assignments}
                                        prefix={<FileTextOutlined />}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Total Submissions"
                                        value={analytics.total_submissions}
                                        prefix={<FileOutlined />}
                                    />
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Submissions (30d)"
                                        value={analytics.submissions_this_month}
                                        prefix={<CheckCircleOutlined />}
                                        valueStyle={{ color: '#1890ff' }}
                                    />
                                </Col>
                            </Row>
                        ) : (
                            <div>Failed to load analytics</div>
                        )}
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default OrgOverview;
