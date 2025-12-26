<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  HomeIcon,
  PhotoIcon,
  SwatchIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const menuItems = [
  { name: 'بناء الواجهة', path: '/home-builder', icon: HomeIcon },
  { name: 'البانرات', path: '/banners', icon: PhotoIcon },
  { name: 'الثيمات', path: '/themes', icon: SwatchIcon },
  { name: 'الإصدارات', path: '/versions', icon: ClockIcon },
  { name: 'التحليلات', path: '/analytics', icon: ChartBarIcon },
  { name: 'الإعدادات', path: '/settings', icon: Cog6ToothIcon }
]

const isActive = (path: string) => route.path === path

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <aside class="w-64 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
    <!-- Logo -->
    <div class="p-6 border-b border-gray-800">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </div>
        <div>
          <h1 class="font-bold text-lg">منبره</h1>
          <p class="text-xs text-gray-400">UI Config Dashboard</p>
        </div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1">
      <router-link
        v-for="item in menuItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
          isActive(item.path)
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        ]"
      >
        <component :is="item.icon" class="w-5 h-5" />
        <span>{{ item.name }}</span>
      </router-link>
    </nav>

    <!-- User -->
    <div class="p-4 border-t border-gray-800">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
          <span class="text-sm font-medium">{{ authStore.user?.name?.[0] || 'A' }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">{{ authStore.user?.name || 'Admin' }}</p>
          <p class="text-xs text-gray-400 truncate">{{ authStore.user?.email }}</p>
        </div>
      </div>
      <button
        @click="handleLogout"
        class="w-full flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <ArrowRightOnRectangleIcon class="w-5 h-5" />
        <span>تسجيل الخروج</span>
      </button>
    </div>
  </aside>
</template>
