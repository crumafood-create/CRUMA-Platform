import type { Preview } from '@storybook/nextjs-vite';

import '../src/app/globals.css';
import '../src/shared/design-system/styles/tokens.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#111111',
        },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
