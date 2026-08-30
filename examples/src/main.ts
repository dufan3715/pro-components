import { createApp } from 'vue';
import App from './App.vue';
import 'vant/lib/index.css';
import 'element-plus/dist/index.css';

const app = createApp(App);
app.config.performance = true;

app.mount('#app');
