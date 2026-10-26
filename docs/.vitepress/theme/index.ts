import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus';
import type { App } from 'vue';
import 'vant/lib/index.css';
import Layout from './Layout.vue';

export default {
  Layout,
  enhanceApp({ app }: { app: App }) {
    // 为 SSR 渲染提供稳定的 Element Plus 注入值，避免文档站点水合告警
    app.provide(ID_INJECTION_KEY, { prefix: 1024, current: 0 });
    app.provide(ZINDEX_INJECTION_KEY, { current: 0 });
  },
};
