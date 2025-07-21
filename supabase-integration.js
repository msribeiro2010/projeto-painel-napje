// Integração com Supabase para o frontend
class SupabaseManager {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api/supabase';
        this.userId = null;
        this.isOnline = navigator.onLine;

        // Inicializa o Supabase quando disponível
        this.initializeSupabase();

        // Inicializa o userId de forma assíncrona
        this.initializeUserId();

        // Monitora status de conexão
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Inicializa o cliente Supabase quando a biblioteca estiver disponível
    initializeSupabase() {
        if (
            typeof window !== 'undefined' &&
            window.supabase &&
            window.SUPABASE_URL &&
            window.SUPABASE_ANON_KEY
        ) {
            try {
                window.supabaseClient = window.supabase.createClient(
                    window.SUPABASE_URL,
                    window.SUPABASE_ANON_KEY
                );
                console.log('✅ Supabase cliente inicializado com sucesso!');
                console.log('🔗 URL:', window.SUPABASE_URL);
            } catch (error) {
                console.error('❌ Erro ao inicializar Supabase:', error);
            }
        } else {
            // Verifica quais variáveis estão faltando
            console.log('⏳ Aguardando Supabase...', {
                supabase: !!window.supabase,
                url: !!window.SUPABASE_URL,
                key: !!window.SUPABASE_ANON_KEY
            });
            // Tenta novamente após um pequeno delay
            setTimeout(() => this.initializeSupabase(), 100);
        }
    }

    async initializeUserId() {
        this.userId = await this.getUserId();
    }

    // Obtém o ID do usuário autenticado do Supabase
    async getUserId() {
        try {
            // Verifica se o Supabase está disponível
            if (typeof window !== 'undefined' && window.supabaseClient) {
                const {
                    data: { user }
                } = await window.supabaseClient.auth.getUser();
                if (user && user.id) {
                    return user.id;
                }
            }
            // Fallback para ID local se não estiver autenticado
            let userId = localStorage.getItem('napje_user_id');
            if (!userId) {
                userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('napje_user_id', userId);
            }
            return userId;
        } catch (error) {
            console.error('Erro ao obter ID do usuário:', error);
            // Fallback para ID local
            let userId = localStorage.getItem('napje_user_id');
            if (!userId) {
                userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('napje_user_id', userId);
            }
            return userId;
        }
    }

    // Método genérico para fazer requisições
    async makeRequest(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Erro na requisição:', error);
            throw error;
        }
    }

    // ===== FAVORITOS =====

    async getFavoritos() {
        try {
            if (!this.isOnline) {
                return this.getLocalFavoritos();
            }

            const response = await this.makeRequest('/favoritos');

            // Sincroniza com localStorage
            localStorage.setItem('supabase_favoritos', JSON.stringify(response.favoritos));

            return response.favoritos;
        } catch (error) {
            console.error('Erro ao buscar favoritos do Supabase, usando dados locais:', error);
            return this.getLocalFavoritos();
        }
    }

    async addFavorito(titulo, url, icone) {
        // Garante que o userId está inicializado
        if (!this.userId) {
            this.userId = await this.getUserId();
        }

        const favorito = {
            titulo,
            url,
            icone,
            usuario_id: this.userId
        };

        try {
            if (!this.isOnline) {
                return this.addLocalFavorito(favorito);
            }

            const response = await this.makeRequest('/favoritos', {
                method: 'POST',
                body: JSON.stringify(favorito)
            });

            // Atualiza cache local
            this.updateLocalFavoritos();

            return response.favorito;
        } catch (error) {
            console.error('Erro ao adicionar favorito, salvando localmente:', error);
            return this.addLocalFavorito(favorito);
        }
    }

    async removeFavorito(id) {
        try {
            if (!this.isOnline) {
                return this.removeLocalFavorito(id);
            }

            await this.makeRequest(`/favoritos/${id}`, {
                method: 'DELETE'
            });

            // Atualiza cache local
            this.updateLocalFavoritos();

            return true;
        } catch (error) {
            console.error('Erro ao remover favorito, removendo localmente:', error);
            return this.removeLocalFavorito(id);
        }
    }

    // Métodos para gerenciar favoritos localmente
    getLocalFavoritos() {
        const favoritos = localStorage.getItem('supabase_favoritos');
        return favoritos ? JSON.parse(favoritos) : [];
    }

    addLocalFavorito(favorito) {
        const favoritos = this.getLocalFavoritos();
        const novoFavorito = {
            ...favorito,
            id: 'local_' + Date.now(),
            created_at: new Date().toISOString(),
            sync_pending: true
        };

        favoritos.push(novoFavorito);
        localStorage.setItem('supabase_favoritos', JSON.stringify(favoritos));

        return novoFavorito;
    }

    removeLocalFavorito(id) {
        const favoritos = this.getLocalFavoritos();
        const filteredFavoritos = favoritos.filter(f => f.id !== id);
        localStorage.setItem('supabase_favoritos', JSON.stringify(filteredFavoritos));
        return true;
    }

    async updateLocalFavoritos() {
        try {
            const favoritos = await this.getFavoritos();
            localStorage.setItem('supabase_favoritos', JSON.stringify(favoritos));
        } catch (error) {
            console.error('Erro ao atualizar cache local:', error);
        }
    }

    // ===== ANIVERSARIANTES =====

    async getAniversariantes() {
        try {
            if (!this.isOnline) {
                return this.getLocalAniversariantes();
            }

            const response = await this.makeRequest('/aniversariantes');

            // Sincroniza com localStorage
            localStorage.setItem('supabase_aniversariantes', JSON.stringify(response.Servidores));

            return response.Servidores;
        } catch (error) {
            console.error(
                'Erro ao buscar aniversariantes do Supabase, usando dados locais:',
                error
            );
            return this.getLocalAniversariantes();
        }
    }

    getLocalAniversariantes() {
        const aniversariantes = localStorage.getItem('supabase_aniversariantes');
        return aniversariantes ? JSON.parse(aniversariantes) : [];
    }

    // ===== LOGS DE CLIQUES =====

    async logClick(botaoNome, url) {
        // Garante que o userId está inicializado
        if (!this.userId) {
            this.userId = await this.getUserId();
        }

        const logData = {
            botao_nome: botaoNome,
            url: url,
            usuario_id: this.userId,
            ip_address: await this.getClientIP()
        };

        try {
            if (!this.isOnline) {
                this.addPendingLog(logData);
                return;
            }

            await this.makeRequest('/logs/click', {
                method: 'POST',
                body: JSON.stringify(logData)
            });
        } catch (error) {
            console.error('Erro ao registrar clique:', error);
            this.addPendingLog(logData);
        }
    }

    addPendingLog(logData) {
        const pendingLogs = JSON.parse(localStorage.getItem('pending_logs') || '[]');
        pendingLogs.push({
            ...logData,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('pending_logs', JSON.stringify(pendingLogs));
    }

    // ===== CONFIGURAÇÕES DO USUÁRIO =====

    async getUserSettings() {
        try {
            // Garante que o userId está inicializado
            if (!this.userId) {
                this.userId = await this.getUserId();
            }

            if (!this.isOnline) {
                return this.getLocalSettings();
            }

            const response = await this.makeRequest(`/user-settings/${this.userId}`);

            // Sincroniza com localStorage
            localStorage.setItem('user_settings', JSON.stringify(response.settings));

            return response.settings;
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            return this.getLocalSettings();
        }
    }

    async saveUserSettings(settings) {
        // Garante que o userId está inicializado
        if (!this.userId) {
            this.userId = await this.getUserId();
        }

        const settingsData = {
            user_id: this.userId,
            ...settings
        };

        try {
            if (!this.isOnline) {
                localStorage.setItem('user_settings', JSON.stringify(settingsData));
                return settingsData;
            }

            const response = await this.makeRequest('/user-settings', {
                method: 'POST',
                body: JSON.stringify(settingsData)
            });

            // Atualiza cache local
            localStorage.setItem('user_settings', JSON.stringify(response.settings));

            return response.settings;
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            localStorage.setItem('user_settings', JSON.stringify(settingsData));
            return settingsData;
        }
    }

    getLocalSettings() {
        const settings = localStorage.getItem('user_settings');
        return settings ? JSON.parse(settings) : {};
    }

    // ===== SINCRONIZAÇÃO OFFLINE =====

    async syncOfflineData() {
        console.log('Sincronizando dados offline...');

        try {
            // Sincroniza logs pendentes
            await this.syncPendingLogs();

            // Sincroniza favoritos pendentes
            await this.syncPendingFavoritos();

            // Atualiza caches
            await this.updateLocalFavoritos();

            console.log('Sincronização concluída!');
        } catch (error) {
            console.error('Erro na sincronização:', error);
        }
    }

    async syncPendingLogs() {
        const pendingLogs = JSON.parse(localStorage.getItem('pending_logs') || '[]');

        for (const log of pendingLogs) {
            try {
                await this.makeRequest('/logs/click', {
                    method: 'POST',
                    body: JSON.stringify(log)
                });
            } catch (error) {
                console.error('Erro ao sincronizar log:', error);
            }
        }

        // Limpa logs sincronizados
        localStorage.removeItem('pending_logs');
    }

    async syncPendingFavoritos() {
        const favoritos = this.getLocalFavoritos();
        const pendingFavoritos = favoritos.filter(f => f.sync_pending);

        for (const favorito of pendingFavoritos) {
            try {
                await this.addFavorito(favorito.titulo, favorito.url, favorito.icone);
            } catch (error) {
                console.error('Erro ao sincronizar favorito:', error);
            }
        }
    }

    // ===== UTILITÁRIOS =====

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }

    // ===== ESTATÍSTICAS =====

    async getClickStats() {
        try {
            if (!this.isOnline) {
                return [];
            }

            const response = await this.makeRequest('/stats/clicks');
            return response.stats;
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            return [];
        }
    }
}

// Instância global do gerenciador Supabase
const supabaseManager = new SupabaseManager();

// Exporta para uso global
window.supabaseManager = supabaseManager;
