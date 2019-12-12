import { IShortcutCategory } from './KeyboardShortcuts';

const shortcuts: IShortcutCategory[] = [
  {
    category: 'General',
    shortcuts: [
      {
        name: 'Show Shortcuts Guide',
        keys: ['COMMAND', '/'],
      },
      {
        name: 'Dark Mode',
        keys: ['COMMAND', 'l'],
      },
      {
        name: 'View Grade Breakdown',
        keys: ['COMMAND', 'SHIFT', 'b'],
      },
      {
        name: 'Zoom',
        keys: ['COMMAND', '+', 'SLASH', '-'],
      },
    ],
  },
  {
    category: 'Navigate',
    shortcuts: [
      {
        name: 'Change File',
        keys: ['COMMAND', 'file-#'],
      },
      {
        name: 'Move Cursor to Code',
        keys: ['COMMAND', 'LEFT'],
      },
      {
        name: 'Move Cursor to Comments',
        keys: ['COMMAND', 'RIGHT'],
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
    category: 'Manage',
    shortcuts: [
      {
        name: 'Toggle Finalize',
        keys: ['COMMAND', 'SHIFT', 'f'],
      },
      {
        name: 'Edit Rubric (Admin)',
        keys: ['COMMAND', 'e'],
      },
      {
        name: 'Claim Another',
        keys: ['COMMAND', 'SHIFT', 'p'],
      },
      {
        name: 'Search Rubric',
        keys: ['COMMAND', 'o'],
      },
    ],
  },
  {
    category: 'Edit (Active Comment)',
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
        name: 'Scroll Rubric Comments',
        keys: ['COMMAND', 'u', 'SLASH', 'i'],
      },
      {
        name: 'Link Highlighted Rubric Comment',
        keys: ['ENTER'],
      },
      {
        name: 'Remove Rubric Comment',
        keys: ['COMMAND', 'y'],
      },
    ],
  },
];

export default shortcuts;
