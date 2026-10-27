<script lang="ts" setup>
import { useData } from 'vitepress';
import { ConfigProvider } from 'vant';

const { isDark } = useData();
</script>

<template>
  <ConfigProvider :theme="isDark ? 'dark' : 'light'">
    <slot />
  </ConfigProvider>
</template>
