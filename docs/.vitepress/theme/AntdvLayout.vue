<script lang="ts" setup>
import { useData } from 'vitepress';
import { ConfigProvider, theme } from 'ant-design-vue';

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
