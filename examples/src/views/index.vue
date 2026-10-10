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
      <Card hoverable>
        <template #title>CR-091 分组列表头复现与修复对比 Demo</template>
        <p>
          Element Plus ProTable 分组列 (children) 在旧版本子列静默消失 vs
          当前工作区修复版的对照复现。
        </p>
        <RouterLink to="/table-group-column-demo">进入对比 Demo →</RouterLink>
      </Card>
      <Card hoverable>
        <template #title>CR-082 表单项上下文与 a11y 关联对比 Demo</template>
        <p>
          antd-vue-pro BaseField 在旧版输入框丢失 id 与无法聚焦 vs
          工作区已修复版的对比。
        </p>
        <RouterLink to="/form-item-a11y-demo">进入对比 Demo →</RouterLink>
      </Card>
      <Card hoverable>
        <template #title>CR-071 Provider 注入表格尺寸被清空对比 Demo</template>
        <p>
          ProComponentProvider 注入表格尺寸 (size) 在旧版被模板后置绑定覆盖清空
          vs 工作区已修复版。
        </p>
        <RouterLink to="/table-provider-size-demo">进入对比 Demo →</RouterLink>
      </Card>
      <Card hoverable>
        <template #title>CR-052 / CR-053 Vant 类名与样式生效对比 Demo</template>
        <p>
          vant-pro 中 componentClass 属性污染与 fieldClass 在输入框分支丢弃 vs
          工作区已修复版。
        </p>
        <RouterLink to="/vant-class-style-repro-demo"
          >进入对比 Demo →</RouterLink
        >
      </Card>
      <Card hoverable>
        <template #title>CR-009 列就地变异 key 补齐与联动对比 Demo</template>
        <p>
          useTable 对 columns 执行 push 变异后 key 未分配导致 setColumn 失效 vs
          customRef 读取即补齐。
        </p>
        <RouterLink to="/table-columns-mutation-demo"
          >进入对比 Demo →</RouterLink
        >
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
