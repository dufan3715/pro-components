## naive-ui-pro

- [x] pro-form
- [x] pro-component-provider
- [ ] pro-table



#### 1. ProForm

> Naive-ui Form组件的封装，引用了Form、Grid、GridItem、FormItem、Input、Select、Switch等表单布局组件，接受formData和fields参数，采用递归组件的形式根据fields渲染对应表单组件，亦可渲染自定义组件

##### 1.1 example

```
<script lang="ts" setup>
import { ProForm, useForm } from '@qin-ui/naive-ui-pro';

const form = useForm({}, [
  { label: '用户名', key: 'username', component: 'input' },
  { label: '密码', key: 'password', component: 'input', type: 'password' },
  { label: '验证码', key: 'code', component: 'input-number' },
]);
</script>

<template>
  <ProForm :form="form" />
</template>
```

##### 1.2 api

+ **ProForm**（组件）
+ **useForm** （hook）



#### 2. ProComponentProvider

> 若需要修改Pro组件自定义初始配置，可通过此组件完成。

##### 2.1 example

```
<script lang="ts" setup>
import { ProForm, useForm } from '@qin-ui/naive-ui-pro';

const form = useForm({}, [
  { label: '用户名', key: 'username', component: 'input' },
  { label: '密码', key: 'password', component: 'input', type: 'password' },
  { label: '验证码', key: 'code', component: 'input-number' },
]);

const componentVars: ComponentVars = {
  proFormField: {
  	// 设置表单组件Input的初始化props中最大输入长度限制为100个字符
    input: { maxlength: 100 },
    // 设置表单组件Input中textarea的初始化props中最大输入长度限制为1000个字符
    'input.textarea': { maxlength: 1000 },
    // 设置表单组件InputNumber的初始化props中最大值为9
    'input-number': { max: 9 },
  },
};
</script>

<template>
	<ProComponentProvider :component-vars="componentVars">
  	<ProForm :form="form" />
  </ProComponentProvider>
</template>
```

