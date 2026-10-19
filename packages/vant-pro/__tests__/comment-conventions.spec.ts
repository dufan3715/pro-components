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

const readme = read('../README.md');
const aiContext = read('../AI-CONTEXT.md');
const providerTypes = read(
  '../src/components/component-provider/types/index.ts'
);
const providerConstants = read(
  '../src/components/component-provider/constants/index.ts'
);

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

  // ----------------------------------------------------
  // DOC-03 [判别]: README 的 useFormPopup 语义与实现口径一致
  // ----------------------------------------------------
  it('DOC-03 [判别]: README 的 useFormPopup 表格与示例不再保留旧语义', () => {
    const readme = read('../README.md');
    // 旧语义缺席：原始数据初值 / 先重置默认再合并 / 更新当前属性
    expect(readme).not.toContain('初始值（原始数据）');
    expect(readme).not.toContain('自动重置属性为默认值后合并');
    expect(readme).not.toContain('合并更新当前弹层属性');
    // 当前语义在场：控件侧取值 / 单次覆盖 / 基础属性持久生效
    expect(readme).toContain('打开指定路径字段的弹层');
    expect(readme).toContain('`customProps` 仅对本次打开生效');
    expect(readme).toContain('更新 Popup 基础属性，此后每次打开均沿用');
  });

  // ----------------------------------------------------
  // DOC-04 [判别]: Provider 注入面边界（form 不可注入）在类型与文档同句
  // ----------------------------------------------------
  it('DOC-04 [判别]: Provider 注入面边界在类型面与文档面同步', () => {
    // 类型面在 RequiredComponentVars 内直接剔除不可注入键
    expect(providerTypes).toContain("Omit<ProFormProps & FormProps, 'form'>");
    expect(providerTypes).toContain(
      'ComponentVars = Partial<RequiredComponentVars>'
    );
    expect(providerTypes).toContain('不参与全局注入');
    // 运行期清单直接声明在注入项内，与类型面同键（两处分别锁定）
    expect(providerConstants).toContain("ignoreProps: ['form'],");
    expect(providerConstants).not.toContain('IGNORE_PROPS');
    expect(providerConstants).toContain('不接受 Provider 注入的键');
    expect(aiContext).toContain(
      "`form` 不可经 `componentVars['pro-form']` 配置"
    );
    expect(aiContext).toContain('在注入层静默忽略（类型面已限制，不输出告警）');
    expect(readme).toContain('不参与 `componentVars` 注入');
  });

  // ----------------------------------------------------
  // DOC-05 [判别]: 字段样式类名/样式的文档类型列与公开类型面一致
  // ----------------------------------------------------
  it('DOC-05 [判别]: 字段样式类名与样式在两个文档面记为宿主类型，示例不再用未注册组件名', () => {
    const docs = read('../../../docs/vant-pro/components/pro-form/index.md');
    for (const [name, doc] of Object.entries({ readme, docs })) {
      for (const key of ['componentClass', 'fieldClass']) {
        expect(doc, `${name} 的 ${key} 未记 ClassValue`).toMatch(
          new RegExp(`\`${key}\`[^\\n]*\`ClassValue\``)
        );
        expect(doc, `${name} 的 ${key} 仍以 any 记档`).not.toMatch(
          new RegExp(`\`${key}\`[^\\n]*\`any\``)
        );
      }
      for (const key of ['componentStyle', 'fieldStyle']) {
        expect(doc, `${name} 的 ${key} 未记 StyleValue`).toMatch(
          new RegExp(`\`${key}\`[^\\n]*\`StyleValue\``)
        );
      }
    }
    // 入口示例的组件名应取自内置组件表，未注册名会告警并降级为原生元素
    expect(read('../src/index.ts')).not.toContain("component: 'input'");
  });

  // ----------------------------------------------------
  // DOC-06 [判别]: 校验触发归属（Form 级 validateTrigger / 字段级 rules[].trigger）在两个文档面同句
  // ----------------------------------------------------
  it('DOC-06 [判别]: 校验触发归属在 README 与组件文档同句，字段顶层 validateTrigger 不入文档承诺', () => {
    const docs = read('../../../docs/vant-pro/components/pro-form/index.md');
    for (const [name, doc] of Object.entries({ readme, docs })) {
      expect(doc, `${name} 未声明校验触发的归属层`).toContain(
        '校验触发时机是 Form 级配置'
      );
      expect(doc, `${name} 未给出字段级写法`).toContain('`rules` 的 `trigger`');
      expect(doc, `${name} 未说明字段顶层写法不生效`).toContain(
        '字段配置顶层写 `validateTrigger` 不生效'
      );
    }
  });
});
