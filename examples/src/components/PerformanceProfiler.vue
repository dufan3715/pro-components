<script setup lang="ts">
import { ref, shallowRef, computed, nextTick } from 'vue';

// ---------------- 1. 引入本地 Workspace 最新构建版本 (新版扁平架构) ----------------
import {
  useForm as useAntdForm,
  ProForm as AntdProForm,
} from '@qin-ui/antd-vue-pro';
import {
  useForm as useAntdvNextForm,
  ProForm as AntdvNextProForm,
} from '@qin-ui/antdv-next-pro';
import {
  useForm as useElForm,
  ProForm as ElProForm,
} from '@qin-ui/element-plus-pro';
import {
  useForm as useVantForm,
  ProForm as VantProForm,
} from '@qin-ui/vant-pro';

// ---------------- 2. 引入 npm 官方 Registry 发布的真实版本 (旧版含无渲染组件) ----------------
import {
  useForm as useLegacyAntdForm,
  ProForm as LegacyAntdProForm,
} from 'legacy-antd-vue-pro';
import {
  useForm as useLegacyAntdvNextForm,
  ProForm as LegacyAntdvNextProForm,
} from 'legacy-antdv-next-pro';
import {
  useForm as useLegacyElForm,
  ProForm as LegacyElProForm,
} from 'legacy-element-plus-pro';
import {
  useForm as useLegacyVantForm,
  ProForm as LegacyVantProForm,
} from 'legacy-vant-pro';

type Framework = 'antd' | 'antdv-next' | 'element-plus' | 'vant';

interface CompareMetrics {
  framework: Framework;
  frameworkName: string;
  fieldCount: number;
  rounds: number;
  legacyPkgVersion: string;
  legacy: {
    mountTimeMs: number;
    updateTimeMs: number;
    instanceCount: number;
    scopedSlotCount: number;
  };
  current: {
    mountTimeMs: number;
    updateTimeMs: number;
    instanceCount: number;
    scopedSlotCount: number;
  };
  savedInstances: number;
  savedInstancesPercent: number;
  mountSpeedupPercent: number;
  updateSpeedupPercent: number;
  timestamp: string;
}

const frameworks: {
  key: Framework;
  name: string;
  npmPkg: string;
  npmVer: string;
}[] = [
  {
    key: 'antd',
    name: 'Ant Design Vue',
    npmPkg: '@qin-ui/antd-vue-pro',
    npmVer: '2.3.3',
  },
  {
    key: 'antdv-next',
    name: 'Antdv Next',
    npmPkg: '@qin-ui/antdv-next-pro',
    npmVer: '1.3.2',
  },
  {
    key: 'element-plus',
    name: 'Element Plus',
    npmPkg: '@qin-ui/element-plus-pro',
    npmVer: '1.2.3',
  },
  {
    key: 'vant',
    name: 'Vant (Mobile)',
    npmPkg: '@qin-ui/vant-pro',
    npmVer: '1.2.2',
  },
];

// 各 UI 框架按架构层数的实例估算表
const FRAMEWORK_LAYERS: Record<
  Framework,
  { legacyPerField: number; currentPerField: number; topLevel: number }
> = {
  antd: { legacyPerField: 8, currentPerField: 6, topLevel: 4 },
  'antdv-next': { legacyPerField: 8, currentPerField: 6, topLevel: 4 },
  'element-plus': { legacyPerField: 8, currentPerField: 6, topLevel: 4 },
  vant: { legacyPerField: 4, currentPerField: 2, topLevel: 3 },
};

const selectedFramework = ref<Framework>('antd');
const fieldCountOptions = [20, 50, 100, 200, 300];
const selectedFieldCount = ref<number>(100);

const ROUNDS = 5;
const isBenchmarking = ref(false);
const currentRound = ref(0);
const activePreviewTab = ref<'both' | 'legacy' | 'current'>('both');

const legacyFormInstance = shallowRef<any>(null);
const currentFormInstance = shallowRef<any>(null);

const latestCompare = ref<CompareMetrics | null>(null);
const historyList = ref<CompareMetrics[]>([]);

// 生成完全对等的测试字段 Schema
const generateFields = (count: number, fw: Framework) => {
  const fields = [];
  for (let i = 1; i <= count; i++) {
    if (fw === 'vant') {
      fields.push({
        label: `字段 ${i}`,
        path: `field_${i}`,
        component: i % 3 === 0 ? 'stepper' : 'field',
        placeholder: `请输入第 ${i} 项`,
      });
    } else {
      fields.push({
        label: `字段 ${i}`,
        path: `field_${i}`,
        component:
          i % 4 === 0 ? 'select' : i % 3 === 0 ? 'input-number' : 'input',
        placeholder: `请输入第 ${i} 项`,
        options:
          i % 4 === 0
            ? [
                { label: '选项 A', value: 'a' },
                { label: '选项 B', value: 'b' },
              ]
            : undefined,
        span: 8,
      });
    }
  }
  return fields;
};

// 测量基础设施：等待 Vue patch 冲刷 (nextTick) + 双 rAF（确保 DOM 提交与一帧稳定渲染）
const waitRender = () =>
  new Promise<void>(resolve => {
    nextTick(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  });

// 计算中位数辅助函数
const getMedian = (values: number[]): number => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return Number(sorted[mid].toFixed(2));
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
};

// 一键 A/B 真实版本交替压测（5 轮交替消除顺序偏置，取中位数）
const runCompareBenchmark = async () => {
  if (isBenchmarking.value) return;
  isBenchmarking.value = true;
  currentRound.value = 0;
  legacyFormInstance.value = null;
  currentFormInstance.value = null;
  await waitRender();

  const fw = selectedFramework.value;
  const count = selectedFieldCount.value;
  const fields = generateFields(count, fw);

  const batchData: Record<string, any> = {};
  for (let i = 1; i <= count; i++) {
    batchData[`field_${i}`] =
      fw === 'vant' && i % 3 === 0 ? i : `Val_${i}_${Date.now() % 1000}`;
  }

  const legacyMounts: number[] = [];
  const legacyUpdates: number[] = [];
  const currentMounts: number[] = [];
  const currentUpdates: number[] = [];

  let lastLegacyForm: any = null;
  let lastCurrentForm: any = null;

  // 测量单侧表单（挂载 -> 批量更新 -> 卸载冷却）
  const measureLegacy = async () => {
    let lForm: any;
    if (fw === 'antd') lForm = useLegacyAntdForm({}, fields as any);
    else if (fw === 'antdv-next')
      lForm = useLegacyAntdvNextForm({}, fields as any);
    else if (fw === 'element-plus') lForm = useLegacyElForm({}, fields as any);
    else lForm = useLegacyVantForm({}, fields as any);
    lastLegacyForm = lForm;

    const startMount = performance.now();
    legacyFormInstance.value = lForm;
    await waitRender();
    const mountTime = Number((performance.now() - startMount).toFixed(2));

    const startUpdate = performance.now();
    lForm.setFormData(batchData);
    await waitRender();
    const updateTime = Number((performance.now() - startUpdate).toFixed(2));

    legacyFormInstance.value = null;
    await waitRender();

    return { mountTime, updateTime };
  };

  const measureCurrent = async () => {
    let cForm: any;
    if (fw === 'antd') cForm = useAntdForm({}, fields as any);
    else if (fw === 'antdv-next') cForm = useAntdvNextForm({}, fields as any);
    else if (fw === 'element-plus') cForm = useElForm({}, fields as any);
    else cForm = useVantForm({}, fields as any);
    lastCurrentForm = cForm;

    const startMount = performance.now();
    currentFormInstance.value = cForm;
    await waitRender();
    const mountTime = Number((performance.now() - startMount).toFixed(2));

    const startUpdate = performance.now();
    cForm.setFormData(batchData);
    await waitRender();
    const updateTime = Number((performance.now() - startUpdate).toFixed(2));

    currentFormInstance.value = null;
    await waitRender();

    return { mountTime, updateTime };
  };

  // 5 轮交替测量循环
  for (let r = 0; r < ROUNDS; r++) {
    currentRound.value = r + 1;
    const legacyFirst = r % 2 === 0;

    if (legacyFirst) {
      const leg = await measureLegacy();
      legacyMounts.push(leg.mountTime);
      legacyUpdates.push(leg.updateTime);

      const cur = await measureCurrent();
      currentMounts.push(cur.mountTime);
      currentUpdates.push(cur.updateTime);
    } else {
      const cur = await measureCurrent();
      currentMounts.push(cur.mountTime);
      currentUpdates.push(cur.updateTime);

      const leg = await measureLegacy();
      legacyMounts.push(leg.mountTime);
      legacyUpdates.push(leg.updateTime);
    }
  }

  // 恢复实机展示视图
  if (
    activePreviewTab.value === 'both' ||
    activePreviewTab.value === 'legacy'
  ) {
    legacyFormInstance.value = lastLegacyForm;
  }
  if (
    activePreviewTab.value === 'both' ||
    activePreviewTab.value === 'current'
  ) {
    currentFormInstance.value = lastCurrentForm;
  }

  // 计算中位数与统计指标
  const medianLegacyMount = getMedian(legacyMounts);
  const medianLegacyUpdate = getMedian(legacyUpdates);
  const medianCurrentMount = getMedian(currentMounts);
  const medianCurrentUpdate = getMedian(currentUpdates);

  const layers = FRAMEWORK_LAYERS[fw];
  const legacyInstances = count * layers.legacyPerField + layers.topLevel;
  const currentInstances = count * layers.currentPerField + layers.topLevel;
  const savedInstances = legacyInstances - currentInstances;
  const savedInstancesPercent = Number(
    ((savedInstances / legacyInstances) * 100).toFixed(1)
  );

  const mountSpeedup =
    medianLegacyMount > 0
      ? Number(
          (
            ((medianLegacyMount - medianCurrentMount) / medianLegacyMount) *
            100
          ).toFixed(1)
        )
      : 0;

  const updateSpeedup =
    medianLegacyUpdate > 0
      ? Number(
          (
            ((medianLegacyUpdate - medianCurrentUpdate) / medianLegacyUpdate) *
            100
          ).toFixed(1)
        )
      : 0;

  const currentFwMeta = frameworks.find(f => f.key === fw);

  const result: CompareMetrics = {
    framework: fw,
    frameworkName: currentFwMeta?.name || fw,
    fieldCount: count,
    rounds: ROUNDS,
    legacyPkgVersion: `${currentFwMeta?.npmPkg}@${currentFwMeta?.npmVer}`,
    legacy: {
      mountTimeMs: medianLegacyMount,
      updateTimeMs: medianLegacyUpdate,
      instanceCount: legacyInstances,
      scopedSlotCount: count * 2,
    },
    current: {
      mountTimeMs: medianCurrentMount,
      updateTimeMs: medianCurrentUpdate,
      instanceCount: currentInstances,
      scopedSlotCount: 0,
    },
    savedInstances,
    savedInstancesPercent,
    mountSpeedupPercent: mountSpeedup,
    updateSpeedupPercent: updateSpeedup,
    timestamp: new Date().toLocaleTimeString(),
  };

  latestCompare.value = result;
  historyList.value.unshift(result);
  isBenchmarking.value = false;
};

// 挂载加速比文案
const mountRatioText = computed(() => {
  if (!latestCompare.value) return '';
  const diff =
    latestCompare.value.legacy.mountTimeMs -
    latestCompare.value.current.mountTimeMs;
  if (diff > 0) {
    return `⚡ 提速 ${latestCompare.value.mountSpeedupPercent}% (快 ${diff.toFixed(1)}ms)`;
  }
  return `基本持平`;
});

// 更新响应文案（如实计算，杜绝硬编码）
const updateRatioText = computed(() => {
  if (!latestCompare.value) return '';
  const diff = Math.abs(
    latestCompare.value.legacy.updateTimeMs -
      latestCompare.value.current.updateTimeMs
  );
  if (diff < 1.0) {
    return `持平（符合预期）`;
  }
  if (latestCompare.value.updateSpeedupPercent > 0) {
    return `快 ${latestCompare.value.updateSpeedupPercent}%`;
  }
  return `差异 ${latestCompare.value.updateSpeedupPercent}%`;
});
</script>

<template>
  <div class="profiler-container">
    <!-- 常驻提示条：构建产物陈旧提示 -->
    <div class="build-warning-banner">
      <span class="warning-icon">⚠️</span>
      <div class="warning-text">
        <strong>测试对象提示：</strong>新版测试对象为各包
        <code>packages/*/es</code>
        构建产物，运行压测前请确认已在项目根目录执行过
        <code>pnpm run build</code>。
      </div>
    </div>

    <!-- 顶部标题 -->
    <div class="header-card">
      <div class="title-wrap">
        <h2 class="main-title">
          ⚡ @qin-ui ProForm 真实 npm 线上版 vs 本地重构版 性能压测中心
        </h2>
        <p class="sub-title">
          严谨真机对标：旧版直接导入
          <strong>npm 官方 Registry 线上发布包 (含冗余无渲染组件层)</strong
          >，新版直接导入 <strong>本地 Workspace 编译包 (6 层扁平化)</strong>。
        </p>
      </div>

      <button
        class="benchmark-btn"
        :disabled="isBenchmarking"
        @click="runCompareBenchmark"
      >
        <span v-if="isBenchmarking" class="btn-spinner"></span>
        <span v-if="isBenchmarking"
          >🔄 压测中 (第 {{ currentRound }}/{{ ROUNDS }} 轮)...</span
        >
        <span v-else>🔥 开始真·A/B 对比压测 (5 轮交替中位数)</span>
      </button>
    </div>

    <!-- 交互控制面板 -->
    <div class="control-panel">
      <!-- 框架选择 -->
      <div class="control-item">
        <span class="control-label">UI 框架 (Framework):</span>
        <div class="btn-group">
          <button
            v-for="fw in frameworks"
            :key="fw.key"
            class="switch-btn"
            :class="{ active: selectedFramework === fw.key }"
            :disabled="isBenchmarking"
            @click="selectedFramework = fw.key"
          >
            {{ fw.name }}
          </button>
        </div>
      </div>

      <!-- 字段规模选择 -->
      <div class="control-item">
        <span class="control-label">字段规模 (Field Scale):</span>
        <div class="btn-group">
          <button
            v-for="opt in fieldCountOptions"
            :key="opt"
            class="switch-btn"
            :class="{ active: selectedFieldCount === opt }"
            :disabled="isBenchmarking"
            @click="selectedFieldCount = opt"
          >
            {{ opt }} 字段
          </button>
        </div>
      </div>

      <!-- 渲染视口模式 -->
      <div class="control-item">
        <span class="control-label">实机视口:</span>
        <div class="btn-group">
          <button
            class="switch-btn"
            :class="{ active: activePreviewTab === 'both' }"
            @click="activePreviewTab = 'both'"
          >
            左右并排
          </button>
          <button
            class="switch-btn"
            :class="{ active: activePreviewTab === 'current' }"
            @click="activePreviewTab = 'current'"
          >
            仅看本地新版
          </button>
          <button
            class="switch-btn"
            :class="{ active: activePreviewTab === 'legacy' }"
            @click="activePreviewTab = 'legacy'"
          >
            仅看npm旧版
          </button>
        </div>
      </div>
    </div>

    <!-- 核心指标对比看板 (Comparison KPI Dashboard) -->
    <div v-if="latestCompare" class="kpi-dashboard">
      <!-- KPI 1: 首次挂载耗时 -->
      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-name"
            >首次挂载耗时 (Initial Mount Time - 中位数)</span
          >
          <span class="kpi-badge speedup">{{ mountRatioText }}</span>
        </div>
        <div class="kpi-body">
          <div class="metric-col legacy">
            <span class="metric-tag">🔴 npm 线上版</span>
            <span class="metric-val"
              >{{ latestCompare.legacy.mountTimeMs }} <small>ms</small></span
            >
          </div>
          <div class="metric-vs">VS</div>
          <div class="metric-col current">
            <span class="metric-tag">🟢 本地重构版</span>
            <span class="metric-val highlight"
              >{{ latestCompare.current.mountTimeMs }} <small>ms</small></span
            >
          </div>
        </div>
        <div class="kpi-bar-wrap">
          <div class="kpi-bar-fill legacy-fill" style="width: 100%"></div>
          <div
            class="kpi-bar-fill current-fill"
            :style="{
              width: `${Math.min(100, (latestCompare.current.mountTimeMs / (latestCompare.legacy.mountTimeMs || 1)) * 100)}%`,
            }"
          ></div>
        </div>
        <div class="kpi-footer-tip">
          基于 5 轮交替测量中位数（消除冷热顺序偏置与单轮 GC 抖动）
        </div>
      </div>

      <!-- KPI 2: 批量更新响应耗时 -->
      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-name"
            >批量更新响应 (Batch Update Time - 中位数)</span
          >
          <span class="kpi-badge neutral">{{ updateRatioText }}</span>
        </div>
        <div class="kpi-body">
          <div class="metric-col legacy">
            <span class="metric-tag">🔴 npm 线上版</span>
            <span class="metric-val"
              >{{ latestCompare.legacy.updateTimeMs }} <small>ms</small></span
            >
          </div>
          <div class="metric-vs">VS</div>
          <div class="metric-col current">
            <span class="metric-tag">🟢 本地重构版</span>
            <span class="metric-val highlight"
              >{{ latestCompare.current.updateTimeMs }} <small>ms</small></span
            >
          </div>
        </div>
        <div class="kpi-bar-wrap">
          <div class="kpi-bar-fill legacy-fill" style="width: 100%"></div>
          <div
            class="kpi-bar-fill current-fill"
            :style="{
              width: `${Math.min(100, (latestCompare.current.updateTimeMs / (latestCompare.legacy.updateTimeMs || 1)) * 100)}%`,
            }"
          ></div>
        </div>
        <div class="kpi-footer-tip">
          批量更新路径在新旧架构中一致（BaseField
          未改动），该指标用于验证无回归，不预期产生提升
        </div>
      </div>

      <!-- KPI 3: Vue 组件实例总数 -->
      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-name">Vue 组件内部实例数 (估算值)</span>
          <span class="kpi-badge saved"
            >🔻 节约 {{ latestCompare.savedInstances }} 个 (-{{
              latestCompare.savedInstancesPercent
            }}%)</span
          >
        </div>
        <div class="kpi-body">
          <div class="metric-col legacy">
            <span class="metric-tag">🔴 npm 线上版</span>
            <span class="metric-val danger"
              >{{ latestCompare.legacy.instanceCount }} <small>个</small></span
            >
          </div>
          <div class="metric-vs">VS</div>
          <div class="metric-col current">
            <span class="metric-tag">🟢 本地重构版</span>
            <span class="metric-val success"
              >{{ latestCompare.current.instanceCount }} <small>个</small></span
            >
          </div>
        </div>
        <div class="kpi-footer-tip">
          估算值（按架构层数计算）：旧版每字段额外产生
          <code>PathProvider</code> 与 <code>GroupedFieldAttrs</code> 2
          个组件实例
        </div>
      </div>

      <!-- KPI 4: Scoped Slot 闭包消除 -->
      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-name">作用域插槽闭包 (架构对比)</span>
          <span class="kpi-badge saved">100% 消除</span>
        </div>
        <div class="kpi-body">
          <div class="metric-col legacy">
            <span class="metric-tag">🔴 npm 线上版</span>
            <span class="metric-val danger"
              >{{ latestCompare.legacy.scopedSlotCount }}
              <small>层闭包</small></span
            >
          </div>
          <div class="metric-vs">VS</div>
          <div class="metric-col current">
            <span class="metric-tag">🟢 本地重构版</span>
            <span class="metric-val success">0 <small>纯计算 Hook</small></span>
          </div>
        </div>
        <div class="kpi-footer-tip">
          架构对比：本地版改用
          <code>useGroupFieldAttrs</code>
          纯函数，彻底移除了作用域插槽闭包与参数解构开销
        </div>
      </div>
    </div>

    <!-- 实机渲染并排视窗 (Live Forms Side-by-Side) -->
    <div class="live-viewport">
      <!-- 左栏：真实 npm 线上发布版实机渲染 -->
      <div
        v-if="activePreviewTab === 'both' || activePreviewTab === 'legacy'"
        class="form-host-card legacy-host"
      >
        <div class="host-header">
          <span class="host-badge legacy"
            >🔴 真实 npm 线上包 ({{
              frameworks.find(f => f.key === selectedFramework)?.npmPkg
            }}@{{
              frameworks.find(f => f.key === selectedFramework)?.npmVer
            }})</span
          >
          <span class="host-sub">含无渲染组件层</span>
        </div>
        <div class="host-content">
          <template v-if="legacyFormInstance">
            <LegacyAntdProForm
              v-if="selectedFramework === 'antd'"
              :form="legacyFormInstance"
              :grid="true"
            />
            <LegacyAntdvNextProForm
              v-else-if="selectedFramework === 'antdv-next'"
              :form="legacyFormInstance"
              :grid="true"
            />
            <LegacyElProForm
              v-else-if="selectedFramework === 'element-plus'"
              :form="legacyFormInstance"
              :grid="true"
            />
            <LegacyVantProForm
              v-else-if="selectedFramework === 'vant'"
              :form="legacyFormInstance"
            />
          </template>
          <div v-else class="empty-placeholder">
            点击上方「开始真·A/B 对比压测」启动实机渲染
          </div>
        </div>
      </div>

      <!-- 右栏：本地构建重构版实机渲染 -->
      <div
        v-if="activePreviewTab === 'both' || activePreviewTab === 'current'"
        class="form-host-card current-host"
      >
        <div class="host-header">
          <span class="host-badge current"
            >🟢 本地 Workspace 最新构建包 (@qin-ui/{{
              selectedFramework
            }}-pro)</span
          >
          <span class="host-sub">重构后扁平化架构 (纯计算 Hook)</span>
        </div>
        <div class="host-content">
          <template v-if="currentFormInstance">
            <AntdProForm
              v-if="selectedFramework === 'antd'"
              :form="currentFormInstance"
              :grid="true"
            />
            <AntdvNextProForm
              v-else-if="selectedFramework === 'antdv-next'"
              :form="currentFormInstance"
              :grid="true"
            />
            <ElProForm
              v-else-if="selectedFramework === 'element-plus'"
              :form="currentFormInstance"
              :grid="true"
            />
            <VantProForm
              v-else-if="selectedFramework === 'vant'"
              :form="currentFormInstance"
            />
          </template>
          <div v-else class="empty-placeholder">
            点击上方「开始真·A/B 对比压测」启动实机渲染
          </div>
        </div>
      </div>
    </div>

    <!-- 历史对比记录表格 -->
    <div v-if="historyList.length > 0" class="history-card">
      <h3 class="history-head-title">
        📊 真·A/B 对比压测历史记录日志 (5 轮中位数汇总)
      </h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>测试时间</th>
              <th>UI 框架</th>
              <th>线上 npm 版本包</th>
              <th>字段规模</th>
              <th>采样轮数</th>
              <th>旧版挂载耗时</th>
              <th>新版挂载耗时</th>
              <th>挂载提速比</th>
              <th>旧版实例数</th>
              <th>新版实例数</th>
              <th>节约实例</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in historyList" :key="idx">
              <td>{{ item.timestamp }}</td>
              <td>
                <span class="fw-badge">{{ item.frameworkName }}</span>
              </td>
              <td>
                <code>{{ item.legacyPkgVersion }}</code>
              </td>
              <td>{{ item.fieldCount }} 字段</td>
              <td>{{ item.rounds }} 轮中位数</td>
              <td class="mono-num">{{ item.legacy.mountTimeMs }} ms</td>
              <td class="mono-num highlight">
                {{ item.current.mountTimeMs }} ms
              </td>
              <td class="mono-num speedup">+{{ item.mountSpeedupPercent }}%</td>
              <td class="mono-num">{{ item.legacy.instanceCount }}</td>
              <td class="mono-num">{{ item.current.instanceCount }}</td>
              <td class="mono-num success">
                -{{ item.savedInstances }} (-{{ item.savedInstancesPercent }}%)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profiler-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.build-warning-banner {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 16px;
  background: #2d2006;
  border: 1px solid #784d08;
  border-radius: 8px;
}

.warning-icon {
  font-size: 16px;
}

.warning-text {
  color: #fde047;
  font-size: 13px;
  line-height: 1.5;
}

.warning-text code {
  padding: 2px 6px;
  color: #fef08a;
  background: #422006;
  border-radius: 4px;
}

.header-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding: 24px;
  background: #181d28;
  border: 1px solid #283044;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

.main-title {
  margin: 0;
  color: #38bdf8;
  font-weight: 700;
  font-size: 20px;
}

.sub-title {
  margin: 8px 0 0;
  color: #94a3b8;
  font-size: 13px;
  line-height: 1.6;
}

.sub-title strong {
  color: #f1f5f9;
}

.benchmark-btn {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 24px;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  background: linear-gradient(135deg, #0284c7, #2563eb);
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
}

.benchmark-btn:disabled {
  background: #334155;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.7;
}

.benchmark-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0369a1, #1d4ed8);
  transform: translateY(-2px);
}

.control-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  margin-bottom: 20px;
  padding: 14px 20px;
  background: #131722;
  border: 1px solid #232a3b;
  border-radius: 10px;
}

.control-item {
  display: flex;
  gap: 10px;
  align-items: center;
}

.control-label {
  color: #94a3b8;
  font-weight: 500;
  font-size: 13px;
}

.btn-group {
  display: flex;
  gap: 6px;
}

.switch-btn {
  padding: 5px 14px;
  color: #cbd5e1;
  font-size: 12px;
  background: #1e2433;
  border: 1px solid #333d54;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.switch-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.switch-btn.active {
  color: #fff;
  font-weight: 600;
  background: #0284c7;
  border-color: #38bdf8;
}

.kpi-dashboard {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  padding: 18px;
  background: #141824;
  border: 1px solid #242c3e;
  border-radius: 10px;
}

.kpi-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.kpi-name {
  color: #e2e8f0;
  font-weight: 600;
  font-size: 13px;
}

.kpi-badge {
  padding: 2px 8px;
  font-weight: 600;
  font-size: 11px;
  border-radius: 10px;
}

.kpi-badge.speedup {
  color: #34d399;
  background: #10b98120;
  border: 1px solid #10b98140;
}

.kpi-badge.neutral {
  color: #94a3b8;
  background: #64748b20;
  border: 1px solid #64748b40;
}

.kpi-badge.saved {
  color: #60a5fa;
  background: #3b82f620;
  border: 1px solid #3b82f640;
}

.kpi-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #0b0f19;
  border: 1px solid #1c2230;
  border-radius: 6px;
}

.metric-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-tag {
  color: #64748b;
  font-size: 11px;
}

.metric-val {
  color: #94a3b8;
  font-weight: 700;
  font-size: 20px;
  font-family: Menlo, Monaco, Consolas, monospace;
}

.metric-val.highlight {
  color: #38bdf8;
}

.metric-val.danger {
  color: #f87171;
}

.metric-val.success {
  color: #34d399;
}

.metric-val small {
  color: #64748b;
  font-weight: normal;
  font-size: 12px;
}

.metric-vs {
  color: #475569;
  font-weight: 700;
  font-size: 11px;
}

.kpi-bar-wrap {
  position: relative;
  height: 6px;
  margin-top: 12px;
  overflow: hidden;
  background: #1e293b;
  border-radius: 3px;
}

.kpi-bar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.legacy-fill {
  background: #ef444460;
}

.current-fill {
  background: #38bdf8;
}

.kpi-footer-tip {
  margin-top: 8px;
  color: #64748b;
  font-size: 11px;
  line-height: 1.5;
}

.kpi-footer-tip code {
  color: #94a3b8;
}

.live-viewport {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.form-host-card {
  overflow: hidden;
  color: #1e293b;
  background: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
}

.host-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.host-badge {
  font-weight: 600;
  font-size: 12px;
}

.host-badge.legacy {
  color: #dc2626;
}

.host-badge.current {
  color: #059669;
}

.host-sub {
  color: #64748b;
  font-size: 11px;
}

.host-content {
  max-height: 320px;
  padding: 16px;
  overflow-y: auto;
}

.empty-placeholder {
  padding: 50px 0;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

.history-card {
  padding: 20px;
  background: #141824;
  border: 1px solid #242c3e;
  border-radius: 10px;
}

.history-head-title {
  margin: 0 0 14px;
  color: #94a3b8;
  font-size: 15px;
}

.table-responsive {
  overflow: hidden;
  border: 1px solid #232a3b;
  border-radius: 6px;
}

.data-table {
  width: 100%;
  font-size: 12px;
  text-align: left;
  border-collapse: collapse;
}

.data-table th {
  padding: 10px 14px;
  color: #94a3b8;
  background: #0f131d;
  border-bottom: 1px solid #232a3b;
}

.data-table td {
  padding: 10px 14px;
  color: #cbd5e1;
  border-bottom: 1px solid #1c2230;
}

.fw-badge {
  padding: 2px 6px;
  color: #38bdf8;
  font-size: 11px;
  background: #1e293b;
  border-radius: 4px;
}

.mono-num {
  font-family: Menlo, Monaco, Consolas, monospace;
}

.mono-num.highlight {
  color: #38bdf8;
  font-weight: 600;
}

.mono-num.speedup {
  color: #34d399;
  font-weight: 700;
}

.mono-num.success {
  color: #34d399;
}

.btn-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
