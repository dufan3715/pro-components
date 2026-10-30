<script lang="ts">
/**
 * 单字段行渲染组件
 *
 * @component BaseFormItem
 *
 * 将单个字段配置渲染为栅格项、FormItem 与控件，支持：
 * - 字段属性分流（grid / formItem / component / slots）
 * - 嵌套字段递归渲染（交由 BaseFormItems）
 * - FormItem / 控件实例登记
 *
 * @param {Field} field - 字段配置
 * @param {boolean | GridProps} [grid] - 是否启用网格布局
 * @param {boolean} [disabled] - 上层下发的禁用状态
 * @param {Function} [setFormItemRef] - FormItem 实例登记回调
 * @param {Function} [setComponentRef] - 控件实例登记回调
 *
 * @internal
 */
import {
  computed,
  defineComponent,
  h,
  toValue,
  watch,
  type PropType,
  type VNode,
} from 'vue';
import { toPath } from '../../../../shared/core';
import { FormItem, GridItem as AGridItem } from '../../../../shared/ui';
import type { Field, Grid } from '../../types';
import BaseField from '../BaseField/index.vue';
import BaseFormItems from '../BaseFormItems/index.vue';
import SlotComponent from '../SlotComponent/index.vue';
import {
  useGroupedField,
  type GroupedField,
} from '../../hooks/useGroupFieldAttrs';

export default defineComponent({
  name: 'BaseFormItem',
  inheritAttrs: false,
  props: {
    /** 字段配置 */
    field: { type: Object as PropType<Field>, required: true },
    /** 是否启用网格布局 */
    grid: {
      type: [Boolean, Object] as PropType<Grid>,
      default: undefined,
    },
    /** 上层下发的禁用状态 */
    disabled: { type: Boolean, default: undefined },
    /** FormItem 实例登记回调 */
    setFormItemRef: {
      type: Function as PropType<
        (field: Field, el: any, getFormItemProps: () => any) => void
      >,
      default: undefined,
    },
    /** 控件实例登记回调 */
    setComponentRef: {
      type: Function as PropType<(field: Field, el: any) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const grouped = useGroupedField(() => props.field);
    const enableGrid = computed(() => !!props.grid);

    // 控件级配置身份：字符串组件名 + picker 段；组件对象无 Provider 配置，使用固定值
    const componentKey = computed(() => {
      const field = props.field as any;
      const component = toValue(field.component);
      if (typeof component !== 'string') return 'component-object';
      return `string:${component}:${toValue(field.picker) ?? ''}`;
    });

    /** 当前字段的宿主 FormItem 实例 */
    let formItemInstance: any;

    const setItemRef = (el: any) => {
      formItemInstance = el;
      props.setFormItemRef?.(
        props.field,
        el,
        () => grouped.value.formItemProps
      );
    };

    const setFieldRef = (el: any) => {
      props.setComponentRef?.(props.field, el);
    };

    // 字段对象变化后，实例访问器归属当前字段
    watch(
      () => props.field,
      (next, prev) => {
        if (!prev || prev === next) return;
        props.setFormItemRef?.(prev, null, () => grouped.value.formItemProps);
        props.setComponentRef?.(prev, null);
      },
      { flush: 'pre' }
    );

    /*
     * 字段值变更经 BaseField 的 field-value-change 事件回传，由当前字段的 FormItem 实例触发校验；
     * autoLink 为 false 时保持用户自行校验的语义
     */
    const onFieldValueChange = () => {
      if (grouped.value.formItemProps?.autoLink === false) return;
      formItemInstance?.onFieldChange?.();
    };

    /** 按容器组件逐层包裹当前节点 */
    const withContainer = (
      node: VNode,
      component: any,
      containerProps: Record<string, any>
    ): VNode =>
      component ? h(component, containerProps, { default: () => node }) : node;

    /** 组装 FormItem 的动态插槽与默认插槽 */
    const renderFormItemSlots = (groupedField: GroupedField) => {
      const slots: Record<string, any> = {};
      Object.entries(groupedField.formItemSlots).forEach(([name, slot]) => {
        slots[name] = (scope?: Record<string, any>) =>
          h(SlotComponent as any, {
            path: groupedField.path,
            component: slot,
            ...(scope || {}),
          });
      });

      slots.default = () => {
        const field = props.field as any;
        if (field.fields) {
          return h(BaseFormItems as any, {
            grid: field.grid ?? props.grid,
            fields: field.fields,
            disabled: toValue(field.disabled),
          });
        }
        return h(BaseField as any, {
          key: componentKey.value,
          ref: setFieldRef,
          ...groupedField.componentProps,
          path: groupedField.path,
          onFieldValueChange,
        });
      };
      return slots;
    };

    return () => {
      const groupedField = grouped.value;
      let node: VNode = h(
        FormItem as any,
        {
          ...groupedField.formItemProps,
          ref: setItemRef,
          name: toPath(groupedField.path),
          path: groupedField.path,
        },
        renderFormItemSlots(groupedField)
      );
      node = withContainer(node, groupedField.formItemContainer, {
        path: groupedField.path,
      });
      node = withContainer(
        node,
        enableGrid.value ? AGridItem : undefined,
        groupedField.gridItemProps
      );
      return node;
    };
  },
});
</script>
