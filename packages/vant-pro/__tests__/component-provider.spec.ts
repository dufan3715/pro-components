import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h, inject } from 'vue';
import ProComponentProvider from '../src/components/component-provider';
import {
  getInjectConfig,
  ensureInjectConfig,
} from '../src/components/component-provider/constants';

describe('component-provider 注入配置', () => {
  // ----------------------------------------------------
  // VP-PC1 [判别]: getInjectConfig 未知 key 命中即缓存，多次调用返回同一 entry
  // ----------------------------------------------------
  it('VP-PC1 [判别]: getInjectConfig 未知 key 命中即缓存，多次调用返回同一 entry', () => {
    const first = getInjectConfig('widget-a');
    const second = getInjectConfig('widget-a');
    expect(second).toBe(first);
    expect(second.injectionKey).toBe(first.injectionKey);
    // 与 ensureInjectConfig 共享同一动态缓存
    expect(ensureInjectConfig('widget-a')).toBe(first);
  });

  // ----------------------------------------------------
  // VP-PC2 [判别]: 非字符串 component 共享同一 anonymous entry
  // ----------------------------------------------------
  it('VP-PC2 [判别]: 非字符串 component 共享同一 anonymous entry', () => {
    expect(getInjectConfig(undefined)).toBe(getInjectConfig(undefined));
    expect(getInjectConfig(123)).toBe(getInjectConfig(null));
    expect(getInjectConfig(null)).toBe(getInjectConfig(undefined));
  });

  // ----------------------------------------------------
  // VP-PC3 [判别]: Provider 自定义 componentVars key 的 provide 通道可被 getInjectConfig 命中
  // ----------------------------------------------------
  it('VP-PC3 [判别]: Provider 自定义 componentVars key 的 provide 通道可被 getInjectConfig 命中', () => {
    let injected: any;
    const Probe = defineComponent({
      setup() {
        const config = getInjectConfig('widget-b');
        injected = inject(config.injectionKey, null);
        return () => h('div');
      },
    });
    mount(ProComponentProvider, {
      props: { componentVars: { 'widget-b': { width: '120px' } } } as any,
      slots: { default: () => h(Probe) },
    });
    expect(injected).not.toBeNull();
    expect(injected.value).toEqual({ width: '120px' });
  });
});
