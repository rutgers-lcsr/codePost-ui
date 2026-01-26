import { Modal, Form, Input, InputNumber, Typography } from 'antd';

interface IProps {
    visible: boolean;
    onCancel: () => void;
    onInsert: (code: string) => void;
    language: string;
}

export const TestBuilderModal = (props: IProps) => {
    const [form] = Form.useForm();

    const generateSnippet = (values: any) => {
        const { name, points, logic, description } = values;
        const lang = props.language.toLowerCase();

        // Normalize logic indentation
        const indentedLogic = logic.split('\n').map((line: string) => `    ${line}`).join('\n');

        // Helper for description
        const descComment = description ? `    // ${description}\n` : '';
        const pythonDesc = description ? `    """\n    ${description}\n    """\n` : '';

        if (lang === 'python' || lang === 'ipynb') {
            const descArg = description ? `, description="${description}"` : '';
            return `
@test("${name}", points=${points}${descArg})
def test_${name.toLowerCase().replace(/\s+/g, '_')}():
${pythonDesc}${indentedLogic}
`;
        } else if (lang === 'java') {
            const descArg = description ? `, description="${description}"` : '';
            return `
@Test(name="${name}", points=${points}${descArg})
public void test${name.replace(/\s+/g, '')}() {
${descComment}${indentedLogic}
}`;
        } else if (lang === 'cpp' || lang === 'c') {
            if (description) {
                return `
TEST_DESC("${name}", ${points}, "${description}") {
${descComment}${indentedLogic}
}`;
            } else {
                return `
TEST("${name}", ${points}) {
${descComment}${indentedLogic}
}`;
            }
        } else if (lang === 'javascript' || lang === 'node') {
            const descArg = description ? `, "${description}"` : '';
            return `
test("${name}", ${points}${descArg}, function() {
${descComment}${indentedLogic}
});`;
        } else if (lang === 'php') {
            const descArg = description ? `, "${description}"` : '';
            return `
Tester::test("${name}", ${points}${descArg}, function() {
${descComment}${indentedLogic}
});`;
        } else if (lang === 'r') {
            const descArg = description ? `, "${description}"` : '';
            return `
run_test("${name}", ${points}${descArg}, function() {
${descComment}${indentedLogic}
})`;
        } else if (lang === 'ruby') {
            const descArg = description ? `, "${description}"` : '';
            return `
run_test("${name}", ${points}${descArg}) do
${description ? `    # ${description}\n` : ''}${indentedLogic}
end`;
        }

        return `// Unknown language: ${lang}\n// ${name} (${points} pts)\n${logic}`;
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const code = generateSnippet(values);
            props.onInsert(code);
            form.resetFields();
        } catch (e) {
            // validation failed
        }
    };

    return (
        <Modal
            title="Add Test Case"
            open={props.visible}
            onOk={handleOk}
            onCancel={props.onCancel}
            width={600}
            okText="Insert Test"
        >
            <Form form={form} layout="vertical" initialValues={{ points: 1 }}>
                <Form.Item name="name" label="Test Name" rules={[{ required: true, message: 'Missing test name' }]}>
                    <Input placeholder="e.g. Test Addition" />
                </Form.Item>
                <Form.Item name="description" label="Description">
                    <Input placeholder="Optional description of what this test checks" />
                </Form.Item>
                <Form.Item name="points" label="Points" rules={[{ required: true }]}>
                    <InputNumber min={0} />
                </Form.Item>

                <Form.Item label="Test Logic" name="logic" rules={[{ required: true, message: 'Enter the test logic' }]}>
                    <Input.TextArea
                        rows={6}
                        placeholder={
                            (props.language === 'python' || props.language === 'ipynb') ? "assert add(1, 2) == 3" :
                                props.language === 'java' ? "assertEquals(3, add(1, 2));" :
                                    "if (add(1,2) != 3) throw new Error('Failed');"
                        }
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Write the body of the test function here. The system will wrap it in the correct boilerplate for {props.language}.
                </Typography.Text>
            </Form>
        </Modal>
    );
};
