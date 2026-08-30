---
'@qin-ui/pro-components-core': patch
---

修复 useSearchFormExpand 高度测量链路的反馈振荡与展开按钮闪烁：

- ResizeObserver 触发的测量改为 requestAnimationFrame 合帧，同一帧内的多次尺寸变化只测量一次，卸载时取消未执行的测量帧；
- 测量写入增加 2px 死区：自然高度与单行高度与上次写入值差异小于 2px 时不更新状态，分数像素布局（缩放、flex 均分）下不再出现 ±1px 振荡；
- 更换表单元素（`:form` 运行期替换）时按元素身份重建测量基线，新元素的首次测量始终写入。

边界：±1px 内的真实尺寸变化不再触发高度状态更新，属有意取舍。
