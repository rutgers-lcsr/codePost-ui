// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FileOutlined } from '@ant-design/icons';
import { useCodeConsoleStore } from '../../../../stores/useCodeConsoleStore';
import { FileWithId } from '../../../../utils/file';
import type { LayoutConfig, SidebarPanelDefinition } from '../SidebarRegistry';
import FileMenu, { FileMenuTitle, FileMenuTooltip } from '../../menu/FileMenu';

function FilesPanel({ config }: { config: LayoutConfig }) {
  return <FileMenu isFilesOnly={config.isFilesOnly} />;
}

export function filesDef(_config: LayoutConfig): SidebarPanelDefinition {
  return {
    key: 'file-menu',
    order: 30,
    icon: FileOutlined,
    title: <FilesPanelTitle />,
    tooltip: <FilesPanelTooltip />,
    visible: () => true,
    render: () => <FilesPanel config={_config} />,
  };
}

function FilesPanelTitle() {
  const files = useCodeConsoleStore((s) => s.files) as FileWithId[];
  return <FileMenuTitle key="files" files={files} />;
}

function FilesPanelTooltip() {
  const files = useCodeConsoleStore((s) => s.files) as FileWithId[];
  return <FileMenuTooltip key="files-tooltip" files={files} />;
}
