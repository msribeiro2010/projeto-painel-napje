# 🔧 Setup do Banco de Dados Supabase

## ⚠️ PROBLEMA IDENTIFICADO

O sistema de autenticação não estava funcionando devido a:

1. **URLs inconsistentes do Supabase** entre frontend e backend
2. **Tabelas ausentes** no banco de dados
3. **Configurações de autenticação incorretas**

## ✅ CORREÇÕES APLICADAS

### 1. Unificação das URLs do Supabase
- Corrigida a URL no `auth.html` para usar a mesma do servidor
- URL unificada: `https://seoxtbjhpysgzbrjymjg.supabase.co`

### 2. Script SQL Completo Criado
- Arquivo: `create_database_tables.sql`
- Contém todas as tabelas necessárias
- Inclui políticas de segurança (RLS)
- Configurações de índices para performance

### 3. Correções no Código
- Corrigidos os nomes das colunas na tabela `user_profiles`
- Melhorado o tratamento de erros
- Ajustadas as consultas SQL

## 🚀 PASSOS PARA CONFIGURAR

### Passo 1: Executar Script SQL
1. Acesse o painel do Supabase: https://app.supabase.com
2. Vá para o projeto: `https://seoxtbjhpysgzbrjymjg.supabase.co`
3. No menu lateral, clique em "SQL Editor"
4. Cole o conteúdo do arquivo `create_database_tables.sql`
5. Execute o script clicando em "Run"

### Passo 2: Verificar Tabelas Criadas
Após executar o script, você deve ter as seguintes tabelas:
- `user_profiles` - Perfis de usuários
- `favoritos` - Favoritos dos usuários
- `aniversariantes` - Lista de aniversariantes
- `logs_cliques` - Logs de cliques
- `user_settings` - Configurações dos usuários
- `active_sessions` - Sessões ativas

### Passo 3: Configurar Autenticação
1. No painel do Supabase, vá em "Authentication" > "Settings"
2. Verifique se está habilitado:
   - Email confirmations
   - Secure email change
3. Configure o site URL: `http://localhost:3000` (ou sua URL de produção)

### Passo 4: Iniciar o Servidor
```bash
cd server
npm install
npm start
```

### Passo 5: Testar Autenticação
1. Abra `auth.html` no navegador
2. O sistema tentará criar automaticamente o usuário admin:
   - Email: `msribeiro@trt15.jus.br`
   - Senha temporária: `TrT15@2025tmp`

## 🔑 USUÁRIO ADMINISTRADOR

**Email:** `msribeiro@trt15.jus.br`  
**Senha inicial:** `TrT15@2025tmp`

⚠️ **IMPORTANTE:** No primeiro login, o sistema solicitará para alterar a senha.

## 🔍 VERIFICAÇÕES DE FUNCIONAMENTO

### 1. Verificar se o Supabase está conectado
- Abra o console do navegador
- Deve aparecer: "✅ Cliente Supabase inicializado com sucesso!"

### 2. Verificar tabelas no banco
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 3. Verificar usuário admin
```sql
SELECT * FROM user_profiles WHERE role = 'admin';
```

## 🐛 TROUBLESHOOTING

### Erro: "relation does not exist"
- Execute o script SQL completo no Supabase
- Verifique se todas as tabelas foram criadas

### Erro: "Invalid login credentials"
- Verifique se o usuário admin foi criado
- Tente registrar um novo usuário se necessário

### Erro de conexão
- Verifique se a URL e chave do Supabase estão corretas
- Certifique-se de que o projeto Supabase está ativo

### Console mostra erros de CORS
- Configure as URLs permitidas no painel do Supabase
- Adicione sua URL local e de produção

## 📱 FUNCIONALIDADES APÓS SETUP

Após a configuração, o sistema terá:
- ✅ Login/logout funcionando
- ✅ Registro de novos usuários
- ✅ Recuperação de senha
- ✅ Perfis de usuário
- ✅ Favoritos personalizados
- ✅ Logs de cliques
- ✅ Configurações de usuário
- ✅ Controle de sessões ativas

## 🔄 PRÓXIMOS PASSOS

1. Teste o login com o usuário admin
2. Altere a senha no primeiro acesso
3. Crie usuários adicionais se necessário
4. Configure backups regulares do banco
5. Monitore logs de autenticação