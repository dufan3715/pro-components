/**
 * 注释规范契约回归 —— 锁定适配层注释与插槽渲染实现的口径
 *
 * @description
 * 断言两类事实：CR-090 余项的适配层注释已改为行为陈述，实现手段与动机表述不再回流；
 * SlotComponent 与同构包 element-plus-pro 的实现与注释逐字一致（CR-086 口径）。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (path: string) => readFileSync(resolve(__dirname, path), 'utf-8');

const sources = {
  slotComponent: read(
    '../src/components/form/components/SlotComponent/index.vue'
  ),
  baseFormItem: read(
    '../src/components/form/components/BaseFormItem/index.vue'
  ),
  baseField: read('../src/components/form/components/BaseField/index.vue'),
  proForm: read('../src/components/form/components/ProForm/index.vue'),
};

describe('注释规范契约 · vant-pro', () => {
  // ----------------------------------------------------
  // DOC-01 [判别]: 实现手段 / 动机表述缺席，行为陈述在场
  // ----------------------------------------------------
  it('DOC-01 [判别]: 实现手段与动机表述不出现在适配层注释中，行为陈述在场', () => {
    const banned = [
      '不可枚举：不进入 Object.keys / spread，不随字段配置透传',
      'shallowRef 形态，computed 内经 .value 读取建立依赖',
      'slots 以 shallowRef 注入，组件每次更新后触发通知',
    ];
    for (const [name, source] of Object.entries(sources)) {
      for (const phrase of banned) {
        expect(source, `${name} 命中禁用表述：${phrase}`).not.toContain(phrase);
      }
    }

    expect(sources.baseFormItem).toContain(
      '访问器仅用于字段对象读取，不参与属性遍历与字段配置透传'
    );
    expect(sources.baseField).toContain(
      '从 ProForm 插槽注入的 slots 集合（优先级最高）'
    );
    expect(sources.proForm).toContain(
      '向深层 BaseField 提供 ProForm 的具名插槽'
    );
  });

  // ----------------------------------------------------
  // DOC-02 [判别]: SlotComponent 与同构包实现及注释逐字一致
  // ----------------------------------------------------
  it('DOC-02 [判别]: SlotComponent 与 element-plus-pro 同构文件逐字一致', () => {
    const element = read(
      '../../element-plus-pro/src/components/form/components/SlotComponent/index.vue'
    );
    expect(sources.slotComponent).toBe(element);
    expect(sources.slotComponent).not.toContain('isVNode');
    expect(sources.slotComponent).toContain(
      '可组件化渲染判定：VNode / 函数（含函数式组件）/ 组件定义对象'
    );
    expect(sources.slotComponent).toContain('const isRenderable');
  });
});
