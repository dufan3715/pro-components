import type { App } from 'vue';
import ProForm from './components/form';
import ProComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/component-provider';
export * from './locale';

/**
 * Schema 驱动的表单组件，基于 vant Form 封装
 *
 * @description 通过声明式 Schema 配置生成表单，具备 TypeScript 类型推导与组件库插槽扩展能力。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ProForm, useForm } from '@qin-ui/vant-pro'
 * const form = useForm<User>({ name: '' }, [
 *   { path: 'name', label: '姓名', component: 'field' }
 * ])
 * </script>
 * <template>
 *   <ProForm :form="form" />
 * </template>
 * ```
 */
export { ProForm };
/**
 * 全局配置提供者
 *
 * @description 为子组件树注入组件默认属性、自定义组件映射与文案覆盖。
 *
 * @example
 * ```vue
 * <template>
 *   <ProComponentProvider :componentVars="customVars">
 *     <App />
 *   </ProComponentProvider>
 * </template>
 * ```
 */
export { ProComponentProvider };

export default {
  /**
   * 安装方法
   *
   * @description 全局注册 ProForm 与 ProComponentProvider。
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
    app.component(
      ProComponentProvider.name ?? 'ProComponentProvider',
      ProComponentProvider
    );
  },
};
