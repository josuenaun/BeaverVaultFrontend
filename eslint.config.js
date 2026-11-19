// eslint.config.js - Configuración de linter ESLint en formato plano para BeaverVault
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

// Configuración modular de reglas de calidad de código
export default defineConfig([
  // Ignorar artefactos de compilación
  globalIgnores(['dist']),

  // Reglas para archivos JavaScript y React JSX
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    // Variables globales del navegador y soporte de sintaxis JSX
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // Personalización de reglas para React Hooks y variables no usadas
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
])
