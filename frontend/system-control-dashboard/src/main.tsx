import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App.tsx'
import './index.css'

// Configure Ant Design theme for cockpit interface
const cockpitTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    colorBgBase: '#0a0e27',
    colorBgContainer: 'rgba(255, 255, 255, 0.05)',
    colorBorder: 'rgba(255, 255, 255, 0.1)',
    colorText: '#ffffff',
    colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    lineHeight: 1.5,
  },
  components: {
    Card: {
      colorBgContainer: 'rgba(255, 255, 255, 0.05)',
      colorBorderSecondary: 'rgba(255, 255, 255, 0.1)',
    },
    Button: {
      colorPrimary: '#1890ff',
      colorPrimaryHover: '#40a9ff',
      colorPrimaryActive: '#096dd9',
    },
    Layout: {
      colorBgHeader: 'rgba(0, 0, 0, 0.3)',
      colorBgBody: 'transparent',
      colorBgTrigger: 'rgba(255, 255, 255, 0.1)',
    },
    Menu: {
      colorBgContainer: 'transparent',
      colorItemBg: 'transparent',
      colorItemBgSelected: 'rgba(24, 144, 255, 0.2)',
      colorItemBgHover: 'rgba(255, 255, 255, 0.1)',
      colorItemText: '#ffffff',
      colorItemTextSelected: '#1890ff',
    },
    Progress: {
      colorSuccess: '#52c41a',
      colorWarning: '#fa8c16',
      colorError: '#f5222d',
    },
    Alert: {
      colorInfoBg: 'rgba(24, 144, 255, 0.1)',
      colorWarningBg: 'rgba(250, 140, 22, 0.1)',
      colorErrorBg: 'rgba(245, 34, 45, 0.1)',
      colorSuccessBg: 'rgba(82, 196, 26, 0.1)',
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider theme={cockpitTheme}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
)