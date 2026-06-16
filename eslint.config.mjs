import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importPlugin from 'eslint-plugin-import'

const domains = [
  'casino',
  'predictions',
  'bonus',
  'guild',
  'transactions',
  'raffle',
  'user',
  'atm',
  'vip',
  'blackjack'
]

const domainBoundaryZones = domains.flatMap((target) =>
  domains
    .filter((from) => from !== target)
    .map((from) => ({
      target: `src/${target}`,
      from: `src/${from}`,
      message: `Domain "${target}" must not import from sibling domain "${from}". Use common/ or dependency injection.`
    }))
)

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**']
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: false
        }
      ]
    }
  },
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    files: ['src/{casino,predictions,bonus,guild,transactions,raffle,user,atm,vip,blackjack}/**/*.ts'],
    plugins: {
      import: importPlugin
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            ...domainBoundaryZones,
            {
              target: 'src/common',
              from: 'src/casino',
              message: 'common/ must not import from domain modules.'
            },
            {
              target: 'src/common',
              from: 'src/guild',
              message: 'common/ must not import from domain modules.'
            }
          ]
        }
      ]
    }
  }
]
