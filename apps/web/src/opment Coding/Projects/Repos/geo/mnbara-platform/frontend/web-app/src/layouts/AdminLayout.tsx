import { Link, useLocation, Outlet } from 'react-router-dom';
import { ControlCenterThemeProvider, useControlCenterTheme } from '../contexts/ControlCenterThemeContext';

const NAV_ITEMS = [
  { label: 'Command Deck', path: '/admin', icon: '🛰️' },
  { label: 'Threat Map', path: '/admin/threat-map', icon: '🛡️' },
  { label: 'Server Ops', path: '/admin/servers', icon: '⚡' },
  { label: 'xyOps', path: '/admin/xyops', icon: '⚙️', description: 'جدولة مهام، workflows، مراقبة' },
  { label: 'Studio', path: '/admin/studio', icon: '🔧' },
  { label: 'Steganography', path: '/admin/stego', icon: '🔐' },
  { label: 'CMS Manager', path: '/admin/cms', icon: '📝' },
  { label: 'Ads Manager', path: '/admin/ads', icon: '📢' },
  { label: 'Travelers', path: '/admin/travelers', icon: '✈️' },
  { label: 'Financial Guarantees', path: '/admin/guarantees', icon: '🔐' },
  { label: 'Apocalypse', path: '/admin/apocalypse', icon: '☢️', danger: true },
];

function AdminLayoutContent() {
  const location = useLocation();
  const { theme, setTheme, colors } = useControlCenterTheme();

  return (
    <div className="min-h-screen flex transition-colors duration-500" style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Sidebar */}
      <aside 
        className="w-64 flex-shrink-0 border-r transition-colors duration-500"
        style={{ borderColor: colors.panel, backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <div className="p-6 border-b" style={{ borderColor: colors.panel }}>
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl animate-pulse">⚡</span> MNbarh C2
          </Link>
          <div className="text-[10px] uppercase tracking-widest opacity-50 mt-1">
            {theme.toUpperCase()} MODE ACTIVE
          </div>
        </div>
        
        <nav className="p-4 space-y-2">
          {NAV_ITEMS.map((item) => (
            <div key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
                    ? 'shadow-lg'
                    : 'opacity-70 hover:opacity-100 hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: (location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))) 
                    ? colors.primary + '20' 
                    : 'transparent',
                  color: (location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))
                    ? colors.primary
                    : colors.text,
                  borderLeft: (location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path)))
                    ? `3px solid ${item.danger ? colors.danger : colors.primary}`
                    : '3px solid transparent'
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* Theme Switcher */}
        <div className="p-4 mt-10 border-t border-white/10">
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">System Key</p>
          <div className="grid grid-cols-2 gap-2">
            {(['modern', 'cyberpunk', 'egyptian', 'hacker'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`text-xs p-2 rounded border transition-all ${theme === t ? 'bg-white/10 border-current' : 'border-transparent hover:bg-white/5'}`}
                style={{ color: theme === t ? colors.accent : colors.text }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 mt-auto border-t" style={{ borderColor: colors.panel }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-inner"
              style={{ backgroundColor: colors.secondary, color: '#fff' }}
            >
              AD
            </div>
            <div className="text-sm">
              <p className="font-medium">Commander</p>
              <p className="text-xs opacity-50">Level 5 Access</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Ambient Effects */}
        {theme === 'cyberpunk' && <div className="absolute inset-0 pointer-events-none bg-[url('/grid.png')] opacity-10 z-0" />}
        
        <header 
          className="h-16 flex items-center justify-between px-8 border-b relative z-10 backdrop-blur-sm"
          style={{ borderColor: colors.panel, backgroundColor: colors.background + '80' }}
        >
          <h1 className="text-lg font-semibold tracking-wide">
            {NAV_ITEMS.find(i => location.pathname.startsWith(i.path))?.label || 'Command Deck'}
          </h1>
          <div className="flex items-center gap-4">
            <div className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: colors.accent }} />
            <span className="text-xs font-mono opacity-70">SYSTEM ONLINE</span>
          </div>
        </header>

        <div className="p-8 pb-20 relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <ControlCenterThemeProvider>
      <AdminLayoutContent />
    </ControlCenterThemeProvider>
  );
}
