-- Script SQL completo para criar todas as tabelas necessárias no Supabase
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela user_profiles (perfis de usuário)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    first_login BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Tabela favoritos
CREATE TABLE IF NOT EXISTS favoritos (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    url TEXT NOT NULL,
    icone TEXT,
    usuario_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela aniversariantes
CREATE TABLE IF NOT EXISTS aniversariantes (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    data TEXT NOT NULL, -- Formato DD/MM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela logs_cliques
CREATE TABLE IF NOT EXISTS logs_cliques (
    id SERIAL PRIMARY KEY,
    botao_nome TEXT NOT NULL,
    url TEXT,
    usuario_id TEXT,
    ip_address TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela user_settings (configurações do usuário)
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 6. Tabela active_sessions (sessões ativas)
CREATE TABLE IF NOT EXISTS active_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_id ON favoritos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_cliques_usuario_id ON logs_cliques(usuario_id);
CREATE INDEX IF NOT EXISTS idx_logs_cliques_timestamp ON logs_cliques(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aniversariantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_cliques ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para user_profiles
CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os perfis" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas de segurança para favoritos
CREATE POLICY "Usuários podem gerenciar seus favoritos" ON favoritos
    FOR ALL USING (usuario_id = auth.uid()::text);

-- Políticas de segurança para aniversariantes
CREATE POLICY "Usuários autenticados podem ver aniversariantes" ON aniversariantes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Apenas admins podem gerenciar aniversariantes" ON aniversariantes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas de segurança para logs_cliques
CREATE POLICY "Usuários podem criar logs de clique" ON logs_cliques
    FOR INSERT WITH CHECK (usuario_id = auth.uid()::text);

CREATE POLICY "Admins podem ver todos os logs" ON logs_cliques
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas de segurança para user_settings
CREATE POLICY "Usuários podem gerenciar suas configurações" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Políticas de segurança para active_sessions
CREATE POLICY "Usuários autenticados podem ver sessões ativas" ON active_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem gerenciar suas próprias sessões" ON active_sessions
    FOR ALL USING (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas que possuem updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_favoritos_updated_at BEFORE UPDATE ON favoritos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aniversariantes_updated_at BEFORE UPDATE ON aniversariantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE user_profiles IS 'Perfis de usuários do sistema';
COMMENT ON TABLE favoritos IS 'Favoritos salvos pelos usuários';
COMMENT ON TABLE aniversariantes IS 'Lista de aniversariantes';
COMMENT ON TABLE logs_cliques IS 'Logs de cliques dos usuários';
COMMENT ON TABLE user_settings IS 'Configurações personalizadas dos usuários';
COMMENT ON TABLE active_sessions IS 'Sessões ativas de usuários';

-- Inserir dados iniciais de aniversariantes (exemplo)
INSERT INTO aniversariantes (nome, data) VALUES
('Exemplo Servidor 1', '15/03'),
('Exemplo Servidor 2', '22/07'),
('Exemplo Servidor 3', '10/12')
ON CONFLICT DO NOTHING;

-- Inserir usuário administrador inicial (será criado via código)
-- O perfil será criado automaticamente quando o admin fizer primeiro login