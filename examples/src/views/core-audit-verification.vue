<script lang="ts" setup>
/**
 * core 复核验证台（A 批：搜索表单折叠 + 列 key / 表属性面）
 *
 * 用途：在真实浏览器中验证 core 复核修复项，每张卡片给出「怎么点 → 预期结果」与实测面板。
 * 数据与组件均来自工作区源码（ProTable 走 antd-vue-pro 源码，core 走 workspace 构建产物）。
 */
import { nextTick, onMounted, onBeforeUnmount, ref } from 'vue';
import { ProTable, useTable } from '../../../packages/antd-vue-pro/src';
// 直接引 workspace 构建产物：与适配层解析到同一模块实例（Hook 属 core 内部 API，未从适配层再导出）
import { useSearchFormExpand } from '../../../packages/core/es/index.js';

// ====================================================
// 场景 1：折叠态初值自动展开 + 重测不回弹 + 折叠行数（A1/A2/A3）
// ====================================================
/**
 * grid 默认每行 3 个字段（antd 栅格 24 列 / 字段默认 span 8）：8 个字段占 3 行，
 * `minExpandRows: 2` 时第 3 行（标签 / 开始日期）落在折叠区；给最后 3 个字段带初值，
 * 保证隐藏区一定有已填写条件
 */
const initialSearchParam = {
  keyword: '',
  status: '',
  owner: '',
  dept: '',
  role: '',
  level: 'P6',
  tag: '核心客户',
  dateFrom: '2026-01-01',
};

const expandTable = useTable<any>({
  // 字段数组内联声明，由 useTable 参数做上下文类型推导（component 保持字面量类型）
  searchFields: [
    { path: 'keyword', label: '关键词', component: 'input' },
    { path: 'status', label: '状态', component: 'input' },
    { path: 'owner', label: '负责人', component: 'input' },
    { path: 'dept', label: '部门', component: 'input' },
    { path: 'role', label: '角色', component: 'input' },
    { path: 'level', label: '等级', component: 'input' },
    { path: 'tag', label: '标签', component: 'input' },
    { path: 'dateFrom', label: '开始日期', component: 'input' },
  ],
  searchParam: { ...initialSearchParam },
});

const expandSection = ref<HTMLElement | null>(null);
const narrow = ref(false);
const extraFieldAdded = ref(false);

const toggleWidth = () => {
  narrow.value = !narrow.value;
};

/** 增删字段：走 fields 变化 → useSearchFormExpand 的测量 watch 分支 */
const toggleExtraField = async () => {
  const form = expandTable.searchForm as any;
  if (extraFieldAdded.value) {
    form.deleteField('extra');
    extraFieldAdded.value = false;
  } else {
    form.appendField(undefined, { path: 'extra', label: '追加字段' });
    extraFieldAdded.value = true;
  }
  await nextTick();
  scheduleMeasureReport();
};

const resetSearch = async () => {
  expandTable.searchForm.setFormData({ ...initialSearchParam } as any);
  await nextTick();
  scheduleMeasureReport();
};

// ====================================================
// 场景 2：kebab 写法 :data-source 与多位点列 key 唯一（保名收窄 / 列 key 重分配）
// ====================================================
const tableRows = [
  { name: '张三', status: '在职' },
  { name: '李四', status: '试用' },
  { name: '王五', status: '离职' },
];

const columnTable = useTable<any>({
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'status', title: '状态' },
  ],
});

const appendedKeyGroups = ref<string[][]>([]);

const appendColumnsEverywhere = async () => {
  const form = columnTable as any;
  form.appendColumn(
    (c: any) => c.key === 'name' || c.key === 'status',
    { key: 'x', title: 'X', children: [{ key: 'x1', title: 'X1' }] },
    { all: true }
  );
  await nextTick();
  const flat: string[] = [];
  const collect = (list: any[]) => {
    list.forEach(c => {
      flat.push(String(c.key));
      if (Array.isArray(c.children)) collect(c.children);
    });
  };
  collect(columnTable.columns.value as any[]);
  appendedKeyGroups.value.push(flat);
  scheduleMeasureReport();
};

// ====================================================
// 场景 3：Hook 直连探针 —— 非 grid 布局不施加高度约束
// ====================================================
const probeInline = useSearchFormExpand({
  form: expandTable.searchForm as any,
  expand: true,
  layout: 'inline',
  rowGap: 16,
});
const probeGrid = useSearchFormExpand({
  form: expandTable.searchForm as any,
  expand: true,
  layout: 'grid',
  rowGap: 16,
});

// ====================================================
// DOM 实测面板：容器内联高度 / 行数 / 展开按钮文案
// ====================================================
type MeasureReport = {
  inlineHeight: string;
  computedHeight: string;
  scrollHeight: number;
  clientHeight: number;
  /** 每行字段数（取各行的最大值；grid 默认 3） */
  fieldsPerRow: number;
  totalRows: number;
  visibleRows: number;
  totalFields: number;
  visibleFields: number;
  toggleText: string;
};

const measure = ref<MeasureReport | null>(null);
let rafId: number | null = null;

const runMeasure = () => {
  const root = expandSection.value;
  const formEl = root?.querySelector('form') as HTMLElement | null;
  if (!formEl) {
    measure.value = null;
    return;
  }
  const rows = Array.from(
    formEl.querySelectorAll("[class*='-form-item']")
  ).filter(el => {
    let parent = el.parentElement;
    while (parent && parent !== formEl) {
      if (
        typeof (parent as HTMLElement).className === 'string' &&
        (parent as HTMLElement).className.includes('-form-item')
      ) {
        return false;
      }
      parent = parent.parentElement;
    }
    return true;
  }) as HTMLElement[];
  const formBottom = formEl.getBoundingClientRect().bottom;
  const visibleFields = rows.filter(
    el =>
      el.offsetHeight > 0 && el.getBoundingClientRect().bottom <= formBottom + 1
  ).length;

  // 与 core 内部同口径：垂直区间重叠的字段归为同一行
  type RowBox = { top: number; bottom: number; count: number };
  const rowBoxes: RowBox[] = [];
  rows
    .filter(el => el.offsetHeight > 0)
    .map(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom };
    })
    .sort((a, b) => a.top - b.top)
    .forEach(box => {
      const last = rowBoxes[rowBoxes.length - 1];
      if (last && box.top < last.bottom - 1) {
        last.bottom = Math.max(last.bottom, box.bottom);
        last.count += 1;
      } else {
        rowBoxes.push({ top: box.top, bottom: box.bottom, count: 1 });
      }
    });
  const visibleRows = rowBoxes.filter(
    box => box.bottom <= formBottom + 1
  ).length;
  const toggle = root?.querySelector(
    '.pro-table_search-form_expand-toggle-button'
  );
  measure.value = {
    inlineHeight: formEl.style.height || '(无)',
    computedHeight: getComputedStyle(formEl).height,
    scrollHeight: formEl.scrollHeight,
    clientHeight: formEl.clientHeight,
    fieldsPerRow: rowBoxes.reduce((max, box) => Math.max(max, box.count), 0),
    totalRows: rowBoxes.length,
    visibleRows,
    totalFields: rows.filter(el => el.offsetHeight > 0).length,
    visibleFields,
    toggleText: toggle?.textContent?.trim() || '(无展开按钮)',
  };
};

/** rAF 后再测，避开测量/样式写入的同一帧 */
const scheduleMeasureReport = () => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    rafId = null;
    runMeasure();
  });
};

let observer: ResizeObserver | null = null;
onMounted(() => {
  const formEl = expandSection.value?.querySelector('form');
  if (formEl && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => scheduleMeasureReport());
    observer.observe(formEl);
  }
  setTimeout(scheduleMeasureReport, 120);
});

onBeforeUnmount(() => {
  observer?.disconnect();
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <main class="verification">
    <h1>core 复核验证台</h1>
    <p class="lead">
      每张卡片写清「怎么点 → 预期结果」，右下角面板为同一时刻的 DOM 实测值。
      数据来自工作区源码，core 来自 workspace 构建产物（改完 core 记得先
      <code>pnpm --filter "@qin-ui/pro-components-core" build</code>）。
    </p>

    <!-- 场景 1 -->
    <section ref="expandSection" class="card">
      <h2>① 折叠态初值自动展开 / 重测不回弹 / 折叠行数</h2>
      <ol class="steps">
        <li>
          <b>初值自动展开</b>：打开页面即应处于<b>展开态</b>（可见 8 行，含第 4
          行「部门 = 研发部」）——隐藏区有初值时自动展开。
        </li>
        <li>
          <b>重测不回弹（A1/A2）</b>：点「容器宽度
          ±60px」或「增删字段」多次，展开态应 <b>保持不变</b>（不会突然收起到 2
          行）。
        </li>
        <li>
          <b>折叠行数（A3）</b>：点表单自带的「收起」后，实测面板应显示
          <b>可见行数 = 2 且可见字段数 = 每行字段数 × 2</b>（grid 默认每行 3
          个字段，故为 6 个字段），不出现第 3 行露头。
          <span class="hint">
            说明：A3 的「坐标链不可测」分支在真实 DOM 下难以构造，由单测
            <code>SE-14</code>
            锁定；此处验证同一折叠公式的正常路径（只统计可见行）。
          </span>
        </li>
        <li>
          <b>手动锁定</b>：手动收起后再点「容器宽度
          ±60px」，应保持收起（用户意图优先）。
        </li>
      </ol>

      <div class="actions">
        <button data-test="toggle-width" @click="toggleWidth">
          容器宽度 ±60px（当前：{{ narrow ? '收窄' : '全宽' }}）
        </button>
        <button data-test="toggle-field" @click="toggleExtraField">
          {{ extraFieldAdded ? '删除追加字段' : '追加一个字段' }}
        </button>
        <button data-test="reset-search" @click="resetSearch">
          恢复初值（标签 / 等级 / 开始日期）
        </button>
        <button data-test="measure" @click="runMeasure">立即实测</button>
      </div>

      <div
        class="stage"
        :style="{ width: narrow ? 'calc(100% - 60px)' : '100%' }"
      >
        <ProTable
          :table="expandTable"
          :search-form-config="{ expand: { minExpandRows: 2 } }"
          :pagination="false"
        />
      </div>
    </section>

    <!-- 场景 2 -->
    <section class="card">
      <h2>② kebab 写法 <code>:data-source</code> 与多位点列 key 唯一</h2>
      <ol class="steps">
        <li>
          <b>data-source 生效</b>：下方表格由 <code>:data-source</code>（kebab
          写法）驱动，应渲染
          <b>3 行</b>数据（修复前该属性被静默忽略、表格为空）。
        </li>
        <li>
          <b>多位点列 key 唯一</b>：点「多站点追加列」两次，面板中每次追加后的
          <b>key 列表应无重复</b>（修复前带显式 key 的列会得到
          <code>x</code> 重复项）。
        </li>
      </ol>

      <div class="actions">
        <button data-test="append-columns" @click="appendColumnsEverywhere">
          多站点追加列（all: true，带显式 key 与子列）
        </button>
      </div>

      <ProTable
        :table="columnTable"
        :data-source="tableRows"
        :pagination="false"
      />

      <div v-if="appendedKeyGroups.length" class="keys">
        <div v-for="(keys, i) in appendedKeyGroups" :key="i">
          第 {{ i + 1 }} 次追加后列 key：<code>{{ keys.join(' | ') }}</code>
          <b :class="new Set(keys).size === keys.length ? 'ok' : 'bad'">
            {{
              new Set(keys).size === keys.length ? '✔ 无重复' : '✘ 存在重复'
            }}
          </b>
        </div>
      </div>
    </section>

    <!-- 场景 3 -->
    <section class="card">
      <h2>③ 非 grid 布局不施加高度约束（heightStyle 不再为 '0px'）</h2>
      <p class="steps">
        同一表单实例上的两个 Hook 直连探针：<code>layout: 'inline'</code>
        时不施加高度约束，
        <code>layout: 'grid'</code>
        时按折叠高度施加（实测值随上面的交互实时变化）。
      </p>
      <table class="probe">
        <thead>
          <tr>
            <th>探测项</th>
            <th>layout: 'inline'</th>
            <th>layout: 'grid'</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>heightStyle</td>
            <td data-test="inline-height-style">
              {{ String(probeInline.heightStyle.value) }}
            </td>
            <td>{{ String(probeGrid.heightStyle.value) }}</td>
          </tr>
          <tr>
            <td>currentHeight</td>
            <td>{{ String(probeInline.currentHeight.value) }}</td>
            <td>{{ String(probeGrid.currentHeight.value) }}</td>
          </tr>
          <tr>
            <td>collapseHeight</td>
            <td>{{ probeInline.collapseHeight.value }}</td>
            <td>{{ probeGrid.collapseHeight.value }}</td>
          </tr>
          <tr>
            <td>proFormHeight</td>
            <td>{{ String(probeInline.proFormHeight.value) }}</td>
            <td>{{ String(probeGrid.proFormHeight.value) }}</td>
          </tr>
        </tbody>
      </table>
      <p class="expect">
        预期：inline 列 <code>heightStyle === undefined</code>（不出现
        <code>0px</code>）；grid 列给出具体折叠高度（如
        <code>80px</code>，随行高与 rowGap 变化）。
      </p>
    </section>

    <!-- 实测面板 -->
    <section class="card panel">
      <h2>④ DOM 实测面板（场景 ① 的容器）</h2>
      <p class="steps">
        面板由 ProForm
        根元素与顶层字段元素的真实布局读数得出（按垂直重叠归行，与 core
        内部同口径）：收起后「可见行数」应为 2、「可见字段数」应为 每行字段数 ×
        2； 展开后两者都等于总数；「容器内联高度」即宿主实际施加的
        <code>heightStyle</code>。
      </p>
      <table v-if="measure" class="probe">
        <tbody>
          <tr>
            <td>容器内联高度（实际施加）</td>
            <td data-test="measure-inline-height">
              {{ measure.inlineHeight }}
            </td>
          </tr>
          <tr>
            <td>容器计算高度 / clientHeight</td>
            <td>{{ measure.computedHeight }} / {{ measure.clientHeight }}px</td>
          </tr>
          <tr>
            <td>自然高度 scrollHeight</td>
            <td>{{ measure.scrollHeight }}px</td>
          </tr>
          <tr>
            <td>每行字段数（grid 默认 3）</td>
            <td data-test="measure-fields-per-row">
              {{ measure.fieldsPerRow }}
            </td>
          </tr>
          <tr>
            <td>可见行数 / 总行数</td>
            <td data-test="measure-rows">
              {{ measure.visibleRows }} / {{ measure.totalRows }}
            </td>
          </tr>
          <tr>
            <td>可见字段数 / 总字段数</td>
            <td data-test="measure-fields">
              {{ measure.visibleFields }} / {{ measure.totalFields }}
            </td>
          </tr>
          <tr>
            <td>展开按钮文案</td>
            <td data-test="measure-toggle-text">{{ measure.toggleText }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>等待表单挂载…</p>
    </section>
  </main>
</template>

<style scoped>
.verification {
  max-width: 1120px;
  margin: 32px auto 64px;
  padding: 0 24px;
  font-family: inherit;
}

.lead {
  color: #555;
}

.card {
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
}

.card h2 {
  margin: 0 0 8px;
  font-size: 17px;
}

.steps {
  margin: 8px 0 12px;
  padding-left: 20px;
  color: #444;
  line-height: 1.8;
}

.steps li {
  margin-bottom: 4px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.actions button {
  padding: 5px 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
}

.actions button:hover {
  color: #1677ff;
  border-color: #1677ff;
}

.stage {
  transition: width 0.2s;
}

.keys {
  margin-top: 12px;
  color: #444;
  line-height: 2;
}

.ok {
  margin-left: 8px;
  color: #389e0d;
}

.bad {
  margin-left: 8px;
  color: #cf1322;
}

.probe {
  width: 100%;
  font-size: 13px;
  border-collapse: collapse;
}

.probe th,
.probe td {
  padding: 6px 10px;
  text-align: left;
  border: 1px solid #eee;
}

.probe th {
  font-weight: 600;
  background: #fafafa;
}

.expect {
  color: #555;
  font-size: 13px;
}

.hint {
  display: block;
  margin-top: 2px;
  color: #8c8c8c;
  font-size: 12px;
}

.panel {
  background: #fcfcfc;
}
</style>
