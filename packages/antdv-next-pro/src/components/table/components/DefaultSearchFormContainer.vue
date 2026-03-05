<script lang="ts" setup>
import { computed } from 'vue';
import { theme } from '../../../shared/ui';
const { token } = theme.useToken();
const bgColor = computed(() => token.value?.colorBgContainer);
</script>

<template>
  <div
    class="pro-table_search-form-container"
    :style="{ backgroundColor: bgColor }"
  >
    <slot />
  </div>
</template>

<style scoped lang="less">
.pro-table_search-form-container {
  margin-bottom: 24px;
  padding: 24px;
}
</style>
