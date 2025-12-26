<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/vue/24/outline'
import api from '../services/api'

const banners = ref<any[]>([])
const isLoading = ref(true)

onMounted(async () => {
  try {
    const response = await api.get('/banners')
    banners.value = response.data.banners
  } catch (error) {
    console.error('Failed to fetch banners:', error)
  } finally {
    isLoading.value = false
  }
})

const deleteBanner = async (id: string) => {
  if (!confirm('هل أنت متأكد من حذف هذا البانر؟')) return
  try {
    await api.delete(`/banners/${id}`)
    banners.value = banners.value.filter(b => b.id !== id)
  } catch (error) {
    console.error('Failed to delete banner:', error)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">البانرات</h1>
        <p class="text-sm text-gray-500">إدارة البانرات الإعلانية</p>
      </div>
      <button class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        <PlusIcon class="w-5 h-5" />
        إضافة بانر
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="banner in banners"
        :key="banner.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden"
      >
        <div class="aspect-[2/1] bg-gray-100">
          <img v-if="banner.image_url" :src="banner.image_url" class="w-full h-full object-cover" />
        </div>
        <div class="p-4">
          <h3 class="font-medium text-gray-900 dark:text-white">{{ banner.title_ar || banner.title_en || 'بدون عنوان' }}</h3>
          <p class="text-sm text-gray-500 mt-1">{{ banner.position }}</p>
          <div class="flex items-center justify-between mt-4">
            <span :class="['px-2 py-1 text-xs rounded-full', banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600']">
              {{ banner.is_active ? 'نشط' : 'غير نشط' }}
            </span>
            <div class="flex gap-2">
              <button class="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <PencilIcon class="w-4 h-4" />
              </button>
              <button @click="deleteBanner(banner.id)" class="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isLoading && banners.length === 0" class="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
      <p class="text-gray-500">لا توجد بانرات</p>
    </div>
  </div>
</template>
