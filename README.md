# 🏛️ Painel NAPJe - TRT15

> Sistema de gestão e painel administrativo para o Núcleo de Apoio ao Planejamento Judiciário do TRT15

## 🚀 Deploy Rápido

### Vercel (Recomendado)

1. **Fork/Clone este repositório**
2. **Conecte ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Importe o repositório
   - Configure as variáveis de ambiente

3. **Variáveis de Ambiente:**
   ```env
   SUPABASE_URL=sua_url_do_supabase
   SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Deploy automático** ✅

### GitHub Pages

1. **Configure o repositório:**
   - Vá em Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / (root)

2. **Adicione as variáveis no código:**
   - Edite `auth.html` e `index.html`
   - Substitua as variáveis do Supabase

## 🛠️ Configuração Local

```bash
# Clone o repositório
git clone <seu-repositorio>
cd projeto-painel-napje

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# Inicie o servidor
npm start
```

## 📁 Estrutura do Projeto

```
painel-napje/
├── index.html              # Página principal
├── auth.html               # Sistema de autenticação
├── admin.html              # Painel administrativo
├── settings.html           # Configurações do usuário
├── style.css               # Estilos principais
├── auth.js                 # Lógica de autenticação
├── script.js               # JavaScript principal
├── admin.js                # Funcionalidades admin
├── server/                 # Servidor Node.js
│   ├── server.js          # Servidor principal
│   ├── config/            # Configurações
│   └── data/              # Dados estáticos
└── assets/                # Recursos estáticos
```

## 🔧 Configuração do Supabase

### 1. Criar Projeto
- Acesse [supabase.com](https://supabase.com)
- Crie um novo projeto
- Anote a URL e chave anônima

### 2. Configurar Autenticação
- Authentication → Settings
- Configure domínio permitido: `@trt15.jus.br`
- Desabilite confirmação por email (opcional para desenvolvimento)

### 3. Configurar Banco de Dados
- Execute os scripts SQL necessários
- Configure RLS (Row Level Security)
- Crie tabelas: `user_profiles`, `user_settings`, `logs_cliques`

## 🌐 Funcionalidades

- ✅ **Autenticação** com email institucional (@trt15.jus.br)
- ✅ **Painel Principal** com atalhos personalizáveis
- ✅ **Sistema de Favoritos** por usuário
- ✅ **Calendário** com feriados e aniversários
- ✅ **Configurações** personalizadas
- ✅ **Painel Admin** para gestão
- ✅ **Logs de Atividade** e analytics
- ✅ **Modo Offline** com Service Worker

## 🔒 Segurança

- Autenticação obrigatória
- Validação de email institucional
- Row Level Security (RLS)
- Sanitização de dados
- HTTPS obrigatório em produção

## 📱 Responsividade

- ✅ Desktop (1920x1080+)
- ✅ Tablet (768px+)
- ✅ Mobile (320px+)
- ✅ PWA (Progressive Web App)

## 🚀 Performance

- Service Worker para cache
- Lazy loading de imagens
- Minificação automática
- CDN para recursos estáticos

## 📞 Suporte

- **Desenvolvedor:** Marcelo Ribeiro
- **Email:** msribeiro@trt15.jus.br
- **Versão:** 2.0.0
- **Última atualização:** 2024

## 📄 Licença

Este projeto é de uso interno do TRT15.

---

**🏛️ Tribunal Regional do Trabalho da 15ª Região**