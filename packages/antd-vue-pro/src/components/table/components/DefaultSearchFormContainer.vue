<script lang="ts" setup>
import { theme } from '../../../shared/ui';
const { token } = theme.useToken();
</script>

<template>
  <div
    class="pro-table_search-form-container"
    :style="{ backgroundColor: token.colorBgContainer }"
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
