<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Card as ACard,
  Tag as ATag,
  Alert as AAlert,
  RadioGroup as ARadioGroup,
  RadioButton as ARadioButton,
  Row as ARow,
  Col as ACol,
} from 'ant-design-vue';

// 1. 旧版：legacy-antd-vue-pro (CR-071 缺陷现场)
import {
  ProTable as LegacyProTable,
  ProComponentProvider as LegacyProvider,
  useTable as useLegacyTable,
} from 'legacy-antd-vue-pro';

// 2. 当前工作区：已修复版 antd-vue-pro
import {
  ProTable as FixedProTable,
  ProComponentProvider as FixedProvider,
  useTable as useFixedTable,
} from '../../../packages/antd-vue-pro/src';

type SizeType = 'small' | 'middle' | 'large';

// 动态控制 Provider 注入的表格尺寸
const providerSize = ref<SizeType>('small');

// 测试表格列与数据
const testColumns = [
  { title: 'ID', dataIndex: 'id', width: 80 },
  { title: '商品名称', dataIndex: 'name', width: 140 },
  { title: '品类', dataIndex: 'category', width: 120 },
  { title: '单价 (元)', dataIndex: 'price', width: 100 },
  { title: '库存状态', dataIndex: 'status', width: 100 },
];

const testData = [
  {
    id: 101,
    name: '机械键盘 Pro',
    category: '外设办公',
    price: 599,
    status: '现货充足',
  },
  {
    id: 102,
    name: '人体工学椅',
    category: '办公家具',
    price: 1299,
    status: '现货',
  },
  {
    id: 103,
    name: '4K 显示器',
    category: '数码影音',
    price: 2499,
    status: '少量库存',
  },
];

// 初始化旧版表格
const legacyTable = useLegacyTable({
  columns: testColumns,
  dataSource: testData,
});

// 初始化工作区修复版表格
const fixedTable = useFixedTable({
  columns: testColumns,
  dataSource: testData,
});

// DOM 容器引用
const legacyWrapperRef = ref<HTMLElement | null>(null);
const fixedWrapperRef = ref<HTMLElement | null>(null);

// 探针状态
interface ProbeInfo {
  renderedClasses: string[];
  isSmall: boolean;
  isMiddle: boolean;
  actualSize: string;
  matchedProvider: boolean;
}

const legacyProbe = ref<ProbeInfo>({
  renderedClasses: [],
  isSmall: false,
  isMiddle: false,
  actualSize: '未知',
  matchedProvider: false,
});

const fixedProbe = ref<ProbeInfo>({
  renderedClasses: [],
  isSmall: false,
  isMiddle: false,
  actualSize: '未知',
  matchedProvider: false,
});

const inspectDOM = async () => {
  await nextTick();
  await nextTick();

  // 1. 探测旧版表格 DOM
  if (legacyWrapperRef.value) {
    const tableEl = legacyWrapperRef.value.querySelector('.ant-table');
    if (tableEl) {
      const classList = Array.from(tableEl.classList);
      const isSmall = classList.includes('ant-table-small');
      const isMiddle = classList.includes('ant-table-middle');
      const actualSize = isSmall
        ? 'small'
        : isMiddle
          ? 'middle'
          : 'large (默认默认尺寸)';
      legacyProbe.value = {
        renderedClasses: classList,
        isSmall,
        isMiddle,
        actualSize,
        matchedProvider: actualSize === providerSize.value,
      };
    }
  }

  // 2. 探测工作区已修复版表格 DOM
  if (fixedWrapperRef.value) {
    const tableEl = fixedWrapperRef.value.querySelector('.ant-table');
    if (tableEl) {
      const classList = Array.from(tableEl.classList);
      const isSmall = classList.includes('ant-table-small');
      const isMiddle = classList.includes('ant-table-middle');
      const actualSize = isSmall
        ? 'small'
        : isMiddle
          ? 'middle'
          : 'large (默认默认尺寸)';
      fixedProbe.value = {
        renderedClasses: classList,
        isSmall,
        isMiddle,
        actualSize,
        matchedProvider: actualSize === providerSize.value,
      };
    }
  }
};

const onProviderSizeChange = () => {
  setTimeout(() => {
    inspectDOM();
  }, 100);
};

onMounted(() => {
  setTimeout(() => {
    inspectDOM();
  }, 300);
});
</script>

<template>
  <div class="demo-page">
    <!-- 顶栏导航 -->
    <header class="demo-header">
      <div class="header-nav">
        <RouterLink to="/" class="back-link">← 返回示例导航</RouterLink>
        <span class="badge">CODE-REVIEW 修复验证工作台</span>
      </div>
      <h1 class="header-title">
        CR-071 修复前后对比：ProComponentProvider 注入表格尺寸 (size)
        被后置绑定静默清空
      </h1>
      <p class="header-desc">
        对比旧版
        <code>legacy-antd-vue-pro@2.4.5</code>（缺陷现场）与当前工作区已修复的
        <code>@qin-ui/antd-vue-pro</code>。
      </p>
    </header>

    <!-- 缺陷背景与修复说明卡片 -->
    <AAlert
      type="info"
      show-icon
      class="mb-24"
      message="CR-071 核心机制与修复原理解析"
    >
      <template #description>
        <div>
          <strong>缺陷成因：</strong>旧版 <code>ProTable.vue</code> 的模板中写有
          <code
            >&lt;ATable v-bind="computedTableProps" :size="size" ... /&gt;</code
          >。由于 <code>size</code> 来自
          <code>defineModel()</code>，未显式传参时其值为
          <code>undefined</code>。在 Vue 的
          <code>mergeProps</code> 规范中，后声明的
          <code>:size="undefined"</code> 会<strong>无条件覆盖</strong>前置
          <code>computedTableProps</code> 中的注入值，导致通过
          <code>ProComponentProvider</code> 全局配置的
          <code>size: 'small'</code>
          被静默抹除，表格尺寸永远退化为默认的大尺寸！<br />
          <strong>工作区修复：</strong>从模板中移除了后置的
          <code>:size="size"</code>，将属性合并收敛至
          <code>computedTableProps</code> 计算属性内部。仅当调用方显式声明了
          <code>size</code> prop 或通过工具栏修改时才覆盖注入值，从而保证全局
          Provider 注入的尺寸能够稳定生效！
        </div>
      </template>
    </AAlert>

    <!-- 动态控制栏 -->
    <ACard class="mb-24 control-card" title="全局 Provider 尺寸控制">
      <div class="control-row">
        <span class="control-label">切换 Provider 注入的表格尺寸：</span>
        <ARadioGroup
          v-model:value="providerSize"
          button-style="solid"
          @change="onProviderSizeChange"
        >
          <ARadioButton value="small">紧凑尺寸 (small)</ARadioButton>
          <ARadioButton value="middle">中等尺寸 (middle)</ARadioButton>
          <ARadioButton value="large">标准大尺寸 (large)</ARadioButton>
        </ARadioGroup>
        <span class="control-tip"
          >（切换后观察下方两侧表格的实际渲染尺寸与 DOM 状态）</span
        >
      </div>
    </ACard>

    <!-- 探针数据摘要 -->
    <ARow :gutter="24" class="mb-24">
      <!-- 左侧：旧版缺陷探针 -->
      <ACol :span="12">
        <div class="probe-card probe-defect">
          <div class="probe-title">
            <span>🔴 Legacy 旧版实测探针 (v2.4.5)</span>
            <ATag color="error">注入尺寸失效</ATag>
          </div>
          <div class="probe-item">
            Provider 期望注入尺寸：
            <strong>{{ providerSize }}</strong>
          </div>
          <div class="probe-item">
            表格 DOM 实际尺寸：
            <strong class="text-danger">{{ legacyProbe.actualSize }}</strong>
          </div>
          <div class="probe-item">
            注入状态判定：
            <ATag v-if="legacyProbe.matchedProvider" color="green">
              ✅ 生效
            </ATag>
            <ATag v-else color="red">
              ❌ 失效（被 :size="undefined" 清空，恒为默认大尺寸）
            </ATag>
          </div>
          <div class="probe-detail">
            <code>.ant-table</code> 类名：
            <span class="classes-text">{{
              legacyProbe.renderedClasses.join(' ')
            }}</span>
          </div>
        </div>
      </ACol>

      <!-- 右侧：工作区已修复探针 -->
      <ACol :span="12">
        <div class="probe-card probe-fixed">
          <div class="probe-title">
            <span>🟢 当前工作区修复后探针 (已修复)</span>
            <ATag color="success">注入尺寸正常生效</ATag>
          </div>
          <div class="probe-item">
            Provider 期望注入尺寸：
            <strong>{{ providerSize }}</strong>
          </div>
          <div class="probe-item">
            表格 DOM 实际尺寸：
            <strong class="text-success">{{ fixedProbe.actualSize }}</strong>
          </div>
          <div class="probe-item">
            注入状态判定：
            <ATag v-if="fixedProbe.matchedProvider" color="green">
              ✅ 完美对齐 Provider 注入（{{ providerSize }}）
            </ATag>
            <ATag v-else color="red"> ❌ 未对齐 </ATag>
          </div>
          <div class="probe-detail">
            <code>.ant-table</code> 类名：
            <span class="classes-text">{{
              fixedProbe.renderedClasses.join(' ')
            }}</span>
          </div>
        </div>
      </ACol>
    </ARow>

    <!-- 双栏视图渲染对照 -->
    <ARow :gutter="24" class="mb-24">
      <!-- 左侧：Legacy ProTable -->
      <ACol :span="12">
        <ACard
          title="Legacy 旧版渲染 (legacy-antd-vue-pro@2.4.5)"
          class="compare-card defect-border"
        >
          <template #extra>
            <ATag color="red">缺陷：尺寸注入被吞</ATag>
          </template>
          <div ref="legacyWrapperRef" class="table-wrapper">
            <p class="tip-text text-danger">
              在 Provider 中配置了
              <code>size: '{{ providerSize }}'</code>，但表格依然渲染为大尺寸：
            </p>
            <LegacyProvider
              :component-vars="{
                'pro-table': {
                  size: providerSize,
                },
              }"
            >
              <LegacyProTable :table="legacyTable" :pagination="false" />
            </LegacyProvider>
          </div>
        </ACard>
      </ACol>

      <!-- 右侧：当前工作区已修复 ProTable -->
      <ACol :span="12">
        <ACard
          title="当前工作区渲染 (@qin-ui/antd-vue-pro 已修复)"
          class="compare-card fixed-border"
        >
          <template #extra>
            <ATag color="green">已修复：尺寸正常生效</ATag>
          </template>
          <div ref="fixedWrapperRef" class="table-wrapper">
            <p class="tip-text text-success">
              Provider 注入的
              <code>size: '{{ providerSize }}'</code>
              正常应用到表格，排版紧凑适中：
            </p>
            <FixedProvider
              :component-vars="{
                'pro-table': {
                  size: providerSize,
                },
              }"
            >
              <FixedProTable :table="fixedTable" :pagination="false" />
            </FixedProvider>
          </div>
        </ACard>
      </ACol>
    </ARow>

    <!-- 源码对比分析卡片 -->
    <ACard title="CR-071 源码修复落地实录" class="code-card">
      <ARow :gutter="24">
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-danger">
              ❌ 修复前：后置 :size 绑定无条件覆盖注入配置
            </div>
            <pre><code>&lt;!-- ProTable.vue (旧版模板) --&gt;
&lt;ATable
  class="pro-table_content"
  v-bind="computedTableProps"
  :size="size"       &lt;!-- 此处 size 为 undefined，将 computedTableProps.size 抹除 --&gt;
  :loading="loading"
  :columns="visibleComputedColumns"
  :data-source="computedDataSource"
/&gt;</code></pre>
          </div>
        </ACol>
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-success">
              ✅ 修复后：移除后置绑定，收敛至 computedTableProps 内合并
            </div>
            <pre><code>// ProTable.vue (工作区已修复)
// 1. 模板中移除后置 :size 覆盖
&lt;ATable
  class="pro-table_content"
  v-bind="computedTableProps"
  :loading="loading"
  :columns="visibleComputedColumns"
/&gt;

// 2. 在 computedTableProps 内部统一合并，仅显式绑定或手动切换时覆盖注入值：
const localSize = size.value;
if (isBoundProp('size') || localSize !== undefined) {
  merged.size = localSize;
}</code></pre>
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

.control-card {
  background: #ffffff;
  border-radius: 8px;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.control-label {
  color: #1d2129;
  font-weight: 500;
  font-size: 14px;
}

.control-tip {
  color: #86909c;
  font-size: 13px;
}

.probe-card {
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.probe-defect {
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

.probe-item {
  margin-bottom: 8px;
  color: #1d2129;
  font-size: 14px;
}

.probe-detail {
  margin-top: 8px;
  color: #86909c;
  font-size: 12px;
  word-break: break-all;
}

.classes-text {
  padding: 2px 6px;
  font-family: Consolas, Monaco, monospace;
  background: #f2f3f5;
  border-radius: 4px;
}

.compare-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.defect-border {
  border-top: 3px solid #ff4d4f;
}

.fixed-border {
  border-top: 3px solid #52c41a;
}

.table-wrapper {
  min-height: 280px;
  padding: 12px 8px;
}

.tip-text {
  margin-bottom: 16px;
  padding: 6px 12px;
  color: #4e5969;
  font-size: 13px;
  background: #f2f3f5;
  border-radius: 4px;
}

.text-danger {
  color: #cf1322 !important;
}

.text-success {
  color: #389e0d !important;
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

pre {
  margin: 0;
  overflow-x: auto;
  color: #d4d4d4;
  font-size: 12px;
  font-family: Consolas, Monaco, monospace;
  line-height: 1.5;
}
</style>
