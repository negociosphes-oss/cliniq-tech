import { supabase } from '../supabaseClient';

export class TseCertificadoService {
  static async gerarPayload(osId: number) {
    try {
      const { data: tseDataList, error: tseError } = await supabase
        .from('metrologia_tse')
        .select('*')
        .eq('ordem_servico_id', osId)
        .order('id', { ascending: false })
        .limit(1);

      if (tseError) throw new Error('Erro ao buscar dados do Ensaio.');
      if (!tseDataList || tseDataList.length === 0) throw new Error('Laudo não encontrado para esta O.S.');
      
      const tseData = tseDataList[0];

      if (tseData.perfil_id) {
          const { data: perfil } = await supabase.from('metrologia_tse_normas').select('*').eq('id', tseData.perfil_id).maybeSingle();
          tseData.metrologia_tse_normas = perfil || {};
      }

      if (tseData.equipamento_id) {
          const { data: equip } = await supabase.from('equipamentos').select('*').eq('id', tseData.equipamento_id).maybeSingle();
          if (equip) {
              if (equip.cliente_id) {
                  const { data: cli } = await supabase.from('clientes').select('*').eq('id', equip.cliente_id).maybeSingle();
                  equip.clientes = cli || {};
              }
              if (equip.tecnologia_id) {
                  const { data: tec } = await supabase.from('tecnologias').select('*').eq('id', equip.tecnologia_id).maybeSingle();
                  equip.tecnologias = tec || {};
              }
          }
          tseData.equipamentos = equip || {};
      }

      if (tseData.id_tecnico_executor) {
          const { data: tec } = await supabase.from('equipe_tecnica').select('*').eq('id', tseData.id_tecnico_executor).maybeSingle();
          tseData.equipe_tecnica = tec || {};
      }

      let configData = {};
      
      // 1. Tenta puxar da empresas_inquilinas
      const { data: tenantData } = await supabase.from('empresas_inquilinas').select('*').eq('id', tseData.tenant_id || 1).maybeSingle();
      if (tenantData) configData = { ...configData, ...tenantData };
      
      // 2. 🚀 A MÁGICA: Puxa da sua tabela exata 'configuracoes_empresa' que você me mostrou no vídeo
      try {
         const { data: confData } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
         if (confData) configData = { ...configData, ...confData };
      } catch (e) {
         // ignora se falhar
      }

      return { data: tseData, empresaConfig: configData };
      
    } catch (error: any) {
      console.error('TseCertificadoService Error:', error);
      throw error;
    }
  }
}