<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, CheckIcon } from '@heroicons/vue/24/outline'
import api from '../services/api'

const themes = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await api.get('/themes')
    themes.value = response.data.themes
  } catch (error) {
    console.error('Failed to fetch themes:', error)
  } finally {
    isLoading.value = false
  }
})

const activateTheme = async (id: string) => {
  try {
    await api.patch(`/themes/${id}/activate`)
    themes.value = themes.value.map(t => ({ ...t, is_active: t.id === id }))
  } catch (error) {
    console.error('Failed to activate theme:', error)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">الثيمات</h1>
        <p class="text-sm text-gray-500">إدارة ثيمات التطبيق</p>
      </div>
      <button class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <PlusIcon class="w-5 h-5" />
        إضافة ثيم
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="theme in themes"
        :key="theme.id"
        :class="['bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border-2 transition-all cursor-pointer', theme.is_active ? 'border-blue-500' : 'border-transparent hover:border-gray-200']"
        @click="activateTheme(theme.id)"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-medium text-gray-900 dark:text-white">{{ theme.name }}</h3>
          <div v-if="theme.is_active" class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
            <CheckIcon class="w-4 h-4 text-white" />
          </div>
        </div>
        
        <!-- Color Preview -->
        <div class="flex gap-2 mb-4">
          <div :style="{ backgroundColor: theme.primary_color }" class="w-8 h-8 rounded-full" :title="'Primary: ' + theme.primary_color"></div>
          <div :style="{ backgroundColor: theme.secondary_color }" class="w-8 h-8 rounded-full" :title="'Secondary: ' + theme.secondary_color"></div>
          <div :style="{ backgroundColor: theme.accent_color }" class="w-8 h-8 rounded-full" :title="'Accent: ' + theme.accent_color"></div>
          <div :style="{ backgroundColor: theme.background_color }" class="w-8 h-8 rounded-full border" :title="'Background: ' + theme.background_color"></div>
        </div>

        <div class="text-sm text-gray-500">
          <p>الخط العربي: {{ theme.font_family_ar }}</p>
          <p>الخط الإنجليزي: {{ theme.font_family_en }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
