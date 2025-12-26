<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ChartBarIcon, EyeIcon, CursorArrowRaysIcon } from '@heroicons/vue/24/outline'
import api from '../services/api'

const analytics = ref<any>(null)
const period = ref('7d')
const isLoading = ref(true)

const fetchAnalytics = async () => {
  isLoading.value = true
  try {
    const response = await api.get(`/dashboard/analytics?period=${period.value}`)
    analytics.value = response.data.analytics
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchAnalytics)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">التحليلات</h1>
        <p class="text-sm text-gray-500">إحصائيات أداء الواجهة</p>
      </div>
      <select v-model="period" @change="fetchAnalytics" class="px-4 py-2 border border-gray-300 rounded-lg">
        <option value="1d">اليوم</option>
        <option value="7d">آخر 7 أيام</option>
        <option value="30d">آخر 30 يوم</option>
      </select>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
    </div>

    <template v-else-if="analytics">
      <!-- Top Sections -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">أفضل الأقسام أداءً</h2>
        <div class="space-y-4">
          <div v-for="section in analytics.top_sections" :key="section.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">{{ section.title }}</p>
              <p class="text-sm text-gray-500">{{ section.type }}</p>
            </div>
            <div class="flex items-center gap-6 text-sm">
              <div class="flex items-center gap-1 text-gray-500">
                <EyeIcon class="w-4 h-4" />
                {{ section.views }}
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <CursorArrowRaysIcon class="w-4 h-4" />
                {{ section.clicks }}
              </div>
              <span class="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{{ section.ctr }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Banners -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">أفضل البانرات أداءً</h2>
        <div class="space-y-4">
          <div v-for="banner in analytics.top_banners" :key="banner.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p class="font-medium text-gray-900 dark:text-white">{{ banner.title || 'بدون عنوان' }}</p>
            <div class="flex items-center gap-6 text-sm">
              <div class="flex items-center gap-1 text-gray-500">
                <EyeIcon class="w-4 h-4" />
                {{ banner.impressions }}
              </div>
              <div class="flex items-center gap-1 text-gray-500">
                <CursorArrowRaysIcon class="w-4 h-4" />
                {{ banner.clicks }}
              </div>
              <span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{{ banner.ctr }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
