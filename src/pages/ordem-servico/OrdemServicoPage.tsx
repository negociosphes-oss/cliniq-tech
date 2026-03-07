import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, X, Loader2, Download } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Documentos e Motores PDF
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { CertificadoService } from '../../services/CertificadoService';
import { LoteCertificadosPDF, MetrologiaCertificadoPDF } from '../../documents/MetrologiaCertificadoPDF';
import { TseCertificadoService } from '../../services/TseCertificadoService';
import { TseCertificadoPDF } from '../metrologia/TseCertificadoPDF';

// Componentes das Abas
import { GeralTab } from './GeralTab';
import { ApontamentosTab } from './ApontamentosTab';
import { EvidenciasTab } from './EvidenciasTab';
import { AssinaturasTab, type AssinaturasTabHandle } from './AssinaturasTab';
import { FechamentoTab } from './FechamentoTab';
import { ChecklistTab } from './ChecklistTab'; 
import { OrdensListagem } from './OrdensListagem';
import { PecasTab } from './PecasTab';

// ABAS SEPARADAS
import { MetrologiaTab } from './MetrologiaTab'; 
import { TseTab } from './TseTab'; 

// Relatórios
import { imprimirRelatorio, imprimirRelatoriosEmLote } from './reports/RelatorioTecnicoTemplate';
import type { OrdemServico, Equipamento, Cliente, Tecnico, Apontamento } from '../../types';

interface OrdemServicoPageProps { equipamentos: Equipamento[]; clientes: Cliente[]; tecnicos: Tecnico[]; ordens: OrdemServico[]; fetchAll: () => void; showToast: (msg: string, type: 'success' | 'error' | 'info') => void; targetOsId?: number | null; }

export function OrdemServicoPage({ equipamentos, clientes, tecnicos, ordens, fetchAll, showToast, targetOsId }: OrdemServicoPageProps) {
  const navigate = useNavigate();
  const [selectedOsId, setSelectedOsId] = useState<number | null>(targetOsId || null);
  
  const [activeTab, setActiveTab] = useState<'geral' | 'checklist' | 'metrologia' | 'apontamentos' | 'pecas' | 'evidencias' | 'assinaturas' | 'fechamento'>('geral');
  
  const [osForm, setOsForm] = useState<any>({});
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [statusExecucaoMetrologia, setStatusExecucaoMetrologia] = useState<string>('');
  
  const [tenantId, setTenantId] = useState<number>(1); 
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [equipeReal, setEquipeReal] = useState<any[]>(tecnicos || []); 
  const [tiposOsDinamicos, setTiposOsDinamicos] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const assinaturasRef = useRef<AssinaturasTabHandle>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    if (tecnicos && tecnicos.length > 0) setEquipeReal(tecnicos);
  }, [tecnicos]);

  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        let finalConfig: any = {};
        let currentTenantId = 1;

        const { data: confData } = await supabase.from('configuracoes_empresa').select('*').order('id', { ascending: true }).limit(1).maybeSingle();
        if (confData) finalConfig = { ...confData };

        const { data: tenants } = await supabase.from('empresas_inquilinas').select('*').limit(1).maybeSingle();
        if (tenants) {
            currentTenantId = tenants.id;
            finalConfig = { ...tenants, ...finalConfig };
        }

        setTenantId(currentTenantId);
        setSystemConfig(finalConfig);

        const { data: tipos } = await supabase.from('tipos_ordem_servico').select('*').order('nome');
        if (tipos) setTiposOsDinamicos(tipos);
      } catch (err) {}
    };
    fetchGlobalData();
  }, []);

  const refreshDependencies = async (osId: number) => {
    setLoading(true);
    try {
        // 🚀 VOLTAMOS PARA A BUSCA SEGURA E ESTÁVEL
        const { data: osData, error } = await supabase.from('ordens_servico').select('*, equipamentos (*, clientes (*))').eq('id', osId).single();
        
        if (error) throw error;

        if (osData) {
          // 🚀 BUSCA A TECNOLOGIA SEPARADO PARA NÃO QUEBRAR O SISTEMA
          let tecData = null;
          if (osData.equipamentos && osData.equipamentos.tecnologia_id) {
              const { data: tec } = await supabase.from('tecnologias').select('*').eq('id', osData.equipamentos.tecnologia_id).single();
              tecData = tec;
          }

          // Junta tudo
          setOsForm({ 
              ...osData, 
              equipamento: { ...osData.equipamentos, tecnologias: tecData }, 
              cliente: osData.equipamentos?.clientes 
          });

          const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', osId).order('data_inicio');
          setApontamentos(aptData || []);
          
          const isTse = osData.tipo?.toUpperCase().includes('SEGURANÇA');
          if (isTse) {
             const { data: tse } = await supabase.from('metrologia_tse').select('resultado').eq('ordem_servico_id', osId).order('id', { ascending: false }).limit(1).maybeSingle();
             setStatusExecucaoMetrologia(tse ? 'Concluído' : '');
          } else {
             const { data: metro } = await supabase.from('os_metrologia_execucoes').select('status_execucao').eq('ordem_servico_id', osId).maybeSingle();
             setStatusExecucaoMetrologia(metro?.status_execucao || '');
          }
        }
    } catch (err) { 
        console.error("Erro ao abrir OS:", err);
        showToast("Erro ao abrir Ordem de Serviço", "error");
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { if (targetOsId) { setSelectedOsId(targetOsId); refreshDependencies(targetOsId); } }, [targetOsId]);

  const handleFinalize = async () => {
    try {
      await supabase.from('ordens_servico').update({ status: 'Concluída', data_fechamento: new Date().toISOString() }).eq('id', osForm.id);
      showToast('O.S. Finalizada com sucesso!', 'success');
      refreshDependencies(osForm.id);
      fetchAll();
    } catch (e) { showToast('Erro ao finalizar.', 'error'); }
  };

  // 🚀 FUNÇÃO MASTER SEGURA PARA O PDF
  const getFullOsDataForPrint = async (osId: number) => {
     // Busca segura principal
     const { data: osData } = await supabase.from('ordens_servico').select('*, equipamentos (*, clientes (*))').eq('id', osId).single();
     
     // Busca o modelo separado
     let tecData = null;
     if (osData?.equipamentos?.tecnologia_id) {
         const { data: tec } = await supabase.from('tecnologias').select('*').eq('id', osData.equipamentos.tecnologia_id).single();
         tecData = tec;
     }

     if (osData && osData.equipamentos) {
         osData.equipamentos.tecnologias = tecData;
     }

     const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', osId).order('data_inicio');
     const { data: pecas } = await supabase.from('estoque_movimentacoes').select('*, estoque_itens(*)').eq('os_id', osId).eq('tipo', 'SAIDA');
     
     // Busca o Checklist
     let checklistData = null;
     const { data: chkExec } = await supabase.from('os_checklists_execucao').select('*').eq('ordem_servico_id', osId).maybeSingle();
     if (chkExec && chkExec.checklist_id) {
         const { data: chkPadrao } = await supabase.from('os_checklists_padrao').select('*').eq('id', chkExec.checklist_id).maybeSingle();
         if (chkPadrao) {
             checklistData = { perguntas: chkPadrao.perguntas, respostas: chkExec.respostas || [] };
         }
     }
     
     return { ...osData, pecas: pecas || [], checklistData, apontamentos: aptData || [] };
  };

  const handlePrintOS = async () => {
    if (!osForm.id) return;
    try {
      showToast('Gerando relatório...', 'info');
      const fullData = await getFullOsDataForPrint(osForm.id);
      await imprimirRelatorio(fullData, fullData.apontamentos, systemConfig);
    } catch (err) { showToast("Erro ao gerar impressão da O.S.", "error"); }
  };

  const handleQuickPrint = async (os: any) => {
    try {
      showToast('Buscando dados da O.S...', 'info');
      const fullData = await getFullOsDataForPrint(os.id);
      await imprimirRelatorio(fullData, fullData.apontamentos, systemConfig || {});
    } catch (err) { showToast('Erro ao imprimir O.S.', 'error'); }
  };
  
  const handleQuickPrintCertificado = async (id: number) => {
    setIsGenerating(true);
    showToast('Gerando documento...', 'info');
    try {
        const { data: os } = await supabase.from('ordens_servico').select('tipo').eq('id', id).single();
        const isTse = os?.tipo?.toUpperCase().includes('SEGURANÇA');

        if (isTse) {
            const payload = await TseCertificadoService.gerarPayload(id);
            if (!payload || !payload.data) throw new Error("Laudo não encontrado. Realize o teste primeiro.");
            
            const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig || systemConfig} />).toBlob();
            saveAs(blob, `TSE-OS-${id}.pdf`);
            showToast('Laudo TSE baixado!', 'success');
        } else {
            const payload = await CertificadoService.gerarPayload(id);
            if (!payload) throw new Error("Certificado não encontrado.");

            const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
            saveAs(blob, `CERTIFICADO-OS-${id}.pdf`);
            showToast('Certificado baixado!', 'success');
        }
    } catch (err: any) { 
        showToast(err.message || 'Erro ao gerar documento.', 'error'); 
    } finally { setIsGenerating(false); }
  };

  const handleBulkPrintOs = async (ids: number[]) => {
    showToast(`Gerando lote de ${ids.length} Ordens...`, 'info');
    try {
      const ordensCompletas = [];
      for (const id of ids) {
         const fullData = await getFullOsDataForPrint(id);
         ordensCompletas.push(fullData);
      }
      await imprimirRelatoriosEmLote(ordensCompletas, systemConfig);
      showToast('Lote gerado com sucesso!', 'success');
    } catch (err) { showToast('Erro ao gerar lote.', 'error'); }
  };

  const handleBulkPrintCertificados = async (ids: number[]) => {
    showToast(`Processando ${ids.length} laudos... Pode levar alguns segundos.`, 'info');
    let sucesso = 0;
    
    for (const id of ids) {
       try {
           const { data: os } = await supabase.from('ordens_servico').select('tipo').eq('id', id).single();
           const isTse = os?.tipo?.toUpperCase().includes('SEGURANÇA');

           if (isTse) {
               const payload = await TseCertificadoService.gerarPayload(id);
               if(payload && payload.data) {
                 const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig || systemConfig} />).toBlob();
                 saveAs(blob, `TSE-OS-${id}.pdf`);
                 sucesso++;
               }
           } else {
               const payload = await CertificadoService.gerarPayload(id);
               if(payload) {
                 const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
                 saveAs(blob, `CERTIFICADO-OS-${id}.pdf`);
                 sucesso++;
               }
           }
       } catch (err) {}
    }
    showToast(`${sucesso} laudos gerados com sucesso!`, 'success');
  };

  const changeTabAndScroll = (tab: any) => { setActiveTab(tab); if (tabContainerRef.current) tabContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const handleCloseOs = () => { setSelectedOsId(null); window.history.replaceState(null, '', '/ordens'); };

  if (selectedOsId && osForm.id) {
    const isTse = osForm.tipo?.toUpperCase().includes('SEGURANÇA');
    const exigeLaudo = osForm.tipo === 'Calibração' || isTse;
    const laudoPronto = statusExecucaoMetrologia === 'Concluído' || statusExecucaoMetrologia === 'Aprovado' || statusExecucaoMetrologia === 'Reprovado';
    const nomeEmpresa = systemConfig?.nome_empresa || systemConfig?.razao_social || systemConfig?.nome_fantasia || 'DADOS DA EMPRESA';

    return (
      <div className="max-w-[1600px] mx-auto p-4 animate-fadeIn pb-24" ref={tabContainerRef}>
         <div className="bg-white border border-slate-200 p-6 rounded-t-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{nomeEmpresa}</h2>
                <div className="flex gap-2 mt-2 items-center">
                   <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded text-xs font-semibold text-slate-600">OS #{osForm.id}</span>
                   <span className={`px-2.5 py-1 rounded text-xs font-semibold text-white ${osForm.status === 'Concluída' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{osForm.status}</span>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={handlePrintOS} className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                    <Printer size={16}/> Imprimir O.S.
                </button>

                {exigeLaudo && (
                  <button 
                     onClick={() => handleQuickPrintCertificado(osForm.id)} 
                     disabled={isGenerating}
                     className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                     {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                     {isTse ? 'Laudo TSE' : 'Certificado RBC'}
                  </button>
                )}

                <div className="w-px h-6 bg-slate-200 mx-2 hidden md:block"></div>
                <button onClick={handleCloseOs} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><X size={20}/></button>
            </div>
         </div>

         <div className="bg-slate-50 p-1 flex gap-1 border-x border-b border-slate-200 overflow-x-auto">
            {[ 
               { id: 'geral', label: 'Geral' }, 
               { id: 'checklist', label: 'Inspeção' }, 
               ...(exigeLaudo ? [{ id: 'metrologia', label: isTse ? 'Seg. Elétrica' : 'Metrologia' }] : []), 
               { id: 'apontamentos', label: 'Mão de Obra' }, 
               { id: 'pecas', label: 'Peças/Materiais' }, 
               { id: 'evidencias', label: 'Fotos' }, 
               { id: 'assinaturas', label: 'Assinaturas' }, 
               { id: 'fechamento', label: 'Finalizar' } 
            ].map(tab => (
               <button key={tab.id} onClick={() => changeTabAndScroll(tab.id as any)} className={`flex-1 min-w-[120px] py-3 text-xs font-semibold uppercase tracking-wider rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-white text-indigo-600 border-t-2 border-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>{tab.label}</button>
            ))}
         </div>

         <div className="bg-white p-8 rounded-b-2xl shadow-sm border border-slate-200 border-t-0 pb-10 min-h-[400px]">
            <div className={activeTab === 'geral' ? 'block' : 'hidden'}><GeralTab osForm={osForm} setOsForm={setOsForm} tecnicos={equipeReal} status={osForm.status} tiposOs={tiposOsDinamicos} /></div>
            <div className={activeTab === 'checklist' ? 'block' : 'hidden'}><ChecklistTab osId={osForm.id} equipamentoId={osForm.equipamento_id} tipoServico={osForm.tipo} showToast={showToast} /></div>
            
            <div className={activeTab === 'metrologia' ? 'block' : 'hidden'}>
               {osForm.id && osForm.equipamento_id && (
                  isTse ? (
                    <TseTab osId={osForm.id} equipamentoId={osForm.equipamento_id} tenantId={tenantId} onUpdate={() => refreshDependencies(osForm.id!)} />
                  ) : (
                    <MetrologiaTab osId={osForm.id} equipamentoId={osForm.equipamento_id} onUpdate={() => refreshDependencies(osForm.id!)} />
                  )
               )}
            </div>

            <div className={activeTab === 'apontamentos' ? 'block' : 'hidden'}><ApontamentosTab osId={osForm.id!} tecnicos={equipeReal} status={osForm.status} showToast={showToast} onUpdate={() => refreshDependencies(osForm.id!)} /></div>
            
            <div className={activeTab === 'pecas' ? 'block' : 'hidden'}>
               <PecasTab osId={osForm.id!} status={osForm.status} showToast={showToast} />
            </div>

            <div className={activeTab === 'evidencias' ? 'block' : 'hidden'}><EvidenciasTab osId={osForm.id!} currentAnexos={osForm.anexos} showToast={showToast} onUpdate={() => refreshDependencies(osForm.id!)} /></div>
            <div className={activeTab === 'assinaturas' ? 'block' : 'hidden'}><AssinaturasTab ref={assinaturasRef} osId={osForm.id!} status={osForm.status} tecnicos={equipeReal} assinaturaTecnico={osForm.assinatura_tecnico} assinaturaCliente={osForm.assinatura_cliente} /></div>
            <div className={activeTab === 'fechamento' ? 'block' : 'hidden'}><FechamentoTab osForm={osForm} setOsForm={setOsForm} apontamentos={apontamentos} onFinalize={handleFinalize} status={osForm.status} onPrint={handlePrintOS} showToast={showToast} /></div>
         </div>
      </div>
    );
  }

  return (
    <OrdensListagem 
        ordens={ordens} equipamentos={equipamentos} clientes={clientes}
        onOpenOs={(id) => { setSelectedOsId(id); refreshDependencies(id); }}
        onNewOs={() => navigate('/novo-chamado')}
        onQuickPrint={handleQuickPrint}
        onQuickPrintCertificado={handleQuickPrintCertificado}
        onBulkPrintOs={handleBulkPrintOs}
        onBulkPrintCertificados={handleBulkPrintCertificados}
    />
  );
}