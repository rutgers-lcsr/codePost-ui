/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* style imports */
import { Input, Table } from 'antd';
import { ColumnProps } from 'antd/lib/table';

/* other library imports */
import Highlighter from 'react-highlight-words';

/* codePost imports */
import CPFlex from '../../core/CPFlex';
import CPAdminDetail from '../other/CPAdminDetail';

import { LOCAL_SETTINGS } from '../../utils/LocalSettings';

/**********************************************************************************************************************/

export interface ITableDetailColumn extends ColumnProps<any> {
  renderForSearch?: (searchText: string) => (text: string, record: any, index: number) => React.ReactNode;
}

interface IProps {
  loadComplete: boolean;
  isEmpty: boolean;
  title: string | React.ReactNode;
  breadcrumbs?: React.ReactNode;
  emptyNode: React.ReactNode;
  actions: React.ReactNode[];
  columns: ITableDetailColumn[];
  data: any[];
  tableProps?: any;
  drawer?: React.ReactNode;
  pagination?: any;
  hideSearch?: boolean;
  titleInfo?: string | React.ReactNode;
  onRowClick?: (record: any) => void;
  detail?: React.ReactNode;
  components?: any;
  onRow?: any;
  expandAllRows?: boolean;
  tableOnly?: boolean; // only show the table without the layout
}

interface IState {
  searchText: string;
}

class TableDetail extends React.Component<IProps, IState> {
  private defaultSortOrder: 'ascend' | 'descend' = 'ascend';

  public constructor(props: any) {
    super(props);
    this.state = {
      searchText: '',
    };
  }

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
  public getColumnSearchProps = (column: ITableDetailColumn): ColumnProps => {
    let renderFunction;
    if (column.render !== undefined) {
      renderFunction = column.render;
    } else if (column.renderForSearch !== undefined) {
      renderFunction = column.renderForSearch(this.state.searchText);
    } else {
      renderFunction = (text: unknown, _record: unknown, _index: number): React.ReactNode => {
        switch (typeof text) {
          case 'string':
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text.toString()}
              />
            );
          case 'number':
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text.toString()}
              />
            );
          default:
            return text as React.ReactNode;
        }
      };
    }

    return {
      defaultSortOrder: this.defaultSortOrder,
      render: renderFunction,
    };
  };

  public setSearchText = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchText: event.target.value.toUpperCase() });
  };

  public onShowSizeChange = (_current: number, size: number) => {
    LOCAL_SETTINGS.defaultPageSize.setter(size);
  };

  public render() {
    let content = null;
    let actions: React.ReactNode[] = [];

    if (!this.props.loadComplete) {
      content = (
        <div>
          <Input.Search disabled={true} placeholder={'Search...'} style={{ width: 300 }} />
          <br />
          <br />
          <Table columns={this.props.columns} dataSource={[]} loading={true} locale={{ emptyText: '-' }} />
          {this.props.detail}
        </div>
      );
    } else {
      if (this.props.isEmpty) {
        content = this.props.emptyNode;
      } else {
        const oldColumns = this.props.columns;
        const newColumns: Array<ColumnProps<Record<string, unknown>>> = [];
        oldColumns.forEach((_, i) => {
          newColumns[i] = {
            ...oldColumns[i],
            ...this.getColumnSearchProps(oldColumns[i]),
          };
        });

        // Cache keys so we can search each field of the row
        const keys = this.props.data.length > 0 ? Object.keys(this.props.data[0]) : [];
        const data = this.props.data.filter((el: Record<string, unknown>) => {
          if (this.state.searchText === '') {
            return true;
          } else {
            for (const key of keys) {
              if (key !== 'key') {
                switch (typeof el[key]) {
                  case 'string':
                    if (el[key].toUpperCase().includes(this.state.searchText)) {
                      return true;
                    }
                    break;
                  case 'number':
                    if (el[key].toString().includes(this.state.searchText)) {
                      return true;
                    }
                    break;
                }
              }
            }
            return false;
          }
        });

        /***************************************/
        /* PAGINATION CONFIG
        /**************************************/

        const MIN_ROWS = 10;
        const MANY_ROWS = 50;

        content = (
          <div>
            {this.props.hideSearch ? null : (
              <div>
                <Input.Search
                  onChange={this.setSearchText}
                  placeholder={'Search...'}
                  style={{ width: 300 }}
                  allowClear
                />
                <br />
                <br />
              </div>
            )}
            <Table
              columns={newColumns}
              dataSource={data}
              components={this.props.components}
              defaultExpandAllRows={this.props.expandAllRows}
              onRow={
                this.props.onRow !== undefined
                  ? this.props.onRow
                  : this.props.onRowClick !== undefined
                    ? (record, _rowIndex) => {
                        return {
                          onClick: (_event) => {
                            if (this.props.onRowClick) {
                              return this.props.onRowClick(record);
                            }
                          },
                        };
                      }
                    : undefined
              }
              pagination={
                this.props.pagination !== undefined
                  ? this.props.pagination
                  : data.length < MIN_ROWS
                    ? false
                    : {
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '50', '100'],
                        position: data.length > MANY_ROWS ? 'both' : 'bottom',
                        defaultPageSize: LOCAL_SETTINGS.defaultPageSize.getter(),
                        onShowSizeChange: this.onShowSizeChange,
                      }
              }
              {...(this.props.tableProps ? this.props.tableProps : undefined)}
            />
            {this.props.drawer}
            {this.props.detail}
          </div>
        );

        actions = this.props.actions;
      }
    }

    if (this.props.tableOnly) {
      return (
        <div>
          <CPFlex left={[]} right={[actions]} gutterSize={10} />
          {content}
        </div>
      );
    }

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={this.props.breadcrumbs}
        title={this.props.title}
        actions={actions}
        content={content}
        titleInfo={this.props.titleInfo}
      />
    );
  }
}

export { TableDetail };
