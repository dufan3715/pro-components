<script lang="ts" setup>
/**
 * @component BaseFormItem
 * @description 表单字段渲染引擎
 *
 * 负责将字段配置数组渲染为实际的表单项，支持：
 * - 字段分组（嵌套 fields 递归渲染）
 * - Field 包装（label、rules、校验等）
 * - 组件绑定（通过 BaseField 渲染具体组件，如 Popup 选择器等）
 * - 插槽透传（label 等 Field 插槽）
 *
 * ## 渲染流程
 *
 * 1. 遍历 fields 数组，过滤 hidden 字段
 * 2. 通过 useGroupFieldAttrs Hook 纯计算各字段属性与路径
 * 3. 递归渲染 BaseFormItem（嵌套表单）或 BaseField（输入组件）
 *
 * @param {Fields} [fields] - 字段配置数组
 *
 * @internal
 */
import { computed, toRaw, toValue } from 'vue';
import type { Fields } from '../../types';
import BaseField from '../BaseField/index.vue';
import ContainerFragment from '../ContainerFragment/index.vue';
import { useGroupFieldAttrs } from '../../hooks/useGroupFieldAttrs';

/*
 * 无 path 字段的稳定渲染 key：以字段原始对象为 key 分配自增 id，
 * 字段插删/重排/过滤时保持 key 与对象绑定，不随数组位置漂移
 */
let fieldKeySeed = 0;
const fieldKeyMap = new WeakMap<object, number>();
const getFieldKey = (field: unknown): number => {
  const raw = toRaw(field as object);
  let key = fieldKeyMap.get(raw);
  if (key === undefined) {
    key = ++fieldKeySeed;
    fieldKeyMap.set(raw, key);
  }
  return key;
};

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  fields?: Fields;
};

const props = withDefaults(defineProps<Props>(), {
  fields: () => [],
});

const validFields = computed(() => {
  const f = toValue(props.fields);
  if (!Array.isArray(f)) return [];
  return f.filter(field => !toValue(field.hidden));
});

const groupedFields = useGroupFieldAttrs(validFields);

/** 已告警过的字段对象（不可写场景去重） */
const warnedFrozenFields = new WeakSet<object>();
const defineFieldAccessors = (
  raw: object,
  accessors: Record<string, () => any>
) => {
  try {
    for (const [key, getter] of Object.entries(accessors)) {
      // 不可枚举：不进入 Object.keys / spread，不随字段配置透传
      Object.defineProperty(raw, key, {
        value: getter,
        enumerable: false,
        configurable: true,
        writable: true,
      });
    }
  } catch {
    if (!warnedFrozenFields.has(raw)) {
      warnedFrozenFields.add(raw);
      console.warn(
        '[pro-components] 字段配置对象不可写（如被 Object.freeze），getComponentRef 等实例访问器挂载失败。'
      );
    }
  }
};

/*
 * 以字段原始对象（toRaw）为 key 登记控件实例，挂接 getComponentRef 等访问器供业务层调用；
 * 随字段回收自动释放
 */
const componentRefMap = new WeakMap<object, any>();
const setComponentRef = (field: object, el: any) => {
  const raw = toRaw(field);
  if (el) {
    componentRefMap.set(raw, el);
    defineFieldAccessors(raw, {
      getComponentRef: () => componentRefMap.get(raw)?.getComponentRef?.(),
      getComponentComputedProps: () =>
        componentRefMap.get(raw)?.getComponentComputedProps?.(),
    });
  } else {
    componentRefMap.delete(raw);
    delete (raw as any).getComponentRef;
    delete (raw as any).getComponentComputedProps;
  }
};

defineExpose({
  getComponentRef: (rawField: object) =>
    componentRefMap.get(toRaw(rawField))?.getComponentRef?.(),
  getComponentComputedProps: (rawField: object) =>
    componentRefMap.get(toRaw(rawField))?.getComponentComputedProps?.(),
});
</script>

<template>
  <template
    v-for="item in groupedFields"
    :key="item.path || getFieldKey(item.rawField)"
  >
    <template v-if="item.rawField.fields">
      <ContainerFragment
        :component="item.fieldContainer"
        :path="item.path"
        v-bind="item.componentProps"
      >
        <BaseFormItem :fields="item.rawField.fields" />
      </ContainerFragment>
    </template>
    <template v-else>
      <BaseField
        :ref="(el: any) => setComponentRef(item.rawField, el)"
        v-bind="item.componentProps"
        :path="item.path"
      />
    </template>
  </template>
</template>
