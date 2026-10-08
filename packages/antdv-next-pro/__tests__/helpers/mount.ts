import { mount, type MountingOptions } from '@vue/test-utils';
import { nextTick } from 'vue';
import { expect } from 'vitest';
import ProForm from '../../src/components/form/components/ProForm/index.vue';
import ProTable from '../../src/components/table/components/ProTable.vue';
import { useForm } from '../../src/components/form/hooks/useForm';
import { useTable } from '../../src/components/table/hooks/useTable';
import type { Field } from '../../src/components/form/types';
import type { Column } from '../../src/components/table/types';

/**
 * 等待挂起的微任务与宏任务（含 Vue DOM 更新）完成
 */
export const flushPromises = async () => {
  await nextTick();
  await new Promise(resolve => setTimeout(resolve, 0));
  await nextTick();
};

/**
 * 挂载 ProForm 辅助函数
 */
export const mountProForm = (
  options: {
    form?: any;
    fields?: Field[];
    initialData?: Record<string, any>;
    props?: Record<string, any>;
    slots?: Record<string, any>;
  } = {}
) => {
  const form =
    options.form ??
    (options.fields || options.initialData
      ? useForm(options.initialData ?? {}, options.fields ?? [])
      : undefined);

  const mountOptions: MountingOptions<any> = {
    props: {
      ...(form ? { form } : {}),
      ...(options.props ?? {}),
    },
    slots: options.slots,
    global: {
      stubs: {
        transition: false,
      },
    },
  };

  const wrapper = mount(ProForm as any, mountOptions as any);
  return {
    wrapper,
    form,
  };
};

/**
 * 挂载 ProTable 辅助函数
 *
 * @description `attachToBody` 为 true 时挂载至 document.body：点击表单内 submit 按钮
 * 依赖元素已连接文档，用例结束须调用返回的 `cleanup` 清空挂载点
 */
export const mountProTable = (
  options: {
    table?: any;
    columns?: Column[];
    dataSource?: any[];
    searchFields?: Field[];
    search?: () => Promise<unknown>;
    props?: Record<string, any>;
    slots?: Record<string, any>;
    attachToBody?: boolean;
  } = {}
) => {
  const table =
    options.table ??
    useTable({
      columns: options.columns ?? [],
      dataSource: options.dataSource ?? [],
      searchFields: options.searchFields,
    });

  const mountOptions: MountingOptions<any> = {
    props: {
      table,
      ...(options.search ? { search: options.search } : {}),
      ...(options.props ?? {}),
    },
    slots: options.slots,
    ...(options.attachToBody ? { attachTo: document.body } : {}),
    global: {
      stubs: {
        transition: false,
      },
    },
  };

  const wrapper = mount(ProTable as any, mountOptions as any);
  return {
    wrapper,
    table,
    cleanup: () => {
      if (options.attachToBody) document.body.innerHTML = '';
    },
  };
};

/**
 * 等待下一帧渲染回调执行（ResizeObserver 经 rAF 合帧后重测）
 */
export const waitForRaf = () =>
  new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

/**
 * 断言 console.warn 产生匹配警告
 */
export const expectWarn = (spy: any, matcher: string | RegExp) => {
  expect(spy).toHaveBeenCalled();
  const calls = spy.mock.calls.flat();
  const matched = calls.some((msg: any) =>
    typeof matcher === 'string'
      ? String(msg).includes(matcher)
      : matcher.test(String(msg))
  );
  expect(matched).toBe(true);
};

/**
 * 通用交互断言：断言输入框的值
 */
export const expectInputValue = (
  wrapper: ReturnType<typeof mount>,
  selector: string,
  expectedValue: string
) => {
  const el = wrapper.find<HTMLInputElement>(selector);
  expect(el.exists()).toBe(true);
  expect(el.element.value).toBe(expectedValue);
};
