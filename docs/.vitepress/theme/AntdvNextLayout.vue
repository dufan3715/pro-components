<script lang="ts" setup>
import { useData } from 'vitepress';
import { ConfigProvider, theme } from 'antdv-next';
import zhCN from 'antdv-next/dist/locale/zh_CN';

const { isDark } = useData();
</script>

<template>
  <ConfigProvider
    :locale="zhCN"
    :theme="{
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    }"
  >
    <slot />
  </ConfigProvider>
</template>
