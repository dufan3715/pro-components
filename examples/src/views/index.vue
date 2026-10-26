<script lang="ts" setup>
import { Card, Typography } from 'ant-design-vue';
</script>

<template>
  <main class="home">
    <Typography.Title :level="3"
      >@qin-ui/pro-components 示例导航</Typography.Title
    >
    <div class="home-grid">
      <Card hoverable>
        <template #title>ProTable SearchForm 布局工作台</template>
        <p>SearchForm 多场景布局测试工作台与视口调节器。</p>
        <RouterLink to="/search-form-playground">进入工作台 →</RouterLink>
      </Card>
    </div>
  </main>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 48px auto;
  padding: 0 24px;
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}
</style>
