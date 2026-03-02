---
trigger: always_on
description: UI infrastructure patterns and conventions for codePost frontend development
---

# codePost UI Infrastructure Guide

This document outlines the key architectural patterns, conventions, and best practices for the codePost-ui React application.

## Tech Stack

| Category         | Technology               |
| ---------------- | ------------------------ |
| Framework        | React 19 with TypeScript |
| Build Tool       | Vite 7.x                 |
| UI Library       | Ant Design 6.x           |
| State Management | Zustand 5.x              |
| Routing          | React Router 7.x         |
| Styling          | SCSS + CSS-in-JS         |
| Code Editor      | Monaco Editor            |
| Type Validation  | io-ts + fp-ts            |
| Testing          | Vitest + Testing Library |

## Project Structure

```
src/
├── components/          # React components by feature area
│   ├── admin/          # Admin dashboard components
│   ├── code-review/    # Code Console and review components
│   ├── core/           # Core shared components (Layout, Header, etc.)
│   ├── landing/        # Marketing pages
│   ├── pre-auth/       # Login, signup, auth flows
│   ├── student/        # Student-facing views
│   ├── grader/         # Grader-specific components
│   └── utils/          # Utility components
├── api-client/     # API layer and data types
├── stores/             # Zustand state stores
├── styles/             # SCSS files (7-1 architecture)
├── theme/              # Ant Design theming and color tokens
├── types/              # TypeScript type definitions
└── hooks/              # Custom React hooks
```

## State Management with Zustand

All complex component state should use Zustand stores instead of `useState` for:

- Shared state across components
- State that persists across route changes
- Complex state with many properties

### Store Pattern

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface MyStoreState {
  data: DataType[];
  isLoading: boolean;
}

interface MyStoreActions {
  setData: (data: DataType[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

type MyStore = MyStoreState & MyStoreActions;

const initialState: MyStoreState = {
  data: [],
  isLoading: false,
};

export const useMyStore = create<MyStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setData: (data) => set({ data }, false, 'setData'),
      setLoading: (loading) => set({ isLoading: loading }, false, 'setLoading'),
      reset: () => set(initialState, false, 'reset'),
    }),
    { name: 'my-store' },
  ),
);
```

### Existing Stores

| Store                   | Purpose                                                |
| ----------------------- | ------------------------------------------------------ |
| `useCodeConsoleStore`   | Code Console UI state (comments, files, tests, rubric) |
| `useRubricStore`        | Rubric editing state with undo/redo support            |
| `useRubricCommentStore` | Rubric comment management                              |

## API Layer (Infrastructure)

All API interactions go through the `infrastructure/` layer using io-ts for type validation.

### Type Definition Pattern

```typescript
import * as t from 'io-ts';

// Define the io-ts codec
export const MyObject = t.type({
  id: t.number,
  name: t.string,
  optional: t.union([t.string, t.undefined]),
});

// Extract the TypeScript type
export type MyObjectType = t.TypeOf<typeof MyObject>;
```

### API Functions

The api is generated through an Openapi schema in the codePost-api repo. If you need to add new endpoints, add them to the openapi spec and regenerate the client. under `~/codePost-api/scripts/generate-ts-client.ts`. this will generate the client in `~/codePost-ui/src/api-client/` and you can import the generated functions and types directly from there.

## Theming & Colors

**Never hardcode color values.** Always use tokens from the theme system.

### In TypeScript/TSX

```typescript
import { colors } from '@/theme/colors';
// or
import { brandColors, actionColors, neutralColors } from '@/theme/colors';

// Use in components
<div style={{ color: colors.brandPrimary }}>
```

### In SCSS

```scss
@import '@/styles/abstracts/colors';

.my-class {
  color: $brandPrimary;
  background: $neutralBackground;
  border: 1px solid $neutralBorder;
}
```

### Color Categories

| Category        | Examples                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| Brand           | `brandPrimary`, `brandLight`, `brandDark`, `brandAccent`                    |
| Action          | `actionBlue`, `actionGreen`, `actionYellow`, `actionRed` + `*Fade` variants |
| Neutral (Light) | `neutralTitle`, `neutralMainText`, `neutralSecondaryText`, `neutralBorder`  |
| Neutral (Dark)  | `neutralDarkTitle`, `neutralDarkMainText`, `neutralDarkBackground`          |
| Green Palette   | `green1` through `green10`                                                  |

## Component Conventions

### File Naming

- Components: `PascalCase.tsx` (e.g., `MyComponent.tsx`)
- Styles: `_component-name.scss` with underscore prefix for partials
- Tests: `ComponentName.test.tsx`

### Component Structure

```typescript
import React from 'react';
import { Button, Space } from 'antd';
import { useMyStore } from '@/stores/useMyStore';
import { colors } from '@/theme/colors';
import './MyComponent.scss';

interface MyComponentProps {
  id: number;
  onComplete?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ id, onComplete }) => {
  // Zustand store hooks
  const { data, setData } = useMyStore();

  // Local state (only for UI-only concerns)
  const [isOpen, setIsOpen] = React.useState(false);

  // Handlers
  const handleClick = () => {
    // ...
    onComplete?.();
  };

  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
};
```

### Accessibility Requirements

- All interactive elements must have unique, descriptive `id` attributes
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.)
- Ensure WCAG 2 AA color contrast (4.5:1 for text)
- Form elements must have associated labels
- Use Ant Design's accessibility-compliant components

## Testing

### Running Tests

```bash
npm run test        # Run tests in watch mode
npm run build       # Type check + build (includes tsc)
```

### Test File Location

Tests live in `src/__tests__/` or alongside components as `*.test.tsx`.

### Accessibility Testing

```typescript
import { axe, toHaveNoViolations } from 'vitest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Key Components Reference

### Code Console (`components/code-review/`)

The main code review interface. Key sub-components:

- `CodeWindow` - Monaco editor wrapper
- `CommentPanel` - Comment list and creation
- `RubricPanel` - Rubric selection
- `TestResults` - Autograder test results display
- `FileTree` - Submission file navigator

### Admin Panel (`components/admin/`)

Course and assignment management:

- `AssignmentEditor` - Assignment configuration
- `RubricManager` - Rubric category/comment editing
- `TestManager` - Autograder test configuration
- `GraderDashboard` - Grading progress overview

## SCSS Architecture (7-1 Pattern)

```
styles/
├── abstracts/     # Variables, mixins, functions
│   └── _colors.scss
├── base/          # Reset, typography
├── components/    # Component-specific styles
├── layout/        # Grid, header, footer
├── pages/         # Page-specific styles
├── themes/        # Theme variations
├── vendors/       # Third-party overrides
└── main.scss      # Main entry point
```

## Common Patterns

### Loading States

```typescript
const { isLoading, setLoading } = useMyStore();

if (isLoading) {
  return <Spin size="large" />;
}
```

### Error Handling

API errors are handled by `handleErrorResponse` in generics.tsx and display user-friendly messages via `antd.message`.

### Form Handling

Use Ant Design's `Form` component with controlled inputs:

```typescript
const [form] = Form.useForm();

<Form form={form} onFinish={handleSubmit}>
  <Form.Item name="field" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```

## Build & Development

```bash
npm run dev           # Start dev server
npm run build         # Build for development
npm run build:production  # Build for production
npm run preview       # Preview production build
npm run lint:fix      # Fix linting issues
```

## Important Notes

1. **Type Safety**: Use api-client which is autogenerated from openapi if your changing api definations go to codePost-Api and regenerate the client.
2. **Immutability**: State updates should be immutable. Use spread operators or `immutability-helper`.
3. **Performance**: Use `React.memo`, `useMemo`, and `useCallback` for expensive operations.
4. **Monaco Editor**: Use `@monaco-editor/react` wrapper, not raw Monaco.
5. **Routing**: Use React Router v7 patterns with `useNavigate`, `useParams`, etc.
6. **Legacy Code**: Remove legacy code do not use adapters.
7. **NO ANY**: no using any in interfaces.
