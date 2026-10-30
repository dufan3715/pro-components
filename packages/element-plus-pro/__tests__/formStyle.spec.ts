import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import BaseFormItem from '../src/components/form/components/BaseFormItem/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import { flushPromises } from './helpers/mount';

describe('Element Plus 嵌套 FormItem 样式', () => {
  // ----------------------------------------------------
  // BI-A28 [判别]: 嵌套间距使用 scoped 且只作用于 FormItem 根节点
  // ----------------------------------------------------
  it('BI-A28 [判别]: 样式保持 scoped，嵌套 FormItem 根节点携带组件 scope id', async () => {
    const source = readFileSync(
      resolve(
        __dirname,
        '../src/components/form/components/BaseFormItem/index.vue'
      ),
      'utf-8'
    );
    expect(source).toMatch(/<style\s+scoped\s+lang="less">/);
    expect(source).toContain("[class*='-form-item'] [class*='-form-item']");
    expect(source).not.toContain('.pro-form');

    const form = useForm({ group: { a: '', b: '' } }, [
      {
        path: 'group',
        label: '分组',
        fields: [
          { path: 'group.a', label: 'A', component: 'input' },
          { path: 'group.b', label: 'B', component: 'input' },
        ],
      },
    ] as any);
    const wrapper = mount(ProForm, {
      props: { form },
      global: { stubs: { transition: false } },
    });
    await flushPromises();

    const scopeId = (BaseFormItem as any).__scopeId;
    expect(scopeId).toMatch(/^data-v-/);

    const nestedFormItems = wrapper.findAll('.el-form-item .el-form-item');
    expect(nestedFormItems.length).toBeGreaterThan(0);
    expect(
      nestedFormItems.every(item => item.element.hasAttribute(scopeId))
    ).toBe(true);

    // 编译后的选择器为 [class*='-form-item'] [class*='-form-item'][data-v-x]
    const matched = wrapper.findAll(
      `[class*='-form-item'] [class*='-form-item'][${scopeId}]`
    );
    expect(matched.length).toBeGreaterThan(0);
    expect(matched.every(item => item.classes('el-form-item'))).toBe(true);

    wrapper.unmount();
  });
});
