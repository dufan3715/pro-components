<script lang="ts" setup>
import { theme } from '../../../shared/ui';
const { token } = theme.useToken();
</script>

<template>
  <div
    class="search-form-container"
    :style="{ backgroundColor: token.colorBgContainer }"
  >
    <slot />
  </div>
</template>

<style scoped lang="less">
.search-form-container {
  margin-bottom: 24px;
  padding: 24px;
}
</style>
