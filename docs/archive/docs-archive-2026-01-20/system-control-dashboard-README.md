# System Control Dashboard

🚀 **Aircraft/Ship Cockpit Style System Control Interface**

Professional system monitoring and control dashboard with cockpit-inspired design for Mnbara Platform technical operations.

## 🎯 Purpose

This dashboard is specifically designed for **system administrators and DevOps teams** to monitor and control the technical infrastructure of the Mnbara platform.

## ✈️ Features

### 🛩️ **Cockpit Interface**
- Aircraft/Ship bridge inspired design
- Real-time system monitoring
- Emergency controls and auto-pilot mode
- Three view modes: Cockpit, Bridge, Command

### 🤖 **AI Integration**
- Intelligent problem detection
- Automated root cause analysis
- AI-generated solutions
- Predictive analytics

### 🏢 **Department Portals**
- Individual portals for each technical department
- Service management and monitoring
- Team performance metrics
- Alert management

### 📊 **Real-Time Monitoring**
- WebSocket integration for live data
- System health monitoring
- Performance analytics
- Alert management

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Ant Design** with custom dark theme
- **Framer Motion** for animations
- **@ant-design/plots** for data visualization
- **WebSocket** for real-time data
- **Zustand** for state management

## 🚀 Quick Start

### Install Dependencies
```bash
cd frontend/system-control-dashboard
npm install
```

### Run Development Server
```bash
npm run dev
```

The dashboard will be available at: **http://localhost:3001**

### Build for Production
```bash
npm run build
```

## 🎨 Design Philosophy

The interface is designed to mimic aircraft cockpits and ship bridges:
- **Dark theme** with blue/cyan accents
- **Circular gauges** and progress indicators
- **Status lights** and alert systems
- **Hierarchical information display**
- **Emergency controls** prominently placed

## 📁 Project Structure

```
src/
├── components/
│   ├── cockpit/           # Cockpit-style components
│   ├── monitoring/        # Real-time monitoring
│   └── controls/          # System controls
├── pages/
│   ├── CentralControl.tsx # Main cockpit dashboard
│   ├── SystemHealth.tsx   # System health monitoring
│   ├── AIProblemSolver.tsx# AI problem detection
│   └── DepartmentPortal.tsx# Department management
├── hooks/
│   ├── useWebSocket.ts    # Real-time data
│   ├── useSystemHealth.ts # System monitoring
│   └── useAIAnalytics.ts  # AI insights
└── styles/
    └── cockpit.css        # Cockpit-specific styles
```

## 🔐 Access Control

This dashboard is restricted to:
- **System Administrators**
- **DevOps Engineers** 
- **Technical Operations Team**
- **Emergency Response Team**

## 🌐 Ports

- **Development:** http://localhost:3001
- **Production:** https://control.mnbara.com

## 📊 Monitoring Capabilities

- **Infrastructure:** Kubernetes, Docker, Databases
- **Services:** Microservices health and performance
- **Security:** Threat detection and response
- **Performance:** Real-time metrics and alerts
- **AI/ML:** Model performance and predictions

## 🚨 Emergency Features

- **Kill Switch:** Emergency system shutdown
- **Auto-Pilot:** Automated problem resolution
- **Alert System:** Real-time notifications
- **Backup Controls:** Manual override capabilities

## 📞 Support

For technical issues with the System Control Dashboard:
- **DevOps Team:** devops@mnbara.com
- **Emergency:** +1-XXX-XXX-XXXX
- **Documentation:** https://docs.mnbara.com/system-control

---

**⚠️ WARNING:** This dashboard controls critical system infrastructure. Use with caution and follow all safety protocols.