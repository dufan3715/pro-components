---
'@qin-ui/pro-components-core': patch
'@qin-ui/vant-pro': patch
---

fix(ssr): 消除模块级自增种子与随机 id 在 SSR 下的 hydration 隐患 (R-06)

- **core `useTable`**：无 key 列的自动标识（`__col_N`）改由实例级种子生成，每次 `useTable` 调用独立从 1 计数，SSR 下服务端与客户端按相同列配置得到一致 key 序列；`normalizeColumn` / `normalizeColumns` 新增可选 `allocateKey` 参数供调用方注入生成函数，独立调用（未传参）时回退模块级兜底种子，行为向后兼容；
- **vant-pro `useFormPopup`**：弹层容器 id（Teleport 目标 `#pro-form-popup-content-*` 会渲染进 DOM）由 `Math.random()` 改为 Vue 3.5 `useId()` 派生，SSR 下服务端/客户端 id 一致，消除 hydration mismatch 与 Teleport 目标失配；无组件上下文的命令式独立弹层（不参与 hydration）回退 `standalone-N` 兜底计数器，多实例仍互不冲突；
- **vant-pro `BaseField`**：弹层字段归属标识 `fieldUid` 由模块级自增计数器改为直接复用组件实例 uid（`getCurrentInstance().uid`，同页面唯一）；该值仅参与运行期比对、不落入 DOM，SSR 不受影响，开发期 HMR 与多实例行为不变；
- 附带评估：四包 ProForm 的 `formInstanceCounter`（`:key="formKey"` 重挂载契约）key 不落 DOM、语义绑定 form 实例身份，无需调整；
- 新增判别测试：core TT-22~TT-24（实例级种子序列、动态增列延续、显式 `allocateKey` 递归）、vant VP-V12~VP-V14（跨挂载 id 可复现、同应用多实例唯一、归属标识与实例 uid 恒等）。
