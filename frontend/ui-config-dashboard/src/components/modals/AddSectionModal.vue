<script setup lang="ts">
import { ref, computed } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useSectionsStore } from '../../stores/sections'
import { COMPONENT_DEFINITIONS } from '../../types/ui-config'

const emit = defineEmits(['close', 'created'])
const sectionsStore = useSectionsStore()

const selectedType = ref('')
const titleAr = ref('')
const titleEn = ref('')
const subtitleAr = ref('')
const subtitleEn = ref('')
const isSubmitting = ref(false)

const componentTypes = computed(() => Object.entries(COMPONENT_DEFINITIONS).map(([slug, def]) => ({
  slug,
  ...def
})))

const handleSubmit = async () => {
  if (!selectedType.value) return
  
  isSubmitting.value = true
  try {
    await sectionsStore.createSection({
      component_slug: selectedType.value,
      title_ar: titleAr.value || undefined,
      title_en: titleEn.value || undefined,
      subtitle_ar: subtitleAr.value || undefined,
      subtitle_en: subtitleEn.value || undefined
    })
    emit('created')
  } catch (error) {
    console.error('Failed to create section:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">إضافة قسم جديد</h2>
        <button @click="emit('close')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <XMarkIcon class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 overflow-y-auto max-h-[60vh]">
        <!-- Component Type Selection -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">اختر نوع القسم</label>
          <div class="grid grid-cols-3 gap-3">
            <button
              v-for="type in componentTypes"
              :key="type.slug"
              @click="selectedType = type.slug"
              :class="[
                'p-3 border rounded-lg text-right transition-all',
                selectedType === type.slug
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              ]"
            >
              <p class="font-medium text-gray-900 dark:text-white text-sm">{{ type.name_ar }}</p>
              <p class="text-xs text-gray-500 mt-1">{{ type.description_ar }}</p>
            </button>
          </div>
        </div>

        <!-- Section Details -->
        <div v-if="selectedType" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (عربي)</label>
              <input v-model="titleAr" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="العنوان بالعربية" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (إنجليزي)</label>
              <input v-model="titleEn" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Title in English" dir="ltr" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان الفرعي (عربي)</label>
              <input v-model="subtitleAr" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="العنوان الفرعي" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان الفرعي (إنجليزي)</label>
              <input v-model="subtitleEn" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="Subtitle" dir="ltr" />
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="emit('close')" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">إلغاء</button>
        <button
          @click="handleSubmit"
          :disabled="!selectedType || isSubmitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'جاري الإضافة...' : 'إضافة القسم' }}
        </button>
      </div>
    </div>
  </div>
</template>
