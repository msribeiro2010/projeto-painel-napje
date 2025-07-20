// Função para aguardar o Supabase estar disponível
function getSupabaseClient() {
    return window.supabaseClient;
}

function waitForSupabase() {
    return new Promise(resolve => {
        if (window.supabaseClient) {
            resolve(window.supabaseClient);
        } else {
            setTimeout(() => {
                waitForSupabase().then(resolve);
            }, 100);
        }
    });
}

// Classe para gerenciar configurações do usuário
class SettingsManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    async init() {
        // Aguardar Supabase estar disponível
        await waitForSupabase();

        // Verificar autenticação
        await this.checkAuthentication();

        // Carregar dados do usuário
        await this.loadUserData();

        // Verificar se é primeiro login
        this.checkFirstLogin();

        // Configurar event listeners
        this.setupEventListeners();

        // Carregar preferências
        await this.loadUserPreferences();
    }

    async checkAuthentication() {
        const supabase = getSupabaseClient();
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            // Usuário não autenticado, redirecionar para login
            window.location.href = 'auth.html';
            return;
        }

        this.currentUser = user;
    }

    async loadUserData() {
        if (!this.currentUser) {
            return;
        }

        // Carregar dados do perfil
        const supabase = getSupabaseClient();
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', this.currentUser.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.error('Erro ao carregar perfil:', error);
        }

        this.userProfile = profile;

        // Atualizar UI com dados do usuário
        this.updateUserInfo();
    }

    updateUserInfo() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');

        const displayName =
            this.userProfile?.full_name || this.currentUser.user_metadata?.full_name || 'Usuário';
        const email = this.currentUser.email;

        userName.textContent = displayName;
        userEmail.textContent = email;
        profileName.value = displayName;
        profileEmail.value = email;
    }

    checkFirstLogin() {
        const urlParams = new URLSearchParams(window.location.search);
        const isFirstLogin =
            urlParams.get('first_login') === 'true' || this.userProfile?.first_login;

        if (isFirstLogin) {
            document.getElementById('firstLoginWarning').style.display = 'block';
            // Focar no campo de senha atual
            setTimeout(() => {
                document.getElementById('currentPassword').focus();
            }, 500);
        }
    }

    setupEventListeners() {
        // Profile form
        document.getElementById('profileForm').addEventListener('submit', e => {
            e.preventDefault();
            this.handleProfileUpdate();
        });

        // Password form
        document.getElementById('passwordForm').addEventListener('submit', e => {
            e.preventDefault();
            this.handlePasswordChange();
        });

        // Preferences form
        document.getElementById('preferencesForm').addEventListener('submit', e => {
            e.preventDefault();
            this.handlePreferencesUpdate();
        });

        // Password strength indicator
        document.getElementById('newPassword').addEventListener('input', e => {
            this.updatePasswordStrength(e.target.value);
        });

        // Confirm password validation
        document.getElementById('confirmNewPassword').addEventListener('input', () => {
            this.validatePasswordConfirmation();
        });

        // Delete account confirmation
        document.getElementById('deleteConfirmation').addEventListener('input', e => {
            const confirmBtn = document.getElementById('confirmDeleteBtn');
            confirmBtn.disabled = e.target.value !== 'EXCLUIR';
        });
    }

    async handleProfileUpdate() {
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;

        if (!this.validateProfileForm(name, email)) {
            return;
        }

        this.setLoading('profileForm', true);
        this.clearAlert('profileAlert');

        try {
            const supabase = getSupabaseClient();
            // Atualizar e-mail se mudou
            if (email !== this.currentUser.email) {
                const { error: emailError } = await supabase.auth.updateUser({
                    email: email
                });

                if (emailError) {
                    throw emailError;
                }

                this.showAlert(
                    'profileAlert',
                    'E-mail atualizado! Verifique sua caixa de entrada para confirmar o novo e-mail.',
                    'warning'
                );
            }

            // Atualizar nome no perfil
            const { error: profileError } = await supabase.from('user_profiles').upsert({
                user_id: this.currentUser.id,
                full_name: name,
                updated_at: new Date().toISOString()
            });

            if (profileError) {
                throw profileError;
            }

            // Atualizar metadados do usuário
            const { error: metadataError } = await supabase.auth.updateUser({
                data: { full_name: name }
            });

            if (metadataError) {
                console.warn('Erro ao atualizar metadados:', metadataError);
            }

            this.showAlert('profileAlert', 'Perfil atualizado com sucesso!', 'success');

            // Recarregar dados do usuário
            await this.loadUserData();
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            let message = 'Erro ao atualizar perfil. Tente novamente.';

            if (error.message.includes('email')) {
                message = 'Erro ao atualizar e-mail. Verifique se o e-mail é válido.';
            }

            this.showAlert('profileAlert', message, 'danger');
        } finally {
            this.setLoading('profileForm', false);
        }
    }

    async handlePasswordChange() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (!this.validatePasswordForm(currentPassword, newPassword, confirmPassword)) {
            return;
        }

        this.setLoading('passwordForm', true);
        this.clearAlert('passwordAlert');

        try {
            const supabase = getSupabaseClient();
            // Verificar senha atual fazendo login
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: this.currentUser.email,
                password: currentPassword
            });

            if (signInError) {
                throw new Error('Senha atual incorreta');
            }

            // Atualizar senha
            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) {
                throw updateError;
            }

            // Marcar que não é mais primeiro login
            if (this.userProfile?.first_login) {
                await supabase
                    .from('user_profiles')
                    .update({
                        first_login: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', this.currentUser.id);

                // Esconder aviso de primeiro login
                document.getElementById('firstLoginWarning').style.display = 'none';
            }

            this.showAlert('passwordAlert', 'Senha alterada com sucesso!', 'success');

            // Limpar campos
            document.getElementById('passwordForm').reset();
            this.updatePasswordStrength('');
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            let message = 'Erro ao alterar senha. Tente novamente.';

            if (error.message.includes('atual incorreta')) {
                message = 'Senha atual incorreta.';
            }

            this.showAlert('passwordAlert', message, 'danger');
        } finally {
            this.setLoading('passwordForm', false);
        }
    }

    async handlePreferencesUpdate() {
        const theme = document.querySelector('input[name="theme"]:checked').value;
        const emailNotifications = document.getElementById('emailNotifications').checked;
        const birthdayNotifications = document.getElementById('birthdayNotifications').checked;

        this.setLoading('preferencesForm', true);
        this.clearAlert('preferencesAlert');

        try {
            // Verificar se o usuário está autenticado
            if (!this.currentUser) {
                throw new Error('Usuário não autenticado');
            }

            // Obter token de acesso
            const supabase = getSupabaseClient();
            const {
                data: { session }
            } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Sessão não encontrada');
            }

            // Salvar preferências através do endpoint do servidor
            const response = await fetch('/api/supabase/user-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    theme: theme,
                    email_notifications: emailNotifications,
                    birthday_notifications: birthdayNotifications
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar preferências');
            }

            // Aplicar tema imediatamente
            this.applyTheme(theme);

            this.showAlert('preferencesAlert', 'Preferências salvas com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao salvar preferências:', error);
            this.showAlert(
                'preferencesAlert',
                'Erro ao salvar preferências. Tente novamente.',
                'danger'
            );
        } finally {
            this.setLoading('preferencesForm', false);
        }
    }

    async loadUserPreferences() {
        try {
            // Verificar se o usuário está autenticado
            if (!this.currentUser) {
                console.warn('Usuário não autenticado, não é possível carregar preferências');
                return;
            }

            // Obter token de acesso
            const {
                data: { session }
            } = await supabase.auth.getSession();
            if (!session) {
                console.warn('Sessão não encontrada, não é possível carregar preferências');
                return;
            }

            // Buscar preferências através do endpoint do servidor
            const response = await fetch('/api/supabase/user-settings', {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Nenhuma configuração encontrada para o usuário');
                    return;
                }
                throw new Error('Erro ao carregar preferências');
            }

            const data = await response.json();
            const settings = data.settings;

            if (settings) {
                // Aplicar configurações na UI
                document.querySelector(
                    `input[name="theme"][value="${settings.theme || 'auto'}"]`
                ).checked = true;
                document.getElementById('emailNotifications').checked =
                    settings.email_notifications !== false;
                document.getElementById('birthdayNotifications').checked =
                    settings.birthday_notifications !== false;

                // Aplicar tema
                this.applyTheme(settings.theme || 'auto');
            }
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }

    applyTheme(theme) {
        const body = document.body;

        // Remover classes de tema existentes
        body.classList.remove('theme-light', 'theme-dark');

        if (theme === 'light') {
            body.classList.add('theme-light');
        } else if (theme === 'dark') {
            body.classList.add('theme-dark');
        } else {
            // Tema automático - usar preferência do sistema
            if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                body.classList.add('theme-dark');
            } else {
                body.classList.add('theme-light');
            }
        }
    }

    // Validações
    validateProfileForm(name, email) {
        let isValid = true;

        if (!name || name.length < 2) {
            this.setFieldInvalid('profileName');
            isValid = false;
        } else {
            this.setFieldValid('profileName');
        }

        if (!this.validateEmail(email)) {
            this.setFieldInvalid('profileEmail');
            isValid = false;
        } else {
            this.setFieldValid('profileEmail');
        }

        return isValid;
    }

    validatePasswordForm(currentPassword, newPassword, confirmPassword) {
        let isValid = true;

        if (!currentPassword) {
            this.setFieldInvalid('currentPassword');
            isValid = false;
        } else {
            this.setFieldValid('currentPassword');
        }

        if (!this.validatePassword(newPassword)) {
            this.setFieldInvalid('newPassword');
            isValid = false;
        } else {
            this.setFieldValid('newPassword');
        }

        if (newPassword !== confirmPassword) {
            this.setFieldInvalid('confirmNewPassword');
            isValid = false;
        } else {
            this.setFieldValid('confirmNewPassword');
        }

        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePassword(password) {
        // Mínimo 8 caracteres, pelo menos 1 letra, 1 número e 1 caractere especial
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        return passwordRegex.test(password);
    }

    validatePasswordConfirmation() {
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;

        if (confirmPassword && newPassword !== confirmPassword) {
            this.setFieldInvalid('confirmNewPassword');
        } else if (confirmPassword) {
            this.setFieldValid('confirmNewPassword');
        }
    }

    updatePasswordStrength(password) {
        const strengthContainer = document.querySelector('.password-strength');
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

    // Exclusão de conta
    async deleteAccount() {
        this.setLoading('confirmDeleteBtn', true);

        try {
            const supabase = getSupabaseClient();
            // Deletar dados do usuário
            await supabase.from('user_profiles').delete().eq('user_id', this.currentUser.id);

            await supabase.from('user_settings').delete().eq('user_id', this.currentUser.id);

            await supabase.from('favoritos').delete().eq('user_id', this.currentUser.id);

            // Deletar conta do usuário
            const { error } = await supabase.auth.admin.deleteUser(this.currentUser.id);

            if (error) {
                throw error;
            }

            // Fazer logout
            await supabase.auth.signOut();

            alert('Conta excluída com sucesso.');
            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            alert('Erro ao excluir conta. Tente novamente ou entre em contato com o suporte.');
        } finally {
            this.setLoading('confirmDeleteBtn', false);
        }
    }
}

// Funções globais
function confirmDeleteAccount() {
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
}

function deleteAccount() {
    settingsManager.deleteAccount();
}

async function logout() {
    try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signOut();
        if (error) {
            throw error;
        }

        window.location.href = 'auth.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        alert('Erro ao fazer logout. Tente novamente.');
    }
}

// Inicializar o gerenciador de configurações
const settingsManager = new SettingsManager();

// Exportar para uso global
window.settingsManager = settingsManager;
