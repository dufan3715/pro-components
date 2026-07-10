import type { App } from 'vue';
import ProForm from './components/form';
import ProTable from './components/table';
import ProComponentProvider from './components/component-provider';

export * from './components/form';
export * from './components/table';
export * from './components/component-provider';

/**
 * Schema 驱动的表单组件，基于 element-plus Form 封装
 *
 * @description 通过声明式 JSON Schema 配置即可快速生成表单，
 * 提供极致的 TypeScript 类型推导与组件库插槽扩展能力。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ProForm, useForm } from '@qin-ui/element-plus-pro'
 * const form = useForm<User>({ name: '' }, [
 *   { path: 'name', label: '姓名', component: 'input' }
 * ])
 * </script>
 * <template>
 *   <ProForm :form="form" />
 * </template>
 * ```
 *
 * Schema 驱动的表格组件，基于 element-plus Table 封装
 *
 * @description 通过声明式列配置即可生成功能完整的表格，
 * 支持列动态控制、搜索表单集成、分页管理等企业级能力。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ProTable, useTable } from '@qin-ui/element-plus-pro'
 * const table = useTable<User>({ columns: [{ key: 'name', title: '姓名' }] })
 * </script>
 * <template>
 *   <ProTable :table="table" />
 * </template>
 * ```
 *
 * 组件提供者，用于全局配置 ProForm 和 ProTable 的默认行为
 *
 * @description 通过 `ProComponentProvider` 包裹应用根组件，
 * 可以全局覆盖组件的默认属性（如表单布局、表格尺寸等）。
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
export { ProForm, ProTable, ProComponentProvider };

export default {
  /**
   * @qin-ui/element-plus-pro 安装方法
   * @description 全局注册所有组件（ProForm、ProTable、ProComponentProvider）
   *
   * @param {App} app - Vue 应用实例
   *
   * @example
   * ```ts
   * import { createApp } from 'vue'
   * import ProComponents from '@qin-ui/element-plus-pro'
   * const app = createApp(App)
   * app.use(ProComponents)
   * ```
   */
  install(app: App) {
    app.component(ProForm.name, ProForm);
    app.component(ProTable.name, ProTable);
    app.component(ProComponentProvider.name!, ProComponentProvider);
  },
};
