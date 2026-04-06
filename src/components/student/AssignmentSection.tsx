// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial Licensed, included with this software.
import React, { useState, useCallback } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { AnimatePresence, motion } from 'motion/react';
import styles from './StudentConsole.module.scss';

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

const iconClassName: Record<SectionVariant, string> = {
  overdue: styles.sectionIconOverdue,
  dueToday: styles.sectionIconDueToday,
  dueSoon: styles.sectionIconDueSoon,
  upcoming: styles.sectionIconUpcoming,
  completed: styles.sectionIconCompleted,
  unpublished: styles.sectionIconUnpublished,
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

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.section
          className={styles.section}
          aria-label={`${title} — ${count} assignment${count === 1 ? '' : 's'}`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            className={styles.sectionHeader}
            onClick={toggleCollapse}
            onKeyDown={handleKeyDown}
            role="button"
            tabIndex={0}
            aria-expanded={!collapsed}
            style={{ cursor: 'pointer' }}
          >
            <div className={iconClassName[variant] ?? styles.sectionIconUpcoming} aria-hidden="true">
              {icon}
            </div>
            <h2 className={styles.sectionTitle}>{title}</h2>
            <span className={styles.sectionCount} aria-label={`${count} assignment${count === 1 ? '' : 's'}`}>
              {count}
            </span>
            <DownOutlined
              className={collapsed ? styles.sectionChevron : styles.sectionChevronOpen}
              aria-hidden="true"
            />
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                className={styles.sectionList}
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
                  style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sc-space-sm)' }}
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
