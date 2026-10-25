const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    { ignores: ['node_modules/'] },
    js.configs.recommended,
    {
        // Applet code runs inside Cinnamon's GJS (cjs) runtime, loaded by Cinnamon's xlet
        // loader, which provides require/module/exports in addition to the GJS globals.
        files: ['src/**/*.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'commonjs',
            globals: {
                imports: 'readonly',
                global: 'readonly',
                log: 'readonly',
                logError: 'readonly',
                _: 'readonly',
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
