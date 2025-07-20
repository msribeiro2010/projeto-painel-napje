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

// Estado global
let currentUser = null;
let users = [];
let activeSessions = [];
let adminActions = [];

// Inicialização
document.addEventListener('DOMContentLoaded', async() => {
    await waitForSupabase();
    await checkAuth();
    await loadUsers();
    await loadActiveSessions();
    await loadAdminActions();
    setupEventListeners();
});

// Verificar autenticação e permissões de admin
async function checkAuth() {
    try {
        const supabase = getSupabaseClient();
        const {
            data: { user },
            error
        } = await supabase.auth.getUser();

        if (error || !user) {
            window.location.href = '/auth.html';
            return;
        }

        // Verificar se é admin
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || profile.role !== 'admin') {
            alert('Acesso negado. Apenas administradores podem acessar esta página.');
            window.location.href = '/index.html';
            return;
        }

        currentUser = user;
        // Remover esta linha pois o elemento adminEmail não existe no HTML
    } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        window.location.href = '/auth.html';
    }
}

// Carregar lista de usuários
async function loadUsers() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        users = data;
        renderUsers();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showAlert('Erro ao carregar usuários', 'danger');
    }
}

// Renderizar lista de usuários
function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        // Determinar status baseado no nome
        let status = 'active';
        if (user.name && user.name.includes('[BLOQUEADO]')) {
            status = 'blocked';
        } else if (user.name && user.name.includes('[PAUSADO]')) {
            status = 'paused';
        }

        const statusClass =
            status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'danger';

        row.innerHTML = `
            <td>${user.email}</td>
            <td>${user.name || 'N/A'}</td>
            <td><span class="badge bg-${user.role === 'admin' ? 'primary' : 'secondary'}">${user.role}</span></td>
            <td><span class="badge bg-${statusClass}">${status}</span></td>
            <td>1/5</td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}</td>
            <td>
                <div class="btn-group" role="group">
                    ${
    status === 'active'
        ? `<button class="btn btn-sm btn-warning" onclick="pauseUser('${user.id}')">Pausar</button>
                         <button class="btn btn-sm btn-danger" onclick="blockUser('${user.id}')">Bloquear</button>`
        : status === 'paused'
            ? `<button class="btn btn-sm btn-success" onclick="unblockUser('${user.id}')">Ativar</button>
                         <button class="btn btn-sm btn-danger" onclick="blockUser('${user.id}')">Bloquear</button>`
            : `<button class="btn btn-sm btn-success" onclick="unblockUser('${user.id}')">Desbloquear</button>`
}
                    <button class="btn btn-sm btn-info" onclick="forceLogout('${user.id}')">Desconectar</button>
                    ${user.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">Excluir</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar sessões ativas (simulado com dados dos usuários logados)
async function loadActiveSessions() {
    try {
        const supabase = getSupabaseClient();
        // Como não temos a tabela user_sessions ainda, vamos simular com usuários ativos
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .not('last_login', 'is', null)
            .order('last_login', { ascending: false })
            .limit(20);

        if (error) {
            throw error;
        }

        // Simular sessões ativas baseado no último login
        activeSessions = data.map(user => ({
            id: user.id,
            user_profiles: { email: user.email, name: user.name },
            ip_address: 'N/A',
            user_agent: 'N/A',
            created_at: user.last_login,
            last_activity: user.last_login
        }));

        renderActiveSessions();
    } catch (error) {
        console.error('Erro ao carregar sessões ativas:', error);
        showAlert('Erro ao carregar sessões ativas', 'danger');
    }
}

// Renderizar sessões ativas
function renderActiveSessions() {
    const tbody = document.getElementById('sessions-table-body');
    tbody.innerHTML = '';

    activeSessions.forEach(session => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.user_profiles?.email || 'N/A'}</td>
            <td>${session.user_profiles?.name || 'N/A'}</td>
            <td>${session.ip_address || 'N/A'}</td>
            <td>${session.user_agent || 'N/A'}</td>
            <td>${new Date(session.created_at).toLocaleString('pt-BR')}</td>
            <td>${new Date(session.last_activity).toLocaleString('pt-BR')}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="terminateSession('${session.id}')">Terminar</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Carregar ações administrativas (simulado)
async function loadAdminActions() {
    try {
        // Como não temos a tabela admin_actions ainda, vamos simular com dados básicos
        adminActions = [
            {
                id: '1',
                created_at: new Date().toISOString(),
                admin: { email: currentUser?.email || 'admin@example.com' },
                action: 'login',
                target: { email: 'Sistema' },
                reason: 'Acesso ao painel administrativo'
            }
        ];

        renderAdminActions();
    } catch (error) {
        console.error('Erro ao carregar ações administrativas:', error);
        showAlert('Erro ao carregar ações administrativas', 'danger');
    }
}

// Renderizar ações administrativas
function renderAdminActions() {
    const tbody = document.getElementById('logs-table-body');
    tbody.innerHTML = '';

    adminActions.forEach(action => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${new Date(action.created_at).toLocaleString('pt-BR')}</td>
            <td>${action.admin?.email || 'N/A'}</td>
            <td>${action.action}</td>
            <td>${action.target?.email || 'N/A'}</td>
            <td>${action.reason || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Pausar usuário (simulado - adiciona comentário no nome)
async function pauseUser(userId) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const newName =
            user.name && user.name.includes('[PAUSADO]')
                ? user.name
                : `${user.name || user.email} [PAUSADO]`;

        const { error } = await supabase
            .from('user_profiles')
            .update({ name: newName })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        showAlert('Usuário pausado com sucesso', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Erro ao pausar usuário:', error);
        showAlert('Erro ao pausar usuário', 'danger');
    }
}

// Bloquear usuário (simulado - adiciona comentário no nome)
async function blockUser(userId) {
    const reason = prompt('Motivo para bloquear o usuário:');
    if (!reason) {
        return;
    }

    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        const newName =
            user.name && user.name.includes('[BLOQUEADO]')
                ? user.name
                : `${user.name || user.email} [BLOQUEADO]`;

        const { error } = await supabase
            .from('user_profiles')
            .update({ name: newName })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        showAlert(`Usuário bloqueado com sucesso. Motivo: ${reason}`, 'success');
        loadUsers();
    } catch (error) {
        console.error('Erro ao bloquear usuário:', error);
        showAlert('Erro ao bloquear usuário', 'danger');
    }
}

// Desbloquear usuário (remove marcações do nome)
async function unblockUser(userId) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        let newName = user.name || user.email;
        newName = newName
            .replace(/\s*\[BLOQUEADO\]/g, '')
            .replace(/\s*\[PAUSADO\]/g, '')
            .trim();

        const { error } = await supabase
            .from('user_profiles')
            .update({ name: newName })
            .eq('id', userId);

        if (error) {
            throw error;
        }

        showAlert('Usuário desbloqueado com sucesso', 'success');
        loadUsers();
    } catch (error) {
        console.error('Erro ao desbloquear usuário:', error);
        showAlert('Erro ao desbloquear usuário', 'danger');
    }
}

// Forçar logout do usuário (simulado)
async function forceLogout(userId) {
    if (!confirm('Tem certeza que deseja desconectar este usuário?')) {
        return;
    }

    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        showAlert(`Logout forçado simulado para ${user.email}`, 'warning');
        await loadActiveSessions();
    } catch (error) {
        console.error('Erro ao desconectar usuário:', error);
        showAlert('Erro ao desconectar usuário', 'danger');
    }
}

// Terminar sessão específica (simulado)
async function terminateSession(sessionId) {
    if (!confirm('Tem certeza que deseja terminar esta sessão?')) {
        return;
    }

    try {
        const session = activeSessions.find(s => s.id === sessionId);
        if (!session) {
            throw new Error('Sessão não encontrada');
        }

        showAlert(`Sessão terminada para ${session.user_profiles.email}`, 'warning');
        await loadActiveSessions();
    } catch (error) {
        console.error('Erro ao terminar sessão:', error);
        showAlert('Erro ao terminar sessão', 'danger');
    }
}

// Deletar usuário
async function deleteUser(userId) {
    const reason = prompt('Motivo para deletar o usuário:');
    if (!reason) {
        alert('É obrigatório informar o motivo da exclusão.');
        return;
    }

    if (
        !confirm('ATENÇÃO: Esta ação é irreversível! Tem certeza que deseja deletar este usuário?')
    ) {
        return;
    }

    try {
        const user = users.find(u => u.id === userId);
        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Deletar o usuário
        const { error } = await supabase.from('user_profiles').delete().eq('id', userId);

        if (error) {
            throw error;
        }

        showAlert(`Usuário ${user.email} deletado com sucesso. Motivo: ${reason}`, 'success');
        loadUsers();
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        showAlert('Erro ao deletar usuário', 'danger');
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Não há botão de logout específico no HTML, removendo
    // Não há botão de refresh específico no HTML, removendo
    // Não há filtros no HTML, removendo
    console.log('Event listeners configurados');
}

// Função global para o botão de atualizar (chamada pelo onclick no HTML)
window.refreshData = async function() {
    await loadUsers();
    await loadActiveSessions();
    await loadAdminActions();
    showAlert('Dados atualizados', 'info');
};

// Filtrar usuários (removido pois não há elementos de filtro no HTML)
// function filterUsers() { ... }

// Renderizar usuários filtrados
function renderFilteredUsers(filteredUsers) {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '';

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        const statusClass =
            user.status === 'active' ? 'success' : user.status === 'paused' ? 'warning' : 'danger';

        row.innerHTML = `
            <td>${user.email}</td>
            <td>${user.name || 'N/A'}</td>
            <td><span class="badge bg-${user.role === 'admin' ? 'primary' : 'secondary'}">${user.role}</span></td>
            <td><span class="badge bg-${statusClass}">${user.status}</span></td>
            <td>${user.session_count || 0}/${user.max_sessions || 5}</td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString('pt-BR') : 'Nunca'}</td>
            <td>
                <div class="btn-group" role="group">
                    ${
    user.status === 'active'
        ? `<button class="btn btn-sm btn-warning" onclick="pauseUser('${user.id}')">Pausar</button>
                         <button class="btn btn-sm btn-danger" onclick="blockUser('${user.id}')">Bloquear</button>`
        : user.status === 'paused'
            ? `<button class="btn btn-sm btn-success" onclick="unblockUser('${user.id}')">Ativar</button>
                         <button class="btn btn-sm btn-danger" onclick="blockUser('${user.id}')">Bloquear</button>`
            : `<button class="btn btn-sm btn-success" onclick="unblockUser('${user.id}')">Desbloquear</button>`
}
                    <button class="btn btn-sm btn-info" onclick="forceLogout('${user.id}')">Desconectar</button>
                    ${user.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger" onclick="deleteUser('${user.id}')">Excluir</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Mostrar alerta
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alerts-container');
    if (!alertContainer) {
        console.error('Container de alertas não encontrado');
        return;
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.appendChild(alert);

    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Atualização automática a cada 30 segundos
setInterval(async() => {
    await loadActiveSessions();
}, 30000);

// Cleanup de sessões expiradas a cada 5 minutos
setInterval(async() => {
    try {
        await supabase.rpc('cleanup_expired_sessions');
    } catch (error) {
        console.warn('Erro na limpeza de sessões:', error);
    }
}, 300000);

// ===== GERENCIAMENTO DE GRUPOS E ATALHOS =====

let groups = [];
let shortcuts = [];

// Carregar grupos únicos da tabela atalhos
async function loadGroups() {
    console.log('Iniciando carregamento de grupos...');
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Cliente Supabase não disponível');
            throw new Error('Cliente Supabase não disponível');
        }

        const { data, error } = await supabase.from('atalhos').select('grupo').order('grupo');

        if (error) {
            console.error('Erro na query de grupos:', error);
            throw error;
        }

        console.log('Dados de grupos recebidos:', data);

        // Extrair grupos únicos
        const uniqueGroups = [...new Set(data.map(item => item.grupo))];
        console.log('Grupos únicos encontrados:', uniqueGroups);

        groups = uniqueGroups.map((grupo, index) => ({
            id: grupo,
            name: grupo.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            key: grupo,
            order: index
        }));

        console.log('Grupos processados:', groups);
        renderGroups();
        updateGroupSelects();
    } catch (error) {
        console.error('Erro ao carregar grupos:', error);
        showAlert('Erro ao carregar grupos', 'danger');
    }
}

// Carregar atalhos
async function loadShortcuts(groupFilter = '') {
    console.log(
        'Iniciando carregamento de atalhos...',
        groupFilter ? `Filtro: ${groupFilter}` : 'Sem filtro'
    );
    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            console.error('Cliente Supabase não disponível');
            throw new Error('Cliente Supabase não disponível');
        }

        let query = supabase.from('atalhos').select('*').order('grupo').order('ordem');

        if (groupFilter) {
            query = query.eq('grupo', groupFilter);
            console.log('Aplicando filtro de grupo:', groupFilter);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro na query de atalhos:', error);
            throw error;
        }

        console.log('Dados de atalhos recebidos:', data);
        shortcuts = data || [];
        console.log('Atalhos processados:', shortcuts.length, 'itens');
        renderShortcuts();
    } catch (error) {
        console.error('Erro ao carregar atalhos:', error);
        showAlert('Erro ao carregar atalhos', 'danger');
    }
}

// Renderizar lista de grupos
function renderGroups() {
    const container = document.getElementById('groups-list');
    if (!container) {
        return;
    }

    if (groups.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">Nenhum grupo encontrado</div>';
        return;
    }

    container.innerHTML = groups
        .map(
            group => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
            <div>
                <strong>${group.name}</strong>
                <br>
                <small class="text-muted">${group.key}</small>
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" onclick="editGroup('${group.key}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteGroup('${group.key}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `
        )
        .join('');
}

// Renderizar lista de atalhos
function renderShortcuts() {
    const container = document.getElementById('shortcuts-list');
    if (!container) {
        return;
    }

    if (shortcuts.length === 0) {
        container.innerHTML = '<div class="text-center text-muted">Nenhum atalho encontrado</div>';
        return;
    }

    container.innerHTML = shortcuts
        .map(
            shortcut => `
        <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
            <div class="flex-grow-1">
                <div class="d-flex align-items-center">
                    <i class="${shortcut.icone || 'bi bi-link-45deg'} me-2"></i>
                    <div>
                        <strong>${shortcut.titulo}</strong>
                        ${!shortcut.ativo ? '<span class="badge bg-secondary ms-2">Inativo</span>' : ''}
                        <br>
                        <small class="text-muted">${shortcut.grupo} • Ordem: ${shortcut.ordem}</small>
                        <br>
                        <small class="text-truncate d-block" style="max-width: 300px;">${shortcut.url}</small>
                    </div>
                </div>
            </div>
            <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" onclick="editShortcut(${shortcut.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteShortcut(${shortcut.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `
        )
        .join('');
}

// Atualizar selects de grupos
function updateGroupSelects() {
    const selects = ['group-filter', 'shortcutGroup'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) {
            return;
        }

        // Manter a primeira opção
        const firstOption = select.querySelector('option');
        select.innerHTML = '';
        if (firstOption) {
            select.appendChild(firstOption);
        }

        // Adicionar grupos
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.key;
            option.textContent = group.name;
            select.appendChild(option);
        });
    });
}

// Criar/Editar grupo
function showGroupModal(groupKey = null) {
    const modal = new bootstrap.Modal(document.getElementById('groupModal'));
    const title = document.getElementById('groupModalTitle');
    const form = document.getElementById('groupForm');

    form.reset();

    if (groupKey) {
        const group = groups.find(g => g.key === groupKey);
        if (group) {
            title.textContent = 'Editar Grupo';
            document.getElementById('groupId').value = group.key;
            document.getElementById('groupName').value = group.name;
            document.getElementById('groupKey').value = group.key;
            document.getElementById('groupOrder').value = group.order;
        }
    } else {
        title.textContent = 'Novo Grupo';
    }

    modal.show();
}

// Salvar grupo
async function saveGroup() {
    const form = document.getElementById('groupForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const groupId = document.getElementById('groupId').value;
    const groupName = document.getElementById('groupName').value;
    const groupKey = document.getElementById('groupKey').value;
    const groupOrder = parseInt(document.getElementById('groupOrder').value) || 0;

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Cliente Supabase não disponível');
        }

        if (groupId) {
            // Editar: atualizar todos os atalhos do grupo antigo
            const { error } = await supabase
                .from('atalhos')
                .update({ grupo: groupKey })
                .eq('grupo', groupId);

            if (error) {
                throw error;
            }
            showAlert('Grupo atualizado com sucesso', 'success');
        } else {
            // Novo grupo: apenas validar se a chave não existe
            const { data: existing } = await supabase
                .from('atalhos')
                .select('grupo')
                .eq('grupo', groupKey)
                .limit(1);

            if (existing && existing.length > 0) {
                showAlert('Já existe um grupo com esta chave', 'warning');
                return;
            }

            showAlert('Grupo criado. Adicione atalhos para este grupo.', 'success');
        }

        bootstrap.Modal.getInstance(document.getElementById('groupModal')).hide();
        await loadGroups();
        await loadShortcuts();
    } catch (error) {
        console.error('Erro ao salvar grupo:', error);
        showAlert('Erro ao salvar grupo', 'danger');
    }
}

// Deletar grupo
async function deleteGroup(groupKey) {
    if (
        !confirm(
            `Tem certeza que deseja deletar o grupo "${groupKey}"? Todos os atalhos deste grupo também serão removidos.`
        )
    ) {
        return;
    }

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Cliente Supabase não disponível');
        }

        const { error } = await supabase.from('atalhos').delete().eq('grupo', groupKey);

        if (error) {
            throw error;
        }

        showAlert('Grupo e seus atalhos deletados com sucesso', 'success');
        await loadGroups();
        await loadShortcuts();
    } catch (error) {
        console.error('Erro ao deletar grupo:', error);
        showAlert('Erro ao deletar grupo', 'danger');
    }
}

// Criar/Editar atalho
function showShortcutModal(shortcutId = null) {
    const modal = new bootstrap.Modal(document.getElementById('shortcutModal'));
    const title = document.getElementById('shortcutModalTitle');
    const form = document.getElementById('shortcutForm');

    form.reset();
    document.getElementById('shortcutActive').checked = true;

    if (shortcutId) {
        const shortcut = shortcuts.find(s => s.id === shortcutId);
        if (shortcut) {
            title.textContent = 'Editar Atalho';
            document.getElementById('shortcutId').value = shortcut.id;
            document.getElementById('shortcutTitle').value = shortcut.titulo;
            document.getElementById('shortcutUrl').value = shortcut.url;
            document.getElementById('shortcutIcon').value = shortcut.icone || '';
            document.getElementById('shortcutGroup').value = shortcut.grupo;
            document.getElementById('shortcutOrder').value = shortcut.ordem || 0;
            document.getElementById('shortcutDescription').value = shortcut.descricao || '';
            document.getElementById('shortcutActive').checked = shortcut.ativo;
        }
    } else {
        title.textContent = 'Novo Atalho';
    }

    modal.show();
}

// Salvar atalho
async function saveShortcut() {
    const form = document.getElementById('shortcutForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const shortcutId = document.getElementById('shortcutId').value;
    const shortcutData = {
        titulo: document.getElementById('shortcutTitle').value,
        url: document.getElementById('shortcutUrl').value,
        icone: document.getElementById('shortcutIcon').value || 'bi bi-link-45deg',
        grupo: document.getElementById('shortcutGroup').value,
        ordem: parseInt(document.getElementById('shortcutOrder').value) || 0,
        descricao: document.getElementById('shortcutDescription').value || null,
        ativo: document.getElementById('shortcutActive').checked
    };

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Cliente Supabase não disponível');
        }

        let result;
        if (shortcutId) {
            result = await supabase.from('atalhos').update(shortcutData).eq('id', shortcutId);
        } else {
            result = await supabase.from('atalhos').insert([shortcutData]);
        }

        if (result.error) {
            throw result.error;
        }

        showAlert(`Atalho ${shortcutId ? 'atualizado' : 'criado'} com sucesso`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('shortcutModal')).hide();
        await loadGroups();
        await loadShortcuts();
    } catch (error) {
        console.error('Erro ao salvar atalho:', error);
        showAlert('Erro ao salvar atalho', 'danger');
    }
}

// Deletar atalho
async function deleteShortcut(shortcutId) {
    const shortcut = shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) {
        return;
    }

    if (!confirm(`Tem certeza que deseja deletar o atalho "${shortcut.titulo}"?`)) {
        return;
    }

    try {
        const supabase = getSupabaseClient();
        if (!supabase) {
            throw new Error('Cliente Supabase não disponível');
        }

        const { error } = await supabase.from('atalhos').delete().eq('id', shortcutId);

        if (error) {
            throw error;
        }

        showAlert('Atalho deletado com sucesso', 'success');
        await loadShortcuts();
    } catch (error) {
        console.error('Erro ao deletar atalho:', error);
        showAlert('Erro ao deletar atalho', 'danger');
    }
}

// Event listeners para atalhos
function setupShortcutEventListeners() {
    // Botão novo grupo
    const addGroupBtn = document.getElementById('add-group-btn');
    if (addGroupBtn) {
        addGroupBtn.addEventListener('click', () => showGroupModal());
    }

    // Botão novo atalho
    const addShortcutBtn = document.getElementById('add-shortcut-btn');
    if (addShortcutBtn) {
        addShortcutBtn.addEventListener('click', () => showShortcutModal());
    }

    // Botão salvar grupo
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    if (saveGroupBtn) {
        saveGroupBtn.addEventListener('click', saveGroup);
    }

    // Botão salvar atalho
    const saveShortcutBtn = document.getElementById('saveShortcutBtn');
    if (saveShortcutBtn) {
        saveShortcutBtn.addEventListener('click', saveShortcut);
    }

    // Filtro de grupos
    const groupFilter = document.getElementById('group-filter');
    if (groupFilter) {
        groupFilter.addEventListener('change', e => {
            loadShortcuts(e.target.value);
        });
    }

    // Auto-gerar chave do grupo baseada no nome
    const groupNameInput = document.getElementById('groupName');
    const groupKeyInput = document.getElementById('groupKey');
    if (groupNameInput && groupKeyInput) {
        groupNameInput.addEventListener('input', e => {
            if (!document.getElementById('groupId').value) {
                // Apenas para novos grupos
                const key = e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
                groupKeyInput.value = key;
            }
        });
    }
}

// Funções globais para os botões
window.editGroup = groupKey => showGroupModal(groupKey);
window.deleteGroup = deleteGroup;
window.editShortcut = shortcutId => showShortcutModal(shortcutId);
window.deleteShortcut = deleteShortcut;

// Carregar dados de atalhos quando a aba for ativada
document.addEventListener('DOMContentLoaded', () => {
    setupShortcutEventListeners();

    // Carregar dados quando a aba de atalhos for ativada
    const shortcutsTab = document.getElementById('shortcuts-tab');
    if (shortcutsTab) {
        shortcutsTab.addEventListener('shown.bs.tab', () => {
            console.log('Aba de atalhos ativada, carregando dados...');
            loadGroups();
            loadShortcuts();
        });

        // Também carregar dados se a aba já estiver ativa
        shortcutsTab.addEventListener('click', () => {
            setTimeout(() => {
                if (shortcutsTab.classList.contains('active')) {
                    console.log('Clique na aba de atalhos, carregando dados...');
                    loadGroups();
                    loadShortcuts();
                }
            }, 100);
        });
    }

    // Carregar dados imediatamente se estivermos na página admin
    if (window.location.pathname.includes('admin.html')) {
        console.log('Página admin carregada, preparando dados de atalhos...');
        // Aguardar um pouco para garantir que o Supabase está inicializado
        setTimeout(() => {
            // Verificar se a aba de atalhos está ativa
            const shortcutsTabPane = document.getElementById('shortcuts');
            if (shortcutsTabPane && shortcutsTabPane.classList.contains('active')) {
                loadGroups();
                loadShortcuts();
            }
        }, 1000);
    }
});

// Função para carregar dados manualmente (para debug)
window.loadShortcutData = () => {
    console.log('Carregando dados de atalhos manualmente...');
    loadGroups();
    loadShortcuts();
};

// Função de teste para verificar conexão com Supabase
window.testSupabaseConnection = async() => {
    console.log('Testando conexão com Supabase...');
    try {
        // Testar se o cliente Supabase está disponível
        if (!window.supabase) {
            console.error('Cliente Supabase não encontrado!');
            return;
        }

        console.log('Cliente Supabase encontrado:', window.supabase);

        // Testar query simples na tabela atalhos
        const { data, error, count } = await window.supabase
            .from('atalhos')
            .select('*', { count: 'exact' })
            .limit(5);

        if (error) {
            console.error('Erro na query de teste:', error);
            return;
        }

        console.log('Teste de conexão bem-sucedido!');
        console.log('Total de atalhos na tabela:', count);
        console.log('Primeiros 5 atalhos:', data);

        return { success: true, count, data };
    } catch (error) {
        console.error('Erro no teste de conexão:', error);
        return { success: false, error };
    }
};

// Auto-executar teste de conexão quando a página carregar
setTimeout(() => {
    if (window.location.pathname.includes('admin.html')) {
        window.testSupabaseConnection();
    }
}, 2000);
