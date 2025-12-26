import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import CockpitDashboard from './pages/CockpitDashboard';
import SystemHealth from './pages/SystemHealth';
import AIProblemSolver from './pages/AIProblemSolver';
import DepartmentPortal from './pages/DepartmentPortal';
import EmergencyControls from './pages/EmergencyControls';
import SystemLogs from './pages/SystemLogs';
import PerformanceMonitoring from './pages/PerformanceMonitoring';
import SecurityCenter from './pages/SecurityCenter';
import FeatureManagement from './pages/FeatureManagement';
import './App.css';

const { Content } = Layout;

function App() {
  return (
    <div className="cockpit-interface">
      <AuthProvider>
        <BrowserRouter>
          <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
            <Content style={{ padding: 0, background: 'transparent' }}>
              <Routes>
                {/* Public login route */}
                <Route path="/login" element={<Login />} />
                
                {/* Protected routes with different security levels */}
                <Route 
                  path="/cockpit" 
                  element={
                    <ProtectedRoute requiredClearance="L1" requiredPermissions={['SYSTEM_MONITORING']}>
                      <CockpitDashboard />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/system-health" 
                  element={
                    <ProtectedRoute requiredClearance="L1" requiredPermissions={['SYSTEM_MONITORING']}>
                      <SystemHealth />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/performance" 
                  element={
                    <ProtectedRoute requiredClearance="L2" requiredPermissions={['PERFORMANCE_MONITORING']}>
                      <PerformanceMonitoring />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/security" 
                  element={
                    <ProtectedRoute requiredClearance="L3" requiredPermissions={['SECURITY_MONITORING']}>
                      <SecurityCenter />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/logs" 
                  element={
                    <ProtectedRoute requiredClearance="L2" requiredPermissions={['LOG_ACCESS']}>
                      <SystemLogs />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/ai-solver" 
                  element={
                    <ProtectedRoute requiredClearance="L2" requiredPermissions={['AI_PROBLEM_SOLVER']}>
                      <AIProblemSolver />
                    </ProtectedRoute>
                  } 
                />
                
                <Route 
                  path="/department/:departmentId" 
                  element={
                    <ProtectedRoute requiredClearance="L2" requiredPermissions={['DEPARTMENT_ACCESS']}>
                      <DepartmentPortal />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Emergency controls - highest security level */}
                <Route 
                  path="/emergency" 
                  element={
                    <ProtectedRoute requiredClearance="L4" requiredPermissions={['EMERGENCY_CONTROLS']} emergencyAccess={true}>
                      <EmergencyControls />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Feature Management - Control platform features */}
                <Route 
                  path="/features" 
                  element={
                    <ProtectedRoute requiredClearance="L3" requiredPermissions={['FEATURE_MANAGEMENT']}>
                      <FeatureManagement />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default route redirects to cockpit */}
                <Route path="/" element={<Navigate to="/cockpit" replace />} />
                
                {/* Catch all route */}
                <Route path="*" element={<Navigate to="/cockpit" replace />} />
              </Routes>
            </Content>
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;