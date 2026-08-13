<script setup lang="ts">
import { h, ref, watch } from 'vue';
import { Locale, Button, Space, Radio, Checkbox } from 'vant';
import { ProComponentProvider, ProForm, useForm } from '@qin-ui/vant-pro';
import zhCN from 'vant/es/locale/lang/zh-CN';
import zhTW from 'vant/es/locale/lang/zh-TW';
import enUS from 'vant/es/locale/lang/en-US';

type FormData = {
  name: string;
  gender: number;
  hobby: string[];
};

type Lang = 'zh-CN' | 'zh-TW' | 'en-US';

// 通过 vant 的 Locale.use 切换语言，ProForm 内置占位符（请输入）随之切换
const lang = ref<Lang>('zh-CN');
const langPacks: Record<Lang, Record<string, any>> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
};
watch(lang, val => {
  Locale.use(val, langPacks[val]);
});

const form = useForm<FormData>({}, [
  { label: '姓名', path: 'name', component: 'field' },
  {
    label: '性别',
    path: 'gender',
    component: 'radio-group',
    slots: {
      default: () => [
        h(Radio, { name: 1 }, () => '男'),
        h(Radio, { name: 2 }, () => '女'),
      ],
    },
  },
  {
    label: '爱好',
    path: 'hobby',
    component: 'checkbox-group',
    slots: {
      default: () => [
        h(Checkbox, { name: 'reading' }, () => '阅读'),
        h(Checkbox, { name: 'sports' }, () => '运动'),
      ],
    },
  },
]);

const submit = async () => {
  await form.formRef.value?.validate();
  console.log('表单提交数据:', { ...form.formData });
};
</script>

<template>
  <div class="demo-wrapper">
    <Space style="margin-bottom: 16px">
      <Button
        v-for="item in ['zh-CN', 'zh-TW', 'en-US'] as Lang[]"
        :key="item"
        :type="lang === item ? 'primary' : 'default'"
        size="small"
        @click="lang = item"
      >
        {{ item }}
      </Button>
    </Space>

    <ProComponentProvider>
      <ProForm :form="form">
        <div style="margin: 16px">
          <Button type="primary" native-type="submit" @click="submit">
            提交
          </Button>
        </div>
      </ProForm>
    </ProComponentProvider>
  </div>
</template>
