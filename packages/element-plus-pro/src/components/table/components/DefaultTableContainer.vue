<template>
  <div class="pro-table_table-container">
    <slot />
  </div>
</template>

<style scoped lang="less">
.pro-table_table-container {
  flex: 1;
  padding: 24px 24px 0;
  background-color: var(--el-bg-color, #fff);
  border-radius: 4px;
}
</style>
