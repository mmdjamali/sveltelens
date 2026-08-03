import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'SvelteLens',
  description: 'A local developer observability dashboard for SvelteKit, inspired by Laravel Telescope.',
  appearance: 'force-dark',
  cleanUrls: true,

  head: [['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }]],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/what-is-sveltelens' },
      { text: 'GitHub', link: 'https://github.com/mmdjamali/sveltescope' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'What is Sveltelens?', link: '/guide/what-is-sveltelens' },
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Configuration', link: '/guide/configuration' },
          { text: 'How It Works', link: '/guide/how-it-works' },
        ],
      },
      {
        text: 'Adapters',
        items: [
          { text: 'SQLite', link: '/guide/adapters/sqlite' },
          { text: 'PostgreSQL', link: '/guide/adapters/pg' },
          { text: 'MySQL', link: '/guide/adapters/mysql2' },
          { text: 'libSQL / Turso', link: '/guide/adapters/libsql' },
          { text: 'PostgreSQL (postgres.js)', link: '/guide/adapters/postgres-js' },
        ],
      },
    ],

    socialLinks: [{ icon: 'github', link: 'https://github.com/mmdjamali/sveltescope' }],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/mmdjamali/sveltescope/edit/main/packages/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
    },
  },
});
