<script lang="ts" setup></script>

<template>
  <div class="control-container">
    <slot />
  </div>
</template>

<style scoped lang="less">
.control-container {
  display: flex;
  justify-content: flex-end;
  padding: 24px 24px 16px;
  background-color: #fff;
}
</style>
