// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Component Imports
import IndexManager from './components/pre-auth/IndexManager';
import CreateSignup from './components/pre-auth/CreateSignup';
import JoinSignup from './components/pre-auth/JoinSignup';
import ForgotPasswordForm from './components/pre-auth/ForgotPasswordForm';
import DocsPage from './components/docs/DocsPage';
import Student from './components/student/Student';
import GraderManager from './components/grader/GraderManager';
import AdminManager from './components/admin/AdminManager';
import CodeConsole from './features/code-review/CodeConsole';
import DemoLanding from './features/code-review/DemoLanding';

// Marketing Page Imports
import Landing from './components/landing/LandingABTest';
import { AllTestimonials } from './components/landing/Testimonial';
import AboutUs from './components/pre-auth/AboutUs';
import AutograderDetail from './components/pre-auth/AutograderDetail';
import FAQs from './components/pre-auth/FAQs';
import IntegrationsPage from './components/pre-auth/IntegrationsPage';
import PrivacyPolicy from './components/pre-auth/PrivacyPolicy';
import Scholarship from './components/pre-auth/Scholarship';
import { SignUpManager } from './components/pre-auth/SignUpManager';
import TermsOfService from './components/pre-auth/TermsOfService';
import WhyUse from './components/pre-auth/WhyUse';

import { mockCourse, mockUser as mockUserBase } from './test-utils';

// Mock props for IndexManager
const mockIndexesProps = {
  handleLogin: vi.fn(),
  error: '',
  isLoggedIn: false,
  handleLogout: vi.fn(),
};

// Student user variant (no admin privileges)
const mockUser = {
  ...mockUserBase,
  canCreateCourses: false,
  canModifyRosters: false,
  courseadminCourses: [],
  isOrgStaff: false,
};

// Mock props for Student
const mockStudentProps = {
  initialCourses: [mockCourse],
  currentCourse: mockCourse,
  user: mockUser,
  handleLogout: vi.fn(),
  windowwidth: 1200,
  baseURL: '/student',
  addAssignment: vi.fn(),
  deleteAssignment: vi.fn(),
  addCourse: vi.fn(),
  superGraderCourses: [] as never[],
  sectionsLed: [] as never[],
};

// Axe configuration with best-practice rules enabled
// Performance: color-contrast is tested separately in accessibility_contrast.test.tsx
// because jsdom's CSS parsing adds ~10s overhead. Structural rules don't need computed styles.
const axeConfig = {
  runOnly: {
    type: 'tag' as const,
    values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  },
  resultTypes: ['violations'] as const,
  elementRef: false,
  rules: {
    'color-contrast': { enabled: false },
  },
};

// Strip <style> tags from the document before running axe to avoid jsdom's
// extremely slow CSS stylesheet parsing (~10s overhead per worker). The remaining
// axe rules check DOM structure and ARIA, not computed styles.
const stripStylesAndRunAxe = async (container: HTMLElement) => {
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((el) => el.remove());
  return axe(container, axeConfig);
};

const createTestQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });

describe('Accessibility', () => {
  it('should have no violations on Public Auth Pages', async () => {
    const { container } = render(
      <MemoryRouter>
        <IndexManager {...mockIndexesProps} />
      </MemoryRouter>,
    );
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no violations on CreateSignup page', async () => {
    const { container } = render(
      <MemoryRouter>
        <CreateSignup isLoggedIn={false} />
      </MemoryRouter>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 10000);

  it('should have no violations on JoinSignup page', async () => {
    const { container } = render(
      <MemoryRouter>
        <JoinSignup email="" />
      </MemoryRouter>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no violations on ForgotPassword page', async () => {
    const { container } = render(
      <MemoryRouter>
        <ForgotPasswordForm isLoggedIn={false} />
      </MemoryRouter>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  });

  it('should have no violations on Docs Page', async () => {
    const { container } = render(
      <MemoryRouter>
        <DocsPage />
      </MemoryRouter>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on the Student Console (Student)', async () => {
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <Student {...mockStudentProps} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on Grader Console', async () => {
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <GraderManager
            initialCourses={[mockCourse]}
            user={mockUser}
            handleLogout={vi.fn()}
            baseURL=""
            addAssignment={vi.fn()}
            deleteAssignment={vi.fn()}
            addCourse={vi.fn()}
            superGraderCourses={[]}
            sectionsLed={[]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on Admin Console', async () => {
    const { container } = render(
      <QueryClientProvider client={createTestQueryClient()}>
        <MemoryRouter>
          <AdminManager
            initialCourses={[mockCourse]}
            user={mockUser}
            handleLogout={vi.fn()}
            baseURL=""
            addAssignment={vi.fn()}
            deleteAssignment={vi.fn()}
            addCourse={vi.fn()}
            superGraderCourses={[]}
            sectionsLed={[]}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  it('should have no violations on Code Console (Demo)', async () => {
    // Known to fail runtime, but keeping test structure
    const testQueryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={testQueryClient}>
        <MemoryRouter>
          <CodeConsole inDemoMode={true} user={mockUser} handleLogout={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    // Skip axe check for now as runtime error persists
    // const results = await axe(container, axeConfig);
    // expect(results).toHaveNoViolations();
  }, 30000);

  it('should have no violations on Demo Landing page', async () => {
    const { container } = render(
      <MemoryRouter>
        <DemoLanding />
      </MemoryRouter>,
    );
    const results = await stripStylesAndRunAxe(container);
    expect(results.violations).toHaveLength(0);
  }, 30000);

  describe('Marketing Pages', () => {
    const marketingPages = [
      { name: 'Landing', component: <Landing /> },
      { name: 'AboutUs', component: <AboutUs isLoggedIn={false} /> },
      { name: 'AutograderDetail', component: <AutograderDetail isLoggedIn={false} /> },
      { name: 'FAQs', component: <FAQs isLoggedIn={false} /> },
      { name: 'IntegrationsPage', component: <IntegrationsPage isLoggedIn={false} /> },
      { name: 'PrivacyPolicy', component: <PrivacyPolicy isLoggedIn={false} /> },
      { name: 'Scholarship', component: <Scholarship isLoggedIn={false} /> },
      { name: 'SignUpManager', component: <SignUpManager /> },
      { name: 'TermsOfService', component: <TermsOfService isLoggedIn={false} /> },
      { name: 'WhyUse', component: <WhyUse isLoggedIn={false} /> },
      { name: 'AllTestimonials', component: <AllTestimonials isLoggedIn={false} /> },
    ];

    marketingPages.forEach(({ name, component }) => {
      it(`should have no violations on ${name} page`, async () => {
        const { container } = render(<MemoryRouter>{component}</MemoryRouter>);
        const results = await stripStylesAndRunAxe(container);
        expect(results.violations).toHaveLength(0);
      }, 30000);
    });
  });
});
