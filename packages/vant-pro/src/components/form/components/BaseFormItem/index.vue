<script lang="ts">
/**
 * 单字段行渲染组件
 *
 * @component BaseFormItem
 *
 * 将单个字段配置渲染为控件或嵌套分组，支持：
 * - 字段属性与容器拆分
 * - 嵌套字段递归渲染（交由 BaseFormItems）
 * - 控件实例登记
 *
 * @param {Field} field - 字段配置
 * @param {boolean} [disabled] - 上层下发的禁用状态
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
} from 'vue';
import type { Field } from '../../types';
import BaseField from '../BaseField/index.vue';
import BaseFormItems from '../BaseFormItems/index.vue';
import { useGroupedField } from '../../hooks/useGroupFieldAttrs';

export default defineComponent({
  name: 'BaseFormItem',
  inheritAttrs: false,
  props: {
    /** 字段配置 */
    field: { type: Object as PropType<Field>, required: true },
    /** 上层下发的禁用状态 */
    disabled: { type: Boolean, default: undefined },
    /** 控件实例登记回调 */
    setComponentRef: {
      type: Function as PropType<(field: Field, el: any) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const grouped = useGroupedField(() => props.field);

    // 控件级配置身份：字符串组件名；组件对象无 Provider 配置，使用固定值
    const componentKey = computed(() => {
      const field = props.field as any;
      const component = toValue(field.component);
      if (typeof component !== 'string') return 'component-object';
      return `string:${component}`;
    });

    const setFieldRef = (el: any) => {
      props.setComponentRef?.(props.field, el);
    };

    // 字段对象变化后，控件实例访问器归属当前字段
    watch(
      () => props.field,
      (next, prev) => {
        if (!prev || prev === next) return;
        props.setComponentRef?.(prev, null);
      },
      { flush: 'pre' }
    );

    return () => {
      const groupedField = grouped.value;
      const field = props.field as any;

      if (field.fields) {
        const nested = h(BaseFormItems as any, {
          fields: field.fields,
          disabled: toValue(field.disabled) ?? props.disabled,
        });
        return groupedField.fieldContainer
          ? h(
              groupedField.fieldContainer,
              {
                path: groupedField.path,
                ...groupedField.componentProps,
              },
              { default: () => nested }
            )
          : nested;
      }

      return h(BaseField as any, {
        key: componentKey.value,
        ref: setFieldRef,
        ...groupedField.componentProps,
        path: groupedField.path,
        disabled: groupedField.componentProps.disabled ?? props.disabled,
      });
    };
  },
});
</script>
