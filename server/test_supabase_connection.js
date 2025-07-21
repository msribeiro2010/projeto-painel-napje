const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://qkdciqmomuczdfgdqbcx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZGNpcW1vbXVjemRmZ2RxYmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzAxMDMsImV4cCI6MjA2ODU0NjEwM30.YuxnYd0yjjbZmLbE9a40eE8PICD3Ae4CIBv_Qu_aMxs';

async function testConnection() {
    console.log('🔍 Testando conexão com Supabase...');
    
    try {
        // Criar cliente
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        console.log('✅ Cliente Supabase criado');

        // Teste 1: Verificar se conseguimos fazer uma consulta básica
        console.log('\n📋 Teste 1: Consulta básica...');
        try {
            const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
            if (error) {
                console.log('❌ Erro na consulta:', error.message);
                console.log('🔍 Detalhes do erro:', error);
            } else {
                console.log('✅ Consulta bem-sucedida');
            }
        } catch (err) {
            console.log('❌ Erro na consulta básica:', err.message);
        }

        // Teste 2: Verificar autenticação
        console.log('\n🔐 Teste 2: Verificar usuário atual...');
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) {
                console.log('❌ Erro ao verificar usuário:', error.message);
            } else {
                console.log('📊 Status do usuário:', user ? `Logado: ${user.email}` : 'Não logado');
            }
        } catch (err) {
            console.log('❌ Erro na verificação de usuário:', err.message);
        }

        // Teste 3: Tentar criar usuário admin
        console.log('\n👤 Teste 3: Tentativa de registro do admin...');
        try {
            const { data, error } = await supabase.auth.signUp({
                email: 'msribeiro@trt15.jus.br',
                password: 'TrT15@2025tmp',
                options: {
                    data: {
                        full_name: 'Marcelo S Ribeiro',
                        role: 'admin'
                    }
                }
            });

            if (error) {
                console.log('❌ Erro no registro:', error.message);
                console.log('🔍 Código do erro:', error.status);
                
                if (error.message.includes('already registered')) {
                    console.log('ℹ️ Usuário já existe, tentando login...');
                    
                    // Teste 4: Tentar login
                    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                        email: 'msribeiro@trt15.jus.br',
                        password: 'TrT15@2025tmp'
                    });
                    
                    if (loginError) {
                        console.log('❌ Erro no login:', loginError.message);
                        console.log('🔍 Detalhes:', loginError);
                    } else {
                        console.log('✅ Login bem-sucedido!');
                        console.log('👤 Usuário:', loginData.user.email);
                        
                        // Teste 5: Verificar se perfil existe
                        try {
                            const { data: profile, error: profileError } = await supabase
                                .from('user_profiles')
                                .select('*')
                                .eq('user_id', loginData.user.id)
                                .single();
                                
                            if (profileError) {
                                console.log('⚠️ Perfil não encontrado:', profileError.message);
                                
                                // Tentar criar perfil
                                console.log('🔄 Tentando criar perfil...');
                                const { data: newProfile, error: createError } = await supabase
                                    .from('user_profiles')
                                    .insert([{
                                        user_id: loginData.user.id,
                                        full_name: 'Marcelo S Ribeiro',
                                        role: 'admin',
                                        first_login: true
                                    }])
                                    .select();
                                    
                                if (createError) {
                                    console.log('❌ Erro ao criar perfil:', createError.message);
                                } else {
                                    console.log('✅ Perfil criado com sucesso!');
                                }
                            } else {
                                console.log('✅ Perfil encontrado:', profile.full_name, profile.role);
                            }
                        } catch (profileErr) {
                            console.log('❌ Erro ao verificar perfil:', profileErr.message);
                        }
                    }
                }
            } else {
                console.log('✅ Usuário registrado com sucesso!');
                if (data.user) {
                    console.log('👤 Novo usuário:', data.user.email);
                }
            }
        } catch (err) {
            console.log('❌ Erro no teste de registro:', err.message);
        }

        // Teste 6: Listar tabelas disponíveis
        console.log('\n📋 Teste 6: Verificar tabelas disponíveis...');
        const tables = ['user_profiles', 'favoritos', 'aniversariantes', 'logs_cliques', 'user_settings'];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase.from(table).select('count').limit(1);
                if (error) {
                    console.log(`❌ Tabela ${table}: ${error.message}`);
                } else {
                    console.log(`✅ Tabela ${table}: OK`);
                }
            } catch (err) {
                console.log(`❌ Tabela ${table}: ${err.message}`);
            }
        }

    } catch (error) {
        console.log('💥 Erro fatal:', error.message);
    }
}

// Executar teste
testConnection().then(() => {
    console.log('\n🎯 Teste concluído!');
    process.exit(0);
}).catch(error => {
    console.log('\n💥 Erro fatal no teste:', error.message);
    process.exit(1);
});