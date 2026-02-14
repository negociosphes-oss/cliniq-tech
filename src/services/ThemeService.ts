import { supabase } from '../supabaseClient';
import { ATLAS_THEMES } from '../constants/themes';

export const ThemeService = {
  // 1. Aplica o tema visualmente no Navegador (CSS Variables)
  aplicarTemaNoDOM(primaryColor: string, isDark: boolean) {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  },

  // 2. Busca a configuração oficial do banco de dados
  async carregarConfiguracaoOficial() {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('tema_nome, cor_primaria, modo_escuro_padrao')
        .eq('id', 1)
        .maybeSingle();

      // Fallback seguro se o banco falhar
      if (!data) return { primary: ATLAS_THEMES[0].primary, isDark: false };

      // Retorna o tema encontrado ou o padrão Ocean
      const temaEncontrado = ATLAS_THEMES.find(t => t.id === data.tema_nome) || ATLAS_THEMES[0];
      
      return {
        primary: data.cor_primaria || temaEncontrado.primary,
        isDark: data.modo_escuro_padrao || false
      };
    } catch (error) {
      console.error("Erro tema:", error);
      return { primary: '#2563eb', isDark: false };
    }
  },

  // 3. Salva a nova escolha feita no Sidebar ou Painel
  async salvarNovoTema(themeId: string, primaryColor: string) {
    await supabase
      .from('configuracoes')
      .update({ tema_nome: themeId, cor_primaria: primaryColor })
      .eq('id', 1);
    
    // Aplica instantaneamente
    this.aplicarTemaNoDOM(primaryColor, document.documentElement.classList.contains('dark'));
  }
};