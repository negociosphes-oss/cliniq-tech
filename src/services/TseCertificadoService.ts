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

      // Busca Perfil Norma
      if (tseData.perfil_id) {
          const { data: perfil } = await supabase.from('metrologia_tse_normas').select('*').eq('id', tseData.perfil_id).maybeSingle();
          tseData.metrologia_tse_normas = perfil || {};
      }

      // 🚀 BUSCA INTELIGENTE DO EQUIPAMENTO + NOVO DICIONÁRIO
      if (tseData.equipamento_id) {
          const { data: equip } = await supabase
            .from('equipamentos')
            .select(`
                *, 
                clientes(*), 
                dict_modelos(*, dict_tecnologias(*), dict_fabricantes(*))
            `)
            .eq('id', tseData.equipamento_id)
            .maybeSingle();

          if (equip) {
              // Converte o "Dicionário Novo" pro formato que o PDF já entende (Evita ter que reescrever o PDF)
              if (equip.dict_modelos) {
                  equip.tecnologias = { nome: equip.dict_modelos.dict_tecnologias?.nome };
                  equip.fabricante = equip.dict_modelos.dict_fabricantes?.nome;
                  equip.modelo = equip.dict_modelos.nome;
              }
          }
          tseData.equipamentos = equip || {};
      }

      if (tseData.id_tecnico_executor) {
          const { data: tec } = await supabase.from('equipe_tecnica').select('*').eq('id', tseData.id_tecnico_executor).maybeSingle();
          tseData.equipe_tecnica = tec || {};
      }

      let configData = {};
      
      // Tenta puxar configurações do inquilino ou da matriz
      const { data: tenantData } = await supabase.from('empresas_inquilinas').select('*').eq('id', tseData.tenant_id || 1).maybeSingle();
      if (tenantData) configData = { ...configData, ...tenantData };
      
      try {
         const { data: confData } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
         if (confData) configData = { ...configData, ...confData };
      } catch (e) {}

      return { data: tseData, empresaConfig: configData };
      
    } catch (error: any) {
      console.error('TseCertificadoService Error:', error);
      throw error;
    }
  }
}