<script lang="ts" setup>
/**
 * 搜索区域默认包裹容器，提供统一的背景色与间距
 *
 * @component DefaultSearchFormContainer
 */
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
