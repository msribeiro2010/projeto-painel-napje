# 🚀 Guia de Deploy para Produção - Painel NAPJe

## ✅ Checklist Pré-Deploy

### 1. Verificações de Código
- [ ] Executar testes: `npm test`
- [ ] Verificar linting: `npm run lint:check`
- [ ] Verificar formatação: `npm run format:check`
- [ ] Executar build: `npm run build`
- [ ] Verificar vulnerabilidades: `npm audit`

### 2. Configurações de Ambiente
- [ ] Arquivo `.env` configurado corretamente
- [ ] Variáveis de ambiente do Supabase válidas
- [ ] NODE_ENV=production
- [ ] URLs de produção configuradas

### 3. Banco de Dados (Supabase)
- [ ] Executar script SQL: `create_active_sessions_table.sql`
- [ ] Verificar tabelas: `user_profiles`, `user_settings`, `logs_cliques`, `active_sessions`
- [ ] Configurar RLS (Row Level Security)
- [ ] Testar conexão com banco

## 🔧 Configuração do Supabase para Produção

### 1. Executar Script SQL
```sql
-- Execute o arquivo create_active_sessions_table.sql no SQL Editor do Supabase
-- Isso criará a tabela active_sessions com todas as configurações necessárias
```

### 2. Configurar Autenticação
```
Authentication → Settings:
- Site URL: https://seu-dominio.vercel.app
- Redirect URLs: https://seu-dominio.vercel.app/auth.html
- Email Templates: Personalizar conforme necessário
- Email Domain: @trt15.jus.br (se aplicável)
```

### 3. Configurar RLS Policies
```sql
-- Verificar se as políticas RLS estão ativas em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🌐 Deploy no Vercel (Recomendado)

### 1. Preparação
```bash
# 1. Fazer commit de todas as alterações
git add .
git commit -m "Preparação para produção"
git push origin main

# 2. Executar build local para verificar
npm run build
```

### 2. Configuração no Vercel
1. **Conectar Repositório:**
   - Acesse [vercel.com](https://vercel.com)
   - Import Git Repository
   - Selecione o repositório do projeto

2. **Configurar Variáveis de Ambiente:**
   ```
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua_chave_anonima_aqui
   NODE_ENV=production
   ```

3. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Teste a aplicação

### 3. Configurações Avançadas
```json
// vercel.json já está configurado com:
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "DENY"},
        {"key": "X-XSS-Protection", "value": "1; mode=block"},
        {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"}
      ]
    }
  ]
}
```

## 🔒 Configurações de Segurança

### 1. Supabase Security
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de acesso configuradas
- [ ] Chaves de API protegidas
- [ ] CORS configurado corretamente

### 2. Aplicação
- [ ] HTTPS obrigatório
- [ ] Headers de segurança configurados
- [ ] Validação de entrada de dados
- [ ] Sanitização de dados do usuário

### 3. Monitoramento
- [ ] Logs de erro configurados
- [ ] Monitoramento de performance
- [ ] Alertas de segurança

## 📊 Otimizações de Performance

### 1. Assets
- [ ] CSS minificado: `npm run minify-css`
- [ ] JavaScript minificado: `npm run minify-js`
- [ ] Imagens otimizadas
- [ ] Cache headers configurados

### 2. Service Worker
- [ ] Cache de recursos estáticos
- [ ] Estratégia offline configurada
- [ ] Atualização automática

### 3. CDN
- [ ] Recursos estáticos via CDN
- [ ] Compressão gzip habilitada
- [ ] Cache-Control otimizado

## 🧪 Testes Pós-Deploy

### 1. Funcionalidades Básicas
- [ ] Login com email @trt15.jus.br
- [ ] Navegação entre páginas
- [ ] Criação/edição de atalhos
- [ ] Sistema de favoritos
- [ ] Calendário funcionando

### 2. Painel Administrativo
- [ ] Login como administrador
- [ ] Visualização de usuários ativos
- [ ] Estatísticas do dashboard
- [ ] Logs de atividade
- [ ] Gestão de usuários

### 3. Performance
- [ ] Tempo de carregamento < 3s
- [ ] Responsividade mobile
- [ ] Funcionamento offline
- [ ] PWA instalável

## 🔄 Processo de Atualização

### 1. Desenvolvimento
```bash
# 1. Criar branch para nova feature
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e testar
npm run dev
npm test

# 3. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin feature/nova-funcionalidade
```

### 2. Deploy
```bash
# 1. Merge para main
git checkout main
git merge feature/nova-funcionalidade

# 2. Executar validações
npm run validate
npm run build

# 3. Deploy automático via Vercel
git push origin main
```

## 📞 Suporte e Manutenção

### Contatos
- **Desenvolvedor:** Marcelo Ribeiro
- **Email:** msribeiro@trt15.jus.br
- **Repositório:** [GitHub](https://github.com/msribeiro2010/projeto-painel-napje)

### Logs e Monitoramento
- **Vercel Dashboard:** Monitoramento de performance
- **Supabase Dashboard:** Logs de banco de dados
- **Browser DevTools:** Debug de frontend

### Backup
- **Código:** Git repository
- **Banco de Dados:** Backup automático Supabase
- **Configurações:** Documentadas neste guia

---

## 🚀 Comandos Rápidos

```bash
# Preparar para produção
npm run validate && npm run build

# Deploy local para teste
npm start

# Verificar dependências
npm audit && npm outdated

# Limpar cache
npm run clean
```

**✅ Projeto pronto para produção!**