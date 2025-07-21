// Função para aguardar o Supabase estar disponível
function getSupabaseClient() {
    console.log('🔍 Verificando cliente Supabase...');
    console.log('window.supabaseClient:', window.supabaseClient);

    if (!window.supabaseClient) {
        console.error('❌ Supabase client não está disponível');
        return null;
    }

    console.log('✅ Cliente Supabase disponível');
    return window.supabaseClient;
}

function waitForSupabase() {
    console.log('⏳ Aguardando Supabase...');

    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 segundos máximo

        const checkSupabase = () => {
            attempts++;
            console.log(`🔄 Tentativa ${attempts}/${maxAttempts}`);

            // Verificar se o Supabase está disponível
            if (window.supabaseClient) {
                console.log('✅ Supabase client já disponível!');
                resolve(window.supabaseClient);
                return;
            }

            console.log('🔍 Verificando variáveis:', {
                supabase: !!window.supabase,
                url: !!window.SUPABASE_URL,
                key: !!window.SUPABASE_ANON_KEY
            });

            // Tentar inicializar se ainda não foi feito
            if (
                window.supabase &&
                window.SUPABASE_URL &&
                window.SUPABASE_ANON_KEY &&
                !window.supabaseClient
            ) {
                try {
                    console.log('🚀 Inicializando cliente Supabase...');
                    window.supabaseClient = window.supabase.createClient(
                        window.SUPABASE_URL,
                        window.SUPABASE_ANON_KEY
                    );
                    console.log('✅ Cliente Supabase inicializado com sucesso!');
                    resolve(window.supabaseClient);
                    return;
                } catch (error) {
                    console.error('❌ Erro ao inicializar Supabase:', error);
                }
            }

            if (attempts >= maxAttempts) {
                console.error('❌ Timeout: Supabase não pôde ser inicializado');
                reject(new Error('Timeout: Supabase não pôde ser inicializado'));
                return;
            }

            setTimeout(checkSupabase, 100);
        };

        checkSupabase();
    });
}

// Classe para gerenciar autenticação
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando AuthManager...');

        try {
            console.log('⏳ Aguardando Supabase...');
            await waitForSupabase();

            console.log('🔗 Obtendo cliente Supabase...');
            const supabase = getSupabaseClient();

            if (!supabase) {
                throw new Error('Falha ao obter cliente Supabase');
            }

            console.log('✅ Supabase disponível, configurando listeners básicos...');

            // Configurar listeners de autenticação
            supabase.auth.onAuthStateChange((event, session) => {
                console.log('🔄 Auth state change:', event, session?.user?.email || 'no user');
                this.handleAuthStateChange(event, session);
                this.currentUser = session?.user || null;
            });

            console.log('🎯 Configurando event listeners...');
            this.setupEventListeners();

            console.log('👤 Verificando usuário administrador...');
            // Tentar criar usuário admin se necessário (sem await para não bloquear)
            this.createAdminUserIfNeeded().catch(error => {
                console.log('ℹ️ Nota: Não foi possível verificar/criar usuário admin:', error.message);
            });

            console.log('🔍 Verificando fluxo de reset de senha...');
            this.checkResetPasswordFlow();

            console.log('✅ AuthManager inicializado com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao inicializar AuthManager:', error);

            // Mostrar erro na interface
            const loginAlert = document.getElementById('loginAlert');
            if (loginAlert) {
                loginAlert.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="bi bi-exclamation-triangle"></i>
                        Erro ao conectar: ${error.message}
                    </div>
                `;
            }
        }
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginFormElement')?.addEventListener('submit', e => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register form
        document.getElementById('registerFormElement')?.addEventListener('submit', e => {
            e.preventDefault();
            this.handleRegister();
        });

        // Forgot password form
        document.getElementById('forgotPasswordFormElement')?.addEventListener('submit', e => {
            e.preventDefault();
            this.handleForgotPassword();
        });

        // Reset password form
        document.getElementById('resetPasswordFormElement')?.addEventListener('submit', e => {
            e.preventDefault();
            this.handleResetPassword();
        });

        // Password strength indicators
        document.getElementById('registerPassword')?.addEventListener('input', e => {
            this.updatePasswordStrength(e.target.value, 'register');
        });

        document.getElementById('resetPassword')?.addEventListener('input', e => {
            this.updatePasswordStrength(e.target.value, 'reset');
        });

        // Confirm password validation
        document.getElementById('registerConfirmPassword')?.addEventListener('input', e => {
            this.validatePasswordConfirmation('register');
        });

        document.getElementById('resetConfirmPassword')?.addEventListener('input', e => {
            this.validatePasswordConfirmation('reset');
        });
    }

    async handleLogin() {
        console.log('🔐 Iniciando processo de login...');

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        console.log('📧 Email:', email);
        console.log('🔒 Password length:', password.length);

        if (!this.validateLoginForm(email, password)) {
            console.log('❌ Validação do formulário falhou');
            return;
        }

        console.log('✅ Formulário validado com sucesso');
        this.setLoading('loginFormElement', true);
        this.clearAlert('loginAlert');

        try {
            console.log('🔄 Obtendo cliente Supabase...');
            const supabase = getSupabaseClient();

            if (!supabase) {
                throw new Error('Cliente Supabase não disponível');
            }

            console.log('🚀 Tentando fazer login...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
                options: {
                    shouldCreateUser: false
                }
            });

            if (error) {
                console.log('❌ Erro no login:', error);
                throw error;
            }

            console.log('✅ Login bem-sucedido!', data);

            // Configurar persistência da sessão
            if (rememberMe) {
                localStorage.setItem('supabase.auth.remember', 'true');
            } else {
                localStorage.removeItem('supabase.auth.remember');
            }

            this.showAlert('loginAlert', 'Login realizado com sucesso!', 'success');

            // Verificar se é o primeiro login do admin
            if (email === 'msribeiro@trt15.jus.br') {
                console.log('👤 Verificando primeiro login do admin...');
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('first_login')
                    .eq('user_id', data.user.id)
                    .single();

                if (profile?.first_login) {
                    console.log('🔄 Redirecionando para configurações (primeiro login)...');
                    // Redirecionar para configurações para trocar senha
                    setTimeout(() => {
                        window.location.href = 'settings.html?first_login=true';
                    }, 1500);
                    return;
                }
            }

            console.log('🏠 Redirecionando para página principal...');
            // Redirecionar para a aplicação principal
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('❌ Erro no login:', error);
            let message = 'Erro ao fazer login. Tente novamente.';

            if (error.message.includes('Invalid login credentials')) {
                message = 'E-mail ou senha incorretos.';
            } else if (error.message.includes('Email not confirmed')) {
                message = 'Por favor, confirme seu e-mail antes de fazer login.';
            }

            this.showAlert('loginAlert', message, 'danger');
        } finally {
            this.setLoading('loginFormElement', false);
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        if (!this.validateRegisterForm(name, email, password, confirmPassword)) {
            return;
        }

        this.setLoading('registerFormElement', true);
        this.clearAlert('registerAlert');

        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name
                    },
                    emailRedirectTo: `${window.location.origin}/auth.html`
                }
            });

            if (error) {
                throw error;
            }

            if (data.user && !data.session) {
                // E-mail de confirmação foi enviado
                this.showAlert(
                    'registerAlert',
                    'Conta criada com sucesso! Verifique seu e-mail para confirmar a conta.',
                    'success'
                );

                setTimeout(() => {
                    this.showLogin();
                }, 3000);
            } else {
                // Usuário foi criado e logado automaticamente
                this.showAlert('registerAlert', 'Conta criada com sucesso!', 'success');

                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            let message = 'Erro ao criar conta. Tente novamente.';

            if (error.message.includes('User already registered')) {
                message = 'Este e-mail já está cadastrado.';
            } else if (error.message.includes('Password should be at least')) {
                message = 'A senha deve ter pelo menos 6 caracteres.';
            }

            this.showAlert('registerAlert', message, 'danger');
        } finally {
            this.setLoading('registerFormElement', false);
        }
    }

    async handleForgotPassword() {
        const email = document.getElementById('forgotEmail').value;

        if (!this.validateEmail(email)) {
            this.showAlert('forgotAlert', 'Por favor, insira um e-mail válido.', 'danger');
            return;
        }

        this.setLoading('forgotPasswordFormElement', true);
        this.clearAlert('forgotAlert');

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth.html?reset=true`
            });

            if (error) {
                throw error;
            }

            this.showAlert(
                'forgotAlert',
                'Link de recuperação enviado! Verifique seu e-mail.',
                'success'
            );

            setTimeout(() => {
                this.showLogin();
            }, 3000);
        } catch (error) {
            console.error('Erro ao enviar e-mail de recuperação:', error);
            this.showAlert(
                'forgotAlert',
                'Erro ao enviar e-mail de recuperação. Tente novamente.',
                'danger'
            );
        } finally {
            this.setLoading('forgotPasswordFormElement', false);
        }
    }

    async handleResetPassword() {
        const password = document.getElementById('resetPassword').value;
        const confirmPassword = document.getElementById('resetConfirmPassword').value;

        if (!this.validatePasswordReset(password, confirmPassword)) {
            return;
        }

        this.setLoading('resetPasswordFormElement', true);
        this.clearAlert('resetAlert');

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) {
                throw error;
            }

            this.showAlert('resetAlert', 'Senha atualizada com sucesso!', 'success');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } catch (error) {
            console.error('Erro ao redefinir senha:', error);
            this.showAlert('resetAlert', 'Erro ao redefinir senha. Tente novamente.', 'danger');
        } finally {
            this.setLoading('resetPasswordFormElement', false);
        }
    }

    async createAdminUserIfNeeded() {
        try {
            const supabase = getSupabaseClient();

            if (!supabase) {
                console.log('Cliente Supabase não disponível para criar admin');
                return;
            }

            // Verificar se já existe um perfil admin na tabela user_profiles
            const { data: existingProfile, error: queryError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('role', 'admin')
                .limit(1);

            if (queryError) {
                console.log('Erro ao verificar perfil admin existente:', queryError.message);
                // Se a tabela não existe, isso é esperado na primeira execução
                if (queryError.message.includes('relation "user_profiles" does not exist')) {
                    console.log('Tabela user_profiles não existe ainda. Execute o script SQL primeiro.');
                    return;
                }
            }

            if (!existingProfile || existingProfile.length === 0) {
                console.log('Criando usuário administrador...');
                // Criar usuário administrador
                const { data, error } = await supabase.auth.signUp({
                    email: 'msribeiro@trt15.jus.br',
                    password: 'TrT15@2025tmp',
                    options: {
                        data: {
                            full_name: 'Marcelo S Ribeiro',
                            role: 'admin'
                        }
                    }
                });

                if (error) {
                    console.log('Erro ao criar usuário admin:', error.message);
                    // Se o usuário já existe, apenas criar o perfil
                    if (error.message.includes('already registered')) {
                        console.log('Usuário já existe, verificando se precisa criar perfil...');

                        // Buscar o usuário pelo email
                        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
                        if (!listError && users && users.users) {
                            const adminUser = users.users.find(user => user.email === 'msribeiro@trt15.jus.br');
                            if (adminUser) {
                                await this.createAdminProfile(adminUser.id);
                            }
                        }
                    }
                } else if (data.user) {
                    console.log('Usuário criado com sucesso, criando perfil...');
                    await this.createAdminProfile(data.user.id);
                }
            } else {
                console.log('Usuário admin já existe no sistema.');
            }
        } catch (error) {
            console.log('Erro na verificação/criação do usuário admin:', error.message);
        }
    }

    async createAdminProfile(userId) {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.from('user_profiles').upsert(
                {
                    user_id: userId,
                    full_name: 'Marcelo S Ribeiro',
                    role: 'admin',
                    first_login: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    onConflict: 'user_id'
                }
            );

            if (error) {
                console.error('Erro ao criar perfil admin:', error);
            } else {
                console.log('Perfil admin criado com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao criar perfil admin:', error);
        }
    }

    checkResetPasswordFlow() {
        const urlParams = new URLSearchParams(window.location.search);
        const isReset = urlParams.get('reset');
        const accessToken = urlParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token');

        if (isReset && accessToken && refreshToken) {
            // Usuário veio do link de reset de senha
            this.showResetPassword();
        }
    }

    handleAuthStateChange(event, session) {
        if (event === 'SIGNED_IN') {
            console.log('Usuário logado:', session.user);
        } else if (event === 'SIGNED_OUT') {
            console.log('Usuário deslogado');
            localStorage.removeItem('supabase.auth.remember');
        }
    }

    // Validações
    validateLoginForm(email, password) {
        console.log('🔍 Validando formulário de login...');
        console.log('Email válido:', this.validateEmail(email));
        console.log('Senha válida:', password && password.length >= 1);

        let isValid = true;

        if (!this.validateEmail(email)) {
            console.log('❌ Email inválido');
            this.setFieldInvalid('loginEmail');
            isValid = false;
        } else {
            console.log('✅ Email válido');
            this.setFieldValid('loginEmail');
        }

        if (!password || password.length < 1) {
            console.log('❌ Senha inválida');
            this.setFieldInvalid('loginPassword');
            isValid = false;
        } else {
            console.log('✅ Senha válida');
            this.setFieldValid('loginPassword');
        }

        console.log('Formulário válido:', isValid);
        return isValid;
    }

    validateRegisterForm(name, email, password, confirmPassword) {
        let isValid = true;

        if (!name || name.length < 2) {
            this.setFieldInvalid('registerName');
            isValid = false;
        } else {
            this.setFieldValid('registerName');
        }

        // Validar email institucional
        if (!this.validateInstitutionalEmail(email)) {
            this.setFieldInvalid('registerEmail');
            // Mostrar mensagem específica sobre email institucional
            this.showAlert(
                'registerAlert',
                'Por favor, use um email institucional @trt15.jus.br para se registrar.',
                'warning'
            );
            isValid = false;
        } else {
            this.setFieldValid('registerEmail');
        }

        if (!this.validatePassword(password)) {
            this.setFieldInvalid('registerPassword');
            isValid = false;
        } else {
            this.setFieldValid('registerPassword');
        }

        if (password !== confirmPassword) {
            this.setFieldInvalid('registerConfirmPassword');
            isValid = false;
        } else {
            this.setFieldValid('registerConfirmPassword');
        }

        return isValid;
    }

    validatePasswordReset(password, confirmPassword) {
        let isValid = true;

        if (!this.validatePassword(password)) {
            this.setFieldInvalid('resetPassword');
            isValid = false;
        } else {
            this.setFieldValid('resetPassword');
        }

        if (password !== confirmPassword) {
            this.setFieldInvalid('resetConfirmPassword');
            isValid = false;
        } else {
            this.setFieldValid('resetConfirmPassword');
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validateInstitutionalEmail(email) {
        // Validar se é um email válido primeiro
        if (!this.validateEmail(email)) {
            return false;
        }

        // Verificar se é do domínio institucional
        const allowedDomain = '@trt15.jus.br';
        return email.toLowerCase().endsWith(allowedDomain);
    }

    validatePassword(password) {
        // Mínimo 6 caracteres para facilitar testes
        return password && password.length >= 6;
    }

    validatePasswordConfirmation(formType) {
        const password = document.getElementById(`${formType}Password`).value;
        const confirmPassword = document.getElementById(`${formType}ConfirmPassword`).value;

        if (confirmPassword && password !== confirmPassword) {
            this.setFieldInvalid(`${formType}ConfirmPassword`);
        } else if (confirmPassword) {
            this.setFieldValid(`${formType}ConfirmPassword`);
        }
    }

    updatePasswordStrength(password, formType) {
        const strengthContainer = document.querySelector(`#${formType}Form .password-strength`);
        const strengthBar = strengthContainer.querySelector('.strength-bar');
        const strengthText = strengthContainer.querySelector('.strength-text');

        if (!password) {
            strengthBar.className = 'strength-bar';
            strengthText.textContent = 'Digite uma senha para ver sua força';
            strengthText.className = 'strength-text text-muted';
            return;
        }

        let strength = 0;
        const feedback = [];

        // Verificações de força
        if (password.length >= 8) {
            strength++;
        } else {
            feedback.push('pelo menos 8 caracteres');
        }

        if (/[a-z]/.test(password)) {
            strength++;
        } else {
            feedback.push('letras minúsculas');
        }

        if (/[A-Z]/.test(password)) {
            strength++;
        } else {
            feedback.push('letras maiúsculas');
        }

        if (/\d/.test(password)) {
            strength++;
        } else {
            feedback.push('números');
        }

        if (/[@$!%*#?&]/.test(password)) {
            strength++;
        } else {
            feedback.push('caracteres especiais');
        }

        // Atualizar visual
        strengthBar.className = 'strength-bar';
        if (strength <= 2) {
            strengthBar.classList.add('strength-weak');
            strengthText.textContent = 'Senha fraca';
            strengthText.className = 'strength-text text-danger';
        } else if (strength <= 4) {
            strengthBar.classList.add('strength-medium');
            strengthText.textContent = 'Senha média';
            strengthText.className = 'strength-text text-warning';
        } else {
            strengthBar.classList.add('strength-strong');
            strengthText.textContent = 'Senha forte';
            strengthText.className = 'strength-text text-success';
        }

        if (feedback.length > 0) {
            strengthText.textContent += ` (falta: ${feedback.join(', ')})`;
        }
    }

    // Utilitários de UI
    setFieldValid(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }

    setFieldInvalid(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
    }

    setLoading(formId, loading) {
        const form = document.getElementById(formId);
        if (loading) {
            form.classList.add('loading');
        } else {
            form.classList.remove('loading');
        }
    }

    showAlert(containerId, message, type) {
        const container = document.getElementById(containerId);
        container.innerHTML = `
            <div class="alert alert-${type} fade-in" role="alert">
                <i class="bi bi-${this.getAlertIcon(type)} me-2"></i>
                ${message}
            </div>
        `;
    }

    clearAlert(containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
    }

    getAlertIcon(type) {
        const icons = {
            success: 'check-circle',
            danger: 'exclamation-triangle',
            warning: 'exclamation-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Navegação entre formulários
    showForm(formId) {
        // Esconder todos os formulários
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Mostrar o formulário solicitado
        const targetForm = document.getElementById(formId);
        targetForm.classList.remove('hidden');
        targetForm.classList.add('fade-in');

        // Limpar alertas
        this.clearAlert('loginAlert');
        this.clearAlert('registerAlert');
        this.clearAlert('forgotAlert');
        this.clearAlert('resetAlert');
    }

    showLogin() {
        this.showForm('loginForm');
    }

    showRegister() {
        this.showForm('registerForm');
    }

    showForgotPassword() {
        this.showForm('forgotPasswordForm');
    }

    showResetPassword() {
        this.showForm('resetPasswordForm');
    }

    // Logout
    async logout() {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw error;
            }

            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    }

    // Verificar se usuário está logado
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Obter usuário atual
    getCurrentUser() {
        return this.currentUser;
    }
}

// Funções globais para navegação
function showLogin() {
    authManager.showLogin();
}

function showRegister() {
    authManager.showRegister();
}

function showForgotPassword() {
    authManager.showForgotPassword();
}

function showResetPassword() {
    authManager.showResetPassword();
}

// Inicializar AuthManager quando a página carregar
document.addEventListener('DOMContentLoaded', async() => {
    console.log('📄 DOM carregado, inicializando AuthManager...');

    try {
        const authManager = new AuthManager();
        console.log('🏗️ AuthManager criado, iniciando init...');
        await authManager.init();
        console.log('🎉 AuthManager inicializado com sucesso!');

        // Exportar para uso global
        window.authManager = authManager;
    } catch (error) {
        console.error('💥 Erro fatal na inicialização:', error);

        // Mostrar erro na interface
        const loginAlert = document.getElementById('loginAlert');
        if (loginAlert) {
            loginAlert.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="bi bi-exclamation-triangle"></i>
                    Erro ao inicializar o sistema: ${error.message}
                </div>
            `;
        }
    }
});
