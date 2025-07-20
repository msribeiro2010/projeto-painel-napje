module.exports = {
    // Ambiente de teste
    testEnvironment: 'jsdom',

    // Padrões de arquivos de teste
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js', '**/__tests__/**/*.js'],

    // Arquivos a serem ignorados
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

    // Configuração de cobertura
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],

    // Arquivos para análise de cobertura
    collectCoverageFrom: [
        '*.js',
        '!node_modules/**',
        '!coverage/**',
        '!jest.config.js',
        '!server/**'
    ],

    // Limites de cobertura desabilitados para projeto frontend
    // coverageThreshold: {
    //     global: {
    //         branches: 30,
    //         functions: 30,
    //         lines: 30,
    //         statements: 30
    //     }
    // },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

    // Mocks globais
    globals: {
        window: {},
        document: {},
        navigator: {
            userAgent: 'node.js'
        }
    },

    // Transformações
    transform: {
        '^.+\\.js$': 'babel-jest'
    },

    // Módulos a serem mockados
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
    },

    // Timeout para testes
    testTimeout: 10000,

    // Verbose output
    verbose: true
};
