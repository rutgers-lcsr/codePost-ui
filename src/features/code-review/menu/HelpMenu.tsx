// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Typography, Divider, Descriptions, Card } from 'antd';
import { QuestionCircleOutlined, ThunderboltOutlined, BookOutlined } from '@ant-design/icons';
import { ConsoleThemeContext, consoleThemes } from '../../../styles/abstracts/_console-theme-context';
import shortcuts from '../keyboard_shortcuts';
import { IShortcutCategory } from '../KeyboardShortcuts';

const { Title, Paragraph, Text } = Typography;

export const HelpMenuTitle = () => {
  return (
    <span>
      <QuestionCircleOutlined style={{ marginRight: '10px' }} />
      Help
    </span>
  );
};

interface IHelpers {
  isStudent: boolean;
}

const HelpMenu = (props: IHelpers) => {
  const { consoleTheme } = React.useContext(ConsoleThemeContext);
  const isLight = consoleTheme === consoleThemes.light;
  const theme = consoleTheme;

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: theme.siderBg,
        color: theme.text,
      }}
    >
      <Title level={4} style={{ color: theme.text }}>
        <BookOutlined /> {props.isStudent ? 'Student Help' : 'Grader Help'}
      </Title>
      <Paragraph style={{ color: theme.text }}>
        {props.isStudent
          ? 'Welcome to the code console! Here are some resources to help you review your code.'
          : 'Welcome to the grading console! Here are some resources to help you grade efficiently.'}
      </Paragraph>

      <Divider style={{ borderColor: theme.codeBorder }} />

      <Title level={5} style={{ color: theme.text }}>
        <ThunderboltOutlined /> Keyboard Shortcuts
      </Title>

      {shortcuts
        .filter((category: IShortcutCategory) => (props.isStudent ? !category.graderOnly : true))
        .map((category: IShortcutCategory, index: number) => (
          <Card
            key={index}
            size="small"
            title={category.category}
            style={{
              marginBottom: '10px',
              backgroundColor: isLight ? '#fff' : '#333',
              borderColor: theme.codeBorder,
            }}
            headStyle={{ color: theme.text }}
            bodyStyle={{ padding: '10px' }}
          >
            <Descriptions column={1} size="small">
              {category.shortcuts.map((shortcut, sIndex) => (
                <Descriptions.Item key={sIndex} label={<span style={{ color: theme.text }}>{shortcut.name}</span>}>
                  {shortcut.keys.map((k, kIndex) => (
                    <Text code key={kIndex} style={{ color: theme.text }}>
                      {k}
                    </Text>
                  ))}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        ))}

      {!props.isStudent && (
        <>
          <Divider style={{ borderColor: theme.codeBorder }} />

          <Title level={5} style={{ color: theme.text }}>
            Grading Tips
          </Title>
          <ul style={{ paddingLeft: '20px' }}>
            <li>
              Use <strong>Pinned Comments</strong> (Ctrl+Shift+H) to save frequently used feedback.
            </li>
            <li>
              Switch between files quickly using <strong>Alt + [</strong> or <strong>Alt + ]</strong>.
            </li>
            <li>
              Use the <strong>Rubric</strong> tab (Ctrl+Shift+G) to apply structured grading criteria.
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default HelpMenu;
