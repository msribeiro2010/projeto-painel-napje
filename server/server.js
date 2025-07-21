const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const supabase = require('./config/supabase');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta raiz do projeto
app.use(express.static(path.join(__dirname, '..')));

// Helper function to read JSON files
async function readJsonFile(filename) {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error);
    throw error;
  }
}

// Endpoints originais (mantidos como fallback)
app.get('/api/aniversariantes', async (req, res) => {
  try {
    const data = await readJsonFile('aniversariantes.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching birthday data' });
  }
});

app.get('/api/feriados', async (req, res) => {
  try {
    const data = await readJsonFile('feriados.json');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching holiday data' });
  }
});

// ===== ENDPOINTS SUPABASE =====

// Favoritos
app.get('/api/supabase/favoritos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('favoritos')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ favoritos: data || [] });
  } catch (error) {
    console.error('Erro ao buscar favoritos:', error);
    res.status(500).json({ error: 'Erro ao buscar favoritos' });
  }
});

app.post('/api/supabase/favoritos', async (req, res) => {
  try {
    const { titulo, url, icone, usuario_id } = req.body;
    
    const { data, error } = await supabase
      .from('favoritos')
      .insert([{ titulo, url, icone, usuario_id }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ favorito: data[0] });
  } catch (error) {
    console.error('Erro ao criar favorito:', error);
    res.status(500).json({ error: 'Erro ao criar favorito' });
  }
});

app.put('/api/supabase/favoritos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, url, icone } = req.body;
    
    const { data, error } = await supabase
      .from('favoritos')
      .update({ titulo, url, icone })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ favorito: data[0] });
  } catch (error) {
    console.error('Erro ao atualizar favorito:', error);
    res.status(500).json({ error: 'Erro ao atualizar favorito' });
  }
});

app.delete('/api/supabase/favoritos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('favoritos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Favorito removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover favorito:', error);
    res.status(500).json({ error: 'Erro ao remover favorito' });
  }
});

// Aniversariantes
app.get('/api/supabase/aniversariantes', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('aniversariantes')
      .select('*')
      .order('nome', { ascending: true });
    
    if (error) throw error;
    res.json({ Servidores: data || [] });
  } catch (error) {
    console.error('Erro ao buscar aniversariantes:', error);
    res.status(500).json({ error: 'Erro ao buscar aniversariantes' });
  }
});

app.post('/api/supabase/aniversariantes', async (req, res) => {
  try {
    const { nome, data } = req.body;
    
    const { data: result, error } = await supabase
      .from('aniversariantes')
      .insert([{ nome, data }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ aniversariante: result[0] });
  } catch (error) {
    console.error('Erro ao criar aniversariante:', error);
    res.status(500).json({ error: 'Erro ao criar aniversariante' });
  }
});

app.put('/api/supabase/aniversariantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, data } = req.body;
    
    const { data: result, error } = await supabase
      .from('aniversariantes')
      .update({ nome, data })
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.json({ aniversariante: result[0] });
  } catch (error) {
    console.error('Erro ao atualizar aniversariante:', error);
    res.status(500).json({ error: 'Erro ao atualizar aniversariante' });
  }
});

app.delete('/api/supabase/aniversariantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('aniversariantes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    res.json({ message: 'Aniversariante removido com sucesso' });
  } catch (error) {
    console.error('Erro ao remover aniversariante:', error);
    res.status(500).json({ error: 'Erro ao remover aniversariante' });
  }
});

// Logs de cliques
app.post('/api/supabase/logs/click', async (req, res) => {
  try {
    const { botao_nome, url, usuario_id, ip_address } = req.body;
    
    const { data, error } = await supabase
      .from('logs_cliques')
      .insert([{ botao_nome, url, usuario_id, ip_address }])
      .select();
    
    if (error) throw error;
    res.status(201).json({ log: data[0] });
  } catch (error) {
    console.error('Erro ao registrar clique:', error);
    res.status(500).json({ error: 'Erro ao registrar clique' });
  }
});

// Estatísticas
app.get('/api/supabase/stats/clicks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('logs_cliques')
      .select('botao_nome, count(*)')
      .group('botao_nome')
      .order('count', { ascending: false });
    
    if (error) throw error;
    res.json({ stats: data || [] });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// Endpoint para obter estatísticas de cliques
app.get('/api/stats/clicks', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('logs_cliques')
      .select('url, COUNT(*) as total_clicks')
      .group('url')
      .order('total_clicks', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ENDPOINTS DE AUTENTICAÇÃO =====

// Endpoint para obter perfil do usuário
app.get('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Buscar perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }

    res.json({ user, profile });
  } catch (error) {
    console.error('Erro no endpoint de perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para atualizar perfil do usuário
app.put('/api/auth/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { name, email } = req.body;
    
    // Atualizar perfil
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({ 
        full_name: name,
        first_login: false,
        last_login: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (profileError) {
      console.error('Erro ao atualizar perfil:', profileError);
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }

    // Se o email foi alterado, atualizar também no auth
    if (email && email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        console.error('Erro ao atualizar email:', emailError);
        return res.status(500).json({ error: 'Erro ao atualizar email' });
      }
    }

    res.json({ profile, message: 'Perfil atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para alterar senha
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
    }

    // Atualizar senha
    const { error: passwordError } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (passwordError) {
      console.error('Erro ao alterar senha:', passwordError);
      return res.status(500).json({ error: 'Erro ao alterar senha' });
    }

    // Marcar que não é mais o primeiro login
    await supabase
      .from('user_profiles')
      .update({ first_login: false })
      .eq('user_id', user.id);

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para verificar se é primeiro login
app.get('/api/auth/first-login', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('first_login')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao verificar primeiro login:', profileError);
      return res.status(500).json({ error: 'Erro ao verificar status' });
    }

    res.json({ first_login: profile.first_login });
  } catch (error) {
    console.error('Erro ao verificar primeiro login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Configurações do usuário
app.get('/api/supabase/user-settings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }
    
    // Criar cliente temporário com o token do usuário
    const userSupabase = createClient(
      'https://qkdciqmomuczdfgdqbcx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGNpcW1vbXVjemRmZ2RxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzAxMDMsImV4cCI6MjA2ODU0NjEwM30.YuxnYd0yjjbZmLbE9a40eE8PICD3Ae4CIBv_Qu_aMxs',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    const { data, error } = await userSupabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ settings: data || {} });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

app.post('/api/supabase/user-settings', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autorização necessário' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const { theme } = req.body;
    
    // Criar cliente temporário com o token do usuário
    const userSupabase = createClient(
      'https://qkdciqmomuczdfgdqbcx.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGNpcW1vbXVjemRmZ2RxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzAxMDMsImV4cCI6MjA2ODU0NjEwM30.YuxnYd0yjjbZmLbE9a40eE8PICD3Ae4CIBv_Qu_aMxs',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    // Usar o user.id do token autenticado em vez do user_id do body
    const { data, error } = await userSupabase
      .from('user_settings')
      .upsert([{ user_id: user.id, theme }])
      .select();
    
    if (error) throw error;
    res.json({ settings: data[0] });
  } catch (error) {
    console.error('Erro ao salvar configurações:', error);
    res.status(500).json({ error: 'Erro ao salvar configurações' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});