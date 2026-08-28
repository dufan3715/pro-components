import { describe, expect, it, vi, afterEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { useForm } from '../src/components/form';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useFormPopup } from '../src/components/form/hooks/useFormPopup';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('跨包一致性 · vant-pro', () => {
  it('未知组件名的告警全生命周期仅一次 (M4)', async () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const makeForm = () =>
      useForm({ v: '' }, [
        { path: 'v', label: '字段', component: 'no-such-comp-m4-vant' },
      ] as any);
    const w1 = mount(ProForm, {
      props: { form: makeForm() },
    });
    const w2 = mount(ProForm, {
      props: { form: makeForm() },
    });
    await flushPromises();
    const calls = spy.mock.calls.flat().map(String);
    const hits = calls.filter(c => c.includes('no-such-comp-m4-vant'));
    expect(hits.length).toBe(1);
    w1.unmount();
    w2.unmount();
  });

  it('open 未携带初值时清空上一次弹层的残留值', () => {
    const popup = useFormPopup(true);
    popup.open('address', ['110000', '110100']);
    expect(popup.popupFieldValue.value).toEqual(['110000', '110100']);

    // 连续打开另一个字段且不带初值：不得显示上一个字段的旧值（修复前会残留）
    popup.open('birthday');
    expect(popup.popupFieldValue.value).toBeUndefined();
    expect(popup.popupFieldPath.value).toBe('birthday');
  });

  it('open/close/open 流程下值语义不变', () => {
    const popup = useFormPopup(true);
    popup.open('a', 1);
    popup.close();
    expect(popup.popupFieldValue.value).toBeUndefined();
    expect(popup.visible.value).toBe(false);
    popup.open('b', 2);
    expect(popup.popupFieldValue.value).toBe(2);
  });
});
