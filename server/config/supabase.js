const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const supabaseUrl = 'https://seoxtbjhpysgzbrjymjg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlb3h0YmpocHlzZ3picmp5bWpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTg3NDAsImV4cCI6MjA2ODQzNDc0MH0.qfIFxK1U2L9IKwJdtLBxqbguLZ6m90OqrVX28T_NZ7U';

// Criar cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;