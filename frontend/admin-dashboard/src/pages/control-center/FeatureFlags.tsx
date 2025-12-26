import React, { useState } from 'react';
import { Card, Switch, Tag, Input, Select, message, Tooltip, Progress } from 'antd';
import { 
  SearchOutlined, 
  ExperimentOutlined,
  CrownOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import styles from './ControlCenter.module.css';

interface Feature {
  key: string;
  name: string;
  nameAr: string;
  description: string;
  category: string;
  service: string;
  isEnabled: boolean;
  isBeta: boolean;
  isPremium: boolean;
  rolloutPercentage: number;
  icon: string;
  color: string;
}

const CATEGORIES = [
  { key: 'all', label: 'الكل / All', icon: '🌐' },
  { key: 'FINTECH', label: 'FinTech', icon: '💳' },
  { key: 'AI', label: 'AI', icon: '🤖' },
  { key: 'MARKETPLACE', label: 'Marketplace', icon: '🏪' },
  { key: 'LOGISTICS', label: 'Logistics', icon: '🚚' },
  { key: 'EXPERIMENTAL', label: 'Experimental', icon: '🧪' },
];

const initialFeatures: Feature[] = [
  // FINTECH
  { key: 'bnpl_service', name: 'Buy Now Pay Later', nameAr: 'اشتري الآن وادفع لاحقاً', description: 'Installment payments', category: 'FINTECH', service: 'bnpl-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '💳', color: '#4CAF50' },
  { key: 'crypto_payments', name: 'Crypto Payments', nameAr: 'الدفع بالعملات الرقمية', description: 'Bitcoin, Ethereum, USDC', category: 'FINTECH', service: 'crypto-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '₿', color: '#F7931A' },
  { key: 'multi_currency_wallet', name: 'Multi-Currency Wallet', nameAr: 'المحفظة متعددة العملات', description: 'Hold multiple currencies', category: 'FINTECH', service: 'wallet-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '💰', color: '#2196F3' },
  
  // AI Features
  { key: 'ai_assistant', name: 'AI Shopping Assistant', nameAr: 'مساعد التسوق الذكي', description: 'AI recommendations', category: 'AI', service: 'ai-assistant-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '🤖', color: '#00BCD4' },
  { key: 'ai_chatbot', name: 'AI Chatbot', nameAr: 'المساعد الذكي', description: '24/7 AI customer support', category: 'AI', service: 'ai-chatbot-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '💬', color: '#2196F3' },
  { key: 'voice_search', name: 'Voice Search', nameAr: 'البحث الصوتي', description: 'Search using voice', category: 'AI', service: 'voice-commerce-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '🎤', color: '#9C27B0' },
  { key: 'mnbara_ai_engine', name: 'Mnbara AI Engine', nameAr: 'محرك منبرة الذكي', description: 'Custom AI like Siri', category: 'AI', service: 'mnbara-ai-engine', isEnabled: true, isBeta: true, isPremium: true, rolloutPercentage: 100, icon: '🧠', color: '#E91E63' },
  
  // MARKETPLACE
  { key: 'wholesale_marketplace', name: 'B2B Wholesale', nameAr: 'سوق البيع بالجملة', description: 'Bulk orders for businesses', category: 'MARKETPLACE', service: 'wholesale-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '🏢', color: '#795548' },
  
  // LOGISTICS
  { key: 'smart_delivery', name: 'Smart Delivery', nameAr: 'التوصيل الذكي', description: 'AI-optimized routes', category: 'LOGISTICS', service: 'smart-delivery-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '🚚', color: '#3F51B5' },
  { key: 'live_tracking', name: 'Live Tracking', nameAr: 'التتبع المباشر', description: 'Real-time location', category: 'LOGISTICS', service: 'crowdship-service', isEnabled: true, isBeta: false, isPremium: false, rolloutPercentage: 100, icon: '📍', color: '#4CAF50' },
  
  // EXPERIMENTAL
  { key: 'ar_product_preview', name: 'AR Product Preview', nameAr: 'معاينة المنتج بالواقع المعزز', description: 'View products in AR', category: 'EXPERIMENTAL', service: 'ar-preview-service', isEnabled: true, isBeta: false, isPremium: true, rolloutPercentage: 100, icon: '👓', color: '#FF9800' },
  { key: 'vr_showroom', name: 'VR Showroom', nameAr: 'صالة العرض الافتراضية', description: 'Virtual reality shopping', category: 'EXPERIMENTAL', service: 'vr-showroom-service', isEnabled: true, isBeta: true, isPremium: true, rolloutPercentage: 100, icon: '🥽', color: '#673AB7' },
];

const FeatureFlagsPage: React.FC = () => {
  const [features, setFeatures] = useState<Feature[]>(initialFeatures);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const toggleFeature = async (key: string) => {
    setLoading(key);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setFeatures(prev => prev.map(f => 
      f.key === key ? { ...f, isEnabled: !f.isEnabled } : f
    ));
    
    const feature = features.find(f => f.key === key);
    message.success(`${feature?.name} ${feature?.isEnabled ? 'معطّل' : 'مفعّل'} ✓`);
    setLoading(null);
  };

  const filteredFeatures = features.filter(f => {
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         f.nameAr.includes(searchQuery) ||
                         f.key.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const enabledCount = features.filter(f => f.isEnabled).length;
  const betaCount = features.filter(f => f.isBeta).length;
  const premiumCount = features.filter(f => f.isPremium).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
              🎛️ إدارة الميزات / Feature Management
            </h1>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', margin: '0.5rem 0 0' }}>
              تحكم في ميزات المنصة - Control platform features
            </p>
          </div>
          <button 
            onClick={() => message.info('جاري التحديث...')}
            style={{ 
              background: 'rgba(24, 144, 255, 0.1)', 
              border: '1px solid rgba(24, 144, 255, 0.3)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#1890ff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ReloadOutlined /> تحديث
          </button>
        </div>
      </header>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card size="small" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{features.length}</div>
            <div style={{ opacity: 0.9 }}>إجمالي الميزات</div>
          </div>
        </Card>
        <Card size="small" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', border: 'none' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{enabledCount}</div>
            <div style={{ opacity: 0.9 }}>مفعّلة ✅</div>
          </div>
        </Card>
        <Card size="small" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{betaCount}</div>
            <div style={{ opacity: 0.9 }}>تجريبية 🧪</div>
          </div>
        </Card>
        <Card size="small" style={{ background: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', border: 'none' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{premiumCount}</div>
            <div style={{ opacity: 0.9 }}>بريميوم 👑</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Input
          placeholder="بحث... / Search..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: 250 }}
        />
        <Select
          value={selectedCategory}
          onChange={setSelectedCategory}
          style={{ width: 200 }}
          options={CATEGORIES.map(c => ({ value: c.key, label: `${c.icon} ${c.label}` }))}
        />
      </div>

      {/* Features Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredFeatures.map(feature => (
          <Card
            key={feature.key}
            size="small"
            style={{ 
              borderLeft: `4px solid ${feature.color}`,
              opacity: feature.isEnabled ? 1 : 0.7,
              transition: 'all 0.3s'
            }}
            hoverable
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ 
                  fontSize: '2rem',
                  background: `${feature.color}20`,
                  padding: '8px',
                  borderRadius: '12px'
                }}>
                  {feature.icon}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1rem' }}>{feature.name}</div>
                  <div style={{ color: '#888', fontSize: '0.85rem' }}>{feature.nameAr}</div>
                  <div style={{ color: '#aaa', fontSize: '0.75rem', marginTop: '4px' }}>
                    {feature.description}
                  </div>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <Tag color="blue" style={{ fontSize: '0.7rem' }}>{feature.service}</Tag>
                    {feature.isBeta && (
                      <Tag icon={<ExperimentOutlined />} color="magenta" style={{ fontSize: '0.7rem' }}>Beta</Tag>
                    )}
                    {feature.isPremium && (
                      <Tag icon={<CrownOutlined />} color="gold" style={{ fontSize: '0.7rem' }}>Premium</Tag>
                    )}
                  </div>
                </div>
              </div>
              <Tooltip title={feature.isEnabled ? 'تعطيل' : 'تفعيل'}>
                <Switch
                  checked={feature.isEnabled}
                  loading={loading === feature.key}
                  onChange={() => toggleFeature(feature.key)}
                  checkedChildren="✓"
                  unCheckedChildren="✕"
                />
              </Tooltip>
            </div>
            
            {/* Rollout Progress */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                <span>نسبة النشر</span>
                <span>{feature.rolloutPercentage}%</span>
              </div>
              <Progress 
                percent={feature.rolloutPercentage} 
                showInfo={false}
                strokeColor={feature.color}
                size="small"
              />
            </div>
          </Card>
        ))}
      </div>

      {/* Emergency Controls */}
      <Card 
        title={<span style={{ color: '#f5222d' }}>⚠️ تحكم الطوارئ / Emergency Controls</span>}
        style={{ marginTop: '2rem', borderColor: 'rgba(245, 34, 45, 0.3)' }}
      >
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '1rem',
          background: 'rgba(245, 34, 45, 0.05)',
          borderRadius: '8px'
        }}>
          <div>
            <strong style={{ color: '#f5222d' }}>🔴 GLOBAL KILL SWITCH</strong>
            <p style={{ margin: '4px 0 0', color: '#888', fontSize: '0.85rem' }}>
              تعطيل جميع الميزات فوراً - Disable all features immediately
            </p>
          </div>
          <Switch 
            checkedChildren="ACTIVE" 
            unCheckedChildren="INACTIVE"
            style={{ background: '#52c41a' }}
          />
        </div>
      </Card>
    </div>
  );
};

export default FeatureFlagsPage;
