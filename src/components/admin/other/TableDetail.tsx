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
import CPAdminDetail from '../other/CPAdminDetail';

/**********************************************************************************************************************/

interface ITableDetailColumn extends ColumnProps<any> {
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
  titleInfo?: string | React.ReactNode;
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
  public getColumnSearchProps = (column: ITableDetailColumn): ColumnProps<any> => {
    let renderFunction;
    if (column.render !== undefined) {
      renderFunction = column.render;
    } else if (column.renderForSearch !== undefined) {
      renderFunction = column.renderForSearch(this.state.searchText);
    } else {
      renderFunction = (text: any, record: any, index: number) => {
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
            break;
          case 'number':
            return (
              <Highlighter
                highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
                searchWords={[this.state.searchText]}
                autoEscape
                textToHighlight={text.toString()}
              />
            );
            break;
          default:
            return text;
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

  public render() {
    let content = null;
    let actions: React.ReactNode[] = [];

    if (!this.props.loadComplete) {
      content = (
        <div>
          <Input.Search disabled={true} placeholder={'Search...'} style={{ width: 300 }} />
          <br />
          <br />
          <Table columns={...this.props.columns} dataSource={[]} loading={true} locale={{ emptyText: '-' }} />
        </div>
      );
    } else {
      if (this.props.isEmpty) {
        content = this.props.emptyNode;
      } else {
        const oldColumns = this.props.columns;
        const newColumns: Array<ColumnProps<any>> = [];
        oldColumns.forEach((column, i) => {
          newColumns[i] = { ...oldColumns[i], ...this.getColumnSearchProps(oldColumns[i]) };
        });

        // Cache keys so we can search each field of the row
        const keys = this.props.data.length > 0 ? Object.keys(this.props.data[0]) : [];
        const data = this.props.data.filter((el: any) => {
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

        content = (
          <div>
            <Input.Search onChange={this.setSearchText} placeholder={'Search...'} style={{ width: 300 }} allowClear />
            <br />
            <br />
            <Table
              columns={newColumns}
              dataSource={data}
              pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '50', '100'] }}
              {...(this.props.tableProps ? this.props.tableProps : undefined)}
            />
            {this.props.drawer}
          </div>
        );

        actions = this.props.actions;
      }
    }

    return (
      <CPAdminDetail
        goBack={null}
        breadcrumbs={this.props.breadcrumbs}
        title={this.props.title}
        actions={actions}
        content={content}
        titleInfo={this.props.titleInfo}
        gutterSize={0}
      />
    );
  }
}

export { TableDetail, ITableDetailColumn };
