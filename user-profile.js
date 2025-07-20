/**
 * Gerenciador do Perfil do Usuário
 * Controla a exibição e funcionalidade do perfil do usuário no header
 */

class UserProfileManager {
    constructor() {
        this.userProfile = document.getElementById('user-profile');
        this.authButtons = document.getElementById('auth-buttons');
        this.userName = document.getElementById('user-name');
        this.userRole = document.getElementById('user-role');
        this.userAvatar = document.getElementById('user-avatar');
        this.adminBtn = document.getElementById('admin-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.logoutBtn = document.getElementById('logout-btn');

        this.currentUser = null;
        this.init();
    }

    init() {
        // Verificar se o usuário está logado ao carregar a página
        this.checkAuthState();

        // Configurar event listeners
        this.setupEventListeners();

        // Monitorar mudanças no estado de autenticação do Supabase
        this.waitForSupabaseAndSetupAuth();
    }

    waitForSupabaseAndSetupAuth() {
        if (window.supabaseClient) {
            window.supabaseClient.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    this.handleUserLogin(session.user);
                } else if (event === 'SIGNED_OUT') {
                    this.handleUserLogout();
                }
            });
        } else {
            // Aguarda o Supabase ser inicializado
            setTimeout(() => this.waitForSupabaseAndSetupAuth(), 100);
        }
    }

    setupEventListeners() {
        // Botão de configurações
        if (this.settingsBtn) {
            this.settingsBtn.addEventListener('click', () => {
                window.location.href = 'settings.html';
            });
        }

        // Botão de administração
        if (this.adminBtn) {
            this.adminBtn.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }

        // Botão de logout
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', async() => {
                await this.logout();
            });
        }
    }

    async checkAuthState() {
        try {
            if (!window.supabaseClient) {
                console.log('Supabase não inicializado');
                return;
            }

            const {
                data: { session },
                error
            } = await window.supabaseClient.auth.getSession();

            if (error) {
                console.error('Erro ao verificar sessão:', error);
                this.showAuthButtons();
                return;
            }

            if (session && session.user) {
                await this.handleUserLogin(session.user);
            } else {
                this.showAuthButtons();
            }
        } catch (error) {
            console.error('Erro ao verificar estado de autenticação:', error);
            this.showAuthButtons();
        }
    }

    async handleUserLogin(user) {
        try {
            this.currentUser = user;

            // Buscar informações do perfil do usuário
            const userProfile = await this.getUserProfile(user.id);

            // Atualizar interface
            this.updateUserInterface(user, userProfile);
            this.showUserProfile();
        } catch (error) {
            console.error('Erro ao processar login do usuário:', error);
            this.showAuthButtons();
        }
    }

    async getUserProfile(userId) {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }

            const { data, error } = await window.supabaseClient
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Erro ao buscar perfil do usuário:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return null;
        }
    }

    updateUserInterface(user, profile) {
        // Debug logs
        console.log('🔍 DEBUG - updateUserInterface:');
        console.log('👤 User:', user);
        console.log('📋 Profile:', profile);
        console.log('🔑 Role:', profile?.role);

        // Atualizar nome do usuário
        const displayName =
            profile?.name ||
            user.user_metadata?.full_name ||
            user.email?.split('@')[0] ||
            'Usuário';
        if (this.userName) {
            this.userName.textContent = displayName;
        }

        // Atualizar role do usuário
        const userRole = profile?.role || 'usuário';
        if (this.userRole) {
            this.userRole.textContent = this.formatRole(userRole);
        }

        // Atualizar avatar (pode ser expandido para usar foto do perfil)
        this.updateAvatar(displayName);

        // Mostrar/ocultar botão de administração
        if (this.adminBtn) {
            console.log('🔘 Admin button found, userRole:', userRole);
            if (userRole === 'admin') {
                console.log('✅ Showing admin button');
                this.adminBtn.style.display = 'flex';
            } else {
                console.log('❌ Hiding admin button');
                this.adminBtn.style.display = 'none';
            }
        } else {
            console.log('❌ Admin button not found in DOM');
        }
    }

    updateAvatar(name) {
        if (this.userAvatar) {
            // Por enquanto, usar iniciais do nome
            const initials = this.getInitials(name);
            this.userAvatar.innerHTML = `<span>${initials}</span>`;
        }
    }

    getInitials(name) {
        if (!name) {
            return 'U';
        }

        const words = name.trim().split(' ');
        if (words.length === 1) {
            return words[0].charAt(0).toUpperCase();
        }

        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    formatRole(role) {
        const roleMap = {
            admin: 'Administrador',
            user: 'Usuário',
            moderator: 'Moderador'
        };

        return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
    }

    showUserProfile() {
        if (this.userProfile) {
            this.userProfile.style.display = 'flex';
        }
        if (this.authButtons) {
            this.authButtons.style.display = 'none';
        }
    }

    showAuthButtons() {
        if (this.userProfile) {
            this.userProfile.style.display = 'none';
        }
        if (this.authButtons) {
            this.authButtons.style.display = 'flex';
        }
    }

    handleUserLogout() {
        this.currentUser = null;
        this.showAuthButtons();

        // Limpar dados do perfil
        if (this.userName) {
            this.userName.textContent = 'Nome do Usuário';
        }
        if (this.userRole) {
            this.userRole.textContent = 'Usuário';
        }
        if (this.userAvatar) {
            this.userAvatar.innerHTML = '<i class="bi bi-person-fill"></i>';
        }
        if (this.adminBtn) {
            this.adminBtn.style.display = 'none';
        }
    }

    async logout() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase não inicializado');
            }

            const { error } = await window.supabaseClient.auth.signOut();

            if (error) {
                console.error('Erro ao fazer logout:', error);
                this.showFeedback('Erro ao sair. Tente novamente.', 'error');
                return;
            }

            this.showFeedback('Logout realizado com sucesso!', 'success');

            // Redirecionar para página inicial após um breve delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Erro durante logout:', error);
            this.showFeedback('Erro ao sair. Tente novamente.', 'error');
        }
    }

    showFeedback(message, type = 'success') {
        // Remover feedback anterior se existir
        const existingFeedback = document.querySelector('.feedback-message');
        if (existingFeedback) {
            existingFeedback.remove();
        }

        // Criar novo elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${type}`;
        feedback.textContent = message;

        // Adicionar ao body
        document.body.appendChild(feedback);

        // Remover após 3 segundos
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 3000);
    }

    // Método público para atualizar o perfil
    async refreshProfile() {
        if (this.currentUser) {
            await this.handleUserLogin(this.currentUser);
        }
    }
}

// Inicializar o gerenciador quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.userProfileManager = new UserProfileManager();
});

// Exportar para uso em outros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserProfileManager;
}
