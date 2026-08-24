---
'@qin-ui/pro-components-core': patch
---

- fix(useFormData): 原始值初始数据安全归一化为 `{}`，防止退化导致 setFormData 抛错；为 inject 增加组件上下文守卫
- fix(useForm): 为 useForm(false) 的 inject 增加组件上下文守卫，消除 setup 外调用警告
