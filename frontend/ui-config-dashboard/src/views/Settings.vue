<script setup lang="ts">
import { ref } from 'vue'

const cacheEnabled = ref(true)
const cacheTtl = ref(300)
const analyticsEnabled = ref(true)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">الإعدادات</h1>
      <p class="text-sm text-gray-500">إعدادات نظام الواجهة الديناميكية</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-200 dark:divide-gray-700">
      <!-- Cache Settings -->
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">إعدادات التخزين المؤقت</h2>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">تفعيل التخزين المؤقت</p>
              <p class="text-sm text-gray-500">تخزين الإعدادات مؤقتاً لتحسين الأداء</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="cacheEnabled" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">مدة التخزين (ثانية)</label>
            <input v-model="cacheTtl" type="number" class="w-full max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
          </div>
        </div>
      </div>

      <!-- Analytics Settings -->
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">إعدادات التحليلات</h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">تفعيل التحليلات</p>
            <p class="text-sm text-gray-500">تتبع المشاهدات والنقرات</p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="analyticsEnabled" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      <!-- API Info -->
      <div class="p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">معلومات API</h2>
        <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 font-mono text-sm">
          <p class="text-gray-600 dark:text-gray-300">Base URL: <span class="text-blue-600">https://api.mnbara.com/api/v1/ui-config</span></p>
          <p class="text-gray-600 dark:text-gray-300 mt-2">Endpoints:</p>
          <ul class="list-disc list-inside text-gray-500 mt-1 space-y-1">
            <li>GET / - الحصول على الإعدادات</li>
            <li>GET /sections - الأقسام فقط</li>
            <li>GET /banners - البانرات</li>
            <li>GET /theme - الثيم النشط</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <button class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">حفظ الإعدادات</button>
    </div>
  </div>
</template>
