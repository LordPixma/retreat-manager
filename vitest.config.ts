import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

export default defineWorkersConfig({
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            // Must be >= 32 chars (requireSecret) so token generation works in
            // the endpoint integration tests.
            JWT_SECRET: 'test-secret-key-for-testing-0123456789abcdef',
            ADMIN_JWT_SECRET: 'test-admin-secret-key-0123456789abcdef'
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
