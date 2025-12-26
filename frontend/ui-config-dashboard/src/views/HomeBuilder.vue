<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSectionsStore } from '../stores/sections'
import draggable from 'vuedraggable'
import SectionCard from '../components/sections/SectionCard.vue'
import AddSectionModal from '../components/modals/AddSectionModal.vue'
import EditSectionModal from '../components/modals/EditSectionModal.vue'
import PreviewPanel from '../components/preview/PreviewPanel.vue'
import { PlusIcon, EyeIcon, DevicePhoneMobileIcon } from '@heroicons/vue/24/outline'

const sectionsStore = useSectionsStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showPreview = ref(false)
const selectedSection = ref<any>(null)
const previewDevice = ref<'mobile' | 'tablet'>('mobile')

const sections = computed(() => sectionsStore.sections)
const isLoading = computed(() => sectionsStore.isLoading)

onMounted(async () => {
  await sectionsStore.fetchSections()
})

const handleDragEnd = async () => {
  const reorderedItems = sections.value.map((section, index) => ({
    id: section.id,
    sort_order: index + 1
  }))
  await sectionsStore.reorderSections(reorderedItems)
}

const openEditModal = (section: any) => {
  selectedSection.value = section
  showEditModal.value = true
}

const handleSectionCreated = () => {
  showAddModal.value = false
  sectionsStore.fetchSections()
}

const handleSectionUpdated = () => {
  showEditModal.value = false
  sectionsStore.fetchSections()
}

const toggleSectionVisibility = async (section: any) => {
  await sectionsStore.toggleVisibility(section.id)
}

const toggleSectionActive = async (section: any) => {
  await sectionsStore.toggleActive(section.id)
}

const deleteSection = async (section: any) => {
  if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
    await sectionsStore.deleteSection(section.id)
  }
}

const duplicateSection = async (section: any) => {
  await sectionsStore.duplicateSection(section.id)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          بناء الواجهة الرئيسية
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          قم بإضافة وترتيب وتعديل أقسام الواجهة الرئيسية للتطبيق
        </p>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Preview Button -->
        <button
          @click="showPreview = !showPreview"
          class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <EyeIcon class="w-5 h-5" />
          معاينة
        </button>
        
        <!-- Add Section Button -->
        <button
          @click="showAddModal = true"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <PlusIcon class="w-5 h-5" />
          إضافة قسم
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <p class="text-sm text-gray-500 dark:text-gray-400">إجمالي الأقسام</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ sections.length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <p class="text-sm text-gray-500 dark:text-gray-400">الأقسام النشطة</p>
        <p class="text-2xl font-bold text-green-600">{{ sections.filter(s => s.is_active).length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <p class="text-sm text-gray-500 dark:text-gray-400">الأقسام المخفية</p>
        <p class="text-2xl font-bold text-yellow-600">{{ sections.filter(s => !s.is_visible).length }}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <p class="text-sm text-gray-500 dark:text-gray-400">إجمالي العناصر</p>
        <p class="text-2xl font-bold text-blue-600">{{ sections.reduce((acc, s) => acc + (s.items?.length || 0), 0) }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex gap-6">
      <!-- Sections List -->
      <div class="flex-1">
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              أقسام الواجهة
            </h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              اسحب وأفلت لإعادة الترتيب
            </p>
          </div>
          
          <div v-if="isLoading" class="p-8 text-center">
            <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
            <p class="mt-2 text-gray-500">جاري التحميل...</p>
          </div>
          
          <draggable
            v-else
            v-model="sectionsStore.sections"
            item-key="id"
            handle=".drag-handle"
            ghost-class="opacity-50"
            @end="handleDragEnd"
            class="divide-y divide-gray-200 dark:divide-gray-700"
          >
            <template #item="{ element: section }">
              <SectionCard
                :section="section"
                @edit="openEditModal(section)"
                @toggle-visibility="toggleSectionVisibility(section)"
                @toggle-active="toggleSectionActive(section)"
                @delete="deleteSection(section)"
                @duplicate="duplicateSection(section)"
              />
            </template>
          </draggable>
          
          <div v-if="!isLoading && sections.length === 0" class="p-8 text-center">
            <DevicePhoneMobileIcon class="w-12 h-12 text-gray-400 mx-auto" />
            <p class="mt-2 text-gray-500">لا توجد أقسام بعد</p>
            <button
              @click="showAddModal = true"
              class="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              إضافة قسم جديد
            </button>
          </div>
        </div>
      </div>

      <!-- Preview Panel -->
      <PreviewPanel
        v-if="showPreview"
        :sections="sections"
        :device="previewDevice"
        @close="showPreview = false"
        @change-device="previewDevice = $event"
      />
    </div>

    <!-- Modals -->
    <AddSectionModal
      v-if="showAddModal"
      @close="showAddModal = false"
      @created="handleSectionCreated"
    />
    
    <EditSectionModal
      v-if="showEditModal && selectedSection"
      :section="selectedSection"
      @close="showEditModal = false"
      @updated="handleSectionUpdated"
    />
  </div>
</template>
