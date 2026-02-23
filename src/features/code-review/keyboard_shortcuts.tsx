// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { IShortcutCategory } from './KeyboardShortcuts';

const shortcuts: IShortcutCategory[] = [
  {
    category: 'General',
    graderOnly: false,
    shortcuts: [
      {
        name: 'Show Shortcuts Guide',
        keys: ['COMMAND', '/'],
      },
      {
        name: 'Toggle Info Tab',
        keys: ['COMMAND', 'SHIFT', 'e'],
      },
      {
        name: 'Toggle Test Tab',
        keys: ['COMMAND', 'SHIFT', 'd'],
      },
      {
        name: 'Toggle File Tab',
        keys: ['COMMAND', 'SHIFT', 'f'],
      },
      {
        name: 'Toggle Rubric Tab',
        keys: ['COMMAND', 'SHIFT', 'g'],
      },
      {
        name: 'Toggle Pinned Comments',
        keys: ['COMMAND', 'SHIFT', 'h'],
      },
      {
        name: 'Dark Mode',
        keys: ['COMMAND', 'i'],
      },
      {
        name: 'View Grade Breakdown',
        keys: ['COMMAND', 'SHIFT', 'b'],
      },
      {
        name: 'Zoom',
        keys: ['COMMAND', '+', 'SLASH', '-'],
      },
      {
        name: 'Change File',
        keys: ['COMMAND', 'file-#'],
      },
    ],
  },
  {
    category: 'Manage',
    graderOnly: true,
    shortcuts: [
      {
        name: 'Claim Another',
        keys: ['COMMAND', 'SHIFT', 'u'],
      },
      {
        name: 'Search Rubric',
        keys: ['COMMAND', 'o'],
      },
    ],
  },
  {
    category: 'Cursor Mode',
    graderOnly: true,
    shortcuts: [
      {
        name: 'Enable Cursor Mode',
        keys: ['COMMAND', 'SHIFT', 'y'],
      },
      {
        name: 'Move Cursor to Comments',
        keys: ['COMMAND', 'E'],
      },
      {
        name: 'Select Comments',
        keys: ['UP', 'SLASH', 'DOWN'],
      },
      {
        name: 'Highlight Line / Activate Comment',
        keys: ['ENTER'],
      },
    ],
  },
  {
    category: 'Edit (Active Comment)',
    graderOnly: true,
    shortcuts: [
      {
        name: 'Save Comment',
        keys: ['SHIFT', 'ENTER'],
      },
      {
        name: 'Change Point Value',
        keys: ['COMMAND', '[', 'SLASH', ']'],
      },
      {
        name: 'Delete Comment',
        keys: ['COMMAND', 'd', 'SLASH', 'COMMAND', 'd'],
      },

      {
        name: 'Link Highlighted Rubric Comment',
        keys: ['ENTER'],
      },

      {
        name: 'Deactivate Comment',
        keys: ['ESCAPE'],
      },
    ],
  },
];

export default shortcuts;
