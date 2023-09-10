<!-- eslint-disable no-nested-ternary -->
<script lang="ts" setup>
import {
  computed,
  defineAsyncComponent,
  h,
  inject,
  isVNode,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  useSlots,
  watch,
} from 'vue';
import { get } from 'lodash-es';
import { NCheckbox, NRadio, NSpace } from 'naive-ui';
import type { Field, BaseFieldAttrs, CommandTrigger } from '../../types';
import { ContainerFragment, SlotComponent } from '..';
import {
  asyncImportComponentMap,
  COMMAND,
  UPDATE_REFS,
  FORM_DATA,
  UPDATE_FORM_DATA,
} from '../../constants';

type Props = {
  component: Field['component'];
  path?: string;
  label?: Field['label'];
};

defineOptions({
  name: 'BaseField',
});

const props = withDefaults(defineProps<Props>(), {
  component: () => h('div', 'Missing required prop: "component"'),
  path: '',
  label: '',
  getFormItemRef: undefined,
});

const formData = inject(FORM_DATA);
const updateFormData = inject(UPDATE_FORM_DATA);
const updateRefs = inject(UPDATE_REFS);
const command = inject(COMMAND);

const value = computed({
  get() {
    return get(formData?.value, props.path);
  },
  set(val) {
    updateFormData?.(val, props.path);
  },
});

const forceUpdateKey = ref(0);

watch(value, (val: any, oldVal: any) => {
  if (val === undefined && oldVal) {
    forceUpdateKey.value += 1;
  }
});

const slots = useSlots();

const attrs: BaseFieldAttrs = useAttrs();

const componentType = computed(() =>
  typeof props.component === 'function' || isVNode(props.component)
    ? undefined
    : props.component
);

const rewriteMethod = (methodName: CommandTrigger) => {
  if (attrs.autoCommand && attrs.autoCommand?.[methodName]?.length > 0) {
    return {
      [methodName]: (...args: any) => {
        (attrs as any)[methodName]?.(...args);
        nextTick(() => {
          command?.value?.run(props.path, methodName);
        });
      },
    };
  }
  return {};
};

const mergedAttrs = computed(() => {
  const { componentStyle, type } = attrs as any;
  const overrides = { clearable: true, style: { minWidth: '120px' } };
  switch (componentType.value) {
    case undefined:
      Object.assign(overrides, attrs, rewriteMethod('onUpdateValue'));
      break;
    case 'input':
      Object.assign(overrides, {
        maxlength: 100,
        ...(type === 'textarea'
          ? {
              maxlength: 200,
              autosize: { minRows: 3, maxRows: 6 },
              showCount: true,
            }
          : {}),
        ...attrs,
        ...rewriteMethod('onBlur'),
        ...rewriteMethod('onFocus'),
        ...rewriteMethod('onUpdateValue'),
      });
      break;
    case 'input-number':
      Object.assign(overrides, {
        max: 10 ** 15 - 0.01,
        min: -(10 ** 15 + 0.01),
        showButton: false,
        style: { width: '100%', ...componentStyle },
        ...attrs,
        ...rewriteMethod('onBlur'),
        ...rewriteMethod('onFocus'),
        ...rewriteMethod('onUpdateValue'),
      });
      break;
    case 'select':
      Object.assign(overrides, {
        ...attrs,
        ...rewriteMethod('onUpdateValue'),
      });
      break;
    case 'cascader':
      Object.assign(overrides, {
        ...attrs,
        ...rewriteMethod('onUpdateValue'),
      });
      break;
    case 'date-picker':
      Object.assign(overrides, {
        format: 'yyyy-MM-dd',
        valueFormat: 'yyyy-MM-dd',
        ...(type && ['datetimerange', 'daterange'].includes(type)
          ? { defaultTime: ['00:00:00', '23:59:59'] }
          : {}),
        style: { width: '100%', ...componentStyle },
        ...attrs,
        ...rewriteMethod('onUpdateValue'),
      });
      break;
    case 'time-picker':
      Object.assign(overrides, {
        style: { width: '100%', ...componentStyle },
        ...attrs,
        ...rewriteMethod('onUpdateValue'),
      });
      break;
    case 'radio-group':
      Object.assign(overrides, attrs, { ...rewriteMethod('onUpdateValue') });
      break;
    default:
      break;
  }
  return overrides;
});

const is = computed(() => {
  return typeof props.component === 'string' &&
    Object.hasOwn(asyncImportComponentMap, props.component)
    ? defineAsyncComponent(asyncImportComponentMap[props.component])
    : props.component;
});

const setComponentRef = (el: any) => {
  if (!el) return;
  updateRefs?.(props.path, el, 'fieldRefs');
};

onMounted(() => {
  if (attrs.autoCommand && attrs.autoCommand?.onInit?.length > 0) {
    command?.value?.run(props.path, 'onInit');
  }
});
</script>

<template>
  <ContainerFragment :component="attrs.componentContainer" :path="props.path">
    <component
      :is="is"
      :key="forceUpdateKey"
      v-bind="mergedAttrs"
      :ref="setComponentRef"
      v-model:value="value"
      :class="attrs.componentClassName"
      :style="attrs.componentStyle"
      :path="props.path"
      class="field-component">
      <template v-for="(slot, name) in slots" #[name]>
        <slot :name="name"></slot>
      </template>

      <template v-for="slot in attrs.slots || []" :key="slot.name" #[slot.name]>
        <SlotComponent v-bind="slot" :path="props.path" />
      </template>

      <NSpace
        v-if="
          componentType &&
          ['checkbox-group', 'radio-group'].includes(componentType as string) &&
          !attrs.slots?.find(slot => slot.name === 'default')
        ">
        <component
          :is="componentType === 'checkbox-group' ? NCheckbox : NRadio"
          v-for="(option, index) of (attrs as any).options || []"
          :key="index"
          v-bind="option" />
      </NSpace>
      <div
        v-if="mergedAttrs.clearable && ![null, undefined].includes(value)"
        class="clear-icon"
        @click="value = undefined">
        🅧
      </div>
    </component>
  </ContainerFragment>
</template>

<style scoped lang="less">
.field-component {
  width: 100%;

  &:hover {
    .clear-icon {
      display: block;
    }
  }
}

.clear-icon {
  position: absolute;
  top: 50%;
  right: 9px;
  z-index: 999;
  display: none;
  margin-top: -12px;
  color: #bbb;
  font-size: 15px;
  cursor: pointer;

  &:hover {
    color: #aaa;
  }
}
</style>
