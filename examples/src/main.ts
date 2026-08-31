import { createApp } from 'vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import 'vant/lib/index.css';
import 'element-plus/dist/index.css';
import App from './App.vue';

const app = createApp(App);
app.config.performance = true;
app.use(Antd);

app.mount('#app');
