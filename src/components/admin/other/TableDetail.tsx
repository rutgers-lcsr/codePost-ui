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

interface IProps {
  loadComplete: boolean;
  isEmpty: boolean;
  title: string | React.ReactNode;
  breadcrumbs?: React.ReactNode;
  emptyNode: React.ReactNode;
  actions: React.ReactNode[];
  columns: Array<ColumnProps<any>>;
  data: any[];
  tableProps?: any;
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

  public getColumnSearchProps = (dataIndex: string) => ({
    defaultSortOrder: this.defaultSortOrder,
    render: (text: string, record: any, index: number) =>
      typeof text === 'string' ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#5CBB8B', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text.toString()}
        />
      ) : (
        text
      ),
  });

  public setSearchText = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchText: event.target.value });
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
        const columns = [...this.props.columns];
        let dataIndex: string = '0';

        /* find first column whose property primaryColumn == 'primary' */
        columns.forEach((column, i) => {
          if (column.key === 'primary') {
            switch (typeof column.key) {
              case 'string':
                dataIndex = column.dataIndex!; // FIXME: alter type definition to guarantee this field
                break;
              case 'number':
                dataIndex = column.dataIndex!.toString();
                break;
              default:
                dataIndex = '0';
                break;
            }
            columns[i] = { ...columns[i], ...this.getColumnSearchProps(dataIndex) };
          }
        });

        const data = this.props.data.filter((el: any) => {
          if (this.state.searchText === '') {
            return true;
          } else {
            return el[dataIndex].includes(this.state.searchText);
          }
        });

        content = (
          <div>
            <Input.Search onChange={this.setSearchText} placeholder={'Search...'} style={{ width: 300 }} allowClear />
            <br />
            <br />
            <Table
              columns={columns}
              dataSource={data}
              pagination={{ showSizeChanger: true, pageSizeOptions: ['10', '50', '100'] }}
              {...(this.props.tableProps ? this.props.tableProps : undefined)}
            />
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
      />
    );
  }
}

export default TableDetail;
