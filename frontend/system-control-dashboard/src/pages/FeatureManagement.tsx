// Feature Management Dashboard - لوحة إدارة الميزات
import React, { useState, useEffect } from 'react';
import './FeatureManagement.css';

interface Feature {
  id: string;
  key: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  category: string;
  service: string;
  version: string;
  isEnabled: boolean;
  isPublic: boolean;
  isBeta: boolean;
  isPremium: boolean;
  rolloutPercentage: number;
  rolloutStrategy: string;
  icon: string | null;
  color: string | null;
  enabledAt: string | null;
  disabledAt: string | null;
}

interface Release {
  version: string;
  name: string;
  nameAr: string | null;
  status: string;
  features: string[];
  releasedAt: string | null;
}

const CATEGORIES = [
  { key: 'FINTECH', label: 'FinTech', labelAr: 'التكنولوجيا المالية', icon: '💳' },
  { key: 'AI', label: 'AI', labelAr: 'الذكاء الاصطناعي', icon: '🤖' },
  { key: 'MARKETPLACE', label: 'Marketplace', labelAr: 'السوق', icon: '🏪' },
  { key: 'LOGISTICS', label: 'Logistics', labelAr: 'اللوجستيات', icon: '🚚' },
  { key: 'SECURITY', label: 'Security', labelAr: 'الأمان', icon: '🛡️' },
  { key: 'COMMUNICATION', label: 'Communication', labelAr: 'التواصل', icon: '💬' },
  { key: 'ANALYTICS', label: 'Analytics', labelAr: 'التحليلات', icon: '📊' },
  { key: 'EXPERIMENTAL', label: 'Experimental', labelAr: 'تجريبي', icon: '🧪' },
];

const FeatureManagement: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRolloutModal, setShowRolloutModal] = useState<Feature | null>(null);
  const [rolloutValue, setRolloutValue] = useState(0);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  // Mock data - in production, fetch from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Simulated API call
    setTimeout(() => {
      setFeatures([
        {
          id: '1', key: 'bnpl_service', name: 'Buy Now Pay Later', nameAr: 'اشتري الآن وادفع لاحقاً',
          description: 'Enable installment payments', descriptionAr: 'تفعيل الدفع بالتقسيط',
          category: 'FINTECH', service: 'bnpl-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '💳', color: '#4CAF50', enabledAt: '2026-03-01', disabledAt: null
        },
        {
          id: '2', key: 'crypto_payments', name: 'Cryptocurrency Payments', nameAr: 'الدفع بالعملات الرقمية',
          description: 'Accept Bitcoin, Ethereum, USDC', descriptionAr: 'قبول البيتكوين والإيثريوم',
          category: 'FINTECH', service: 'crypto-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '₿', color: '#F7931A', enabledAt: '2026-03-01', disabledAt: null
        },
        {
          id: '3', key: 'ai_assistant', name: 'AI Shopping Assistant', nameAr: 'مساعد التسوق الذكي',
          description: 'AI-powered recommendations', descriptionAr: 'توصيات مدعومة بالذكاء الاصطناعي',
          category: 'AI', service: 'ai-assistant-service', version: '10.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '🤖', color: '#00BCD4', enabledAt: '2026-03-15', disabledAt: null
        },
        {
          id: '4', key: 'mnbara_ai_engine', name: 'Mnbara AI Engine', nameAr: 'محرك منبرة للذكاء الاصطناعي',
          description: 'Custom AI like Siri', descriptionAr: 'ذكاء اصطناعي مخصص مثل سيري',
          category: 'AI', service: 'mnbara-ai-engine', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: true, isPremium: true,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '🧠', color: '#E91E63', enabledAt: '2026-03-15', disabledAt: null
        },
        {
          id: '5', key: 'wholesale_marketplace', name: 'B2B Wholesale', nameAr: 'سوق البيع بالجملة',
          description: 'Bulk orders for businesses', descriptionAr: 'طلبات بالجملة للشركات',
          category: 'MARKETPLACE', service: 'wholesale-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '🏢', color: '#795548', enabledAt: new Date().toISOString(), disabledAt: null
        },
        {
          id: '6', key: 'smart_delivery', name: 'Smart Delivery', nameAr: 'التوصيل الذكي',
          description: 'AI-optimized routes', descriptionAr: 'مسارات محسنة بالذكاء الاصطناعي',
          category: 'LOGISTICS', service: 'smart-delivery-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '🚚', color: '#3F51B5', enabledAt: new Date().toISOString(), disabledAt: null
        },
        // NEW BRAINSTORM FEATURES
        {
          id: '7', key: 'voice_search', name: 'Voice Search', nameAr: 'البحث الصوتي',
          description: 'Search using voice commands', descriptionAr: 'البحث بالأوامر الصوتية',
          category: 'AI', service: 'voice-commerce-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '🎤', color: '#9C27B0', enabledAt: new Date().toISOString(), disabledAt: null
        },
        {
          id: '8', key: 'ar_product_preview', name: 'AR Product Preview', nameAr: 'معاينة المنتج بالواقع المعزز',
          description: 'View products in AR', descriptionAr: 'عرض المنتجات بالواقع المعزز',
          category: 'EXPERIMENTAL', service: 'ar-preview-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: true,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '👓', color: '#FF9800', enabledAt: new Date().toISOString(), disabledAt: null
        },
        {
          id: '9', key: 'vr_showroom', name: 'VR Showroom', nameAr: 'صالة العرض الافتراضية',
          description: 'Virtual reality shopping', descriptionAr: 'تسوق بالواقع الافتراضي',
          category: 'EXPERIMENTAL', service: 'vr-showroom-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: true, isPremium: true,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '🥽', color: '#673AB7', enabledAt: new Date().toISOString(), disabledAt: null
        },
        {
          id: '10', key: 'ai_chatbot', name: 'AI Chatbot', nameAr: 'المساعد الذكي',
          description: '24/7 AI customer support', descriptionAr: 'دعم عملاء ذكي على مدار الساعة',
          category: 'AI', service: 'ai-chatbot-service', version: '1.0.0',
          isEnabled: true, isPublic: true, isBeta: false, isPremium: false,
          rolloutPercentage: 100, rolloutStrategy: 'ALL_OR_NOTHING',
          icon: '💬', color: '#2196F3', enabledAt: new Date().toISOString(), disabledAt: null
        },
      ]);
      
      setReleases([
        { version: '3.1.0', name: 'Advanced Features', nameAr: 'الميزات المتقدمة', status: 'RELEASED', features: ['voice_search', 'ar_product_preview', 'vr_showroom', 'ai_chatbot'], releasedAt: new Date().toISOString() },
        { version: '3.0.0', name: 'Q2 Expansion', nameAr: 'توسع الربع الثاني', status: 'RELEASED', features: ['wholesale_marketplace', 'smart_delivery'], releasedAt: new Date().toISOString() },
        { version: '2.1.0', name: 'AI Powerhouse', nameAr: 'قوة الذكاء الاصطناعي', status: 'RELEASED', features: ['ai_assistant', 'mnbara_ai_engine'], releasedAt: '2026-03-15' },
      ]);
      
      setLoading(false);
    }, 500);
  };

  const toggleFeature = async (feature: Feature) => {
    setActionLoading(feature.key);
    // Simulated API call
    setTimeout(() => {
      setFeatures(prev => prev.map(f => 
        f.key === feature.key 
          ? { ...f, isEnabled: !f.isEnabled, enabledAt: !f.isEnabled ? new Date().toISOString() : null }
          : f
      ));
      setActionLoading(null);
    }, 500);
  };

  const updateRollout = async () => {
    if (!showRolloutModal) return;
    setActionLoading(showRolloutModal.key);
    setTimeout(() => {
      setFeatures(prev => prev.map(f => 
        f.key === showRolloutModal.key 
          ? { ...f, rolloutPercentage: rolloutValue, rolloutStrategy: 'PERCENTAGE' }
          : f
      ));
      setActionLoading(null);
      setShowRolloutModal(null);
    }, 500);
  };

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const enabledCount = features.filter(f => f.isEnabled).length;
  const betaCount = features.filter(f => f.isBeta).length;

  if (loading) {
    return (
      <div className="feature-loading">
        <div className="spinner"></div>
        <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className="feature-management" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="feature-header">
        <div className="header-content">
          <h1>🚀 {language === 'ar' ? 'إدارة الميزات' : 'Feature Management'}</h1>
          <p>{language === 'ar' ? 'تحكم في ميزات المنصة بضغطة زر' : 'Control platform features with a single click'}</p>
        </div>
        <div className="header-actions">
          <button 
            className="lang-toggle"
            onClick={() => setLanguage(l => l === 'en' ? 'ar' : 'en')}
          >
            {language === 'ar' ? 'EN' : 'عربي'}
          </button>
          <button className="refresh-btn" onClick={loadData}>
            🔄 {language === 'ar' ? 'تحديث' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="feature-stats">
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-info">
            <span className="stat-value">{features.length}</span>
            <span className="stat-label">{language === 'ar' ? 'إجمالي الميزات' : 'Total Features'}</span>
          </div>
        </div>
        <div className="stat-card enabled">
          <span className="stat-icon">✅</span>
          <div className="stat-info">
            <span className="stat-value">{enabledCount}</span>
            <span className="stat-label">{language === 'ar' ? 'مفعّلة' : 'Enabled'}</span>
          </div>
        </div>
        <div className="stat-card disabled">
          <span className="stat-icon">❌</span>
          <div className="stat-info">
            <span className="stat-value">{features.length - enabledCount}</span>
            <span className="stat-label">{language === 'ar' ? 'معطّلة' : 'Disabled'}</span>
          </div>
        </div>
        <div className="stat-card beta">
          <span className="stat-icon">🧪</span>
          <div className="stat-info">
            <span className="stat-value">{betaCount}</span>
            <span className="stat-label">{language === 'ar' ? 'تجريبية' : 'Beta'}</span>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button 
          className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCategory('all')}
        >
          🌐 {language === 'ar' ? 'الكل' : 'All'}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.key}
            className={`category-btn ${selectedCategory === cat.key ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.key)}
          >
            {cat.icon} {language === 'ar' ? cat.labelAr : cat.label}
          </button>
        ))}
      </div>

      {/* Features Grid */}
      <div className="features-grid">
        {filteredFeatures.map(feature => (
          <div 
            key={feature.key} 
            className={`feature-card ${feature.isEnabled ? 'enabled' : 'disabled'}`}
            style={{ borderColor: feature.color || '#ccc' }}
          >
            <div className="feature-card-header">
              <span className="feature-icon" style={{ backgroundColor: feature.color || '#ccc' }}>
                {feature.icon || '⚡'}
              </span>
              <div className="feature-badges">
                {feature.isBeta && <span className="badge beta">Beta</span>}
                {feature.isPremium && <span className="badge premium">Premium</span>}
              </div>
            </div>
            
            <div className="feature-card-body">
              <h3>{language === 'ar' && feature.nameAr ? feature.nameAr : feature.name}</h3>
              <p>{language === 'ar' && feature.descriptionAr ? feature.descriptionAr : feature.description}</p>
              
              <div className="feature-meta">
                <span className="meta-item">
                  📦 {feature.service}
                </span>
                <span className="meta-item">
                  🏷️ v{feature.version}
                </span>
              </div>

              {feature.rolloutStrategy === 'PERCENTAGE' && (
                <div className="rollout-bar">
                  <div className="rollout-label">
                    {language === 'ar' ? 'نسبة النشر' : 'Rollout'}: {feature.rolloutPercentage}%
                  </div>
                  <div className="rollout-track">
                    <div 
                      className="rollout-fill" 
                      style={{ width: `${feature.rolloutPercentage}%`, backgroundColor: feature.color || '#ccc' }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="feature-card-actions">
              <button
                className={`toggle-btn ${feature.isEnabled ? 'on' : 'off'}`}
                onClick={() => toggleFeature(feature)}
                disabled={actionLoading === feature.key}
              >
                {actionLoading === feature.key ? (
                  <span className="btn-spinner"></span>
                ) : feature.isEnabled ? (
                  <>✅ {language === 'ar' ? 'مفعّل' : 'Enabled'}</>
                ) : (
                  <>❌ {language === 'ar' ? 'معطّل' : 'Disabled'}</>
                )}
              </button>
              
              <button
                className="rollout-btn"
                onClick={() => {
                  setShowRolloutModal(feature);
                  setRolloutValue(feature.rolloutPercentage);
                }}
              >
                📊 {language === 'ar' ? 'النشر' : 'Rollout'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Releases */}
      <div className="releases-section">
        <h2>📦 {language === 'ar' ? 'الإصدارات الأخيرة' : 'Recent Releases'}</h2>
        <div className="releases-list">
          {releases.map(release => (
            <div key={release.version} className={`release-card ${release.status.toLowerCase()}`}>
              <div className="release-header">
                <span className="release-version">v{release.version}</span>
                <span className={`release-status ${release.status.toLowerCase()}`}>
                  {release.status === 'RELEASED' ? '✅' : release.status === 'DRAFT' ? '📝' : '⏳'}
                  {release.status}
                </span>
              </div>
              <h4>{language === 'ar' && release.nameAr ? release.nameAr : release.name}</h4>
              <div className="release-features">
                {release.features.map(fKey => {
                  const f = features.find(feat => feat.key === fKey);
                  return f ? (
                    <span key={fKey} className="release-feature-tag">
                      {f.icon} {language === 'ar' && f.nameAr ? f.nameAr : f.name}
                    </span>
                  ) : null;
                })}
              </div>
              {release.releasedAt && (
                <div className="release-date">
                  📅 {new Date(release.releasedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rollout Modal */}
      {showRolloutModal && (
        <div className="modal-overlay" onClick={() => setShowRolloutModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>📊 {language === 'ar' ? 'ضبط نسبة النشر' : 'Set Rollout Percentage'}</h3>
            <p>{language === 'ar' && showRolloutModal.nameAr ? showRolloutModal.nameAr : showRolloutModal.name}</p>
            
            <div className="rollout-slider">
              <input
                type="range"
                min="0"
                max="100"
                value={rolloutValue}
                onChange={e => setRolloutValue(parseInt(e.target.value))}
              />
              <span className="rollout-value">{rolloutValue}%</span>
            </div>
            
            <div className="rollout-presets">
              {[0, 10, 25, 50, 75, 100].map(val => (
                <button key={val} onClick={() => setRolloutValue(val)}>{val}%</button>
              ))}
            </div>
            
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowRolloutModal(null)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button 
                className="save-btn" 
                onClick={updateRollout}
                disabled={actionLoading === showRolloutModal.key}
              >
                {actionLoading === showRolloutModal.key ? (
                  <span className="btn-spinner"></span>
                ) : (
                  language === 'ar' ? 'حفظ' : 'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureManagement;
