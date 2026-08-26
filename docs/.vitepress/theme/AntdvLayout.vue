<script lang="ts" setup>
import { useData } from 'vitepress';
import { ConfigProvider, theme } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

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
