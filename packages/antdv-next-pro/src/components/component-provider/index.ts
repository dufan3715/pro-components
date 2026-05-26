import ComponentProvider from './components/index.vue';

// 仅导出全局属性配置类型，隐藏所有底层的 INJECT_CONFIG 与工具函数
export { type ComponentVars } from './types';

export default ComponentProvider;
