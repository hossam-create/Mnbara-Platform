<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { useSectionsStore } from '../../stores/sections'

const props = defineProps<{ section: any }>()
const emit = defineEmits(['close', 'updated'])
const sectionsStore = useSectionsStore()

const titleAr = ref('')
const titleEn = ref('')
const subtitleAr = ref('')
const subtitleEn = ref('')
const backgroundColor = ref('')
const textColor = ref('')
const isActive = ref(true)
const isVisible = ref(true)
const isSubmitting = ref(false)
const activeTab = ref('content')

onMounted(() => {
  titleAr.value = props.section.title_ar || ''
  titleEn.value = props.section.title_en || ''
  subtitleAr.value = props.section.subtitle_ar || ''
  subtitleEn.value = props.section.subtitle_en || ''
  backgroundColor.value = props.section.background_color || ''
  textColor.value = props.section.text_color || ''
  isActive.value = props.section.is_active
  isVisible.value = props.section.is_visible
})

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    await sectionsStore.updateSection(props.section.id, {
      title_ar: titleAr.value || null,
      title_en: titleEn.value || null,
      subtitle_ar: subtitleAr.value || null,
      subtitle_en: subtitleEn.value || null,
      background_color: backgroundColor.value || null,
      text_color: textColor.value || null,
      is_active: isActive.value,
      is_visible: isVisible.value
    })
    emit('updated')
  } catch (error) {
    console.error('Failed to update section:', error)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">تعديل القسم</h2>
          <p class="text-sm text-gray-500">{{ section.component_type?.name_ar }}</p>
        </div>
        <button @click="emit('close')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <XMarkIcon class="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in ['content', 'style', 'settings']"
          :key="tab"
          @click="activeTab = tab"
          :class="['px-4 py-3 text-sm font-medium border-b-2 -mb-px', activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700']"
        >
          {{ tab === 'content' ? 'المحتوى' : tab === 'style' ? 'التنسيق' : 'الإعدادات' }}
        </button>
      </div>

      <!-- Content -->
      <div class="p-4 overflow-y-auto max-h-[50vh]">
        <!-- Content Tab -->
        <div v-if="activeTab === 'content'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (عربي)</label>
              <input v-model="titleAr" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان (إنجليزي)</label>
              <input v-model="titleEn" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" dir="ltr" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان الفرعي (عربي)</label>
              <input v-model="subtitleAr" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">العنوان الفرعي (إنجليزي)</label>
              <input v-model="subtitleEn" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" dir="ltr" />
            </div>
          </div>
        </div>

        <!-- Style Tab -->
        <div v-if="activeTab === 'style'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">لون الخلفية</label>
              <div class="flex gap-2">
                <input v-model="backgroundColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                <input v-model="backgroundColor" type="text" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="#FFFFFF" />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">لون النص</label>
              <div class="flex gap-2">
                <input v-model="textColor" type="color" class="w-10 h-10 rounded cursor-pointer" />
                <input v-model="textColor" type="text" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" placeholder="#000000" />
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="space-y-4">
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">نشط</p>
              <p class="text-sm text-gray-500">تفعيل أو تعطيل القسم</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="isActive" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <p class="font-medium text-gray-900 dark:text-white">مرئي</p>
              <p class="text-sm text-gray-500">إظهار أو إخفاء القسم</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input v-model="isVisible" type="checkbox" class="sr-only peer" />
              <div class="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        <button @click="emit('close')" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">إلغاء</button>
        <button @click="handleSubmit" :disabled="isSubmitting" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {{ isSubmitting ? 'جاري الحفظ...' : 'حفظ التغييرات' }}
        </button>
      </div>
    </div>
  </div>
</template>
