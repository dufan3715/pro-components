import { expect, test, type Page } from '@playwright/test';

type Lib = 'antd' | 'antdv-next' | 'element';

const LIBS: Lib[] = ['antd', 'antdv-next', 'element'];
const FORM = '.pro-table_search-form';
const TOGGLE = '.pro-table_search-form_expand-toggle-button';
const WIDE = 1440;
const NARROW = 500;

const openLab = async (
  page: Page,
  lib: Lib,
  options: { expandStatus?: boolean; width?: number } = {}
) => {
  const { expandStatus = true, width = WIDE } = options;
  await page.setViewportSize({ width, height: 900 });
  await page.goto(
    `/e2e/fixtures/search-form-lab.html?lib=${lib}&expandStatus=${String(
      expandStatus
    )}`
  );
  await page.waitForFunction(() => (window as any).__LAB_READY__ === true);
  await expect(page.locator(FORM)).toBeVisible();
  await page.waitForTimeout(300);
};

const formHeight = (page: Page) =>
  page.locator(FORM).evaluate(el => el.getBoundingClientRect().height);

const rowCount = (page: Page) =>
  page.evaluate(() => {
    const formEl = document.querySelector('.pro-table_search-form');
    if (!formEl) return 0;
    const items = [...formEl.querySelectorAll("[class*='-form-item']")].filter(
      el => {
        let parent = el.parentElement;
        while (parent && parent !== formEl) {
          if (
            typeof parent.className === 'string' &&
            parent.className.includes('-form-item')
          ) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      }
    );
    return new Set(items.map(el => Math.round(el.getBoundingClientRect().top)))
      .size;
  });

const waitForRows = async (page: Page, count: number) => {
  await expect.poll(() => rowCount(page), { timeout: 5000 }).toBe(count);
  await page.waitForTimeout(150);
};

const rowGeometry = (page: Page) =>
  page.evaluate(() => {
    const formEl = document.querySelector(
      '.pro-table_search-form'
    ) as HTMLElement;
    if (!formEl) return [];
    const formTop = formEl.getBoundingClientRect().top;
    const items = [...formEl.querySelectorAll("[class*='-form-item']")].filter(
      el => {
        let parent = el.parentElement;
        while (parent && parent !== formEl) {
          if (
            typeof parent.className === 'string' &&
            parent.className.includes('-form-item')
          ) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      }
    );
    const rows = new Map<number, { top: number; bottom: number }>();
    for (const el of items) {
      const rect = el.getBoundingClientRect();
      const top = Math.round(rect.top - formTop);
      const bottom = rect.bottom - formTop;
      const row = rows.get(top);
      if (row) {
        row.bottom = Math.max(row.bottom, bottom);
      } else {
        rows.set(top, { top, bottom });
      }
    }
    return [...rows.values()].sort((a, b) => a.top - b.top);
  });

const toggle = (page: Page) => page.locator(TOGGLE);

const growField = async (page: Page, path: string, height: number) => {
  await page.evaluate(
    ({ path, height }) => {
      (window as any).__LAB__.growField(path, height);
    },
    { path, height }
  );
};

const expectInsideForm = async (page: Page, selector: string, slack = 1) => {
  const formBox = await page.locator(FORM).boundingBox();
  const box = await page.locator(selector).boundingBox();
  expect(formBox).not.toBeNull();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(
    formBox!.y + formBox!.height + slack
  );
};

for (const lib of LIBS) {
  test.describe(`SearchForm 展开状态机 - ${lib}`, () => {
    test('E2E-R1~R5: 恰好 2 行不显示按钮，缩窄后收起/展开保持可用，拉宽后按钮消失', async ({
      page,
    }) => {
      await openLab(page, lib, { expandStatus: true, width: WIDE });
      await waitForRows(page, 2);
      await expect(toggle(page)).toHaveCount(0);

      await page.setViewportSize({ width: NARROW, height: 900 });
      await waitForRows(page, 5);
      await expect(toggle(page)).toBeVisible();
      await expect(toggle(page)).toHaveText(/收起/);
      const narrowRows = await rowGeometry(page);
      await expect
        .poll(() => formHeight(page))
        .toBeGreaterThanOrEqual(narrowRows[4]!.bottom - 2);
      const narrowHeight = await formHeight(page);

      await toggle(page).click();
      await expect(toggle(page)).toBeVisible();
      await expect(toggle(page)).toHaveText(/展开/);
      await expect.poll(() => formHeight(page)).toBeLessThan(narrowHeight - 20);
      const collapsedHeight = await formHeight(page);
      expect(collapsedHeight).toBeGreaterThanOrEqual(narrowRows[1]!.bottom - 2);
      expect(collapsedHeight).toBeLessThanOrEqual(narrowRows[2]!.top + 2);
      await expectInsideForm(page, TOGGLE);

      await toggle(page).click();
      await expect(toggle(page)).toHaveText(/收起/);
      await expect
        .poll(() => formHeight(page))
        .toBeGreaterThanOrEqual(narrowRows[4]!.bottom - 2);

      await page.setViewportSize({ width: WIDE, height: 900 });
      await waitForRows(page, 2);
      await expect(toggle(page)).toHaveCount(0);
      const wideRowsAfter = await rowGeometry(page);
      await expect
        .poll(() => formHeight(page))
        .toBeLessThanOrEqual(wideRowsAfter[1]!.bottom + 2);
    });

    test('E2E-R6~R8: 默认折叠时 resize 双向更新按钮与高度', async ({
      page,
    }) => {
      await openLab(page, lib, { expandStatus: false, width: WIDE });
      await waitForRows(page, 2);
      await expect(toggle(page)).toHaveCount(0);

      await page.setViewportSize({ width: NARROW, height: 900 });
      await waitForRows(page, 5);
      await expect(toggle(page)).toBeVisible();
      await expect(toggle(page)).toHaveText(/展开/);
      const narrowRows = await rowGeometry(page);
      const narrowCollapsedHeight = await formHeight(page);
      expect(narrowCollapsedHeight).toBeGreaterThanOrEqual(
        narrowRows[1]!.bottom - 2
      );
      expect(narrowCollapsedHeight).toBeLessThanOrEqual(narrowRows[2]!.top + 2);

      await toggle(page).click();
      await expect(toggle(page)).toHaveText(/收起/);
      await expect
        .poll(() => formHeight(page))
        .toBeGreaterThanOrEqual(narrowRows[4]!.bottom - 2);

      await page.setViewportSize({ width: WIDE, height: 900 });
      await waitForRows(page, 2);
      await expect(toggle(page)).toHaveCount(0);
      const wideRowsAfter = await rowGeometry(page);
      await expect
        .poll(() => formHeight(page))
        .toBeLessThanOrEqual(wideRowsAfter[1]!.bottom + 2);
    });

    test('E2E-R9: 收起态可见行变高后表单高度跟随，按钮保持可用', async ({
      page,
    }) => {
      await openLab(page, lib, { expandStatus: false, width: NARROW });
      await waitForRows(page, 5);
      await expect(toggle(page)).toHaveText(/展开/);
      const before = await formHeight(page);

      await growField(page, 'f2', 96);
      await expect.poll(() => formHeight(page)).toBeGreaterThan(before + 20);
      await expect(toggle(page)).toBeVisible();
      await expect(toggle(page)).toHaveText(/展开/);
      await expectInsideForm(page, '[data-testid="height-box-f2"]');
    });

    test('E2E-R10: 收起态隐藏行变高不撑开表单，展开后完整可见', async ({
      page,
    }) => {
      await openLab(page, lib, { expandStatus: false, width: NARROW });
      await waitForRows(page, 5);
      const before = await formHeight(page);

      await growField(page, 'f5', 96);
      await page.waitForTimeout(300);
      expect(Math.abs((await formHeight(page)) - before)).toBeLessThanOrEqual(
        4
      );
      await expect(toggle(page)).toHaveText(/展开/);

      await toggle(page).click();
      await expect(toggle(page)).toHaveText(/收起/);
      await expect.poll(() => formHeight(page)).toBeGreaterThan(before + 20);
      await expectInsideForm(page, '[data-testid="height-box-f5"]');
    });

    test('E2E-R11~R12: 展开态行高变化与 resize 组合', async ({ page }) => {
      await openLab(page, lib, { expandStatus: true, width: NARROW });
      await waitForRows(page, 5);
      await expect(toggle(page)).toHaveText(/收起/);
      const before = await formHeight(page);

      await growField(page, 'f2', 96);
      await expect.poll(() => formHeight(page)).toBeGreaterThan(before + 20);
      const grown = await formHeight(page);

      await page.setViewportSize({ width: WIDE, height: 900 });
      await waitForRows(page, 2);
      await expect(toggle(page)).toHaveCount(0);
      const wideHeight = await formHeight(page);
      expect(wideHeight).toBeLessThan(grown - 20);

      await page.setViewportSize({ width: NARROW, height: 900 });
      await waitForRows(page, 5);
      await expect(toggle(page)).toBeVisible();
      await expect(toggle(page)).toHaveText(/收起/);
      await expect
        .poll(() => formHeight(page))
        .toBeGreaterThanOrEqual(grown - 4);
    });
  });
}
