<script lang="ts" setup>
import { computed } from 'vue';
import { theme } from '../../../shared/ui';
const { token } = theme.useToken();
const bgColor = computed(() => token.value?.colorBgContainer);
</script>

<template>
  <div class="pro-table_table-container" :style="{ backgroundColor: bgColor }">
    <slot />
  </div>
</template>

<style scoped lang="less">
.pro-table_table-container {
  flex: 1;
  padding: 24px 24px 0;
}
</style>
