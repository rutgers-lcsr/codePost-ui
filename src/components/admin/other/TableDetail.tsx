// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

import { Input, Table } from 'antd';
import { ColumnProps } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
import Highlighter from 'react-highlight-words';

import CPFlex from '../../core/CPFlex';
import CPAdminDetail from '../other/CPAdminDetail';

import { PAGE_SIZE_OPTIONS } from '../../utils/LocalSettings';
import useDefaultPageSize from '../../utils/useDefaultPageSize';

/**********************************************************************************************************************/
/* Types
/**********************************************************************************************************************/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ITableDetailColumn extends ColumnProps<any> {
  renderForSearch?: (
    searchText: string,
  ) => (text: string, record: Record<string, unknown>, index: number) => React.ReactNode;
}

interface IProps {
  loadComplete: boolean;
  isEmpty: boolean;
  title: string | React.ReactNode;
  breadcrumbs?: React.ReactNode;
  emptyNode: React.ReactNode;
  actions: React.ReactNode[];
  columns: ITableDetailColumn[];
  data: Record<string, unknown>[];
  tableProps?: Record<string, unknown>;
  drawer?: React.ReactNode;
  pagination?: Record<string, unknown> | false;
  hideSearch?: boolean;
  titleInfo?: string | React.ReactNode;
  onRowClick?: (record: Record<string, unknown>) => void;
  detail?: React.ReactNode;
  components?: Record<string, unknown>;
  onRow?: (record: Record<string, unknown>, index?: number) => React.HTMLAttributes<HTMLElement>;
  expandAllRows?: boolean;
  tableOnly?: boolean;
}

/**********************************************************************************************************************/
/* Constants
/**********************************************************************************************************************/

const MIN_ROWS = 10;
const MANY_ROWS = 50;
const HIGHLIGHT_BACKGROUND_COLOR = '#48cc98';
const SEARCH_PLACEHOLDER = 'Search...';
const SEARCH_INPUT_WIDTH = 320;

/**********************************************************************************************************************/
/* Helper Functions
/**********************************************************************************************************************/

/**
 * Render a highlighter component for search text
 */
const renderHighlighter = (text: string, searchText: string): React.ReactNode => {
  return (
    <Highlighter
      highlightStyle={{ backgroundColor: HIGHLIGHT_BACKGROUND_COLOR, padding: 0 }}
      searchWords={[searchText]}
      autoEscape
      textToHighlight={text}
    />
  );
};

/**
 * Get default render function for column based on data type
 */
const getDefaultRenderFunction = (searchText: string) => {
  return (text: unknown, _record: unknown, _index: number): React.ReactNode => {
    switch (typeof text) {
      case 'string':
        return renderHighlighter(text, searchText);
      case 'number':
        return renderHighlighter(text.toString(), searchText);
      default:
        return text as React.ReactNode;
    }
  };
};

/**
 * Filter data based on search text
 */
const filterData = (data: Record<string, unknown>[], searchText: string): Record<string, unknown>[] => {
  if (searchText === '') {
    return data;
  }

  const keys = data.length > 0 ? Object.keys(data[0]) : [];
  return data.filter((el: Record<string, unknown>) => {
    for (const key of keys) {
      if (key !== 'key') {
        switch (typeof el[key]) {
          case 'string':
            if ((el[key] as string).toUpperCase().includes(searchText)) {
              return true;
            }
            break;
          case 'number':
            if (el[key].toString().includes(searchText)) {
              return true;
            }
            break;
        }
      }
    }
    return false;
  });
};

/**********************************************************************************************************************/
/* Component
/**********************************************************************************************************************/

const TableDetail: React.FC<IProps> = ({
  loadComplete,
  isEmpty,
  title,
  breadcrumbs,
  emptyNode,
  actions,
  columns,
  data,
  tableProps,
  drawer,
  pagination: paginationProp,
  hideSearch = false,
  titleInfo,
  onRowClick,
  detail,
  components,
  onRow,
  expandAllRows = false,
  tableOnly = false,
}) => {
  const [searchText, setSearchText] = useState<string>('');
  const [pageSize, setPageSize] = useDefaultPageSize();

  /* 🔥 alert, the code below is fire 🔥
   * Columns passed into this component may have an optional 'render' key.
   * If present, the value of this key is a function which takes a string
   * argument (representing the current searchText) and returns a function
   * that renders the table row. The searchText can be used by the returned
   * function to highlight searched phrases in ReactNode components.
   *
   * If not present, this function will try to highlight searchText phrases
   * in the column iff the column's value (the 'text' value) is a string.
   * Otherwise, we have no way to inject highlighting into the cell, so
   * just render the cell value as is.
   */
  const getColumnSearchProps = useCallback(
    (column: ITableDetailColumn): ColumnProps => {
      let renderFunction;
      if (column.render !== undefined) {
        renderFunction = column.render;
      } else if (column.renderForSearch !== undefined) {
        renderFunction = column.renderForSearch(searchText);
      } else {
        renderFunction = getDefaultRenderFunction(searchText);
      }

      return {
        render: renderFunction,
      };
    },
    [searchText],
  );

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value.toUpperCase());
  }, []);

  // Generate columns with search highlighting
  const enrichedColumns = useMemo(() => {
    return columns.map((column) => ({
      ...column,
      ...getColumnSearchProps(column),
    }));
  }, [columns, getColumnSearchProps]);

  // Filter data based on search text
  const filteredData = useMemo(() => {
    return filterData(data, searchText);
  }, [data, searchText]);

  // Generate row click handler
  const rowClickHandler = useMemo(() => {
    if (onRow !== undefined) {
      return onRow;
    }
    if (onRowClick !== undefined) {
      return (record: Record<string, unknown>, _rowIndex?: number) => ({
        onClick: (_event: React.MouseEvent) => {
          if (onRowClick) {
            return onRowClick(record);
          }
        },
      });
    }
    return undefined;
  }, [onRow, onRowClick]);

  // Generate pagination config
  const paginationConfig = useMemo(() => {
    if (paginationProp !== undefined) {
      return paginationProp;
    }
    if (filteredData.length < MIN_ROWS) {
      return false;
    }
    return {
      showSizeChanger: true,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      position:
        filteredData.length > MANY_ROWS ? ['topRight' as const, 'bottomRight' as const] : ['bottomRight' as const],
      pageSize,
      onShowSizeChange: (_current: number, size: number) => setPageSize(size),
      onChange: (_page: number, size: number) => setPageSize(size),
    };
  }, [filteredData.length, pageSize, paginationProp, setPageSize]);

  // Render loading state
  if (!loadComplete) {
    const loadingContent = (
      <div>
        <Input.Search disabled={true} placeholder={SEARCH_PLACEHOLDER} style={{ width: SEARCH_INPUT_WIDTH }} />
        <br />
        <br />
        <Table columns={columns} dataSource={[]} loading={true} locale={{ emptyText: '-' }} />
        {detail}
      </div>
    );

    if (tableOnly) {
      return (
        <div>
          <CPFlex left={[]} right={actions} gutterSize={10} />
          {loadingContent}
        </div>
      );
    }

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={breadcrumbs}
        title={title}
        actions={[]}
        content={loadingContent}
        titleInfo={titleInfo}
      />
    );
  }

  // Render empty state
  if (isEmpty) {
    if (tableOnly) {
      return (
        <div>
          <CPFlex left={[]} right={actions} gutterSize={10} />
          {emptyNode}
        </div>
      );
    }

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={breadcrumbs}
        title={title}
        actions={[]}
        content={emptyNode}
        titleInfo={titleInfo}
      />
    );
  }

  // Render table with data
  const tableContent = (
    <div>
      {!hideSearch && (
        <div style={{ marginBottom: 20 }}>
          <Input.Search
            onChange={handleSearchChange}
            placeholder={SEARCH_PLACEHOLDER}
            style={{ width: SEARCH_INPUT_WIDTH }}
            allowClear
          />
        </div>
      )}
      <Table
        columns={enrichedColumns}
        dataSource={filteredData}
        components={components}
        expandable={{ defaultExpandAllRows: expandAllRows }}
        onRow={rowClickHandler}
        pagination={paginationConfig}
        {...(tableProps || undefined)}
      />
      {drawer}
      {detail}
    </div>
  );

  if (tableOnly) {
    return (
      <div>
        <CPFlex left={[]} right={actions} gutterSize={10} />
        {tableContent}
      </div>
    );
  }

  return (
    <CPAdminDetail
      goBack={null}
      breadcrumbs={breadcrumbs}
      title={title}
      actions={actions}
      content={tableContent}
      titleInfo={titleInfo}
    />
  );
};

export { TableDetail };
