import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useSectionsStore = defineStore('sections', () => {
  const sections = ref<any[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchSections = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await api.get('/sections')
      sections.value = response.data.sections
    } catch (err: any) {
      error.value = err.message
      console.error('Failed to fetch sections:', err)
    } finally {
      isLoading.value = false
    }
  }

  const createSection = async (data: any) => {
    isLoading.value = true
    try {
      const response = await api.post('/sections', data)
      sections.value.push(response.data.section)
      return response.data.section
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateSection = async (id: string, data: any) => {
    try {
      const response = await api.put(`/sections/${id}`, data)
      const index = sections.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sections.value[index] = response.data.section
      }
      return response.data.section
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const deleteSection = async (id: string) => {
    try {
      await api.delete(`/sections/${id}`)
      sections.value = sections.value.filter(s => s.id !== id)
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const duplicateSection = async (id: string) => {
    try {
      const response = await api.post(`/sections/${id}/duplicate`)
      sections.value.push(response.data.section)
      return response.data.section
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const toggleVisibility = async (id: string) => {
    try {
      const response = await api.patch(`/sections/${id}/toggle-visibility`)
      const index = sections.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sections.value[index] = response.data.section
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const toggleActive = async (id: string) => {
    try {
      const response = await api.patch(`/sections/${id}/toggle-active`)
      const index = sections.value.findIndex(s => s.id === id)
      if (index !== -1) {
        sections.value[index] = response.data.section
      }
    } catch (err: any) {
      error.value = err.message
      throw err
    }
  }

  const reorderSections = async (items: { id: string; sort_order: number }[]) => {
    try {
      await api.post('/sections/reorder', { items })
    } catch (err: any) {
      error.value = err.message
      // Refetch to restore correct order
      await fetchSections()
      throw err
    }
  }

  return {
    sections,
    isLoading,
    error,
    fetchSections,
    createSection,
    updateSection,
    deleteSection,
    duplicateSection,
    toggleVisibility,
    toggleActive,
    reorderSections
  }
})
