import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Download, Wrench, ShieldCheck, 
  Building2, AlertTriangle, FileText, Zap, FileBadge, Loader2, CheckCircle2 
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';

// Motores de Laudo (Caminhos Corrigidos)
import { TseCertificadoService } from '../../services/TseCertificadoService';
import { TseCertificadoPDF } from '../metrologia/TseCertificadoPDF';
import { CertificadoService } from '../../services/CertificadoService';
import { MetrologiaCertificadoPDF } from '../../documents/MetrologiaCertificadoPDF';

// 🚀 O SEU MOTOR OFICIAL DE O.S. AZUL (Caminho Corrigido!)
import { imprimirRelatorio } from '../ordem-servico/reports/RelatorioTecnicoTemplate';

export function OSPublicView() {
  const [os, setOs] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloadingOs, setIsDownloadingOs] = useState(false);
  const [isDownloadingLaudo, setIsDownloadingLaudo] = useState(false);

  const osUuid = window.location.pathname.split('/').filter(Boolean).pop();

  const getImageUrl = (path: any, folder: 'evidências' | 'configuração' | 'logos' = 'evidências') => {
    if (!path || typeof path !== 'string' || path.trim() === '') return null;
    if (path.startsWith('http')) return path; 
    const BUCKET = folder === 'logos' || folder === 'configuração' ? 'app-assets' : 'os-imagens';
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/${BUCKET}/${folder}/${path}`;
  };

  useEffect(() => {
    fetchData();
  }, [osUuid]);

  const fetchData = async () => {
    if (!osUuid) return setLoading(false);

    try {
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('*, equipamentos:equipamento_id (*)')
        .eq('id_publico', osUuid)
        .maybeSingle();

      if (osError) throw osError;

      if (osData) {
        const clienteId = osData.cliente_id || osData.equipamentos?.cliente_id;
        const tecId = osData.equipamentos?.tecnologia_id;

        let clienteInfo = null;
        let tecInfo = null;

        if (clienteId) {
           const { data: cli } = await supabase.from('clientes').select('*').eq('id', clienteId).maybeSingle();
           clienteInfo = cli;
        }
        if (tecId) {
           const { data: tec } = await supabase.from('tecnologias').select('*').eq('id', tecId).maybeSingle();
           tecInfo = tec;
        }

        if (osData.equipamentos) {
           osData.equipamentos.clientes = clienteInfo;
           osData.equipamentos.tecnologias = tecInfo;
        } else {
           osData.equipamentos = { clientes: clienteInfo, tecnologias: tecInfo };
        }

        setOs(osData);

        // Busca a configuração oficial do Painel
        let finalConfig: any = {};
        const { data: confData } = await supabase.from('configuracoes_empresa').select('*').order('id', { ascending: true }).limit(1).maybeSingle();
        if (confData) finalConfig = { ...confData };

        const { data: tenants } = await supabase.from('empresas_inquilinas').select('*').limit(1).maybeSingle();
        if (tenants) finalConfig = { ...tenants, ...finalConfig };

        setSystemConfig(finalConfig);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da OS Pública:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Acessando Cofre de Documentos</span>
      </div>
    </div>
  );

  if (!os) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 font-sans text-slate-400 p-8 text-center">
       <AlertTriangle size={64} className="mb-4 opacity-50" />
       <h2 className="text-xl font-black uppercase tracking-widest text-slate-600">Link Expirado ou Indisponível</h2>
       <p className="mt-2 font-medium">A Ordem de Serviço não foi encontrada na base de dados.</p>
    </div>
  );

  const empresaNome = systemConfig?.nome_fantasia || systemConfig?.razao_social || 'ATLAS SYSTEM MEDICAL';
  const clienteNome = os.equipamentos?.clientes?.nome_fantasia || os.equipamentos?.clientes?.razao_social || os.cliente_nome || 'Unidade Hospitalar';
  
  const tec = os.equipamentos?.tecnologias;
  const nomeBase = tec?.nome || os.equipamentos?.nome || os.equipamento_nome || 'Equipamento Médico';
  const nomeEquipamento = tec?.fabricante && tec?.modelo ? `${nomeBase} (${tec.fabricante} - ${tec.modelo})` : nomeBase;

  const rawLogoUrl = systemConfig?.logo_url || systemConfig?.logotipo_url;
  const finalLogoUrl = rawLogoUrl ? `${getImageUrl(rawLogoUrl, 'logos')}?v=${new Date().getTime()}` : null;

  const isTse = (os.tipo || '').toUpperCase().includes('SEGURANÇA');
  const isCalibracao = (os.tipo || '').toUpperCase().includes('CALIBRAÇÃO');
  const temLaudo = (isTse || isCalibracao) && os.status === 'Concluída';

  // 🚀 MÁGICA FINAL: Monta o pacotão exato do painel interno
  const handleDownloadOS = async () => {
      setIsDownloadingOs(true);
      try {
         // 1. Busca os Apontamentos (Mão de Obra)
         const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', os.id).order('data_inicio');
         
         // 2. Busca as Peças e Materiais
         const { data: pecasData } = await supabase.from('estoque_movimentacoes').select('*, estoque_itens(*)').eq('os_id', os.id).eq('tipo', 'SAIDA');
         
         // 3. Busca o Checklist (se houver)
         let checklistData = null;
         const { data: chkExec } = await supabase.from('os_checklists_execucao').select('*').eq('ordem_servico_id', os.id).maybeSingle();
         if (chkExec && chkExec.checklist_id) {
             const { data: chkPadrao } = await supabase.from('checklists_biblioteca').select('*').eq('id', chkExec.checklist_id).maybeSingle();
             if (chkPadrao) {
                 checklistData = { perguntas: chkPadrao.itens_configuracao || chkPadrao.perguntas, respostas: chkExec.respostas || [] };
             }
         }

         // 4. Monta o pacote e forçamos a inserção da Logo correta do banco!
         const fullData = {
            ...os,
            equipamento: { ...os.equipamentos },
            cliente: { ...os.equipamentos?.clientes },
            pecas: pecasData || [],
            checklistData: checklistData,
            apontamentos: aptData || [],
            logoUrl: finalLogoUrl // Força o template a puxar a logo carregada!
         };
         
         // 5. Manda imprimir no Layout Azul!
         await imprimirRelatorio(fullData, fullData.apontamentos, systemConfig || {});

      } catch (err) {
         console.error(err);
         alert("Ocorreu um erro ao gerar a impressão. Tente novamente.");
      } finally {
         setIsDownloadingOs(false);
      }
  };

  const handleDownloadLaudo = async () => {
      setIsDownloadingLaudo(true);
      try {
          if (isTse) {
              const payload = await TseCertificadoService.gerarPayload(os.id);
              if (!payload || !payload.data) throw new Error("Laudo de Segurança não encontrado ou não finalizado.");
              
              const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig || systemConfig} />).toBlob();
              saveAs(blob, `Laudo_TSE_OS_${os.id}.pdf`);
          } else if (isCalibracao) {
              const payload = await CertificadoService.gerarPayload(os.id);
              if (!payload) throw new Error("Certificado de Calibração não encontrado.");

              const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
              saveAs(blob, `Certificado_RBC_OS_${os.id}.pdf`);
          }
      } catch (err: any) { 
          console.error(err);
          alert(err.message || "Erro ao conectar com o motor de laudos."); 
      } finally { 
          setIsDownloadingLaudo(false); 
      }
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 pb-20">
      <nav className="bg-white border-b border-slate-200 p-4 shadow-sm flex justify-center sm:justify-between items-center px-6 md:px-10">
        <div className="flex items-center gap-4">
           {finalLogoUrl && (
             <img src={finalLogoUrl} className="h-10 w-auto object-contain" alt="Logo Empresa" onError={(e) => e.currentTarget.style.display = 'none'} />
           )}
           <span className="font-black text-sm uppercase tracking-tighter text-slate-800">{empresaNome}</span>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto p-4 md:p-6 mt-8 animate-fadeIn">
         <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200/60 mb-8">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight text-center mb-6">Portal de Documentos Técnicos</h1>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                <div className="flex items-start gap-4">
                   <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0"><Wrench size={24}/></div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Equipamento Avaliado</p>
                      <h2 className="text-base font-bold text-slate-800">{nomeEquipamento}</h2>
                      <p className="text-xs font-bold text-indigo-600 mt-1">TAG: {os.equipamentos?.tag || 'N/A'} {os.equipamentos?.numero_serie ? `| S/N: ${os.equipamentos.numero_serie}` : ''}</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-wrap gap-4 justify-between">
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1"><Building2 size={14}/> Cliente</p>
                      <p className="font-bold text-sm text-slate-700">{clienteNome}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1"><ShieldCheck size={14}/> Natureza do Serviço</p>
                      <span className="px-2.5 py-1 bg-slate-200 text-slate-700 text-[10px] font-black uppercase rounded-md">{os.tipo || 'Manutenção'}</span>
                   </div>
                </div>
            </div>
         </div>

         <h3 className="font-black text-slate-800 text-lg mb-4 px-2">Documentos Disponíveis</h3>
         <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-300 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0"><FileText size={24}/></div>
                    <div>
                        <h4 className="font-bold text-slate-800">Relatório Técnico de Serviço</h4>
                        <p className="text-xs text-slate-500 font-medium">Ordem de Serviço #{os.id}</p>
                    </div>
                </div>
                <button onClick={handleDownloadOS} disabled={isDownloadingOs} className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                    {isDownloadingOs ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                    {isDownloadingOs ? 'Gerando...' : 'Baixar OS'}
                </button>
            </div>

            {temLaudo && (
               <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-400 transition-all relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
                   <div className="flex items-center gap-4 pl-2">
                       <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                          {isTse ? <Zap size={24}/> : <FileBadge size={24}/>}
                       </div>
                       <div>
                           <h4 className="font-bold text-slate-800">{isTse ? 'Laudo de Segurança Elétrica' : 'Certificado de Calibração'}</h4>
                           <p className="text-xs text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Válido e Assinado</p>
                       </div>
                   </div>
                   <button onClick={handleDownloadLaudo} disabled={isDownloadingLaudo} className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                       {isDownloadingLaudo ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                       {isDownloadingLaudo ? 'Acessando...' : 'Baixar Laudo'}
                   </button>
               </div>
            )}

         </div>
      </main>
    </div>
  );
}