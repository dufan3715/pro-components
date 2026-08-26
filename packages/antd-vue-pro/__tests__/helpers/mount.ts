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
 * 等待所有异步 Promise 与 Vue DOM 更新完成
 */
export const flushPromises = async () => {
  await new Promise(resolve => setTimeout(resolve, 20));
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
 */
export const mountProTable = (
  options: {
    table?: any;
    columns?: Column[];
    dataSource?: any[];
    search?: () => Promise<any> | any;
    props?: Record<string, any>;
    slots?: Record<string, any>;
  } = {}
) => {
  const table =
    options.table ??
    useTable({
      columns: options.columns ?? [],
      dataSource: options.dataSource ?? [],
    });

  const mountOptions: MountingOptions<any> = {
    props: {
      table,
      ...(options.search ? { search: options.search } : {}),
      ...(options.props ?? {}),
    },
    slots: options.slots,
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
  };
};

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
