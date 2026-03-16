// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { vi, expect } from 'vitest';
import * as matchers from 'vitest-axe/matchers';
import 'vitest-axe/extend-expect';
import React from 'react';

expect.extend(matchers);

//----------- Configure Enzyme (best-effort only)

// Enzyme setup removed as it causes build errors and is not used.

// ----------- Enable localStorage usage

const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock react-pdf to avoid Node.js legacy build warnings and heavy rendering in tests.
vi.mock('react-pdf', () => {
  return {
    Document: ({ children }) => React.createElement('div', null, children),
    Page: () => React.createElement('div'),
    pdfjs: { GlobalWorkerOptions: {} },
  };
});

// Mock Wistia player to avoid media-related side effects in tests.
vi.mock('@wistia/wistia-player-react', () => {
  return {
    WistiaPlayer: () => React.createElement('div'),
    WistiaProvider: ({ children }) => React.createElement('div', null, children),
  };
});

global.DOMMatrix = class DOMMatrix {
  constructor() {
    this.a = 1;
    this.b = 0;
    this.c = 0;
    this.d = 1;
    this.e = 0;
    this.f = 0;
  }
  toString() {
    return '';
  }
};

// ----------- Test environment polyfills / mocks

// Prevent real network calls from components rendered in tests.
// Individual tests can still override this via vi.spyOn(globalThis, 'fetch').
Object.defineProperty(globalThis, 'fetch', {
  configurable: true,
  writable: true,
  value: vi.fn(async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    const method = (init?.method || (typeof input !== 'string' ? input?.method : undefined) || 'GET').toUpperCase();

    // Minimal fixtures used across tests.
    const mockOrganization = { id: 1, name: 'Test University', sso_enabled: false };
    const mockCourse = {
      id: 1,
      name: 'CS101',
      period: 'Fall 2023',
      assignments: [],
      sections: [],
      sendReleasedSubmissionsToBack: false,
      showStudentsStatistics: false,
      timezone: 'US/Eastern',
      emailNewUsers: false,
      anonymousGradingDefault: false,
      allowGradersToEditRubric: false,
      minComments: 0,
      noUnfinalize: false,
      lateDayCreditsAllowable: null,
      archived: false,
      activateQueue: true,
      inviteCode: '',
      emailWhitelist: '',
      inviteCodeEnabled: false,
      enableStudentFeedbackNotifications: false,
      expiration_date: null,
      studentsCanSeeGraders: false,
      studentCount: 0,
      isRubricEditor: false,
    };

    let payload = {};

    if (url?.includes('/registration/current_user/')) {
      payload = {
        email: 'test@university.edu',
        token: 'abc',
        id: 123,
        organization: 1,
        canCreateCourses: true,
        canModifyRosters: true,
        api_token: null,
        studentCourses: [],
        graderCourses: [],
        superGraderCourses: [],
        courseadminCourses: [mockCourse],
        leaderSections: [],
        student_sections: [],
        showProductTips: true,
        codePostAdmin: false,
        hasCredentials: true,
        isOrgStaff: true,
      };
    } else if (url?.includes('/organizations/') && method === 'GET') {
      if (url.match(/\/organizations\/?$/) || url.match(/\/organizations\/?\?/)) {
        payload = [mockOrganization];
      } else if (url.match(/\/organizations\/[0-9]+\/?(\?.*)?$/)) {
        payload = mockOrganization;
      } else if (url.includes('/organizationsUsers/') || url.includes('/users/')) {
        payload = [];
      } else {
        payload = mockOrganization;
      }
    } else if (url?.includes('/courses/') && method === 'GET') {
      if (url.match(/\/courses\/?$/) || url.match(/\/courses\/?\?/)) {
        payload = [mockCourse];
      } else if (url.match(/\/courses\/[0-9]+\/?(\?.*)?$/)) {
        payload = mockCourse;
      } else if (url.includes('/roster')) {
        payload = { courseAdmins: [], students: [], graders: [] };
      } else {
        payload = mockCourse;
      }
    } else if (url?.includes('/users/me/') && (method === 'GET' || method === 'PATCH')) {
      payload = {
        email: 'test@university.edu',
        token: 'abc',
        id: 123,
        organization: 1,
        canCreateCourses: true,
        canModifyRosters: true,
        api_token: 'api-token-123',
        studentCourses: [],
        graderCourses: [],
        superGraderCourses: [],
        courseadminCourses: [mockCourse],
        leaderSections: [],
        student_sections: [],
        showProductTips: true,
        codePostAdmin: false,
        hasCredentials: true,
        isOrgStaff: true,
      };
    } else if (url?.includes('/users/requestAPIToken/') && method === 'POST') {
      payload = {
        email: 'test@university.edu',
        token: 'abc',
        id: 123,
        organization: 1,
        canCreateCourses: true,
        canModifyRosters: true,
        api_token: 'api-token-123',
        studentCourses: [],
        graderCourses: [],
        superGraderCourses: [],
        courseadminCourses: [mockCourse],
        leaderSections: [],
        student_sections: [],
        showProductTips: true,
        codePostAdmin: false,
        hasCredentials: true,
        isOrgStaff: true,
      };
    } else if (url?.includes('/registration/emailPasswordReset/') && method === 'POST') {
      payload = { success: true };
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
});

// jsdom doesn't implement these fully; stub them to avoid noisy failures.
Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

// jsdom throws for pseudo-element queries; provide a safe wrapper.
const originalGetComputedStyle = window.getComputedStyle?.bind(window);
Object.defineProperty(window, 'getComputedStyle', {
  configurable: true,
  writable: true,
  value: (elt, pseudoElt) => {
    if (pseudoElt) {
      return {
        getPropertyValue: () => '',
      };
    }
    try {
      if (originalGetComputedStyle) {
        return originalGetComputedStyle(elt, pseudoElt);
      }
    } catch {
      // fall through to stub
    }
    return {
      getPropertyValue: () => '',
    };
  },
});

if (globalThis.HTMLCanvasElement) {
  globalThis.HTMLCanvasElement.prototype.getContext = vi.fn(() => {
    // minimal stub; enough for libraries that just check for a truthy context
    return {
      canvas: {},
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(() => ({ data: [] })),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    };
  });
}

// ResizeObserver stub for components relying on layout observers (e.g., Wistia, charts)
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
  };
}
