<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/layout/Sidebar.vue'
import Header from './components/layout/Header.vue'

const route = useRoute()
const isAuthPage = computed(() => route.path === '/login')
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900" dir="rtl">
    <!-- Auth Pages -->
    <router-view v-if="isAuthPage" />
    
    <!-- Dashboard Layout -->
    <div v-else class="flex">
      <Sidebar />
      <div class="flex-1 flex flex-col min-h-screen">
        <Header />
        <main class="flex-1 p-6">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>
