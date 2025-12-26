<script setup lang="ts">
import { computed } from 'vue'
import {
  Bars3Icon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/vue/24/outline'
import { COMPONENT_DEFINITIONS } from '../../types/ui-config'

const props = defineProps<{
  section: any
}>()

const emit = defineEmits(['edit', 'toggle-visibility', 'toggle-active', 'delete', 'duplicate'])

const componentDef = computed(() => {
  return COMPONENT_DEFINITIONS[props.section.component_type?.slug] || {
    name_ar: 'غير معروف',
    name_en: 'Unknown',
    icon: 'question-mark-circle'
  }
})

const itemsCount = computed(() => props.section.items?.length || 0)

const statusColor = computed(() => {
  if (!props.section.is_active) return 'bg-gray-100 text-gray-600'
  if (!props.section.is_visible) return 'bg-yellow-100 text-yellow-600'
  return 'bg-green-100 text-green-600'
})

const statusText = computed(() => {
  if (!props.section.is_active) return 'غير نشط'
  if (!props.section.is_visible) return 'مخفي'
  return 'نشط'
})
</script>

<template>
  <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <div class="flex items-center gap-4">
      <!-- Drag Handle -->
      <div class="drag-handle cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        <Bars3Icon class="w-5 h-5 text-gray-400" />
      </div>
      
      <!-- Component Icon -->
      <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
        <component :is="componentDef.icon" class="w-5 h-5 text-blue-600" />
      </div>
      
      <!-- Section Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2">
          <h3 class="font-medium text-gray-900 dark:text-white truncate">
            {{ section.title_ar || section.title_en || componentDef.name_ar }}
          </h3>
          <span :class="['px-2 py-0.5 text-xs font-medium rounded-full', statusColor]">
            {{ statusText }}
          </span>
        </div>
        <div class="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
          <span>{{ componentDef.name_ar }}</span>
          <span>•</span>
          <span>{{ itemsCount }} عنصر</span>
          <span v-if="section.start_date || section.end_date">•</span>
          <span v-if="section.start_date || section.end_date" class="text-orange-500">
            مجدول
          </span>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-2">
        <!-- Toggle Active -->
        <button
          @click="emit('toggle-active')"
          :title="section.is_active ? 'إيقاف' : 'تفعيل'"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <PlayIcon v-if="!section.is_active" class="w-5 h-5 text-green-600" />
          <PauseIcon v-else class="w-5 h-5 text-gray-400" />
        </button>
        
        <!-- Toggle Visibility -->
        <button
          @click="emit('toggle-visibility')"
          :title="section.is_visible ? 'إخفاء' : 'إظهار'"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <EyeIcon v-if="section.is_visible" class="w-5 h-5 text-gray-400" />
          <EyeSlashIcon v-else class="w-5 h-5 text-yellow-500" />
        </button>
        
        <!-- Duplicate -->
        <button
          @click="emit('duplicate')"
          title="نسخ"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <DocumentDuplicateIcon class="w-5 h-5 text-gray-400" />
        </button>
        
        <!-- Edit -->
        <button
          @click="emit('edit')"
          title="تعديل"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <PencilIcon class="w-5 h-5 text-blue-600" />
        </button>
        
        <!-- Delete -->
        <button
          @click="emit('delete')"
          title="حذف"
          class="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <TrashIcon class="w-5 h-5 text-red-500" />
        </button>
      </div>
    </div>
    
    <!-- Items Preview (collapsed) -->
    <div v-if="itemsCount > 0" class="mt-3 ml-16">
      <div class="flex items-center gap-2 overflow-x-auto pb-2">
        <div
          v-for="item in section.items?.slice(0, 5)"
          :key="item.id"
          class="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
        >
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.title_ar || item.title_en"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            {{ (item.title_ar || item.title_en || '?').charAt(0) }}
          </div>
        </div>
        <div
          v-if="itemsCount > 5"
          class="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm font-medium"
        >
          +{{ itemsCount - 5 }}
        </div>
      </div>
    </div>
  </div>
</template>
