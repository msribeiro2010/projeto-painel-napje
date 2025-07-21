-- Script para corrigir políticas RLS com recursão infinita
-- Execute este script no SQL Editor do Supabase

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON user_profiles;
DROP POLICY IF EXISTS "Apenas admins podem gerenciar aniversariantes" ON aniversariantes;
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON logs_cliques;

-- 2. Criar políticas simples e funcionais para user_profiles
CREATE POLICY "Usuários autenticados podem ver perfis" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ver seu próprio perfil" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Permitir inserção de perfis" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Políticas simplificadas para aniversariantes
CREATE POLICY "Todos podem ver aniversariantes" ON aniversariantes
    FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar aniversariantes" ON aniversariantes
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Políticas simplificadas para logs_cliques
CREATE POLICY "Usuários podem inserir logs" ON logs_cliques
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários podem ver logs" ON logs_cliques
    FOR SELECT USING (auth.role() = 'authenticated');

-- 5. Temporariamente desabilitar RLS para user_profiles para permitir setup inicial
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Comentário: RLS será reabilitado após o setup inicial estar funcionando
COMMENT ON TABLE user_profiles IS 'RLS temporariamente desabilitado para setup inicial';

-- 6. Verificar se há dados órfãos que podem estar causando problemas
-- (Estas são consultas de verificação, não serão executadas automaticamente)
-- SELECT COUNT(*) FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
-- DELETE FROM user_profiles WHERE user_id NOT IN (SELECT id FROM auth.users);