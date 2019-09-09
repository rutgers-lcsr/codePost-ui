import * as React from "react";

import { Card, Input, Table } from "antd";

import { Link } from "react-router-dom";

import { OrganizationType } from "../../infrastructure/organization";

const { Search } = Input;

const fullstoryQuery = (email: string) => {
  // tslint:disable-next-line
  return `https://app.fullstory.com/ui/MFFNS/segments/everyone/people:search:((NOW%2FDAY-29DAY:NOW%2FDAY%2B1DAY):((UserEmail:==:%22${email}%22)):():():():)/0`;
};

const cols = [
  {
    title: "Email",
    dataIndex: "email",
    key: "email",
    render: (email: string) => {
      return email;
    }
  },
  {
    title: "Organization",
    dataIndex: "organization",
    key: "organization",
    render: (organization: OrganizationType) => {
      return `${organization.name} (${organization.shortname})`;
    }
  },
  {
    title: "Course",
    dataIndex: "course",
    key: "course",
    render: (course: any, record: any) => {
      return `${record["course_name"]} | ${record["course_period"]}`;
    }
  },
  {
    title: "Actions",
    dataIndex: "actions",
    key: "actions",
    render: (actions: string, record: any) => {
      return (
        <span>
          <Link to={`/loginas/${record["email"]}`} target="_blank">
            loginas
          </Link>{" "}
          |{" "}
          <a href={fullstoryQuery(record["email"])} target="_blank">
            fullstory
          </a>
        </span>
      );
    }
  }
];

const AdminTable = (props: any) => {
  const [filteredAdmins, setFilteredAdmins] = React.useState(props.admins);

  const onSearch = (value: string) => {
    const v = value.toLowerCase();
    setFilteredAdmins(
      props.admins.filter((admin: any) => {
        return (
          admin["email"].toLowerCase().includes(v) ||
          admin["course_name"].toLowerCase().includes(v) ||
          admin["course_period"].toLowerCase().includes(v) ||
          admin["organization"]["name"].toLowerCase().includes(v)
        );
      })
    );
  };

  return (
    <Card title="Admins" bordered={false} style={{ width: "100%" }}>
      <div style={{ padding: "14px 0px", width: "400px" }}>
        <Search placeholder="search..." onSearch={onSearch} enterButton />
      </div>
      <div style={{ padding: "14px 0px" }}>
        Admin Count: {filteredAdmins.length}
      </div>
      <Table columns={cols} dataSource={filteredAdmins} size="small" />
    </Card>
  );
};

export default AdminTable;
