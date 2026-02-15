// Fraud Detection Service - Seed Data
// بيانات أولية لنظام كشف الاحتيال

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Fraud Detection Service...');

  // Create default fraud rules
  const rules = [
    {
      name: 'velocity_hourly_limit',
      nameAr: 'حد السرعة بالساعة',
      description: 'Block transactions exceeding hourly velocity limits',
      descriptionAr: 'حظر المعاملات التي تتجاوز حدود السرعة بالساعة',
      ruleType: 'VELOCITY' as const,
      conditions: { maxHourlyCount: 5, maxHourlyAmount: 1000 },
      actions: { action: 'REVIEW', notifyAdmin: true },
      riskWeight: 1.0,
      createdBy: 'system',
    },
    {
      name: 'velocity_daily_limit',
      nameAr: 'حد السرعة اليومي',
      description: 'Block transactions exceeding daily velocity limits',
      descriptionAr: 'حظر المعاملات التي تتجاوز حدود السرعة اليومية',
      ruleType: 'VELOCITY' as const,
      conditions: { maxDailyCount: 20, maxDailyAmount: 5000 },
      actions: { action: 'REVIEW', notifyAdmin: true },
      riskWeight: 0.8,
      createdBy: 'system',
    },
    {
      name: 'high_value_transaction',
      nameAr: 'معاملة عالية القيمة',
      description: 'Flag high value transactions for review',
      descriptionAr: 'تحديد المعاملات عالية القيمة للمراجعة',
      ruleType: 'AMOUNT' as const,
      conditions: { minAmount: 5000 },
      actions: { action: 'REVIEW', notifyAdmin: true },
      riskWeight: 0.6,
      createdBy: 'system',
    },
    {
      name: 'new_device_high_value',
      nameAr: 'جهاز جديد بقيمة عالية',
      description: 'Flag new device with high value transaction',
      descriptionAr: 'تحديد جهاز جديد بمعاملة عالية القيمة',
      ruleType: 'DEVICE' as const,
      conditions: { isNewDevice: true, minAmount: 1000 },
      actions: { action: 'CHALLENGE', require3DS: true },
      riskWeight: 0.7,
      createdBy: 'system',
    },
    {
      name: 'vpn_proxy_detection',
      nameAr: 'كشف VPN/Proxy',
      description: 'Flag transactions from VPN or proxy connections',
      descriptionAr: 'تحديد المعاملات من اتصالات VPN أو Proxy',
      ruleType: 'LOCATION' as const,
      conditions: { blockVPN: true, blockProxy: true, blockTor: true },
      actions: { action: 'REVIEW', addRiskScore: 30 },
      riskWeight: 0.8,
      createdBy: 'system',
    },
    {
      name: 'country_mismatch',
      nameAr: 'عدم تطابق البلد',
      description: 'Flag billing and shipping country mismatch',
      descriptionAr: 'تحديد عدم تطابق بلد الفوترة والشحن',
      ruleType: 'LOCATION' as const,
      conditions: { checkCountryMatch: true },
      actions: { action: 'REVIEW', addRiskScore: 20 },
      riskWeight: 0.5,
      createdBy: 'system',
    },
    {
      name: 'chargeback_history',
      nameAr: 'سجل الاسترداد',
      description: 'Flag users with chargeback history',
      descriptionAr: 'تحديد المستخدمين بسجل استرداد',
      ruleType: 'BEHAVIOR' as const,
      conditions: { maxChargebackRate: 0.05 },
      actions: { action: 'DECLINE', blockUser: false },
      riskWeight: 1.0,
      createdBy: 'system',
    },
    {
      name: 'round_amount_pattern',
      nameAr: 'نمط المبلغ المستدير',
      description: 'Flag suspiciously round amounts',
      descriptionAr: 'تحديد المبالغ المستديرة المشبوهة',
      ruleType: 'PATTERN' as const,
      conditions: { minAmount: 1000, roundMultiple: 100 },
      actions: { action: 'REVIEW', addRiskScore: 10 },
      riskWeight: 0.3,
      createdBy: 'system',
    },
  ];

  for (const rule of rules) {
    await prisma.fraudRule.upsert({
      where: { name: rule.name },
      update: rule,
      create: rule,
    });
  }
  console.log(`✅ Created ${rules.length} fraud rules`);

  // Create sample blacklist entries
  const blacklistEntries = [
    {
      entryType: 'IP_ADDRESS' as const,
      value: '192.168.1.100',
      reason: 'Known fraud IP - testing',
      reasonAr: 'IP احتيال معروف - اختبار',
      source: 'system',
      addedBy: 'system',
    },
    {
      entryType: 'CARD_BIN' as const,
      value: '411111',
      reason: 'Test card BIN - block in production',
      reasonAr: 'BIN بطاقة اختبار - حظر في الإنتاج',
      source: 'system',
      addedBy: 'system',
    },
  ];

  for (const entry of blacklistEntries) {
    await prisma.blacklist.upsert({
      where: {
        entryType_value: {
          entryType: entry.entryType,
          value: entry.value,
        },
      },
      update: entry,
      create: entry,
    });
  }
  console.log(`✅ Created ${blacklistEntries.length} blacklist entries`);

  // Create initial metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.fraudMetrics.upsert({
    where: { date: today },
    update: {},
    create: {
      date: today,
      totalTransactions: 0,
      flaggedCount: 0,
      blockedCount: 0,
      alertsGenerated: 0,
      alertsResolved: 0,
      falsePositives: 0,
      confirmedFraud: 0,
      fraudAmount: 0,
      preventedAmount: 0,
      avgRiskScore: 0,
    },
  });
  console.log('✅ Created initial metrics');

  console.log('🎉 Fraud Detection Service seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
