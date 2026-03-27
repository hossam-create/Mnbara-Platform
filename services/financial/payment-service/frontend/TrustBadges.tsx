import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Star, 
  Award,
  TrendingUp,
  Users,
  Zap,
  Lock
} from 'lucide-react';

export interface TrustBadgeProps {
  type: 'verified' | 'trusted' | 'fast_payout' | 'high_rating' | 'top_seller' | 'secure_payment' | 'quick_response' | 'no_disputes' | 'trending';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ 
  type, 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'verified':
        return {
          icon: <Shield className="w-4 h-4" />,
          text: 'Verified',
          variant: 'default' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          description: 'Identity and business verified'
        };
      
      case 'trusted':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Trusted',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          description: 'Trusted by community'
        };
      
      case 'fast_payout':
        return {
          icon: <Zap className="w-4 h-4" />,
          text: 'Fast Payout',
          variant: 'default' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Quick payout processing'
        };
      
      case 'high_rating':
        return {
          icon: <Star className="w-4 h-4" />,
          text: 'High Rating',
          variant: 'default' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200',
          description: 'Excellent customer ratings'
        };
      
      case 'top_seller':
        return {
          icon: <Award className="w-4 h-4" />,
          text: 'Top Seller',
          variant: 'default' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-200',
          description: 'Top performing seller'
        };
      
      case 'secure_payment':
        return {
          icon: <Lock className="w-4 h-4" />,
          text: 'Secure Payment',
          variant: 'default' as const,
          className: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          description: 'Secure payment processing'
        };
      
      case 'quick_response':
        return {
          icon: <Clock className="w-4 h-4" />,
          text: 'Quick Response',
          variant: 'default' as const,
          className: 'bg-teal-100 text-teal-800 border-teal-200',
          description: 'Fast response time'
        };
      
      case 'no_disputes':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'No Disputes',
          variant: 'default' as const,
          className: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          description: 'Clean dispute record'
        };
      
      case 'trending':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          text: 'Trending',
          variant: 'default' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          description: 'Trending seller'
        };
      
      default:
        return {
          icon: <Shield className="w-4 h-4" />,
          text: 'Verified',
          variant: 'default' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Verified user'
        };
    }
  };

  const config = getBadgeConfig();
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} title={config.description}>
      <Badge 
        variant={config.variant} 
        className={`${config.className} ${sizeClasses[size]} flex items-center gap-1`}
      >
        {config.icon}
        {showText && <span>{config.text}</span>}
      </Badge>
    </div>
  );
};

export interface TrustScoreProps {
  score: number;
  maxScore?: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TrustScore: React.FC<TrustScoreProps> = ({ 
  score, 
  maxScore = 100, 
  showLabel = true, 
  size = 'md',
  className = '' 
}) => {
  const percentage = (score / maxScore) * 100;
  const getColor = () => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage >= 75) return 'text-green-700';
    if (percentage >= 60) return 'text-blue-700';
    if (percentage >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  const sizeClasses = {
    sm: 'h-2 w-32',
    md: 'h-3 w-48',
    lg: 'h-4 w-64'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">Trust Score</span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
            <div 
              className={`${getColor()} ${sizeClasses[size]} rounded-full transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        
        <span className={`text-sm font-bold ${getTextColor()}`}>
          {score}/{maxScore}
        </span>
      </div>
    </div>
  );
};

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'processing' | 'pending' | 'completed' | 'failed';
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  showText = false, 
  size = 'md',
  className = '' 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return {
          color: 'bg-green-500',
          text: 'Online',
          pulse: true
        };
      
      case 'offline':
        return {
          color: 'bg-gray-500',
          text: 'Offline',
          pulse: false
        };
      
      case 'busy':
        return {
          color: 'bg-red-500',
          text: 'Busy',
          pulse: false
        };
      
      case 'away':
        return {
          color: 'bg-yellow-500',
          text: 'Away',
          pulse: false
        };
      
      case 'processing':
        return {
          color: 'bg-blue-500',
          text: 'Processing',
          pulse: true
        };
      
      case 'pending':
        return {
          color: 'bg-orange-500',
          text: 'Pending',
          pulse: true
        };
      
      case 'completed':
        return {
          color: 'bg-green-500',
          text: 'Completed',
          pulse: false
        };
      
      case 'failed':
        return {
          color: 'bg-red-500',
          text: 'Failed',
          pulse: false
        };
      
      default:
        return {
          color: 'bg-gray-500',
          text: 'Unknown',
          pulse: false
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} ${config.color} rounded-full`} />
        {config.pulse && (
          <div className={`absolute inset-0 ${config.color} rounded-full animate-ping opacity-75`} />
        )}
      </div>
      
      {showText && (
        <span className="text-sm font-medium text-gray-700">{config.text}</span>
      )}
    </div>
  );
};

export interface TrustCardProps {
  title: string;
  badges: TrustBadgeProps['type'][];
  trustScore?: number;
  stats?: Array<{
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }>;
  className?: string;
}

export const TrustCard: React.FC<TrustCardProps> = ({ 
  title, 
  badges, 
  trustScore, 
  stats = [],
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        
        <div className="flex flex-wrap gap-2">
          {badges.map((badgeType, index) => (
            <TrustBadge 
              key={index} 
              type={badgeType} 
              size="sm" 
              showText={false}
            />
          ))}
        </div>
      </div>

      {trustScore !== undefined && (
        <div className="mb-4">
          <TrustScore score={trustScore} size="sm" />
        </div>
      )}

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="flex items-center gap-2">
              {stat.icon && (
                <div className="text-gray-500">
                  {stat.icon}
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrustBadge;
