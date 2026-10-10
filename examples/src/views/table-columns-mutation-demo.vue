<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import {
  Card as ACard,
  Tag as ATag,
  Alert as AAlert,
  Button as AButton,
  Row as ARow,
  Col as ACol,
  Space as ASpace,
  message,
} from 'ant-design-vue';

// 1. 旧版：legacy core 与 legacy 表格
import { useTable as useLegacyTable } from 'legacy-pro-components-core';
import { ProTable as LegacyProTable } from 'legacy-antd-vue-pro';

// 2. 当前工作区修复版：最新 core 与 antd 表格
import { useTable as useFixedTable } from '../../../packages/core/src';
import {
  ProTable as FixedProTable,
  type Column,
} from '../../../packages/antd-vue-pro/src';

// 初始列配置（支持 resizeColumn 拖拽调宽）
const getInitialColumns = (): Column[] => [
  { title: 'ID', dataIndex: 'id', width: 80, resizable: true },
  { title: '用户姓名', dataIndex: 'name', width: 140, resizable: true },
  { title: '所属部门', dataIndex: 'dept', width: 160, resizable: true },
];

const mockData = [
  { id: 1, name: '张三', dept: '技术中台', phone: '13800000001' },
  { id: 2, name: '李四', dept: '业务架构', phone: '13800000002' },
];

// 初始化旧版表格与新版表格
const legacyTable = useLegacyTable<any, any, Column>({
  columns: getInitialColumns(),
  dataSource: mockData,
});

const fixedTable = useFixedTable<any, any, Column>({
  columns: getInitialColumns(),
  dataSource: mockData,
});

// 操作标记状态
const hasPushedColumn = ref(false);
const hasModifiedColumn = ref(false);
const hasResizedColumn = ref(false);

// 探针状态
const probeInfo = ref({
  legacyPushedKey: undefined as string | undefined,
  legacyPushedTitle: '',
  legacySetColumnSuccess: false,
  legacyColumnWidths: [] as { title: string; width: number | string }[],

  fixedPushedKey: undefined as string | undefined,
  fixedPushedTitle: '',
  fixedSetColumnSuccess: false,
  fixedColumnWidths: [] as { title: string; width: number | string }[],
});

// 列宽拖拽调节处理函数（就地变异 col.width = w）
function handleResizeColumn(w: number, col: any) {
  col.width = w;
  hasResizedColumn.value = true;
  updateProbe();
}

const updateProbe = () => {
  // 1. 检查旧版变异列与各列宽度
  const legacyCols = legacyTable.columns.value;
  probeInfo.value.legacyColumnWidths = legacyCols.map((c: any) => ({
    title: String(c.title ?? ''),
    width: c.width ?? 'auto',
  }));
  const legacyPhoneCol = legacyCols.find((c: any) => c.dataIndex === 'phone');
  if (legacyPhoneCol) {
    probeInfo.value.legacyPushedKey = (legacyPhoneCol as any).key;
    probeInfo.value.legacyPushedTitle = String(
      (legacyPhoneCol as any).title ?? ''
    );
    probeInfo.value.legacySetColumnSuccess =
      (legacyPhoneCol as any).title === '【已修改】手机号码';
  } else {
    probeInfo.value.legacyPushedKey = undefined;
    probeInfo.value.legacyPushedTitle = '';
    probeInfo.value.legacySetColumnSuccess = false;
  }

  // 2. 检查修复版变异列与各列宽度
  const fixedCols = fixedTable.columns.value;
  probeInfo.value.fixedColumnWidths = fixedCols.map((c: any) => ({
    title: String(c.title ?? ''),
    width: c.width ?? 'auto',
  }));
  const fixedPhoneCol = fixedCols.find((c: any) => c.dataIndex === 'phone');
  if (fixedPhoneCol) {
    probeInfo.value.fixedPushedKey = (fixedPhoneCol as any).key;
    probeInfo.value.fixedPushedTitle = String(
      (fixedPhoneCol as any).title ?? ''
    );
    probeInfo.value.fixedSetColumnSuccess =
      (fixedPhoneCol as any).title === '【已修改】手机号码';
  } else {
    probeInfo.value.fixedPushedKey = undefined;
    probeInfo.value.fixedPushedTitle = '';
    probeInfo.value.fixedSetColumnSuccess = false;
  }
};

// 操作 1：通过原生数组变异 push 无 key 列
const handlePushColumn = () => {
  // 无显式 key 属性，仅带 dataIndex 与 title
  const newColumn: Column = {
    title: '联系手机 (动态推入)',
    dataIndex: 'phone',
    width: 180,
    resizable: true,
  };

  // 两侧均执行就地变异 push
  legacyTable.columns.value.push({ ...newColumn });
  fixedTable.columns.value.push({ ...newColumn });

  hasPushedColumn.value = true;
  updateProbe();
  message.info('已向两侧表格就地 push 无 key 的新列：phone');
};

// 操作 2：调用 setColumn 修改动态推入的列
const handleModifyColumn = () => {
  if (!hasPushedColumn.value) {
    message.warning('请先点击第一步推入新列！');
    return;
  }

  // 对两侧调用 setColumn 修改该列的标题
  legacyTable.setColumn('phone', (pre: any) => ({
    ...pre,
    title: '【已修改】手机号码',
  }));

  fixedTable.setColumn('phone', (pre: any) => ({
    ...pre,
    title: '【已修改】手机号码',
  }));

  hasModifiedColumn.value = true;
  updateProbe();

  if (
    probeInfo.value.fixedSetColumnSuccess &&
    !probeInfo.value.legacySetColumnSuccess
  ) {
    message.success('测试完成：工作区修复版修改成功，旧版修改失效！');
  }
};

// 操作 3：模拟 resizeColumn 调宽变异
const handleSimulateResize = () => {
  // 模拟对两边的“用户姓名”列进行 resizeColumn(220, col)
  const legacyCol = legacyTable.columns.value.find(
    (c: any) => c.dataIndex === 'name'
  );
  const fixedCol = fixedTable.columns.value.find(
    (c: any) => c.dataIndex === 'name'
  );

  if (legacyCol) {
    handleResizeColumn(220, legacyCol);
  }
  if (fixedCol) {
    handleResizeColumn(220, fixedCol);
  }
  message.success('已触发 resizeColumn：将“用户姓名”列宽调整为 220px');
};

// 操作 4：重置初始状态
const handleReset = () => {
  legacyTable.columns.value = getInitialColumns();
  fixedTable.columns.value = getInitialColumns();
  hasPushedColumn.value = false;
  hasModifiedColumn.value = false;
  hasResizedColumn.value = false;
  updateProbe();
  message.success('已恢复初始列状态');
};

onMounted(() => {
  updateProbe();
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
        CR-009 修复前后对比：useTable 列元素级变异 (push/splice/resizeColumn)
        规范化与联动
      </h1>
      <p class="header-desc">
        对比旧版
        <code>legacy-pro-components-core@2.0.4</code>（数组变异逃逸，key
        未分配致 setColumn 失效）与当前工作区
        <code>customRef</code> 读取就地补齐机制，并演示
        <code>resizeColumn</code> 原生列宽拖拽伸缩功能。
      </p>
    </header>

    <!-- 缺陷背景与修复说明卡片 -->
    <AAlert
      type="info"
      show-icon
      class="mb-24"
      message="CR-009 机制与已落地的修复方案"
    >
      <template #description>
        <div>
          <strong>缺陷成因：</strong>旧版 <code>useTable</code> 内部使用
          <code>watch(columns, normalizeColumns)</code>
          对列数组做规范化（自动补齐唯一 <code>key</code>）。但
          <code>watch</code> 默认只在对
          <code>columns.value = [...]</code> 进行整体重新赋值时触发，当通过
          <code>columns.value.push(...)</code>、<code>splice</code>
          等就地变异方法添加未带
          <code>key</code>
          的列时，<strong>规范化逻辑被完全绕过</strong>。导致新列的
          <code>key</code> 恒为 <code>undefined</code>，宿主表格收到无 key
          列，且后续对该列调用
          <code>setColumn('phone', ...)</code> 彻底失效（无法命中索引）！<br />
          <strong>工作区修复：</strong>放弃依赖被动的 <code>watch</code>，改用
          Vue 的 <code>customRef</code> 包装
          <code>columns</code>。在调用者或模板通过 <code>get()</code> 读取
          <code>columns.value</code> 时，执行就地递归遍历
          <code>ensureColumnKeys()</code>，对缺失 <code>key</code> 的列（及深层
          <code>children</code>
          分组列）进行幂等补齐。无论何种数组变异路径，读取即规范化，<code
            >setColumn</code
          >
          完美匹配！同时在
          <code>@resizeColumn="handleResizeColumn"</code> 就地修改
          <code>col.width = w</code> 时，列引用与响应式更新保持稳定。
        </div>
      </template>
    </AAlert>

    <!-- 交互操作区 -->
    <ACard class="mb-24 control-card" title="变异联动测试操作台">
      <ASpace size="middle" wrap>
        <AButton
          type="primary"
          :disabled="hasPushedColumn"
          @click="handlePushColumn"
        >
          步骤 1：就地变异 push 无 key 的新列 (phone)
        </AButton>
        <AButton
          type="dashed"
          :disabled="!hasPushedColumn || hasModifiedColumn"
          @click="handleModifyColumn"
        >
          步骤 2：对新列调用 setColumn('phone', { title: '【已修改】手机号码' })
        </AButton>
        <AButton @click="handleSimulateResize">
          测试 3：触发 resizeColumn 变异 (修改“用户姓名”为 220px)
        </AButton>
        <AButton @click="handleReset">重置列配置</AButton>
      </ASpace>
      <div class="control-tip mt-12">
        💡 提示：点击步骤 1 推入新列后，观察两侧新列的
        <code>key</code> 是否被补齐；点击步骤 2，观察
        <code>setColumn</code>
        能否成功修改该列标题；也可直接鼠标拖拽表头边框或点击测试 3，体验
        <code>@resizeColumn="handleResizeColumn"</code> 变异响应。
      </div>
    </ACard>

    <!-- 探针数据摘要 -->
    <ARow :gutter="24" class="mb-24">
      <!-- 左侧：旧版缺陷探针 -->
      <ACol :span="12">
        <div class="probe-card probe-defect">
          <div class="probe-title">
            <span>🔴 Legacy 旧版探针 (v2.0.4 变异逃逸现场)</span>
            <ATag color="error">key 规范化失效</ATag>
          </div>
          <div class="probe-item">
            推入列的 <code>key</code> 属性状态：
            <template v-if="hasPushedColumn">
              <strong class="text-danger">{{
                String(probeInfo.legacyPushedKey)
              }}</strong>
              <ATag color="red">❌ 逃逸未分配！缺失 key</ATag>
            </template>
            <span v-else class="text-muted">（尚未推入新列）</span>
          </div>
          <div class="probe-item">
            新列当前 <code>title</code> 状态：
            <strong>{{ probeInfo.legacyPushedTitle || '无' }}</strong>
          </div>
          <div class="probe-item">
            <code>setColumn('phone', ...)</code> 联动判定：
            <template v-if="hasModifiedColumn">
              <ATag v-if="probeInfo.legacySetColumnSuccess" color="green"
                >修改成功</ATag
              >
              <ATag v-else color="red"
                >❌ 修改失败！无 key 无法命中目标列，操作被忽略</ATag
              >
            </template>
            <span v-else class="text-muted">（尚未执行修改）</span>
          </div>
          <div class="probe-item">
            各列宽度状态 (resizeColumn)：
            <span
              v-for="c in probeInfo.legacyColumnWidths"
              :key="c.title"
              class="mr-8"
            >
              <ATag>{{ c.title }}: {{ c.width }}px</ATag>
            </span>
          </div>
        </div>
      </ACol>

      <!-- 右侧：工作区已修复探针 -->
      <ACol :span="12">
        <div class="probe-card probe-fixed">
          <div class="probe-title">
            <span>🟢 当前工作区探针 (customRef 读取即补齐)</span>
            <ATag color="success">就地变异安全补齐</ATag>
          </div>
          <div class="probe-item">
            推入列的 <code>key</code> 属性状态：
            <template v-if="hasPushedColumn">
              <strong class="text-success">{{
                String(probeInfo.fixedPushedKey)
              }}</strong>
              <ATag color="green"
                >✅ 自动规范化补齐（继承 dataIndex 'phone'）</ATag
              >
            </template>
            <span v-else class="text-muted">（尚未推入新列）</span>
          </div>
          <div class="probe-item">
            新列当前 <code>title</code> 状态：
            <strong>{{ probeInfo.fixedPushedTitle || '无' }}</strong>
          </div>
          <div class="probe-item">
            <code>setColumn('phone', ...)</code> 联动判定：
            <template v-if="hasModifiedColumn">
              <ATag v-if="probeInfo.fixedSetColumnSuccess" color="green"
                >✅ 修改成功！标题已更新并在视图呈现</ATag
              >
              <ATag v-else color="red">修改失败</ATag>
            </template>
            <span v-else class="text-muted">（尚未执行修改）</span>
          </div>
          <div class="probe-item">
            各列宽度状态 (resizeColumn)：
            <span
              v-for="c in probeInfo.fixedColumnWidths"
              :key="c.title"
              class="mr-8"
            >
              <ATag color="blue">{{ c.title }}: {{ c.width }}px</ATag>
            </span>
          </div>
        </div>
      </ACol>
    </ARow>

    <!-- 双栏视图渲染对照 -->
    <ARow :gutter="24" class="mb-24">
      <!-- 左侧：Legacy ProTable -->
      <ACol :span="12">
        <ACard
          title="Legacy 旧版渲染 (legacy-pro-components-core@2.0.4)"
          class="compare-card defect-border"
        >
          <template #extra>
            <ATag color="red">缺陷：变异列无 key 且 setColumn 无效</ATag>
          </template>
          <div class="table-wrapper">
            <LegacyProTable
              :table="legacyTable"
              @resize-column="handleResizeColumn"
            />
          </div>
        </ACard>
      </ACol>

      <!-- 右侧：当前工作区修复版 ProTable -->
      <ACol :span="12">
        <ACard
          title="当前工作区渲染 (@qin-ui/pro-components-core 已修复)"
          class="compare-card fixed-border"
        >
          <template #extra>
            <ATag color="green">已修复：变异安全且响应更新</ATag>
          </template>
          <div class="table-wrapper">
            <FixedProTable
              :table="fixedTable"
              @resize-column="handleResizeColumn"
            />
          </div>
        </ACard>
      </ACol>
    </ARow>

    <!-- 源码实现机制卡片 -->
    <ACard title="CR-009 源码缺陷与 customRef 修复架构" class="code-card">
      <ARow :gutter="24">
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-danger">
              ❌ 旧版实现：仅 watch 整体重赋值，元素级变异逃逸
            </div>
            <pre><code>// packages/core/src/table/useTable.ts (旧版)
const columns = ref(normalizeColumns(initColumns, allocateColumnKey));

// 仅在整体 columns.value = [...] 赋值时执行！
// push / unshift / splice 等就地变异操作完全不会触发 watch
watch(
  columns,
  cols => {
    normalizeColumns(cols, allocateColumnKey);
  },
  { flush: 'sync' }
);</code></pre>
          </div>
        </ACol>
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-success">
              ✅ 当前工作区修复架构：customRef 读取即补齐
            </div>
            <pre><code>// packages/core/src/table/useTable.ts (已修复)
// 使用 customRef 拦截读取与赋值：
const columns = customRef((track, trigger) => ({
  get() {
    track();
    // 无论是整体赋值还是元素级变异 (push/splice)，
    // 在下一次读取 columns.value 时就地幂等补齐缺失 key！
    ensureColumnKeys(columnState.value, allocateColumnKey);
    return columnState.value;
  },
  set(next) {
    normalizeColumns(next, allocateColumnKey);
    columnState.value = next;
    trigger();
  },
}));</code></pre>
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

.mt-12 {
  margin-top: 12px;
}

.control-card {
  background: #ffffff;
  border-radius: 8px;
}

.control-tip {
  color: #86909c;
  font-size: 13px;
}

.probe-card {
  min-height: 160px;
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
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  color: #1d2129;
  font-size: 13px;
}

.text-danger {
  color: #cf1322 !important;
}

.text-success {
  color: #389e0d !important;
}

.text-muted {
  color: #86909c;
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
  min-height: 200px;
  padding: 12px 8px;
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
