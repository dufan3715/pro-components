import { getCurrentInstance, onBeforeUpdate, shallowReactive } from 'vue';

/**
 * 包装组件的动态 attrs 快照
 *
 * @description 在 setup 内把当前组件 attrs 同步到浅响应式对象，并在每次更新前刷新；
 * 派生 computed 遍历 attrs 时可随新增 / 删除 / 变更的 key 失效重算。仅在组件 setup 内调用。
 *
 * @returns 与当前组件 attrs 同步的浅响应式对象
 */
export const useReactiveAttrs = (): Record<string, any> => {
  const instance = getCurrentInstance();
  const attrs = shallowReactive<Record<string, any>>({
    ...(instance?.attrs ?? {}),
  });
  onBeforeUpdate(() => {
    if (!instance) return;
    const current = instance.attrs;
    Object.keys(attrs).forEach(key => {
      if (!(key in current)) delete attrs[key];
    });
    for (const key in current) {
      if (attrs[key] !== current[key]) attrs[key] = current[key];
    }
  });
  return attrs;
};
