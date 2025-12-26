<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ArrowPathIcon, CheckCircleIcon, ClockIcon } from '@heroicons/vue/24/outline'
import api from '../services/api'

const versions = ref<any[]>([])
const isLoading = ref(true)
const isPublishing = ref(false)

onMounted(async () => {
  try {
    const response = await api.get('/versions')
    versions.value = response.data.versions
  } catch (error) {
    console.error('Failed to fetch versions:', error)
  } finally {
    isLoading.value = false
  }
})

const publishVersion = async () => {
  isPublishing.value = true
  try {
    const response = await api.post('/versions/publish', {
      name: `Version ${versions.value.length + 1}`,
      description: 'Published from dashboard'
    })
    versions.value.unshift(response.data.version)
  } catch (error) {
    console.error('Failed to publish version:', error)
  } finally {
    isPublishing.value = false
  }
}

const rollback = async (id: string) => {
  if (!confirm('هل أنت متأكد من الرجوع لهذا الإصدار؟')) return
  try {
    await api.post(`/versions/${id}/rollback`)
    location.reload()
  } catch (error) {
    console.error('Failed to rollback:', error)
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">الإصدارات</h1>
        <p class="text-sm text-gray-500">سجل إصدارات الواجهة</p>
      </div>
      <button
        @click="publishVersion"
        :disabled="isPublishing"
        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        <CheckCircleIcon class="w-5 h-5" />
        {{ isPublishing ? 'جاري النشر...' : 'نشر إصدار جديد' }}
      </button>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
    </div>

    <div v-else class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
      <div class="divide-y divide-gray-200 dark:divide-gray-700">
        <div
          v-for="version in versions"
          :key="version.id"
          class="p-4 flex items-center justify-between"
        >
          <div class="flex items-center gap-4">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center', version.is_published ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600']">
              <CheckCircleIcon v-if="version.is_published" class="w-5 h-5" />
              <ClockIcon v-else class="w-5 h-5" />
            </div>
            <div>
              <h3 class="font-medium text-gray-900 dark:text-white">
                {{ version.name || `الإصدار ${version.version_number}` }}
                <span v-if="version.is_rollback" class="text-xs text-orange-500 mr-2">(استرجاع)</span>
              </h3>
              <p class="text-sm text-gray-500">{{ formatDate(version.created_at) }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">v{{ version.version_number }}</span>
            <button
              @click="rollback(version.id)"
              class="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <ArrowPathIcon class="w-4 h-4 inline ml-1" />
              استرجاع
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
