<script lang="ts" setup>
import { theme } from '../../../shared/ui';
const { token } = theme.useToken();
</script>

<template>
  <div
    class="table-container"
    :style="{ backgroundColor: token.colorBgContainer }"
  >
    <slot />
  </div>
</template>

<style scoped lang="less">
.table-container {
  flex: 1;
  padding: 24px 24px 0;
}
</style>
