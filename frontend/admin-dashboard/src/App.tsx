import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Disputes from './pages/Disputes';
import DisputeDetail from './pages/DisputeDetail';
import Analytics from './pages/Analytics';
import KYCManagement from './pages/KYCManagement';
import GeographicVisualization from './pages/GeographicVisualization';
import FlightTracking from './pages/FlightTracking';
import MLInsights from './pages/MLInsights';
import Reports from './pages/Reports';
import OpsDashboard from './pages/OpsDashboard';
import TrustReviewDashboard from './pages/TrustReviewDashboard';
import GuaranteeLedger from './pages/GuaranteeLedger';

import OperationsPage from './pages/control-center/Operations';
import EngineeringPage from './pages/control-center/Engineering';
import FeatureFlagsPage from './pages/control-center/FeatureFlags';
import LogisticsPage from './pages/control-center/Logistics';
import CCAnalyticsPage from './pages/control-center/Analytics';
import CCDisputesPage from './pages/control-center/Disputes';
import CentralControl from './pages/control-center/CentralControl';
import DepartmentPortal from './pages/control-center/DepartmentPortal';
import AIProblemSolver from './pages/control-center/AIProblemSolver';
import UserManagement from './pages/control-center/UserManagement';

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="users/:userId" element={<UserDetail />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="disputes/:disputeId" element={<DisputeDetail />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="kyc" element={<KYCManagement />} />
              <Route path="trust-review" element={<TrustReviewDashboard />} />
              <Route path="guarantee-ledger" element={<GuaranteeLedger />} />
              <Route path="geographic" element={<GeographicVisualization />} />
              <Route path="flights" element={<FlightTracking />} />
              <Route path="ml-insights" element={<MLInsights />} />
              <Route path="reports" element={<Reports />} />
              <Route path="ops" element={<OpsDashboard />} />

              {/* Control Center Routes */}
              <Route path="control-center/central-control" element={<CentralControl />} />
              <Route path="control-center/department/:departmentId" element={<DepartmentPortal />} />
              <Route path="control-center/ai-problem-solver" element={<AIProblemSolver />} />
              <Route path="control-center/user-management" element={<UserManagement />} />
              <Route path="control-center/operations" element={<OperationsPage />} />
              <Route path="control-center/engineering" element={<EngineeringPage />} />
              <Route path="control-center/feature-flags" element={<FeatureFlagsPage />} />
              <Route path="control-center/logistics" element={<LogisticsPage />} />
              <Route path="control-center/analytics" element={<CCAnalyticsPage />} />
              <Route path="control-center/disputes" element={<CCDisputesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
