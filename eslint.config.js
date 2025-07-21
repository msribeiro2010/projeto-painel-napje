module.exports = [
    {
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'script',
            globals: {
                // Browser globals
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                sessionStorage: 'readonly',
                fetch: 'readonly',
                URLSearchParams: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                alert: 'readonly',
                confirm: 'readonly',
                prompt: 'readonly',
                navigator: 'readonly',
                Audio: 'readonly',
                MutationObserver: 'readonly',

                // Service Worker globals
                self: 'readonly',
                caches: 'readonly',

                // Node.js globals (for server files)
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'readonly',
                global: 'readonly',

                // Project specific globals
                supabase: 'readonly',
                Sortable: 'readonly',
                confetti: 'readonly',
                flatpickr: 'readonly',
                bootstrap: 'readonly',
                Chart: 'readonly',
                removeFavorite: 'readonly',
                emojiMap: 'readonly',
                pararTodasAnimacoes: 'readonly',

                // Auth related globals
                authManager: 'writable',
                supabaseManager: 'writable',
                showLogin: 'readonly',
                showRegister: 'readonly',
                showForgotPassword: 'readonly',
                showResetPassword: 'readonly'
            }
        },
        rules: {
            'indent': ['warn', 4],
            'quotes': ['warn', 'single'],
            'semi': ['warn', 'always'],
            'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
            'no-console': 'off',
            'no-debugger': 'error',
            'no-alert': 'warn',
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-undef': 'error',
            'eqeqeq': 'error',
            'curly': ['error', 'multi-line'],
            'brace-style': ['error', '1tbs'],
            'comma-dangle': ['error', 'never'],
            'space-before-blocks': ['error'],
            'keyword-spacing': 'error',
            'no-trailing-spaces': 'warn',
            'object-curly-spacing': ['error', 'always'],
            'space-infix-ops': 'error',
            'eol-last': 'error'
        },
        files: ['*.js', '!node_modules/**', '!dist/**', '!coverage/**']
    },
    {
        // Configuração específica para arquivos do servidor
        files: ['server/**/*.js'],
        languageOptions: {
            sourceType: 'commonjs',
            globals: {
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                global: 'readonly'
            }
        }
    }
];
