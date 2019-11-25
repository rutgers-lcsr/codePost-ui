const shortcuts: IShortcutCategory[] = [
  {
    category: 'General',
    shortcuts: [
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
      {
        name: 'Adjust Code Area',
        keys: ['COMMAND', 'LEFT', 'SLASH', 'RIGHT'],
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
        name: 'Enter Cursor Mode',
        keys: ['COMMAND', 'DOWN'],
      },
      {
        name: 'Leave Cursor Mode',
        keys: ['ESC'],
      },
      {
        name: 'Move Cursor',
        keys: ['COMMAND', 'SLASH', 'UP', 'DOWN', 'LEFT', 'RIGHT'],
      },
      {
        name: 'Extend Code Cursor',
        keys: ['COMMAND', 'SHIFT', 'UP', 'SLASH', 'DOWN'],
      },
      {
        name: 'Highlight Line / Activate Comment',
        keys: ['ENTER'],
      },
      {
        name: 'Highlight Line',
        keys: ['CLICK', 'line-#'],
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
        keys: ['COMMAND', 'j', 'SLASH', 'k'],
      },
      {
        name: 'Link Highlighted Rubric Comment',
        keys: ['ENTER'],
      },
      {
        name: 'Clear Rubric Comment',
        keys: ['COMMAND', 'u'],
      },
    ],
  },
];

export default shortcuts;
