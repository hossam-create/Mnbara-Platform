/**
 * Dashboard Layout Component
 * Main layout wrapper for admin dashboard with sidebar navigation
 */

import { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingOutlined,
  BarChartOutlined,
  SafetyOutlined,
  GlobalOutlined,
  RocketOutlined,
  BulbOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownloadOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SessionTimeoutModal from './SessionTimeoutModal';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: 'Users',
    },
    {
      key: '/disputes',
      icon: <ShoppingOutlined />,
      label: 'Disputes',
    },
    {
      key: '/trust-review',
      icon: <SafetyOutlined />,
      label: 'Trust & Review',
    },
    {
      key: '/guarantee-ledger',
      icon: <DownloadOutlined />,
      label: 'Guarantee Ledger',
    },
    {
      key: '/kyc',
      icon: <SafetyOutlined />,
      label: 'KYC Management',
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: '/reports',
      icon: <DownloadOutlined />,
      label: 'Reports',
    },
    {
      key: '/geographic',
      icon: <GlobalOutlined />,
      label: 'Geographic',
    },
    {
      key: '/flights',
      icon: <RocketOutlined />,
      label: 'Flight Tracking',
    },
    {
      key: '/ml-insights',
      icon: <BulbOutlined />,
      label: 'ML Insights',
    },
    {
      key: '/ops',
      icon: <EyeOutlined />,
      label: 'Live Ops',
    },
    {
      key: 'control-center',
      icon: <RocketOutlined />,
      label: 'Ship Control',
      children: [
        { key: '/control-center/operations', label: 'Operations' },
        { key: '/control-center/logistics', label: 'Logistics' },
        { key: '/control-center/disputes', label: 'Disputes' },
        { key: '/control-center/analytics', label: 'Intelligence' },
        { key: '/control-center/feature-flags', label: 'Feature Flags' },
        { key: '/control-center/engineering', label: 'Engineering' },
      ],
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 32,
            margin: 16,
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 'bold',
          }}
        >
          {collapsed ? 'M' : 'MNBARA'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <div
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Avatar icon={<UserOutlined />} />
              <span>{user?.email}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
      
      {/* Session Timeout Modal */}
      <SessionTimeoutModal />
    </Layout>
  );
};

export default DashboardLayout;
