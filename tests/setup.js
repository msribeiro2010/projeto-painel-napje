// Setup global para testes Jest

// Mock do Supabase
global.supabase = {
    auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        onAuthStateChange: jest.fn()
    },
    from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
    }))
};

// Mock do localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock do sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock de funções do DOM
global.document = {
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(),
    createElement: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock do window
global.window = {
    location: {
        href: 'http://localhost:3000',
        hostname: 'localhost',
        pathname: '/'
    },
    open: jest.fn(),
    alert: jest.fn(),
    confirm: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
};

// Mock de console para testes mais limpos
global.console = {
    ...console,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
};

// Configurações globais para testes
jest.setTimeout(10000);

// Limpar mocks antes de cada teste
beforeEach(() => {
    jest.clearAllMocks();
});