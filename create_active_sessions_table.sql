-- Script SQL para criar a tabela active_sessions no Supabase
-- Execute este script no SQL Editor do Supabase

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
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON active_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_active_sessions_username ON active_sessions(username);

-- Habilitar RLS (Row Level Security)
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam todas as sessões
CREATE POLICY "Usuários autenticados podem ver sessões ativas" ON active_sessions
    FOR SELECT USING (auth.role() = 'authenticated');

-- Política para permitir que usuários autenticados insiram/atualizem suas próprias sessões
CREATE POLICY "Usuários podem gerenciar suas próprias sessões" ON active_sessions
    FOR ALL USING (true);

-- Comentários para documentação
COMMENT ON TABLE active_sessions IS 'Tabela para rastrear sessões ativas de usuários web';
COMMENT ON COLUMN active_sessions.session_id IS 'ID único da sessão gerado pelo cliente';
COMMENT ON COLUMN active_sessions.username IS 'Nome do usuário da sessão';
COMMENT ON COLUMN active_sessions.last_activity IS 'Timestamp da última atividade do usuário';
COMMENT ON COLUMN active_sessions.user_agent IS 'User agent do navegador do usuário';
COMMENT ON COLUMN active_sessions.ip_address IS 'Endereço IP do usuário (ou identificador)';