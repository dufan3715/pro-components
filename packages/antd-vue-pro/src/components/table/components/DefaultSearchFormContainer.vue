<script lang="ts" setup>
/**
 * @component DefaultSearchFormContainer
 * @description 搜索区域默认包裹容器，提供统一的背景色与间距
 */
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
