import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { routes } from 'vue-router/auto-routes';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import 'vant/lib/index.css';
import 'element-plus/dist/index.css';
import App from './App.vue';

const app = createApp(App);
const router = createRouter({ history: createWebHistory(), routes });

app.config.performance = true;
app.use(Antd);
app.use(router);

app.mount('#app');
