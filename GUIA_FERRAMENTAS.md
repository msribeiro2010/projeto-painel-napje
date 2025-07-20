# 🛠️ Guia de Ferramentas de Qualidade

## 📋 Visão Geral

Este projeto agora inclui um conjunto completo de ferramentas para garantir a qualidade, manutenibilidade e performance do código. Este guia explica como usar cada ferramenta.

---

## 🚀 **Comandos Principais**

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento com live reload
npm run dev

# Iniciar apenas o servidor backend
npm start
```

### Qualidade de Código
```bash
# Executar linting e corrigir problemas automaticamente
npm run lint

# Apenas verificar problemas sem corrigir
npm run lint:check

# Formatar código automaticamente
npm run format

# Verificar formatação sem alterar arquivos
npm run format:check
```

### Testes
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch (re-executa quando arquivos mudam)
npm run test:watch

# Executar testes com relatório de cobertura
npm run test:coverage
```

### Build e Deploy
```bash
# Build completo (lint + test + minify)
npm run build

# Apenas minificar arquivos
npm run minify

# Preparar para deploy
npm run deploy
```

### Manutenção
```bash
# Validar tudo (lint + format + test)
npm run validate

# Limpar arquivos temporários
npm run clean

# Auditoria de segurança
npm run audit

# Verificar pacotes desatualizados
npm run outdated
```

---

## 🔧 **Configuração das Ferramentas**

### ESLint
**Arquivo:** `.eslintrc.json`

- **Propósito:** Análise estática do código JavaScript
- **Regras:** Padrões de qualidade, detecção de bugs, boas práticas
- **Configuração:** Baseada no `eslint:recommended` com regras customizadas

**Principais regras ativadas:**
- Uso obrigatório de `const`/`let` ao invés de `var`
- Aspas simples obrigatórias
- Ponto e vírgula obrigatório
- Detecção de variáveis não utilizadas
- Prevenção de `console.log` em produção

### Prettier
**Arquivo:** `.prettierrc`

- **Propósito:** Formatação automática e consistente do código
- **Configuração:** 4 espaços para JS, 2 para HTML/CSS/JSON
- **Suporte:** JavaScript, CSS, HTML, JSON

**Configurações principais:**
- Aspas simples
- Ponto e vírgula sempre
- Largura máxima de 100 caracteres
- Sem vírgula final

### Jest
**Arquivo:** `jest.config.js`

- **Propósito:** Framework de testes unitários
- **Ambiente:** jsdom (simula browser)
- **Cobertura:** Relatórios em HTML e LCOV
- **Metas:** 70% de cobertura mínima

**Recursos configurados:**
- Mocks automáticos para Supabase
- Setup global para testes
- Timeout de 10 segundos
- Relatórios detalhados

### Babel
**Arquivo:** `.babelrc`

- **Propósito:** Transpilação de JavaScript moderno
- **Configuração:** ES6+ para Node.js atual
- **Uso:** Principalmente para testes

---

## 📊 **Relatórios e Métricas**

### Cobertura de Testes
Após executar `npm run test:coverage`:
- **HTML:** `coverage/lcov-report/index.html`
- **Terminal:** Resumo direto no console
- **Meta:** Mínimo 70% em todas as métricas

### Lighthouse (Performance)
Configurado em `.lighthouserc.json`:
- **Performance:** Mínimo 80%
- **Acessibilidade:** Mínimo 90%
- **Boas Práticas:** Mínimo 85%
- **SEO:** Mínimo 80%

### Métricas de Performance
- **First Contentful Paint:** < 2s
- **Largest Contentful Paint:** < 3s
- **Cumulative Layout Shift:** < 0.1
- **Total Blocking Time:** < 500ms

---

## 🔄 **CI/CD com GitHub Actions**

### Workflow Automático
**Arquivo:** `.github/workflows/ci.yml`

**Triggers:**
- Push para `main` ou `develop`
- Pull Requests para `main`

**Jobs executados:**
1. **Test:** Lint, format, testes, auditoria
2. **Build:** Compilação e minificação
3. **Lighthouse:** Análise de performance (apenas main)
4. **Deploy Preview:** Deploy de preview para PRs
5. **Deploy Production:** Deploy para produção (apenas main)

### Secrets Necessários
Para o GitHub Actions funcionar, configure estes secrets:
```
VERCEL_TOKEN=seu_token_vercel
VERCEL_ORG_ID=seu_org_id
VERCEL_PROJECT_ID=seu_project_id
```

---

## 📁 **Estrutura de Arquivos**

```
📁 projeto-painel-napje/
├── 📄 .eslintrc.json          # Configuração ESLint
├── 📄 .prettierrc             # Configuração Prettier
├── 📄 .prettierignore         # Arquivos ignorados pelo Prettier
├── 📄 .babelrc                # Configuração Babel
├── 📄 jest.config.js          # Configuração Jest
├── 📄 .lighthouserc.json      # Configuração Lighthouse
├── 📄 .env.development        # Variáveis de ambiente (exemplo)
├── 📁 .github/
│   └── 📁 workflows/
│       └── 📄 ci.yml          # Pipeline CI/CD
├── 📁 tests/
│   ├── 📄 setup.js            # Setup global para testes
│   └── 📄 auth.test.js        # Exemplo de teste
├── 📁 coverage/               # Relatórios de cobertura (gerado)
├── 📁 dist/                   # Arquivos minificados (gerado)
└── 📄 MELHORIAS_CODIGO.md     # Documentação de melhorias
```

---

## 🎯 **Workflow Recomendado**

### Para Desenvolvimento
1. **Iniciar desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Antes de cada commit:**
   ```bash
   npm run validate
   ```

3. **Corrigir problemas automaticamente:**
   ```bash
   npm run lint
   npm run format
   ```

### Para Deploy
1. **Build local:**
   ```bash
   npm run build
   ```

2. **Push para GitHub:**
   ```bash
   git add .
   git commit -m "feat: nova funcionalidade"
   git push origin main
   ```

3. **CI/CD automático:**
   - Testes executados automaticamente
   - Deploy para Vercel se tudo passar
   - Relatórios de performance gerados

---

## 🐛 **Solução de Problemas**

### ESLint Errors
```bash
# Ver todos os problemas
npm run lint:check

# Corrigir automaticamente
npm run lint
```

### Prettier Conflicts
```bash
# Formatar todos os arquivos
npm run format

# Verificar se há conflitos
npm run format:check
```

### Testes Falhando
```bash
# Executar testes específicos
npx jest auth.test.js

# Modo debug
npx jest --verbose

# Atualizar snapshots
npx jest --updateSnapshot
```

### Build Errors
```bash
# Limpar cache
npm run clean

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

---

## 📈 **Próximos Passos**

### Implementação Gradual
1. **Semana 1:** Configurar ferramentas localmente
2. **Semana 2:** Escrever testes para módulos críticos
3. **Semana 3:** Configurar CI/CD no GitHub
4. **Semana 4:** Otimizar performance baseado no Lighthouse

### Melhorias Futuras
- [ ] Testes E2E com Cypress
- [ ] Análise de bundle size
- [ ] Monitoramento de performance em produção
- [ ] Testes de acessibilidade automatizados
- [ ] Integração com Sonar Cloud

---

## 📞 **Suporte**

**Desenvolvedor:** Marcelo S Ribeiro  
**Email:** msribeiro@trt15.jus.br  
**GitHub:** https://github.com/msribeiro2010/projeto-painel-napje

---

*Este guia será atualizado conforme novas ferramentas forem adicionadas ao projeto.*