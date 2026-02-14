import { supabase } from '../supabaseClient';

export const LoggerService = {
  
  /**
   * Função auxiliar para limpar o objeto JSON
   * Remove campos 'undefined' e transforma em string segura
   */
  sanitizarObjeto: (obj: any) => {
    try {
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        // Remove valores undefined ou nulos para evitar erro 400
        if (value === undefined) return null;
        return value;
      }));
    } catch (e) {
      return {};
    }
  },

  auditarUpdate: async (
    modulo: string, 
    idRecurso: string | number, 
    nomeRecurso: string, 
    oldData: any, 
    newData: any, 
    usuarioNome: string
  ) => {
    const alteracoes: any = {};
    let mudouAlgo = false;

    // Compara apenas campos primitivos ou objetos simples
    Object.keys(newData).forEach(key => {
      // Ignora campos de controle
      if (['updated_at', 'created_at', 'last_seen', 'tecnologia', 'cliente'].includes(key)) return;

      const valorAntigo = oldData[key];
      const valorNovo = newData[key];

      // Comparação simples (evita erro com objetos complexos)
      if (String(valorAntigo) !== String(valorNovo)) {
        alteracoes[key] = {
          antes: valorAntigo ?? 'Vazio',
          depois: valorNovo ?? 'Vazio'
        };
        mudouAlgo = true;
      }
    });

    if (!mudouAlgo) return;

    // Envia usando a sanitização
    await supabase.from('logs_auditoria').insert({
      acao: `Editou ${nomeRecurso}`,
      usuario_nome: usuarioNome || 'Sistema',
      modulo: modulo,
      detalhes: LoggerService.sanitizarObjeto(alteracoes), // <--- AQUI A PROTEÇÃO
      recurso_id: String(idRecurso),
      tipo_recurso: modulo.toLowerCase(),
      data: new Date().toISOString()
    });
  },

  log: async (acao: string, usuario: string, modulo: string, detalhes: any = {}, idRecurso?: string) => {
    await supabase.from('logs_auditoria').insert({
      acao,
      usuario_nome: usuario || 'Sistema',
      modulo,
      detalhes: LoggerService.sanitizarObjeto(detalhes), // <--- AQUI A PROTEÇÃO
      recurso_id: String(idRecurso || ''),
      data: new Date().toISOString()
    });
  }
};