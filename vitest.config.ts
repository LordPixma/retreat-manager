import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            JWT_SECRET: 'test-secret-key-for-testing',
            ADMIN_JWT_SECRET: 'test-admin-secret-key'
          },
          d1Databases: ['DB']
        }
      }
    },
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['functions/**/*.ts'],
      exclude: ['functions/_shared/types.ts']
    }
  }
});
