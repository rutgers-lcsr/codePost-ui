// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Typography, Card, Row, Col, Tag, Space, Divider } from 'antd';
import {
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  MessageOutlined,
  ExperimentOutlined,
  BookOutlined,
  FilePdfOutlined,
  DashboardOutlined,
  TeamOutlined,
  BarChartOutlined,
  ContainerOutlined,
  ClusterOutlined,
  InboxOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import CPButton from '../../components/core/CPButton';
import { brandColors, actionColors } from '../../theme/colors';
import { CODE_DEMO } from '../../routes';

const { Title, Text, Paragraph } = Typography;

const DemoLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${brandColors.light} 0%, #ffffff 50%, #f0f5ff 100%)`,
        padding: '0',
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '64px 24px 40px',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <Tag color={brandColors.primary} style={{ marginBottom: 16, fontSize: 13, padding: '2px 12px' }}>
          Interactive Demo
        </Tag>
        <Title level={1} style={{ marginBottom: 12, fontSize: 40, fontWeight: 700 }}>
          Experience codePost
        </Title>
        <Paragraph
          style={{
            fontSize: 18,
            color: 'rgba(0,0,0,0.6)',
            maxWidth: 600,
            margin: '0 auto 0',
            lineHeight: 1.6,
          }}
        >
          See how codePost makes code grading fast, consistent, and educational. Try the live demos below — no account
          required.
        </Paragraph>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 64px' }}>
        {/* ── Section 1: Code Review ── */}
        <Divider titlePlacement="left" style={{ fontSize: 16, fontWeight: 600 }}>
          Code Review
        </Divider>
        <Paragraph type="secondary" style={{ marginBottom: 24, maxWidth: 700 }}>
          The code review console is where graders leave feedback and students read it. Try both perspectives.
        </Paragraph>

        <Row gutter={[24, 24]}>
          {/* Grader View */}
          <Col xs={24} md={12}>
            <DemoCard
              title="Grader View"
              subtitle="Give feedback like a course grader"
              icon={<EditOutlined style={{ fontSize: 26, color: brandColors.primary }} />}
              iconBg={brandColors.light}
              borderColor={brandColors.primary}
              features={[
                { icon: <MessageOutlined />, text: 'Add inline comments to any line of code' },
                { icon: <CheckCircleOutlined />, text: 'Apply rubric items for consistent grading' },
                { icon: <ExperimentOutlined />, text: 'Review autograder test results' },
                { icon: <BookOutlined />, text: 'View Jupyter notebooks with rendered outputs' },
                { icon: <FilePdfOutlined />, text: 'Preview PDF assignment handouts' },
              ]}
              buttonLabel="Try Grader View"
              buttonIcon={<EditOutlined />}
              buttonType="primary"
              onNavigate={() => navigate(`${CODE_DEMO}/grader`)}
            />
          </Col>

          {/* Student View */}
          <Col xs={24} md={12}>
            <DemoCard
              title="Student View"
              subtitle="See feedback as a student would"
              icon={<EyeOutlined style={{ fontSize: 26, color: actionColors.blue }} />}
              iconBg="#f0f5ff"
              features={[
                { icon: <MessageOutlined />, text: 'Read grader comments with rubric explanations' },
                { icon: <CheckCircleOutlined />, text: 'See point deductions tied to each comment' },
                { icon: <ExperimentOutlined />, text: 'Check which test cases passed and failed' },
                { icon: <BookOutlined />, text: 'View notebook outputs inline' },
                { icon: <FileTextOutlined />, text: 'Browse all submission files in one place' },
              ]}
              buttonLabel="Try Student View"
              buttonIcon={<EyeOutlined />}
              buttonType="secondary"
              onNavigate={() => navigate(`${CODE_DEMO}/student`)}
            />
          </Col>
        </Row>

        {/* ── Section 2: Course Management ── */}
        <Divider titlePlacement="left" style={{ fontSize: 16, fontWeight: 600, marginTop: 56 }}>
          Course Management
        </Divider>
        <Paragraph type="secondary" style={{ marginBottom: 24, maxWidth: 700 }}>
          Instructors and teaching assistants manage courses, rosters, and grading progress through dedicated consoles.
        </Paragraph>

        <Row gutter={[24, 24]}>
          {/* Admin Console */}
          <Col xs={24} md={12}>
            <DemoCard
              title="Admin Console"
              subtitle="Manage your course as an instructor"
              icon={<DashboardOutlined style={{ fontSize: 26, color: '#722ed1' }} />}
              iconBg="#f9f0ff"
              borderColor="#722ed1"
              features={[
                { icon: <FileTextOutlined />, text: 'Create assignments and configure rubrics' },
                { icon: <TeamOutlined />, text: 'Manage students, graders, and sections' },
                { icon: <BarChartOutlined />, text: 'Track grading progress across assignments' },
                { icon: <InboxOutlined />, text: 'View submissions by student or by grader' },
                { icon: <SettingOutlined />, text: 'Configure course settings and webhooks' },
              ]}
              buttonLabel="Try Admin Console"
              buttonIcon={<DashboardOutlined />}
              buttonType="primary"
              onNavigate={() => navigate(`${CODE_DEMO}/admin`)}
            />
          </Col>

          {/* Grader Console */}
          <Col xs={24} md={12}>
            <DemoCard
              title="Grader Console"
              subtitle="Manage your grading queue as a TA"
              icon={<ContainerOutlined style={{ fontSize: 26, color: '#eb2f96' }} />}
              iconBg="#fff0f6"
              features={[
                { icon: <ContainerOutlined />, text: 'Claim and finalize submissions from the queue' },
                { icon: <ClusterOutlined />, text: 'View students in your assigned sections' },
                { icon: <InboxOutlined />, text: 'See grading progress across all assignments' },
                { icon: <MessageOutlined />, text: 'Handle regrade requests from students' },
                { icon: <BarChartOutlined />, text: 'Track your grading statistics' },
              ]}
              buttonLabel="Try Grader Console"
              buttonIcon={<ContainerOutlined />}
              buttonType="secondary"
              onNavigate={() => navigate(`${CODE_DEMO}/grader-console`)}
            />
          </Col>
        </Row>

        {/* Demo content description */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 56,
            padding: '32px',
            background: 'rgba(0,0,0,0.02)',
            borderRadius: 12,
          }}
        >
          <Title level={4} style={{ marginBottom: 8 }}>
            What&apos;s in the demo?
          </Title>
          <Paragraph style={{ color: 'rgba(0,0,0,0.55)', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
            A sample course (CS 201 — Data Structures) with Python and Java files, Jupyter notebooks, a PDF handout,
            autograder test results, a multi-category rubric, comment templates, a full roster with sections, and
            submissions across five assignments — everything you need to see codePost in action.
          </Paragraph>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <Text type="secondary" style={{ fontSize: 15 }}>
            Ready to use codePost with your course?{' '}
            <a href="/signup/create" style={{ color: brandColors.primary, fontWeight: 600 }}>
              Create a free account &rarr;
            </a>
          </Text>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Reusable Card Component
// ---------------------------------------------------------------------------

interface DemoCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  borderColor?: string;
  features: Array<{ icon: React.ReactNode; text: string }>;
  buttonLabel: string;
  buttonIcon: React.ReactNode;
  buttonType: 'primary' | 'secondary';
  onNavigate: () => void;
}

const DemoCard: React.FC<DemoCardProps> = ({
  title,
  subtitle,
  icon,
  iconBg,
  borderColor,
  features,
  buttonLabel,
  buttonIcon,
  buttonType,
  onNavigate,
}) => (
  <Card
    hoverable
    style={{
      borderRadius: 12,
      border: borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
      height: '100%',
      overflow: 'hidden',
    }}
    styles={{ body: { padding: '28px 24px' } }}
  >
    <div style={{ textAlign: 'center', marginBottom: 20 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: iconBg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        {icon}
      </div>
      <Title level={4} style={{ marginBottom: 2 }}>
        {title}
      </Title>
      <Text type="secondary">{subtitle}</Text>
    </div>

    <Space orientation="vertical" size={10} style={{ width: '100%', marginBottom: 24 }}>
      {features.map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: brandColors.primary, fontSize: 15, flexShrink: 0 }}>{f.icon}</span>
          <Text style={{ fontSize: 13 }}>{f.text}</Text>
        </div>
      ))}
    </Space>

    <CPButton
      cpType={buttonType}
      size="large"
      block
      onClick={onNavigate}
      style={{ height: 44, fontSize: 15, borderRadius: 8 }}
    >
      {buttonIcon} {buttonLabel}
    </CPButton>
  </Card>
);

export default DemoLanding;
