import globals from 'globals'
// import tseslint from 'typescript-eslint'

import path from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import pluginJs from '@eslint/js'

// mimic CommonJS variables -- not needed if using CommonJS
// eslint-disable-next-line
const __filename = fileURLToPath(import.meta.url)
// eslint-disable-next-line
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: pluginJs.configs.recommended })

export default [
  { languageOptions: { globals: globals.node } },
  ...compat.extends('standard-with-typescript'),
  {
    files: ['test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': ['off'],
      '@typescript-eslint/no-var-requires': ['off']
    }
  },
  {
    ignores: ['wallets']
  }
  // ...tseslint.configs.recommended
]
