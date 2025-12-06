import { useEffect, useState } from 'react';
import { Table, Tag, Input, Select, Card, Space, Button } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import axios from 'axios';
import type { ColumnsType } from 'antd/es/table';

const { Search } = Input;
const { Option } = Select;

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  kycVerified: boolean;
  lastLogin: string;
  lastLoginCountry: string;
  lastLoginDevice: string;
  totalOrders: number;
  totalSpent: number;
}

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [kycFilter, setKycFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, kycFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (roleFilter) params.role = roleFilter;
      if (kycFilter) params.kycStatus = kycFilter;

      const response = await axios.get('/api/admin/users', { params });
      setUsers(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => `${record.firstName} ${record.lastName}`,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : role === 'traveler' ? 'blue' : 'green'}>
          {role.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'KYC',
      dataIndex: 'kycVerified',
      key: 'kycVerified',
      render: (verified) => (
        <Tag color={verified ? 'success' : 'warning'}>
          {verified ? 'Verified' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Country',
      dataIndex: 'lastLoginCountry',
      key: 'lastLoginCountry',
    },
    {
      title: 'Device',
      dataIndex: 'lastLoginDevice',
      key: 'lastLoginDevice',
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'right',
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      align: 'right',
      render: (value) => `$${value.toFixed(2)}`,
    },
  ];

  return (
    <div>
      <h1>User Management</h1>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle">
          <Search
            placeholder="Search users..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            onSearch={(value) => console.log(value)}
          />
          <Select
            placeholder="Filter by Role"
            style={{ width: 150 }}
            allowClear
            onChange={setRoleFilter}
          >
            <Option value="buyer">Buyer</Option>
            <Option value="traveler">Traveler</Option>
            <Option value="seller">Seller</Option>
            <Option value="admin">Admin</Option>
          </Select>
          <Select
            placeholder="Filter by KYC"
            style={{ width: 150 }}
            allowClear
            onChange={setKycFilter}
          >
            <Option value="true">Verified</Option>
            <Option value="false">Pending</Option>
          </Select>
          <Button icon={<FilterOutlined />} onClick={fetchUsers}>
            Apply Filters
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: limit,
          total,
          onChange: setPage,
          showSizeChanger: false,
          showTotal: (total) => `Total ${total} users`,
        }}
      />
    </div>
  );
};

export default Users;
