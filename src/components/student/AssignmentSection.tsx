// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useState, useCallback } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Badge, Flex, Typography } from 'antd';
import { AnimatePresence, motion } from 'motion/react';

export type SectionVariant = 'overdue' | 'dueToday' | 'dueSoon' | 'upcoming' | 'completed' | 'unpublished';

interface AssignmentSectionProps {
  title: string;
  count: number;
  variant: SectionVariant;
  icon: React.ReactNode;
  children: React.ReactNode;
  /** If true, the section body starts collapsed (header still visible) */
  defaultCollapsed?: boolean;
}

const variantColors: Record<SectionVariant, string> = {
  overdue: '#ff4d4f',
  dueToday: '#fa8c16',
  dueSoon: '#faad14',
  upcoming: '#1677ff',
  completed: '#52c41a',
  unpublished: '#8c8c8c',
};

const AssignmentSection: React.FC<AssignmentSectionProps> = ({
  title,
  count,
  variant,
  icon,
  children,
  defaultCollapsed = false,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapse = useCallback(() => setCollapsed((prev) => !prev), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCollapse();
      }
    },
    [toggleCollapse],
  );

  const iconColor = variantColors[variant];

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.section
          aria-label={`${title} — ${count} assignment${count === 1 ? '' : 's'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{ marginBottom: 16 }}
        >
          <Flex
            align="center"
            gap={8}
            onClick={toggleCollapse}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={!collapsed}
            style={{
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(0, 0, 0, 0.02)',
              userSelect: 'none',
            }}
          >
            <span style={{ color: iconColor, fontSize: 16 }} aria-hidden="true">
              {icon}
            </span>
            <Typography.Text strong style={{ flex: 1 }}>
              {title}
            </Typography.Text>
            <Badge count={count} color={iconColor} overflowCount={999} />
            <DownOutlined
              style={{
                fontSize: 12,
                color: '#8c8c8c',
                transition: 'transform 0.25s',
                transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
              }}
              aria-hidden="true"
            />
          </Flex>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: {
                      transition: { staggerChildren: 0.06 },
                    },
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 8 }}
                >
                  {React.Children.map(children, (child) => (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 8 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                        },
                      }}
                    >
                      {child}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default AssignmentSection;
