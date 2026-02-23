/**
 * xyOps – عمليات التشغيل والجدولة والمراقبة
 * مدمج في Control Center (لوحة التحكم المركزية التقنية).
 * يرتبط بمشروع docs/external-projects/xyops (جدولة مهام، workflows، مراقبة سيرفرات، تنبيهات).
 */

import React, { useState } from 'react';
import { HologramPanel } from '../../components/control-center/ui/HologramPanel';
import { HexButton } from '../../components/control-center/ui/HexButton';
import { useControlCenterTheme } from '../../contexts/ControlCenterThemeContext';

const XYOPS_URL = process.env.NEXT_PUBLIC_XYOPS_URL || 'http://localhost:5522';

export default function XyOpsPage() {
  const { colors } = useControlCenterTheme();
  const [embedMode, setEmbedMode] = useState(false);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header + Quick open */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <HologramPanel title="xyOps — عمليات التشغيل" className="lg:col-span-2">
          <p className="text-sm opacity-80 mb-4">
            جدولة مهام، أتمتة سير العمل (Workflows)، مراقبة السيرفرات، تنبيهات واستجابة للحوادث. منصة موحدة لتشغيل خدمات منبرة تقنياً.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={XYOPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <HexButton variant="primary">
                فتح xyOps في نافذة جديدة
              </HexButton>
            </a>
            <HexButton
              variant="secondary"
              onClick={() => setEmbedMode((v) => !v)}
            >
              {embedMode ? 'إخفاء الواجهة المضمّنة' : 'عرض الواجهة هنا'}
            </HexButton>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs opacity-60">
            <span className="font-mono">{XYOPS_URL}</span>
            <span>• تشغيل اختياري: docker compose --profile ops up -d xyops</span>
          </div>
        </HologramPanel>

        <HologramPanel title="الحالة">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs uppercase">متصل بالوحة التقنية</span>
            </div>
            <p className="text-xs opacity-70 mt-2">
              تسجيل الدخول الافتراضي في xyOps: admin / admin
            </p>
          </div>
        </HologramPanel>
      </div>

      {/* Embedded xyOps iframe (optional) */}
      {embedMode && (
        <HologramPanel title="واجهة xyOps المضمّنة" className="flex-1 min-h-[600px]">
          <iframe
            src={XYOPS_URL}
            title="xyOps"
            className="w-full h-[70vh] min-h-[500px] rounded border-0 bg-black"
            style={{ borderColor: colors.panel }}
          />
        </HologramPanel>
      )}

      {/* Capabilities summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'جدولة المهام', value: 'Jobs', icon: '⏱️' },
          { label: 'سير العمل', value: 'Workflows', icon: '🔄' },
          { label: 'مراقبة السيرفرات', value: 'Monitors', icon: '📡' },
          { label: 'تنبيهات', value: 'Alerts', icon: '🔔' },
        ].map((item) => (
          <HologramPanel key={item.value}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <div className="text-xs uppercase opacity-60">{item.label}</div>
                <div className="font-mono font-bold" style={{ color: colors.primary }}>{item.value}</div>
              </div>
            </div>
          </HologramPanel>
        ))}
      </div>
    </div>
  );
}
