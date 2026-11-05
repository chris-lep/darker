const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    { ignores: ['node_modules/', 'build/'] },
    js.configs.recommended,
    {
        // Applet code runs inside Cinnamon's GJS (cjs) runtime. Cinnamon 6.6's xlet loader
        // provides require/module/exports; on 6.8+, `module` is undefined (see CLAUDE.md).
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                imports: 'readonly',
                global: 'readonly',
                log: 'readonly',
                logError: 'readonly',
                require: 'readonly',
                module: 'writable',
                exports: 'writable',
            },
        },
        rules: {
            // main() is called by Cinnamon's applet manager.
            'no-unused-vars': ['error', { varsIgnorePattern: '^main$', argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['test/**/*.js', 'scripts/**/*.js', 'eslint.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: globals.node,
        },
    },
];
