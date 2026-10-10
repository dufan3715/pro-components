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

// 1. 旧版：legacy-vant-pro (v1.3.4 缺陷现场)
import {
  ProForm as LegacyProForm,
  useForm as useLegacyForm,
} from 'legacy-vant-pro';

// 2. 当前工作区：已修复版 vant-pro
import {
  ProForm as FixedProForm,
  useForm as useFixedForm,
} from '../../../packages/vant-pro/src';

// ----------------------------------------------------
// 场景 1：CR-052 字段配置 (componentClass / componentStyle)
// ----------------------------------------------------
const cr052Fields = [
  {
    path: 'count',
    label: '商品数量 (Stepper)',
    component: 'stepper',
    componentClass: 'repro-stepper-inner-cls',
    componentStyle: {
      border: '2px solid #ff4d4f',
      padding: '4px',
      backgroundColor: '#fff1f0',
    },
  } as any,
];

const legacyCr052Form = useLegacyForm({ count: 2 }, cr052Fields);
const fixedCr052Form = useFixedForm({ count: 2 }, cr052Fields);

// ----------------------------------------------------
// 场景 2：CR-053 字段配置 (fieldClass / fieldStyle 在 field 分支)
// ----------------------------------------------------
const cr053Fields = [
  {
    path: 'username',
    label: '姓名 (field 输入框)',
    component: 'field',
    placeholder: '默认文本输入框分支',
    fieldClass: 'repro-gold-field-cell',
    fieldStyle: {
      background: '#fffbe6',
      borderLeft: '4px solid #faad14',
    },
  } as any,
  {
    path: 'stepperVal',
    label: '步数 (stepper 控件)',
    component: 'stepper',
    fieldClass: 'repro-gold-field-cell',
    fieldStyle: {
      background: '#fffbe6',
      borderLeft: '4px solid #faad14',
    },
  } as any,
];

const legacyCr053Form = useLegacyForm(
  { username: '张三', stepperVal: 5 },
  cr053Fields
);
const fixedCr053Form = useFixedForm(
  { username: '张三', stepperVal: 5 },
  cr053Fields
);

// DOM 容器引用
const legacyCr052ContainerRef = ref<HTMLElement | null>(null);
const fixedCr052ContainerRef = ref<HTMLElement | null>(null);
const legacyCr053ContainerRef = ref<HTMLElement | null>(null);
const fixedCr053ContainerRef = ref<HTMLElement | null>(null);

// 探针状态
const probeState = ref({
  // CR-052
  legacyCr052: {
    classApplied: false,
    styleApplied: false,
    leakedAttrs: [] as string[],
  },
  fixedCr052: {
    classApplied: false,
    styleApplied: false,
    leakedAttrs: [] as string[],
  },

  // CR-053
  legacyCr053Field: { classApplied: false, styleApplied: false },
  legacyCr053Stepper: { classApplied: false, styleApplied: false },
  fixedCr053Field: { classApplied: false, styleApplied: false },
  fixedCr053Stepper: { classApplied: false, styleApplied: false },
});

const inspectDOM = async () => {
  await nextTick();
  await nextTick();

  // 1. 检查 CR-052 旧版
  if (legacyCr052ContainerRef.value) {
    const stepper = legacyCr052ContainerRef.value.querySelector('.van-stepper');
    if (stepper) {
      probeState.value.legacyCr052.classApplied = stepper.classList.contains(
        'repro-stepper-inner-cls'
      );
      const style = stepper.getAttribute('style') || '';
      probeState.value.legacyCr052.styleApplied =
        style.includes('border') || style.includes('background');
      const leaked: string[] = [];
      if (stepper.hasAttribute('componentclass')) leaked.push('componentclass');
      if (stepper.hasAttribute('componentstyle')) leaked.push('componentstyle');
      probeState.value.legacyCr052.leakedAttrs = leaked;
    }
  }

  // 2. 检查 CR-052 修复版
  if (fixedCr052ContainerRef.value) {
    const stepper = fixedCr052ContainerRef.value.querySelector('.van-stepper');
    if (stepper) {
      probeState.value.fixedCr052.classApplied = stepper.classList.contains(
        'repro-stepper-inner-cls'
      );
      const style = stepper.getAttribute('style') || '';
      probeState.value.fixedCr052.styleApplied =
        style.includes('border') || style.includes('background');
      const leaked: string[] = [];
      if (stepper.hasAttribute('componentclass')) leaked.push('componentclass');
      if (stepper.hasAttribute('componentstyle')) leaked.push('componentstyle');
      probeState.value.fixedCr052.leakedAttrs = leaked;
    }
  }

  // 3. 检查 CR-053 旧版
  if (legacyCr053ContainerRef.value) {
    const cells = legacyCr053ContainerRef.value.querySelectorAll('.van-cell');
    if (cells.length >= 2) {
      const fieldCell = cells[0];
      const stepperCell = cells[1];
      probeState.value.legacyCr053Field.classApplied =
        fieldCell.classList.contains('repro-gold-field-cell');
      probeState.value.legacyCr053Field.styleApplied = (
        fieldCell.getAttribute('style') || ''
      ).includes('background');
      probeState.value.legacyCr053Stepper.classApplied =
        stepperCell.classList.contains('repro-gold-field-cell');
      probeState.value.legacyCr053Stepper.styleApplied = (
        stepperCell.getAttribute('style') || ''
      ).includes('background');
    }
  }

  // 4. 检查 CR-053 修复版
  if (fixedCr053ContainerRef.value) {
    const cells = fixedCr053ContainerRef.value.querySelectorAll('.van-cell');
    if (cells.length >= 2) {
      const fieldCell = cells[0];
      const stepperCell = cells[1];
      probeState.value.fixedCr053Field.classApplied =
        fieldCell.classList.contains('repro-gold-field-cell');
      probeState.value.fixedCr053Field.styleApplied = (
        fieldCell.getAttribute('style') || ''
      ).includes('background');
      probeState.value.fixedCr053Stepper.classApplied =
        stepperCell.classList.contains('repro-gold-field-cell');
      probeState.value.fixedCr053Stepper.styleApplied = (
        stepperCell.getAttribute('style') || ''
      ).includes('background');
    }
  }
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
        CR-052 / CR-053 修复前后对比：Vant Pro 表单类名与样式属性失效与恢复
      </h1>
      <p class="header-desc">
        对比旧版
        <code>legacy-vant-pro@1.3.4</code>（缺陷现场）与当前工作区已修复的
        <code>@qin-ui/vant-pro</code>。
      </p>
    </header>

    <!-- CR-052 对比卡片 -->
    <ACard
      class="mb-24 feature-card"
      title="场景一（CR-052 对比）：componentClass / componentStyle 生效与防泄漏"
    >
      <AAlert
        type="info"
        show-icon
        class="mb-16"
        message="CR-052 机制与修复说明"
      >
        <template #description>
          <div>
            <strong>旧版缺陷：</strong><code>componentClass</code> /
            <code>componentStyle</code> 未在
            <code>mergeProps</code>
            中合并，且解构未剔除，导致类名样式未生效，反而作为普通属性泄漏到了
            DOM 上（<code>componentclass="..."</code>）。<br />
            <strong>工作区修复：</strong>在 <code>mergedProps</code> 中合并
            <code
              >{ class: attrs.componentClass, style: attrs.componentStyle
              }</code
            >，并在解构中剔除。内层控件正常应用类名样式，DOM 绝无非法属性泄漏！
          </div>
        </template>
      </AAlert>

      <ARow :gutter="24">
        <!-- 左侧：旧版 -->
        <ACol :span="12">
          <div class="compare-box defect-border">
            <div class="box-header text-danger">
              🔴 Legacy 旧版 (v1.3.4 缺陷现场)
            </div>
            <div ref="legacyCr052ContainerRef" class="mobile-preview-box">
              <LegacyProForm :form="legacyCr052Form" />
            </div>
            <div class="probe-result-box mt-12">
              <div>
                类名挂载：<ATag color="red">{{
                  probeState.legacyCr052.classApplied ? '✅ 挂载' : '❌ 未生效'
                }}</ATag>
              </div>
              <div>
                样式生效：<ATag color="red">{{
                  probeState.legacyCr052.styleApplied ? '✅ 生效' : '❌ 未生效'
                }}</ATag>
              </div>
              <div>
                属性泄漏：
                <ATag
                  v-if="probeState.legacyCr052.leakedAttrs.length"
                  color="error"
                >
                  ⚠️ 泄漏：{{ probeState.legacyCr052.leakedAttrs.join(', ') }}
                </ATag>
                <ATag v-else color="green">无泄漏</ATag>
              </div>
            </div>
          </div>
        </ACol>

        <!-- 右侧：工作区已修复版 -->
        <ACol :span="12">
          <div class="compare-box fixed-border">
            <div class="box-header text-success">
              🟢 当前工作区已修复版 (@qin-ui/vant-pro)
            </div>
            <div ref="fixedCr052ContainerRef" class="mobile-preview-box">
              <FixedProForm :form="fixedCr052Form" />
            </div>
            <div class="probe-result-box mt-12">
              <div>
                类名挂载：<ATag color="green">{{
                  probeState.fixedCr052.classApplied
                    ? '✅ 挂载成功'
                    : '❌ 未生效'
                }}</ATag>
              </div>
              <div>
                样式生效：<ATag color="green">{{
                  probeState.fixedCr052.styleApplied
                    ? '✅ 样式生效（红框红底）'
                    : '❌ 未生效'
                }}</ATag>
              </div>
              <div>
                属性泄漏：
                <ATag
                  v-if="probeState.fixedCr052.leakedAttrs.length"
                  color="error"
                  >⚠️ 发现泄漏</ATag
                >
                <ATag v-else color="green">✅ 零泄漏，属性纯净</ATag>
              </div>
            </div>
          </div>
        </ACol>
      </ARow>
    </ACard>

    <!-- CR-053 对比卡片 -->
    <ACard
      class="mb-24 feature-card"
      title="场景二（CR-053 对比）：fieldClass / fieldStyle 在 field 分支正常生效"
    >
      <AAlert
        type="info"
        show-icon
        class="mb-16"
        message="CR-053 机制与修复说明"
      >
        <template #description>
          <div>
            <strong>旧版缺陷：</strong>模板中
            <code>props.component === 'field'</code>（文本输入框）只写了
            <code>v-bind="groupedAttrs.attrs"</code>，漏掉了
            <code>fieldAttrs</code>，导致最常用的普通输入框丢失了
            <code>fieldClass</code> / <code>fieldStyle</code>；而
            <code>stepper</code> 分支却正常生效，分支间行为严重不一致。<br />
            <strong>工作区修复：</strong>在
            <code>component === 'field'</code> 渲染节点显式绑定
            <code>:class="groupedAttrs.fieldAttrs.class"</code> 与
            <code>:style="groupedAttrs.fieldAttrs.style"</code
            >，使普通输入框与步进器同样准确应用外层单元格金黄色背景与左侧边框！
          </div>
        </template>
      </AAlert>

      <ARow :gutter="24">
        <!-- 左侧：旧版 -->
        <ACol :span="12">
          <div class="compare-box defect-border">
            <div class="box-header text-danger">
              🔴 Legacy 旧版 (v1.3.4 field 分支丢失背景)
            </div>
            <div ref="legacyCr053ContainerRef" class="mobile-preview-box">
              <LegacyProForm :form="legacyCr053Form" />
            </div>
            <div class="probe-result-box mt-12">
              <div class="probe-row text-danger">
                <span>输入框 (field)：</span>
                <ATag color="red">{{
                  probeState.legacyCr053Field.styleApplied
                    ? '✅ 金黄底色'
                    : '❌ 样式丢失（白底）'
                }}</ATag>
              </div>
              <div class="probe-row text-success">
                <span>步进器 (stepper)：</span>
                <ATag color="green">{{
                  probeState.legacyCr053Stepper.styleApplied
                    ? '✅ 金黄底色正常'
                    : '❌ 丢失'
                }}</ATag>
              </div>
            </div>
          </div>
        </ACol>

        <!-- 右侧：工作区已修复版 -->
        <ACol :span="12">
          <div class="compare-box fixed-border">
            <div class="box-header text-success">
              🟢 当前工作区已修复版 (两分支行为严格对齐)
            </div>
            <div ref="fixedCr053ContainerRef" class="mobile-preview-box">
              <FixedProForm :form="fixedCr053Form" />
            </div>
            <div class="probe-result-box mt-12">
              <div class="probe-row text-success">
                <span>输入框 (field)：</span>
                <ATag color="green">{{
                  probeState.fixedCr053Field.styleApplied
                    ? '✅ 金黄底色正常生效'
                    : '❌ 丢失'
                }}</ATag>
              </div>
              <div class="probe-row text-success">
                <span>步进器 (stepper)：</span>
                <ATag color="green">{{
                  probeState.fixedCr053Stepper.styleApplied
                    ? '✅ 金黄底色正常生效'
                    : '❌ 丢失'
                }}</ATag>
              </div>
            </div>
          </div>
        </ACol>
      </ARow>
    </ACard>

    <!-- 源码实录卡片 -->
    <ACard title="CR-052 / CR-053 源码修复落地实录" class="code-card">
      <ARow :gutter="24">
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-danger">❌ 修复前缺陷模式</div>
            <pre><code>// 1. CR-052: mergedProps 未合并 componentClass/Style，且未剔除解构
const mergedProps = mergeProps(initProps, attrs, ...);
const { ..., ...bindAttrs } = mergedProps; // 残留到 bindAttrs 造成 DOM 污染

// 2. CR-053: field 分支漏绑 fieldAttrs
&lt;component
  v-if="props.component === 'field'"
  v-bind="groupedAttrs.attrs"
/&gt;</code></pre>
          </div>
        </ACol>
        <ACol :span="12">
          <div class="code-block">
            <div class="code-header text-success">✅ 修复后落地代码</div>
            <pre><code>// 1. CR-052: 合并 componentClass/Style 并在解构中剔除
const mergedProps = mergeProps(
  initProps,
  attrs,
  { disabled: effectiveDisabled },
  { class: attrs.componentClass, style: attrs.componentStyle },
  { modelProp: modelPropName }
);
const { componentClass, componentStyle, ...bindAttrs } = mergedProps;

// 2. CR-053: field 分支显式绑定 fieldAttrs 样式
&lt;component
  v-if="props.component === 'field'"
  v-bind="groupedAttrs.attrs"
  :class="groupedAttrs.fieldAttrs.class"
  :style="groupedAttrs.fieldAttrs.style"
/&gt;</code></pre>
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

.mb-16 {
  margin-bottom: 16px;
}

.mt-12 {
  margin-top: 12px;
}

.feature-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.compare-box {
  padding: 16px;
  background: #ffffff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.defect-border {
  border-top: 3px solid #ff4d4f;
}

.fixed-border {
  border-top: 3px solid #52c41a;
}

.box-header {
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.text-danger {
  color: #cf1322 !important;
}

.text-success {
  color: #389e0d !important;
}

.mobile-preview-box {
  min-height: 160px;
  padding: 12px;
  background: #f7f8fa;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
}

.probe-result-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  font-size: 13px;
  background: #fafafa;
  border-radius: 6px;
}

.probe-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
