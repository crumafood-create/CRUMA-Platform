import { expect, test } from '@playwright/test';

type VisualStory = {
  id: string;
  name: string;
  interaction?: 'hover' | 'focus';
};

const stories: VisualStory[] = [
  {
    id: 'primitives-button--default',
    name: 'Button Default',
  },
  {
    id: 'primitives-button--primary',
    name: 'Button Primary',
  },
  {
    id: 'primitives-button--secondary',
    name: 'Button Secondary',
  },
  {
    id: 'primitives-button--outline',
    name: 'Button Outline',
  },
  {
    id: 'primitives-button--small',
    name: 'Button Small',
  },
  {
    id: 'primitives-button--medium',
    name: 'Button Medium',
  },
  {
    id: 'primitives-button--large',
    name: 'Button Large',
  },
  {
    id: 'primitives-button--disabled',
    name: 'Button Disabled',
  },
  {
    id: 'primitives-button--loading',
    name: 'Button Loading',
  },
  {
    id: 'primitives-button--hover',
    name: 'Button Hover',
    interaction: 'hover',
  },
  {
    id: 'primitives-button--focus',
    name: 'Button Focus',
    interaction: 'focus',
  },
  {
    id: 'data-display-metric-card--default',
    name: 'Metric Card',
  },
  {
    id: 'data-display-stat-card--success',
    name: 'Stat Card',
  },
  {
    id: 'data-display-status--success',
    name: 'Status',
  },
  {
    id: 'data-display-timeline--default',
    name: 'Timeline',
  },
  {
    id: 'data-display-data-list--default',
    name: 'Data List',
  },
  {
    id: 'data-display-activity-feed--default',
    name: 'Activity Feed',
  },
];

test.describe('Storybook visual baselines', () => {
  for (const story of stories) {
    test(`${story.name} — visual`, async ({ page }, testInfo) => {
    await page.emulateMedia({
      reducedMotion: 'reduce',
    });

      await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);

      if (testInfo.project.name === 'chromium-dark') {
        await page.locator('html').evaluate((html) => {
          html.classList.add('dark');
        });
      }

      const storyRoot = page.locator('#storybook-root');

      await expect(storyRoot).toBeVisible();
      await expect(storyRoot).not.toBeEmpty();

      if (story.interaction) {
        const button = storyRoot.getByRole('button');

        if (story.interaction === 'hover') {
          await button.hover();
        } else {
          await button.focus();
        }
      }

      await expect(storyRoot).toHaveScreenshot(
        `${story.id.replaceAll('--', '-')}.png`
      );
    });
  }
});
