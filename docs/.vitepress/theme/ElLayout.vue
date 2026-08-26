<script lang="ts" setup>
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
</script>

<template>
  <ElConfigProvider :locale="zhCn">
    <slot />
  </ElConfigProvider>
</template>
