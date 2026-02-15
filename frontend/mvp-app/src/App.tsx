import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { Layout } from 'antd';
import UserDashboard from './pages/UserDashboard/UserDashboard';
import TravelerDashboard from './pages/TravelerDashboard/TravelerDashboard';
import './App.css';

// Configure Ant Design theme for Arabic/English support
const theme = {
  token: {
    colorPrimary: '#1890ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
};

function App() {
  return (
    <ConfigProvider theme={theme}>
      <Layout style={{ minHeight: '100vh' }}>
        <Router>
          <Routes>
            {/* User Dashboard - Main entry point */}
            <Route path="/" element={<UserDashboard />} />
            <Route path="/dashboard" element={<UserDashboard />} />
            
            {/* Traveler Dashboard */}
            <Route path="/traveler" element={<TravelerDashboard />} />
            <Route path="/traveler/dashboard" element={<TravelerDashboard />} />
            
            {/* Future routes */}
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route path="/register" element={<Register />} /> */}
            {/* <Route path="/orders" element={<Orders />} /> */}
            {/* <Route path="/payments" element={<Payments />} /> */}
          </Routes>
        </Router>
      </Layout>
    </ConfigProvider>
  );
}

export default App;