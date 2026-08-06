import { expect, test } from '@playwright/test';

test.describe('Storybook visual baselines', () => {
  test('Button Default — light', async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: 'reduce',
    });

    await page.goto(
      '/iframe.html?id=primitives-button--default&viewMode=story'
    );

    const storyRoot = page.locator('#storybook-root');

    await expect(storyRoot).toBeVisible();
    await expect(
      storyRoot.getByRole('button', {
        name: 'Guardar cambios',
      })
    ).toBeVisible();

    await expect(storyRoot).toHaveScreenshot(
      'button-default-light.png'
    );
  });
});
