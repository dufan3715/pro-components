---
'@qin-ui/vant-pro': patch
---

修正 `sideEffects` 声明：移除 `"**/*.css"`（该包源码无 `<style>` 块，`es/` 也无 CSS 产物，`exports` 未暴露 CSS 子路径），保留 `"./es/index.js"`，避免打包器对不存在的样式产物做无谓保留。
