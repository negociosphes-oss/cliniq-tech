import { supabase } from '../supabaseClient';
import { format, parseISO, isValid, addMonths } from 'date-fns';
import QRCode from 'qrcode';

const safeText = (text: any, fallback = '-') => (!text || text === 'undefined' || text === 'null') ? fallback : String(text);
const formatDate = (date: any) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? parseISO(date) : date;
    return isValid(d) ? format(d, 'dd/MM/yyyy') : '-';
};

const resolveStorageUrl = (path: any, folder: string = 'assinaturas') => {
    if (!path || typeof path !== 'string') return null;
    if (path.startsWith('http')) return path;
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/os-imagens/${folder}/${path}`;
};

export const CertificadoService = {
  async gerarPayload(osId: number) {
    try {
      const { data: os, error: errOS } = await supabase.from('ordens_servico').select('*').eq('id', osId).single();
      if (errOS || !os) throw new Error('OS não encontrada.');

      let equipData: any = {};
      let tecData: any = {};
      let clienteData: any = {};

      if (os.equipamento_id) {
          const { data: equip } = await supabase.from('equipamentos').select(`*, tecnologia:tecnologias!fk_tecnologia_oficial (*)`).eq('id', os.equipamento_id).maybeSingle();
          if (equip) {
              equipData = equip;
              tecData = equip.tecnologia || {}; 
              if (equip.cliente_id) {
                  const { data: cli } = await supabase.from('clientes').select('*').eq('id', equip.cliente_id).maybeSingle();
                  clienteData = cli || {};
              }
          }
      }

      if (!clienteData.id && os.cliente_id) {
          const { data: cli } = await supabase.from('clientes').select('*').eq('id', os.cliente_id).maybeSingle();
          clienteData = cli || {};
      }

      const { data: exec } = await supabase.from('os_metrologia_execucoes')
        .select('*, responsavel:id_tecnico_responsavel(*), executor:id_tecnico_executor(*)')
        .eq('ordem_servico_id', osId).order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (!exec) throw new Error('Calibração não finalizada. Salve os dados técnicos antes de gerar o laudo.');

      const { data: config } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();

      const { data: links } = await supabase.from('os_metrologia_padroes').select('padrao_id').eq('execucao_id', exec.id);
      let padroesReais: any[] = [];
      if (links && links.length > 0) {
          const ids = links.map((l: any) => l.padrao_id);
          const { data: p } = await supabase.from('padroes').select('*').in('id', ids);
          padroesReais = p || [];
      }

      const { data: itens } = await supabase.from('os_metrologia_itens').select('*').eq('execucao_id', exec.id).order('ordem');

      let statusMatematico = 'PENDENTE';
      if (itens && itens.length > 0) {
          const temAlgumaLeitura = itens.some((i: any) => i.valor_lido !== null && i.valor_lido !== '');
          const equipamentoComFalha = itens.some((i: any) => i.conforme === false || String(i.conforme).toLowerCase() === 'false');
          
          if (padroesReais.length === 0) {
              statusMatematico = 'REPROVADO';
          } else if (equipamentoComFalha) {
              statusMatematico = 'REPROVADO';
          } else if (temAlgumaLeitura) {
              statusMatematico = 'APROVADO';
          }
      }

      const statusFinal = statusMatematico;
      const dataEmissao = new Date(exec.data_calibracao || new Date());
      const validadeMeses = equipData.periodicidade || 12; 
      const dataVencimento = addMonths(dataEmissao, validadeMeses);
      
      const validadeTexto = statusFinal === 'REPROVADO' ? 'NÃO APLICÁVEL (REPROVADO)' : format(dataVencimento, 'dd/MM/yyyy');
      const numeroCertificado = `CERT-${dataEmissao.getFullYear()}-${String(os.id).padStart(6, '0')}`;
      
      const baseUrl = window.location.origin; 
      const chaveAutenticidade = `${numeroCertificado}-${exec.id}`;
      const urlVerificacao = `${baseUrl}/autenticidade?chave=${chaveAutenticidade}`;
      const qrCodeUrl = await QRCode.toDataURL(urlVerificacao, { width: 100, margin: 1 });

      return {
        id_doc: chaveAutenticidade, 
        numero: numeroCertificado,
        emissao: format(dataEmissao, 'dd/MM/yyyy HH:mm'),
        validade: validadeTexto,
        status: statusFinal,
        qr_code: qrCodeUrl,
        
        cabecalho: {
            empresa: safeText(config?.nome_empresa || config?.nome_fantasia, 'ATLAS SYSTEM MEDICAL'),
            cnpj: safeText(config?.cnpj),
            endereco: safeText(config?.endereco_completo),
            contato: safeText(config?.telefone || config?.email),
            logo: config?.logo_url || config?.logotipo_url // Pega URL direta
        },

        cliente: {
            nome: safeText(clienteData.nome_fantasia || clienteData.razao_social, 'Cliente não informado'),
            doc: safeText(clienteData.cnpj_cpf || clienteData.doc_id),
            endereco: `${safeText(clienteData.endereco)}, ${safeText(clienteData.cidade)}`
        },

        equipamento: {
            nome: safeText(equipData.nome || tecData.nome || os.equipamento_nome || os.titulo, 'Ativo Hospitalar'),
            modelo: safeText(equipData.modelo || tecData.modelo || os.equipamento_modelo, '-'),
            fabricante: safeText(equipData.fabricante || tecData.fabricante || os.equipamento_fabricante, '-'),
            serie: safeText(equipData.n_serie || equipData.serie || os.equipamento_serie, '-'),
            patrimonio: safeText(equipData.patrimonio || os.equipamento_patrimonio, '-'),
            tag: safeText(equipData.tag || os.equipamento_tag, '-')
        },

        ambiente: {
            temp: safeText(exec.temperatura),
            umid: safeText(exec.umidade)
        },

        // 🚀 AQUI ESTÁ A MÁGICA DOS PADRÕES (Layout do seu Exemplo)
        padroes: padroesReais.map((item: any, index: number) => ({
            index: index + 1,
            nome: safeText(item.nome),
            tag: safeText(item.codigo || item.tag, '-'),
            serie: safeText(item.n_serie, '-'),
            emissor: safeText(item.orgao_calibrador || item.fabricante, 'RBC'),
            emissao: formatDate(item.data_calibracao),
            validade: formatDate(item.data_vencimento),
            certificado: safeText(item.n_certificado, '-'),
            // Fallback robusto caso não tenha a coluna rastreabilidade específica
            rastreabilidade: safeText(item.rastreabilidade || item.dados_rastreabilidade || item.observacoes || `PADRÕES UTILIZADOS COM RASTREABILIDADE RBC/INMETRO. CERTIFICADO ORIGEM: ${safeText(item.n_certificado)} - VALIDADE: ${formatDate(item.data_vencimento)}`, '-')
        })),

        resultados: (itens || []).map((i: any) => ({
            teste: safeText(i.descricao_teste),
            unidade: safeText(i.unidade),
            ref: safeText(i.valor_referencia_snapshot),
            lido: safeText(i.valor_lido),
            erro: Number(i.erro_encontrado || 0).toFixed(2),
            incerteza: `k=${safeText(i.incerteza_k, '2')}`,
            status: (i.conforme === true || String(i.conforme).toLowerCase() === 'true') ? 'OK' : 'NOK'
        })),

        assinaturas: {
            executor: safeText(exec.executor?.nome, 'Técnico Executor'),
            executor_reg: safeText(exec.executor?.registro_profissional),
            executor_assinatura: resolveStorageUrl(exec.executor?.assinatura_url || exec.executor?.foto_url, 'assinaturas'), 

            responsavel: safeText(exec.responsavel?.nome, 'Engenheiro Responsável'),
            responsavel_reg: safeText(exec.responsavel?.registro_profissional),
            responsavel_assinatura: resolveStorageUrl(exec.responsavel?.assinatura_url || exec.responsavel?.foto_url, 'assinaturas') 
        },

        notas_tecnicas: {
            metodologia: "Calibração realizada por COMPARAÇÃO DIRETA com padrões rastreáveis ao SI/Inmetro.",
            incerteza: "A Incerteza Expandida relatada baseia-se em uma incerteza padrão combinada multiplicada por um fator de abrangência k=2 (95%).",
            condicoes: `Condições ambientais: Temp: ${safeText(exec.temperatura)}°C / Umid: ${safeText(exec.umidade)}%.`,
            obs: safeText(exec.observacoes_finais, 'Sem observações adicionais.')
        }
      };

    } catch (e: any) { 
        console.error("Erro no motor CertificadoService:", e);
        throw e; 
    }
  }
};