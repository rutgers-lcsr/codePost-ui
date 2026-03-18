// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ComponentManager, { IComponentProps } from '../ComponentManager';
import { Course } from '../../../api-client';

vi.mock('../../utils/LocalSettings', () => ({
  LOCAL_SETTINGS: {
    defaultCourse: {
      getter: vi.fn(() => 0),
      setter: vi.fn(),
    },
  },
}));

const makeCourse = (overrides: Partial<Course> = {}): Course => ({
  id: 1,
  name: 'CS101',
  period: 'Spring 2026',
  assignments: [],
  sections: [],
  inviteCode: null,
  webhooks: [],
  studentCount: 0,
  isRubricEditor: false,
  ...overrides,
});

const makeProps = (overrides: Partial<IComponentProps> = {}) => ({
  initialCourses: [makeCourse()],
  user: {
    id: 1,
    password: '',
    studentCourses: [],
    graderCourses: [],
    superGraderCourses: [],
    courseadminCourses: [],
    leaderSections: [],
    canCreateCourses: false,
    canModifyRosters: false,
    showProductTips: false,
    studentSections: [],
    hasCredentials: true,
    token: null,
  } as IComponentProps['user'],
  addAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  addCourse: vi.fn(),
  superGraderCourses: [],
  sectionsLed: [],
  handleLogout: vi.fn(),
  baseURL: '/admin',
  ...overrides,
});

const TestComponent = ({ currentCourse }: IComponentProps) => (
  <div data-testid="inner">{currentCourse ? currentCourse.name : 'no course'}</div>
);

// Wraps the Managed component in a parent route matching baseURL, like the real app
const renderWithRouter = (element: React.ReactElement, initialPath: string) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/admin/*" element={element} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ComponentManager', () => {
  it('renders the wrapped component for a matching course route', () => {
    const Managed = ComponentManager(TestComponent);
    const { container } = renderWithRouter(<Managed {...makeProps()} />, '/admin/CS101/Spring 2026/overview');
    expect(container.textContent).toContain('CS101');
  });

  it('renders correct course when multiple courses exist', () => {
    const courses = [
      makeCourse({ id: 1, name: 'CS101', period: 'Spring 2026' }),
      makeCourse({ id: 2, name: 'CS201', period: 'Fall 2025' }),
    ];
    const Managed = ComponentManager(TestComponent);
    const { container } = renderWithRouter(
      <Managed {...makeProps({ initialCourses: courses })} />,
      '/admin/CS201/Fall 2025/assignments',
    );
    expect(container.textContent).toContain('CS201');
  });

  it('redirects to default course when stored default matches', async () => {
    const { LOCAL_SETTINGS } = (await import('../../utils/LocalSettings')) as unknown as {
      LOCAL_SETTINGS: { defaultCourse: { getter: { mockReturnValue: (v: number) => void } } };
    };
    LOCAL_SETTINGS.defaultCourse.getter.mockReturnValue(1);

    const Managed = ComponentManager(TestComponent, 'overview');
    const { container } = renderWithRouter(<Managed {...makeProps()} />, '/admin');
    expect(container.textContent).toContain('CS101');
  });

  it('falls back to highest-id course when stored default is not found', () => {
    const courses = [
      makeCourse({ id: 10, name: 'CS101', period: 'Spring 2026' }),
      makeCourse({ id: 20, name: 'CS201', period: 'Fall 2025' }),
    ];
    const Managed = ComponentManager(TestComponent, 'overview');
    const { container } = renderWithRouter(<Managed {...makeProps({ initialCourses: courses })} />, '/admin');
    expect(container.textContent).toContain('CS201');
  });

  it('renders component with no course when initialCourses is empty', () => {
    const Managed = ComponentManager(TestComponent);
    const { container } = renderWithRouter(<Managed {...makeProps({ initialCourses: [] })} />, '/admin');
    expect(container.textContent).toContain('no course');
  });

  it('supports defaultPage as a function', async () => {
    const { LOCAL_SETTINGS } = (await import('../../utils/LocalSettings')) as unknown as {
      LOCAL_SETTINGS: { defaultCourse: { getter: { mockReturnValue: (v: number) => void } } };
    };
    LOCAL_SETTINGS.defaultCourse.getter.mockReturnValue(1);

    const defaultPageFn = (c: Course) => (c.name === 'CS101' ? 'my_submissions' : 'overview');
    const Managed = ComponentManager(TestComponent, defaultPageFn);
    const { container } = renderWithRouter(<Managed {...makeProps()} />, '/admin');
    expect(container.textContent).toContain('CS101');
  });
});
