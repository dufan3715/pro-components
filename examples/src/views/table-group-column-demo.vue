<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Card as ACard,
  Tag as ATag,
  Alert as AAlert,
  Row as ARow,
  Col as ACol,
} from 'ant-design-vue';

// 1. 旧版：legacy-element-plus-pro (v1.3.5)
import {
  ProTable as LegacyProTable,
  useTable as useLegacyTable,
} from 'legacy-element-plus-pro';

// 2. 新版：当前工作区修复后的 element-plus-pro
import {
  ProTable as FixedProTable,
  useTable as useFixedTable,
} from '../../../packages/element-plus-pro/src';

// 3. 复现测试数据集与分组列配置
interface EmployeeRecord {
  id: number;
  name: string;
  gender: string;
  department: string;
  jobTitle: string;
  salary: number;
  bonus: number;
  city: string;
}

const mockData: EmployeeRecord[] = [
  {
    id: 1,
    name: '张晓明',
    gender: '男',
    department: '架构研发部',
    jobTitle: '前端架构师',
    salary: 32000,
    bonus: 8000,
    city: '北京',
  },
  {
    id: 2,
    name: '李秋华',
    gender: '女',
    department: '架构研发部',
    jobTitle: 'Vue核心开发者',
    salary: 28000,
    bonus: 6000,
    city: '上海',
  },
  {
    id: 3,
    name: '王大伟',
    gender: '男',
    department: '基础平台部',
    jobTitle: '组件库技术负责人',
    salary: 35000,
    bonus: 10000,
    city: '深圳',
  },
];

// 核心配置：包含一级分组 (children) 与二级嵌套分组 (children)
const multiLevelColumns = [
  {
    prop: 'id',
    label: '序号',
    width: 70,
  },
  {
    label: '基本信息（一级分组）',
    children: [
      {
        prop: 'name',
        label: '员工姓名',
        width: 110,
      },
      {
        prop: 'gender',
        label: '性别',
        width: 80,
      },
    ],
  },
  {
    label: '组织与职能（一级分组）',
    children: [
      {
        prop: 'department',
        label: '所属部门',
        width: 130,
      },
      {
        label: '薪酬体系（二级深层分组）',
        children: [
          {
            prop: 'jobTitle',
            label: '岗位职称',
            width: 140,
          },
          {
            prop: 'salary',
            label: '基本薪资',
            width: 110,
          },
          {
            prop: 'bonus',
            label: '绩效奖金',
            width: 110,
          },
        ],
      },
    ],
  },
  {
    prop: 'city',
    label: '工作常驻地',
    width: 110,
  },
];

// 初始化旧版表格
const legacyTable = useLegacyTable({
  columns: multiLevelColumns as any,
  data: mockData,
});

// 初始化工作区修复版表格
const fixedTable = useFixedTable({
  columns: multiLevelColumns as any,
  data: mockData,
});

// DOM 探针分析状态
const legacyContainerRef = ref<HTMLElement | null>(null);
const fixedContainerRef = ref<HTMLElement | null>(null);

const probeResult = ref<{
  legacyHeaders: string[];
  legacyHeaderCount: number;
  fixedHeaders: string[];
  fixedHeaderCount: number;
}>({
  legacyHeaders: [],
  legacyHeaderCount: 0,
  fixedHeaders: [],
  fixedHeaderCount: 0,
});

const refreshProbe = async () => {
  await nextTick();
  await nextTick();

  if (legacyContainerRef.value) {
    const ths = Array.from(
      legacyContainerRef.value.querySelectorAll('.el-table__header th')
    );
    probeResult.value.legacyHeaders = ths.map(
      th => th.textContent?.trim() || ''
    );
    probeResult.value.legacyHeaderCount = ths.length;
  }

  if (fixedContainerRef.value) {
    const ths = Array.from(
      fixedContainerRef.value.querySelectorAll('.el-table__header th')
    );
    probeResult.value.fixedHeaders = ths.map(
      th => th.textContent?.trim() || ''
    );
    probeResult.value.fixedHeaderCount = ths.length;
  }
};

onMounted(() => {
  setTimeout(() => {
    refreshProbe();
  }, 200);
});
</script>

<template>
  <div class="demo-page">
    <!-- 顶栏导航 -->
    <header class="demo-header">
      <div class="header-nav">
        <RouterLink to="/" class="back-link">← 返回示例导航</RouterLink>
        <span class="badge">CODE-REVIEW 缺陷复现工作台</span>
      </div>
      <h1 class="header-title">
        CR-091 缺陷复现：Element Plus ProTable 分组列（children 多级表头）
      </h1>
      <p class="header-desc">
        对比旧版 <code>legacy-element-plus-pro@1.3.5</code> 与当前工作区已修复的
        <code>@qin-ui/element-plus-pro</code>。
      </p>
    </header>

    <!-- 缺陷背景卡片 -->
    <AAlert
      type="warning"
      show-icon
      class="mb-24"
      message="CR-091 核心机制剖析"
    >
      <template #description>
        <div>
          <strong>缺陷表现：</strong>当配置了多级表头
          <code>children</code>
          时，旧版本中的子列在界面上<strong>完全静默消失</strong>，表头与数据单元格均不渲染，且没有任何控制台警告。<br />
          <strong>底层成因：</strong>Element Plus 的
          <code>el-table-column</code> 只在默认插槽中收集
          <code>ElTableColumn</code>
          节点或函数式组件。旧版将递归嵌套封装为有状态 SFC
          组件（<code>TableColumnRenderer</code>，<code>shapeFlag = 4</code
          >），导致 Element Plus 无法穿透收集子列；当前工作区修复版改用
          <code>renderColumn</code> 递归生成同层扁平展开的
          <code>TableColumn</code> VNode 树，彻底解决收集丢失问题。
        </div>
      </template>
    </AAlert>

    <!-- 探针数据摘要 -->
    <ARow :gutter="24" class="mb-24">
      <ACol :span="12">
        <div class="probe-card probe-legacy">
          <div class="probe-title">
            <span>🔴 Legacy 包实测探针（缺陷版）</span>
            <ATag color="error">子列全部静默丢失</ATag>
          </div>
          <div class="probe-metric">
            渲染表头单元格数：<strong>{{
              probeResult.legacyHeaderCount
            }}</strong>
            个
          </div>
          <div class="probe-tags">
            <span class="label">捕获到的表头文本：</span>
            <template v-if="probeResult.legacyHeaders.length">
              <ATag
                v-for="(text, idx) in probeResult.legacyHeaders"
                :key="idx"
                color="default"
              >
                {{ text }}
              </ATag>
            </template>
            <span v-else class="text-muted">（未检测到表头）</span>
          </div>
          <div class="probe-alert">
            ❌
            期望子列：<code>员工姓名</code>、<code>性别</code>、<code>所属部门</code>、<code>岗位职称</code>、<code>基本薪资</code>、<code
              >绩效奖金</code
            >
            <strong>无一渲染！</strong>
          </div>
        </div>
      </ACol>
      <ACol :span="12">
        <div class="probe-card probe-fixed">
          <div class="probe-title">
            <span>🟢 当前工作区实测探针（修复版）</span>
            <ATag color="success">完整渲染多级嵌套表头</ATag>
          </div>
          <div class="probe-metric">
            渲染表头单元格数：<strong>{{
              probeResult.fixedHeaderCount
            }}</strong>
            个
          </div>
          <div class="probe-tags">
            <span class="label">捕获到的表头文本：</span>
            <template v-if="probeResult.fixedHeaders.length">
              <ATag
                v-for="(text, idx) in probeResult.fixedHeaders"
                :key="idx"
                color="green"
              >
                {{ text }}
              </ATag>
            </template>
            <span v-else class="text-muted">（未检测到表头）</span>
          </div>
          <div class="probe-alert text-success">
            ✅ 一级分组、二级嵌套分组及所有底层字段列与数据行单元格<strong
              >全部准确渲染！</strong
            >
          </div>
        </div>
      </ACol>
    </ARow>

    <!-- 双栏视图渲染对照 -->
    <ARow :gutter="24" class="mb-24">
      <!-- 左侧：Legacy -->
      <ACol :span="12">
        <ACard
          title="Legacy 旧版渲染 (legacy-element-plus-pro@1.3.5)"
          class="compare-card legacy-border"
        >
          <template #extra>
            <ATag color="red">缺陷：子列消失</ATag>
          </template>
          <div ref="legacyContainerRef" class="table-wrapper">
            <LegacyProTable :table="legacyTable" :pagination="false" />
          </div>
        </ACard>
      </ACol>

      <!-- 右侧：工作区已修复版 -->
      <ACol :span="12">
        <ACard
          title="当前工作区渲染 (@qin-ui/element-plus-pro 工作区最新代码)"
          class="compare-card fixed-border"
        >
          <template #extra>
            <ATag color="green">已修复：正常渲染</ATag>
          </template>
          <div ref="fixedContainerRef" class="table-wrapper">
            <FixedProTable :table="fixedTable" :pagination="false" />
          </div>
        </ACard>
      </ACol>
    </ARow>

    <!-- 源码与实现机理对比面板 -->
    <ACard
      title="代码实现机理对比 (CODE-REVIEW-REPORT CR-091)"
      class="code-card"
    >
      <ARow :gutter="24">
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-danger">
              ❌ 旧版实现 (有状态组件递归封装)
            </div>
            <pre><code>&lt;!-- TableColumnRenderer.vue (旧版) --&gt;
&lt;TableColumn
  v-if="column.children &amp;&amp; column.children.length > 0"
  v-bind="getColumnProps(column)"
&gt;
  &lt;!-- 递归包装了一层状态组件 TableColumnRenderer --&gt;
  &lt;!-- shapeFlag = 4，导致父级 ElTableColumn 无法收集到直系子列 --&gt;
  &lt;TableColumnRenderer :columns="column.children" /&gt;
&lt;/TableColumn&gt;</code></pre>
          </div>
        </ACol>
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-success">
              ✅ 工作区修复版 (直接生成同层 TableColumn VNode 树)
            </div>
            <pre><code>// TableColumnRenderer.vue (当前工作区)
const renderColumn = (column: Column): any => {
  const hasChildren = Array.isArray(column.children) &amp;&amp; column.children.length > 0;
  const vnodeProps = { key: getColumnKey(column), ...getColumnProps(column) };
  if (hasChildren) {
    // 父列插槽内直接递归返回子列的 TableColumn VNode 数组，展开为同层子列
    return h(TableColumn, vnodeProps, {
      default: () => column.children!.map(child => renderColumn(child)),
    });
  }
  return h(TableColumn, vnodeProps);
};</code></pre>
          </div>
        </ACol>
      </ARow>
    </ACard>
  </div>
</template>

<style scoped>
.demo-page {
  max-width: 1400px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 32px 24px 64px;
  background-color: #f7f8fa;
}

.demo-header {
  margin-bottom: 24px;
}

.header-nav {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 8px;
}

.back-link {
  color: #1677ff;
  font-size: 14px;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.badge {
  padding: 2px 8px;
  color: #0958d9;
  font-size: 12px;
  background: #e6f4ff;
  border: 1px solid #91caff;
  border-radius: 4px;
}

.header-title {
  margin: 8px 0;
  color: #1d2129;
  font-weight: 600;
  font-size: 22px;
}

.header-desc {
  margin: 0;
  color: #4e5969;
  font-size: 14px;
}

.mb-24 {
  margin-bottom: 24px;
}

.probe-card {
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.probe-legacy {
  border-left: 4px solid #ff4d4f;
}

.probe-fixed {
  border-left: 4px solid #52c41a;
}

.probe-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 15px;
}

.probe-metric {
  margin-bottom: 8px;
  color: #1d2129;
  font-size: 14px;
}

.probe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 10px;
}

.probe-tags .label {
  color: #86909c;
  font-size: 13px;
}

.probe-alert {
  padding: 6px 12px;
  color: #cf1322;
  font-size: 13px;
  background: #fff1f0;
  border-radius: 4px;
}

.text-success {
  color: #389e0d !important;
  background: #f6ffed !important;
}

.compare-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.legacy-border {
  border-top: 3px solid #ff4d4f;
}

.fixed-border {
  border-top: 3px solid #52c41a;
}

.table-wrapper {
  min-height: 280px;
  overflow-x: auto;
}

.code-card {
  background: #ffffff;
  border-radius: 8px;
}

.code-block {
  padding: 16px;
  overflow: hidden;
  background: #1e1e1e;
  border-radius: 6px;
}

.code-header {
  margin-bottom: 8px;
  padding-bottom: 6px;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid #333;
}

.text-danger {
  color: #ff7875;
}

pre {
  margin: 0;
  overflow-x: auto;
  color: #d4d4d4;
  font-size: 12px;
  font-family: Consolas, Monaco, monospace;
  line-height: 1.5;
}
</style>
