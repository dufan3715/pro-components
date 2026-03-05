<script lang="ts" setup>
import { useData } from 'vitepress';
import { ConfigProvider, theme } from 'antdv-next';

const { isDark } = useData();
</script>

<template>
  <ConfigProvider
    :theme="{
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }"
  >
    <slot />
  </ConfigProvider>
</template>
