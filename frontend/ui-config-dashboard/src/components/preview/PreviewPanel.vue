<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XMarkIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ArrowPathIcon
} from '@heroicons/vue/24/outline'
import { COMPONENT_DEFINITIONS } from '../../types/ui-config'

const props = defineProps<{
  sections: any[]
  device: 'mobile' | 'tablet'
}>()

const emit = defineEmits(['close', 'change-device'])

const language = ref<'ar' | 'en'>('ar')

const deviceWidth = computed(() => {
  return props.device === 'mobile' ? '375px' : '768px'
})

const activeSections = computed(() => {
  return props.sections.filter(s => s.is_active && s.is_visible)
})

const getTitle = (section: any) => {
  return language.value === 'ar' 
    ? (section.title_ar || section.title_en)
    : (section.title_en || section.title_ar)
}

const getSubtitle = (section: any) => {
  return language.value === 'ar'
    ? (section.subtitle_ar || section.subtitle_en)
    : (section.subtitle_en || section.subtitle_ar)
}

const getItemTitle = (item: any) => {
  return language.value === 'ar'
    ? (item.title_ar || item.title_en)
    : (item.title_en || item.title_ar)
}
</script>

<template>
  <div class="w-[420px] flex-shrink-0">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm sticky top-6">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white">معاينة التطبيق</h3>
          <button @click="emit('close')" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <XMarkIcon class="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <!-- Controls -->
        <div class="flex items-center gap-4 mt-3">
          <!-- Device Toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              @click="emit('change-device', 'mobile')"
              :class="[
                'p-2 rounded-md transition-colors',
                device === 'mobile' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''
              ]"
            >
              <DevicePhoneMobileIcon class="w-5 h-5" />
            </button>
            <button
              @click="emit('change-device', 'tablet')"
              :class="[
                'p-2 rounded-md transition-colors',
                device === 'tablet' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''
              ]"
            >
              <DeviceTabletIcon class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Language Toggle -->
          <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              @click="language = 'ar'"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                language === 'ar' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''
              ]"
            >
              عربي
            </button>
            <button
              @click="language = 'en'"
              :class="[
                'px-3 py-1 rounded-md text-sm font-medium transition-colors',
                language === 'en' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''
              ]"
            >
              EN
            </button>
          </div>
        </div>
      </div>
      
      <!-- Preview Frame -->
      <div class="p-4">
        <div
          :style="{ width: deviceWidth }"
          :dir="language === 'ar' ? 'rtl' : 'ltr'"
          class="mx-auto bg-gray-900 rounded-[2rem] p-2 shadow-xl"
        >
          <!-- Phone Notch -->
          <div class="bg-black rounded-t-[1.5rem] pt-6 pb-2 relative">
            <div class="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-900 rounded-full"></div>
          </div>
          
          <!-- Screen -->
          <div class="bg-white dark:bg-gray-100 rounded-b-[1.5rem] overflow-hidden" style="height: 600px;">
            <div class="h-full overflow-y-auto">
              <!-- App Header Mock -->
              <div class="bg-blue-600 text-white p-4 sticky top-0 z-10">
                <div class="flex items-center justify-between">
                  <span class="font-bold">منبره</span>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 bg-white/20 rounded-full"></div>
                    <div class="w-8 h-8 bg-white/20 rounded-full"></div>
                  </div>
                </div>
                <!-- Search Bar -->
                <div class="mt-3 bg-white/20 rounded-lg p-2 text-white/70 text-sm">
                  {{ language === 'ar' ? 'ابحث عن منتجات...' : 'Search products...' }}
                </div>
              </div>
              
              <!-- Sections Preview -->
              <div class="space-y-4 p-3">
                <template v-for="section in activeSections" :key="section.id">
                  <!-- Section Header -->
                  <div v-if="getTitle(section)" class="flex items-center justify-between">
                    <div>
                      <h4 class="font-bold text-gray-900 text-sm">{{ getTitle(section) }}</h4>
                      <p v-if="getSubtitle(section)" class="text-xs text-gray-500">{{ getSubtitle(section) }}</p>
                    </div>
                    <span class="text-xs text-blue-600">{{ language === 'ar' ? 'عرض الكل' : 'View All' }}</span>
                  </div>
                  
                  <!-- Component Preview based on type -->
                  <div class="bg-gray-50 rounded-lg p-2">
                    <!-- Horizontal Slider -->
                    <div
                      v-if="['horizontal_slider', 'featured_services', 'new_services', 'popular_services'].includes(section.component_type?.slug)"
                      class="flex gap-2 overflow-x-auto pb-2"
                    >
                      <div
                        v-for="item in section.items?.slice(0, 4)"
                        :key="item.id"
                        class="flex-shrink-0 w-24"
                      >
                        <div class="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                          <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                        </div>
                        <p class="text-xs mt-1 truncate text-gray-700">{{ getItemTitle(item) }}</p>
                        <p v-if="item.price" class="text-xs font-bold text-blue-600">{{ item.price }} {{ item.currency || 'SAR' }}</p>
                      </div>
                    </div>
                    
                    <!-- Banner Carousel -->
                    <div
                      v-else-if="['banner_carousel', 'banner_single'].includes(section.component_type?.slug)"
                      class="relative"
                    >
                      <div class="aspect-[2/1] bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg overflow-hidden">
                        <img
                          v-if="section.items?.[0]?.image_url"
                          :src="section.items[0].image_url"
                          class="w-full h-full object-cover"
                        />
                      </div>
                      <div v-if="section.items?.length > 1" class="flex justify-center gap-1 mt-2">
                        <div
                          v-for="(_, i) in section.items.slice(0, 5)"
                          :key="i"
                          :class="['w-2 h-2 rounded-full', i === 0 ? 'bg-blue-600' : 'bg-gray-300']"
                        ></div>
                      </div>
                    </div>
                    
                    <!-- Category Grid -->
                    <div
                      v-else-if="['category_grid', 'icon_bar'].includes(section.component_type?.slug)"
                      class="grid grid-cols-4 gap-2"
                    >
                      <div
                        v-for="item in section.items?.slice(0, 8)"
                        :key="item.id"
                        class="text-center"
                      >
                        <div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                          <span v-if="item.icon" class="text-xl">{{ item.icon }}</span>
                          <img v-else-if="item.image_url" :src="item.image_url" class="w-8 h-8 rounded-full" />
                        </div>
                        <p class="text-[10px] mt-1 truncate text-gray-600">{{ getItemTitle(item) }}</p>
                      </div>
                    </div>
                    
                    <!-- Product Grid -->
                    <div
                      v-else-if="section.component_type?.slug === 'product_grid'"
                      class="grid grid-cols-2 gap-2"
                    >
                      <div
                        v-for="item in section.items?.slice(0, 4)"
                        :key="item.id"
                        class="bg-white rounded-lg p-2 shadow-sm"
                      >
                        <div class="aspect-square bg-gray-100 rounded overflow-hidden">
                          <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                        </div>
                        <p class="text-xs mt-1 truncate text-gray-700">{{ getItemTitle(item) }}</p>
                        <p v-if="item.price" class="text-xs font-bold text-blue-600">{{ item.price }} SAR</p>
                      </div>
                    </div>
                    
                    <!-- Default/Other -->
                    <div v-else class="text-center py-4 text-gray-400 text-xs">
                      {{ COMPONENT_DEFINITIONS[section.component_type?.slug]?.name_ar || 'قسم' }}
                    </div>
                  </div>
                </template>
                
                <!-- Empty State -->
                <div v-if="activeSections.length === 0" class="text-center py-8 text-gray-400">
                  <p class="text-sm">لا توجد أقسام نشطة</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
