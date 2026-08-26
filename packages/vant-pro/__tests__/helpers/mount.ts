import { mount, type MountingOptions } from '@vue/test-utils';
import ProForm from '../../src/components/form/components/ProForm/index.vue';
import { useForm } from '../../src/components/form/hooks/useForm';
import type { Field } from '../../src/components/form/types';

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
