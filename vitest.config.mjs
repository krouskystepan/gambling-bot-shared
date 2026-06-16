import { defineConfig } from 'vitest/config'

import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))

const domainAlias = (name) => path.resolve(root, `src/${name}/index.ts`)

const domains = [
  'common',
  'casino',
  'predictions',
  'bonus',
  'guild',
  'transactions',
  'raffle',
  'blackjack',
  'user',
  'atm',
  'vip',
  'mongoose'
]

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      domains.map((name) => [`gambling-bot-shared/${name}`, domainAlias(name)])
    )
  },
  test: {
    include: ['test/**/*.test.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/index.ts',
        'src/**/types/**',
        'src/**/services/types.ts',
        'src/mongoose/**',
        'src/**/*.mongoose.ts',
        'src/**/*.forms.ts',
        'src/**/services/*db.ts',
        'src/casino/services/casinoBet.service.ts'
      ],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100
      }
    }
  }
})
