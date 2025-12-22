// ============================================
// 📊 Stats Card Component for Seller Dashboard
// ============================================

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  bgColor?: string;
}

export function StatsCard({ icon, label, value, change, changeLabel, bgColor = 'bg-pink-100' }: StatsCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 ${bgColor} rounded-xl flex items-center justify-center text-2xl`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          <div className="text-gray-500 text-sm">{label}</div>
        </div>
        {change !== undefined && (
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {isPositive && '+'}
            {change}%
            {changeLabel && <span className="text-gray-400 ml-1">{changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatsCard;
