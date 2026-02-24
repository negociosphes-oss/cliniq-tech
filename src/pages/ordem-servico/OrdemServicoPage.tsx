import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, X, PlayCircle, Loader2, Download } from 'lucide-react';
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
import { MetrologiaCertificadoButton } from './components/MetrologiaCertificadoButton';

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
  const [osForm, setOsForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'geral' | 'checklist' | 'metrologia' | 'apontamentos' | 'evidencias' | 'assinaturas' | 'fechamento'>('geral');
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

        const { data: equipe } = await supabase.from('equipe_tecnica').select('*').eq('tenant_id', currentTenantId);
        if (equipe) setEquipeReal(equipe);
      } catch (err) {}
    };
    fetchGlobalData();
  }, []);

  const refreshDependencies = async (osId: number) => {
    setLoading(true);
    try {
        const { data: osData } = await supabase.from('ordens_servico').select('*, equipamentos (*, clientes (*))').eq('id', osId).single();
        if (osData) {
          setOsForm({ ...osData, equipamento: osData.equipamentos, cliente: osData.equipamentos?.clientes });
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
    } catch (err) { } finally { setLoading(false); }
  };

  useEffect(() => { if (targetOsId) { setSelectedOsId(targetOsId); refreshDependencies(targetOsId); } }, [targetOsId]);

  const handleFinalize = async () => {
    try {
      await supabase.from('ordens_servico').update({ status: 'Concluída' }).eq('id', osForm.id);
      showToast('O.S. Finalizada com sucesso!', 'success');
      refreshDependencies(osForm.id);
      fetchAll();
    } catch (e) { showToast('Erro ao finalizar.', 'error'); }
  };

  // 🚀 MOTOR 1: IMPRIMIR OS ABERTA
  const handlePrintOS = async () => {
    if (!osForm.id) return;
    try {
      await imprimirRelatorio(osForm, apontamentos, systemConfig);
    } catch (err) { showToast("Erro ao gerar impressão da O.S.", "error"); }
  };

  // 🚀 MOTOR 2: IMPRIMIR RÁPIDO DA LISTA (Sem Tela Branca)
  const handleQuickPrint = async (os: any) => {
    showToast('Buscando dados da O.S...', 'info');
    try {
      const { data: osData } = await supabase.from('ordens_servico').select('*, equipamentos (*, clientes (*))').eq('id', os.id).single();
      const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', os.id).order('data_inicio');
      const osCompleta = { ...osData, equipamento: osData.equipamentos, cliente: osData.equipamentos?.clientes };
      await imprimirRelatorio(osCompleta, aptData || [], systemConfig);
    } catch (err) { showToast('Erro ao imprimir O.S.', 'error'); }
  };
  
  // 🚀 MOTOR 3: BAIXAR CERTIFICADO INDIVIDUAL
  const handleQuickPrintCertificado = async (id: number) => {
    setIsGenerating(true);
    showToast('Gerando documento...', 'info');
    try {
        const { data: os } = await supabase.from('ordens_servico').select('tipo').eq('id', id).single();
        const isTse = os?.tipo?.toUpperCase().includes('SEGURANÇA');

        if (isTse) {
            const payload = await TseCertificadoService.gerarPayload(id);
            const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig} />).toBlob();
            saveAs(blob, `TSE-OS-${id}.pdf`);
            showToast('Laudo TSE baixado!', 'success');
        } else {
            const payload = await CertificadoService.gerarPayload(id);
            const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
            saveAs(blob, `CERTIFICADO-OS-${id}.pdf`);
            showToast('Certificado baixado!', 'success');
        }
    } catch (err: any) { 
        showToast(err.message || 'Erro ao gerar documento.', 'error'); 
    } finally { setIsGenerating(false); }
  };

  // 🚀 MOTOR 4: IMPRESSÃO EM LOTE DE O.S. (O Monstro)
  const handleBulkPrintOs = async (ids: number[]) => {
    showToast(`Gerando lote de ${ids.length} Ordens...`, 'info');
    try {
      const { data: ordensData } = await supabase.from('ordens_servico').select('*, equipamentos (*, clientes (*))').in('id', ids);
      if (!ordensData) return;
      
      const { data: aptData } = await supabase.from('apontamentos').select('*').in('os_id', ids);

      const ordensCompletas = ordensData.map(o => ({
         ...o,
         equipamento: o.equipamentos,
         cliente: o.equipamentos?.clientes,
         apontamentos: aptData?.filter(a => a.os_id === o.id) || []
      }));

      await imprimirRelatoriosEmLote(ordensCompletas, systemConfig);
      showToast('Lote de O.S. gerado com sucesso!', 'success');
    } catch (err) { showToast('Erro ao gerar lote de O.S.', 'error'); }
  };

  // 🚀 MOTOR 5: IMPRESSÃO EM LOTE DE CERTIFICADOS
  const handleBulkPrintCertificados = async (ids: number[]) => {
    showToast(`Processando ${ids.length} laudos... Pode levar alguns segundos.`, 'info');
    let sucesso = 0;
    
    for (const id of ids) {
       try {
           const { data: os } = await supabase.from('ordens_servico').select('tipo').eq('id', id).single();
           const isTse = os?.tipo?.toUpperCase().includes('SEGURANÇA');

           if (isTse) {
               const payload = await TseCertificadoService.gerarPayload(id);
               const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig} />).toBlob();
               saveAs(blob, `TSE-OS-${id}.pdf`);
               sucesso++;
           } else {
               const payload = await CertificadoService.gerarPayload(id);
               const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
               saveAs(blob, `CERTIFICADO-OS-${id}.pdf`);
               sucesso++;
           }
       } catch (err) {
           console.error(`Erro na OS ${id}`, err);
       }
    }
    showToast(`${sucesso} laudos baixados com sucesso!`, 'success');
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
         <div className="bg-theme-card p-6 rounded-t-[32px] border-b border-theme flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl">
            <div>
                <h2 className="text-3xl font-black text-theme-main uppercase tracking-tight">{nomeEmpresa}</h2>
                <div className="flex gap-2 mt-2">
                   <span className="px-3 py-1 bg-theme-page border border-theme rounded-lg text-[10px] font-black uppercase text-theme-muted">OS #{osForm.id}</span>
                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white ${osForm.status === 'Concluída' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{osForm.status}</span>
                </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={handlePrintOS} className="flex items-center gap-2 px-5 py-3 bg-theme-page text-theme-muted border border-theme rounded-xl text-[11px] font-black hover:text-primary-theme hover:border-primary-theme transition-all uppercase">
                    <Printer size={16}/> Imprimir O.S.
                </button>

                {exigeLaudo && (
                  <button 
                     onClick={() => handleQuickPrintCertificado(osForm.id)} 
                     disabled={!laudoPronto || isGenerating}
                     className="flex items-center gap-2 px-5 py-3 bg-primary-theme text-white rounded-xl text-[11px] font-black shadow-lg hover:scale-105 transition-all uppercase disabled:opacity-50 disabled:hover:scale-100"
                  >
                     {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Download size={16}/>}
                     {isTse ? 'Laudo TSE' : 'Certificado RBC'}
                  </button>
                )}

                <div className="w-px h-8 bg-theme mx-2 hidden md:block"></div>
                <button onClick={handleCloseOs} className="px-4 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-all"><X size={18}/></button>
            </div>
         </div>

         <div className="bg-theme-page p-1 flex gap-1 border-b border-theme overflow-x-auto">
            {[ 
               { id: 'geral', label: 'Geral' }, 
               { id: 'checklist', label: 'Inspeção' }, 
               ...(exigeLaudo ? [{ id: 'metrologia', label: isTse ? 'Seg. Elétrica' : 'Metrologia' }] : []), 
               { id: 'apontamentos', label: 'Mão de Obra' }, 
               { id: 'evidencias', label: 'Fotos' }, 
               { id: 'assinaturas', label: 'Assinaturas' }, 
               { id: 'fechamento', label: 'Finalizar' } 
            ].map(tab => (
               <button key={tab.id} onClick={() => changeTabAndScroll(tab.id as any)} className={`flex-1 min-w-[120px] py-4 font-black uppercase text-[10px] rounded-t-[20px] ${activeTab === tab.id ? 'bg-theme-card text-primary-theme border-t-4 border-primary-theme' : 'text-theme-muted hover:bg-theme-card/50'}`}>{tab.label}</button>
            ))}
         </div>

         <div className="bg-theme-card p-8 rounded-b-[32px] shadow-2xl border border-theme border-t-0 pb-10">
            <div className={activeTab === 'geral' ? 'block' : 'hidden'}><GeralTab osForm={osForm} setOsForm={setOsForm} tecnicos={equipeReal} status={osForm.status} tiposOs={tiposOsDinamicos} /></div>
            <div className={activeTab === 'checklist' ? 'block' : 'hidden'}>{osForm.id && osForm.equipamento_id && <ChecklistTab osId={osForm.id} equipamentoId={osForm.equipamento_id} tipoServico={osForm.tipo} showToast={showToast} />}</div>
            
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