// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { BookOutlined } from '@ant-design/icons';
import flatten from 'lodash/flatten';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import { useConsoleActions } from '../../ConsoleActionsContext';
import type { Assignment } from '../../../../types/common';
import Loading from '../../../../components/core/Loading';
import RubricManager, { IRubricManagerParams, RubricTooltip } from '../../../../components/core/rubric/RubricManager';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';

const RubricMenuUI = React.lazy(() => import('../../menu/RubricMenuUI'));

function RubricPanel({ config }: { config: LayoutConfig }) {
  const assignment = useCodeConsoleStore((s) => s.assignment);
  const rubricCategories = useCodeConsoleStore((s) => s.rubricCategories);
  const rubricComments = useCodeConsoleStore((s) => s.rubricComments);
  const rubricReload = useCodeConsoleStore((s) => s.rubricReload);
  const { submission } = useConsoleActions();

  const isDemoWithDefaults = config.isDemoMode && rubricCategories.length > 0;

  return (
    <RubricManager
      key="rubric-menu"
      assignment={assignment as Assignment}
      submissions={[]}
      onCancel={() => {}}
      reloadInterval={config.isDemoMode ? undefined : rubricReload}
      setRubric={config.isDemoMode ? undefined : submission.setRubric}
      shouldLoadFeedback={false}
      shouldLoadInstanceLists={!!assignment?.showFrequentlyUsedRubricComments}
      {...(isDemoWithDefaults
        ? {
            defaultRubric: {
              categories: rubricCategories,
              comments: flatten(Object.values(rubricComments)),
            },
          }
        : {})}
    >
      {({ props, state: rubricState, helpers }: IRubricManagerParams) => (
        <React.Suspense fallback={<Loading />}>
          <RubricMenuUI
            props={{ ...props, isDemoMode: config.isDemoMode, isAdmin: config.isAdmin }}
            state={rubricState}
            helpers={helpers}
          />
        </React.Suspense>
      )}
    </RubricManager>
  );
}

export function rubricDef(config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'rubric-menu',
    order: 40,
    icon: BookOutlined,
    title: 'Rubric',
    tooltip: <RubricPanelTooltip />,
    visible: (cfg) => cfg.showRubric && !cfg.isFilesOnly && !cfg.isStudentView,
    render: () => <RubricPanel config={config} />,
  };
}

function RubricPanelTooltip() {
  const rubricComments = useCodeConsoleStore((s) => s.rubricComments);
  return <RubricTooltip key="rubric-tooltip" itemsApplied={Object.values(rubricComments).flat().length} />;
}
