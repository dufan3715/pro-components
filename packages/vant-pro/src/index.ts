import type { App } from 'vue';
import ProForm from './components/form';
import ProComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/component-provider';

/**
 * Schema 驱动的表单组件，基于 vant Form 封装
 *
 * @description 通过声明式 JSON Schema 配置即可快速生成表单，
 * 提供极致的 TypeScript 类型推导与组件库插槽扩展能力。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ProForm, useForm } from '@qin-ui/vant-pro'
 * const form = useForm<User>({ name: '' }, [
 *   { path: 'name', label: '姓名', component: 'input' }
 * ])
 * </script>
 * <template>
 *   <ProForm :form="form" />
 * </template>
 * ```
 *
 * 组件提供者，用于全局配置 ProForm 的默认行为
 *
 * @description 通过 `ProComponentProvider` 包裹应用根组件，
 * 可以全局覆盖组件的默认属性。
 *
 * @example
 * ```vue
 * <template>
 *   <ProComponentProvider :component-props="customProps">
 *     <App />
 *   </ProComponentProvider>
 * </template>
 * ```
 */
export { ProForm, ProComponentProvider };

export default {
  /**
   * @qin-ui/vant-pro 安装方法
   * @description 全局注册所有组件（ProForm、ProComponentProvider）
   *
   * @param {App} app - Vue 应用实例
   *
   * @example
   * ```ts
   * import { createApp } from 'vue'
   * import ProComponents from '@qin-ui/vant-pro'
   * const app = createApp(App)
   * app.use(ProComponents)
   * ```
   */
  install(app: App) {
    app.component(ProForm.name, ProForm);
    app.component(ProComponentProvider.name!, ProComponentProvider);
  },
};
