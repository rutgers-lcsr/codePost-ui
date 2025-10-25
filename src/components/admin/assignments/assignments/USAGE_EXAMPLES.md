# Assignment Files Form - Usage Examples

## Basic Usage

### In a Form Component

```tsx
import AssignmentFilesForm from './AssignmentFilesForm';
import { Form } from 'antd';

function MyAssignmentForm() {
  const [form] = Form.useForm();

  return (
    <Form form={form}>
      <Form.Item name="files" label="Submission Files" extra="Define which files students can submit">
        <AssignmentFilesForm />
      </Form.Item>
    </Form>
  );
}
```

### With Controlled State

```tsx
import AssignmentFilesForm from './AssignmentFilesForm';
import { useState } from 'react';
import type { AssignmentFileType } from '../../../../infrastructure/file';

function MyComponent() {
  const [files, setFiles] = useState<AssignmentFileType[]>([
    {
      id: 1,
      name: 'main.py',
      extension: 'py',
      required: true,
      assignment: 123,
      path: '',
      code: '',
      created: new Date().toISOString(),
      description: '',
    },
  ]);

  return <AssignmentFilesForm value={files} onChange={setFiles} />;
}
```

### In Assignment Settings Dialog (Current Implementation)

```tsx
<Form.Item
  label="Submission files"
  extra="Define which files students can submit. Required files must be present in every submission."
  labelCol={{ span: 6 }}
  wrapperCol={{ span: 18 }}
>
  <AssignmentFilesForm value={templates} onChange={setTemplates} />
</Form.Item>
```

## Common Scenarios

### Scenario 1: Python Programming Assignment

```tsx
// Initial files for a Python assignment
const pythonAssignmentFiles: AssignmentFileType[] = [
  {
    id: 1,
    name: 'main.py',
    extension: 'py',
    required: true,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Main Python file',
  },
  {
    id: 2,
    name: 'test.py',
    extension: 'py',
    required: true,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Test file',
  },
  {
    id: 3,
    name: 'README.md',
    extension: 'md',
    required: false,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Optional readme',
  },
];

<AssignmentFilesForm value={pythonAssignmentFiles} onChange={handleChange} />;
```

### Scenario 2: Java Programming Assignment

```tsx
// Initial files for a Java assignment
const javaAssignmentFiles: AssignmentFileType[] = [
  {
    id: 1,
    name: 'Main.java',
    extension: 'java',
    required: true,
    assignment: assignmentId,
    path: 'src',
    code: '',
    created: new Date().toISOString(),
    description: 'Main class',
  },
  {
    id: 2,
    name: 'Test.java',
    extension: 'java',
    required: true,
    assignment: assignmentId,
    path: 'src',
    code: '',
    created: new Date().toISOString(),
    description: 'Test class',
  },
  {
    id: 3,
    name: 'pom.xml',
    extension: 'xml',
    required: false,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Maven config',
  },
];

<AssignmentFilesForm value={javaAssignmentFiles} onChange={handleChange} />;
```

### Scenario 3: Web Development Assignment

```tsx
// Initial files for a web dev assignment
const webDevFiles: AssignmentFileType[] = [
  {
    id: 1,
    name: 'index.html',
    extension: 'html',
    required: true,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Main HTML file',
  },
  {
    id: 2,
    name: 'styles.css',
    extension: 'css',
    required: true,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Stylesheet',
  },
  {
    id: 3,
    name: 'script.js',
    extension: 'js',
    required: true,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'JavaScript file',
  },
  {
    id: 4,
    name: 'README.md',
    extension: 'md',
    required: false,
    assignment: assignmentId,
    path: '',
    code: '',
    created: new Date().toISOString(),
    description: 'Documentation',
  },
];

<AssignmentFilesForm value={webDevFiles} onChange={handleChange} />;
```

## Handling File Changes

### Save to Backend

```tsx
function MyComponent() {
  const [files, setFiles] = useState<AssignmentFileType[]>([]);

  const handleFilesChange = (newFiles: AssignmentFileType[]) => {
    setFiles(newFiles);
  };

  const handleSave = async () => {
    // Separate new files from existing files
    const newFiles = files.filter((f) => f.id < 0);
    const existingFiles = files.filter((f) => f.id > 0);

    // Create new files
    for (const file of newFiles) {
      await AssignmentFile.create({
        name: file.name,
        extension: file.extension,
        assignment: file.assignment,
        path: file.path,
        required: file.required,
      });
    }

    // Update existing files
    for (const file of existingFiles) {
      await AssignmentFile.update(file);
    }
  };

  return (
    <>
      <AssignmentFilesForm value={files} onChange={handleFilesChange} />
      <Button onClick={handleSave}>Save Changes</Button>
    </>
  );
}
```

### Track Changes

```tsx
function MyComponent() {
  const [initialFiles, setInitialFiles] = useState<AssignmentFileType[]>([]);
  const [currentFiles, setCurrentFiles] = useState<AssignmentFileType[]>([]);

  const hasChanges = () => {
    return JSON.stringify(initialFiles) !== JSON.stringify(currentFiles);
  };

  const handleSave = () => {
    // Save logic...
    setInitialFiles(currentFiles);
  };

  const handleCancel = () => {
    setCurrentFiles(initialFiles);
  };

  return (
    <>
      <AssignmentFilesForm value={currentFiles} onChange={setCurrentFiles} />
      <Button disabled={!hasChanges()} onClick={handleSave}>
        Save
      </Button>
      <Button disabled={!hasChanges()} onClick={handleCancel}>
        Cancel
      </Button>
    </>
  );
}
```

### Validation

```tsx
import { Form, message } from 'antd';

function MyComponent() {
  const [form] = Form.useForm();

  const validateFiles = (_: unknown, files: AssignmentFileType[]) => {
    // Must have at least one file
    if (!files || files.length === 0) {
      return Promise.reject('At least one file is required');
    }

    // Must have at least one required file
    const hasRequired = files.some((f) => f.required);
    if (!hasRequired) {
      return Promise.reject('At least one file must be marked as required');
    }

    // Check for valid extensions
    const invalidFiles = files.filter((f) => !f.extension || f.extension.length === 0);
    if (invalidFiles.length > 0) {
      return Promise.reject('All files must have a valid extension');
    }

    return Promise.resolve();
  };

  return (
    <Form form={form}>
      <Form.Item name="files" label="Submission Files" rules={[{ validator: validateFiles }]}>
        <AssignmentFilesForm />
      </Form.Item>
    </Form>
  );
}
```

## Event Handling

### Listen for Specific Changes

```tsx
function MyComponent() {
  const [files, setFiles] = useState<AssignmentFileType[]>([]);

  const handleFilesChange = (newFiles: AssignmentFileType[]) => {
    const added = newFiles.filter((nf) => !files.some((f) => f.id === nf.id));
    const removed = files.filter((f) => !newFiles.some((nf) => nf.id === f.id));
    const modified = newFiles.filter((nf) => {
      const old = files.find((f) => f.id === nf.id);
      return old && JSON.stringify(old) !== JSON.stringify(nf);
    });

    if (added.length > 0) {
      console.log('Files added:', added);
    }
    if (removed.length > 0) {
      console.log('Files removed:', removed);
    }
    if (modified.length > 0) {
      console.log('Files modified:', modified);
    }

    setFiles(newFiles);
  };

  return <AssignmentFilesForm value={files} onChange={handleFilesChange} />;
}
```

### Integrate with Other Form Fields

```tsx
function MyComponent() {
  const [form] = Form.useForm();

  // When files change, update related fields
  const handleFilesChange = (newFiles: AssignmentFileType[]) => {
    const requiredCount = newFiles.filter((f) => f.required).length;

    // Update another form field based on files
    form.setFieldsValue({
      files: newFiles,
      requiredFileCount: requiredCount,
    });

    // Show message if no required files
    if (requiredCount === 0 && newFiles.length > 0) {
      message.warning('Consider marking at least one file as required');
    }
  };

  return (
    <Form form={form}>
      <Form.Item name="files" label="Files">
        <AssignmentFilesForm onChange={handleFilesChange} />
      </Form.Item>
      <Form.Item name="requiredFileCount" label="Required Files">
        <InputNumber disabled />
      </Form.Item>
    </Form>
  );
}
```

## Testing Examples

### Unit Test

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AssignmentFilesForm from './AssignmentFilesForm';

describe('AssignmentFilesForm', () => {
  it('adds a new file when clicking Add button', () => {
    const onChange = jest.fn();
    render(<AssignmentFilesForm onChange={onChange} />);

    // Type filename
    const input = screen.getByPlaceholderText(/Enter file name/i);
    fireEvent.change(input, { target: { value: 'test.py' } });

    // Click add
    const addButton = screen.getByText('Add File');
    fireEvent.click(addButton);

    // Verify onChange called with new file
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'test.py',
          extension: 'py',
        }),
      ]),
    );
  });

  it('prevents duplicate file names', () => {
    const initialFiles = [{ id: 1, name: 'main.py', extension: 'py' /* ... */ }];
    render(<AssignmentFilesForm value={initialFiles} />);

    // Try to add duplicate
    const input = screen.getByPlaceholderText(/Enter file name/i);
    fireEvent.change(input, { target: { value: 'main.py' } });

    // Add button should be disabled
    const addButton = screen.getByText('Add File');
    expect(addButton).toBeDisabled();

    // Error message should appear
    expect(screen.getByText('Duplicate name')).toBeInTheDocument();
  });
});
```
