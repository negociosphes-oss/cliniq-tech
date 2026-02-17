import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, X, UserCheck, PlayCircle, Wrench, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// Motores de Documentação e PDF
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { CertificadoService } from '../../services/CertificadoService';
import { LoteCertificadosPDF, MetrologiaCertificadoPDF } from '../../documents/MetrologiaCertificadoPDF';

// Componentes das Abas
import { GeralTab } from './GeralTab';
import { ApontamentosTab } from './ApontamentosTab';
import { EvidenciasTab } from './EvidenciasTab';
import { AssinaturasTab, type AssinaturasTabHandle } from './AssinaturasTab';
import { FechamentoTab } from './FechamentoTab';
import { MetrologiaTab } from './MetrologiaTab';
import { MetrologiaCertificadoButton } from './components/MetrologiaCertificadoButton';
import { ChecklistTab } from './ChecklistTab'; 
import { OrdensListagem } from './OrdensListagem';

// Motores de Impressão HTML
import { imprimirRelatorio, imprimirRelatoriosEmLote } from './reports/RelatorioTecnicoTemplate';
import type { OrdemServico, Equipamento, Cliente, Tecnico, Apontamento } from '../../types';

interface OrdemServicoPageProps {
  equipamentos: Equipamento[];
  clientes: Cliente[];
  tecnicos: Tecnico[];
  ordens: OrdemServico[];
  fetchAll: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  targetOsId?: number | null;
}

export function OrdemServicoPage({ equipamentos, clientes, tecnicos, ordens, fetchAll, showToast, targetOsId }: OrdemServicoPageProps) {
  const navigate = useNavigate();

  const [selectedOsId, setSelectedOsId] = useState<number | null>(targetOsId || null);
  const [osForm, setOsForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'geral' | 'checklist' | 'metrologia' | 'apontamentos' | 'evidencias' | 'assinaturas' | 'fechamento'>('geral');
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [statusExecucaoMetrologia, setStatusExecucaoMetrologia] = useState<string>('');
  
  const [tenantId, setTenantId] = useState<number>(1); // 🚀 ESTADO DO FAREJADOR
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [equipeReal, setEquipeReal] = useState<any[]>(tecnicos || []); 

  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const assinaturasRef = useRef<AssinaturasTabHandle>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null); 

  const getImageUrl = (path: any, folder: 'evidências' | 'configuração' = 'evidências') => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http')) return path;
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/os-imagens/${folder}/${path}`;
  };

  // 🚀 MOTOR FAREJADOR E DADOS GLOBAIS BLINDADOS
  useEffect(() => {
    const fetchGlobalData = async () => {
      try {
        const hostname = window.location.hostname;
        let slug = hostname.split('.')[0];
        
        if (slug === 'localhost' || slug === 'app' || slug === 'www') {
            slug = 'atlasum';
        }

        // 1. Busca os dados reais da Empresa Logada (Inquilino)
        const { data: tenant } = await supabase
            .from('empresas_inquilinas')
            .select('*')
            .eq('slug_subdominio', slug)
            .maybeSingle();

        const tId = tenant ? tenant.id : 1;
        setTenantId(tId);
        setSystemConfig(tenant); // Agora a logo e nome vêm do Inquilino!

        // 2. Busca a Equipa Técnica com a TRAVA de segurança
        const { data: equipe } = await supabase
            .from('equipe_tecnica')
            .select('*')
            .eq('tenant_id', tId); 
            
        if (equipe && equipe.length > 0) setEquipeReal(equipe);
      } catch (err) {
        console.error("Erro na blindagem da O.S.:", err);
      }
    };
    fetchGlobalData();
  }, []);

  const refreshDependencies = async (osId: number) => {
    setLoading(true);
    try {
        const { data: osData } = await supabase.from('ordens_servico')
          .select('*, equipamentos (*, clientes (*))')
          .eq('id', osId).single();
        
        if (osData) {
          setOsForm({ ...osData, equipamento: osData.equipamentos, cliente: osData.equipamentos?.clientes });
          const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', osId).order('data_inicio');
          setApontamentos(aptData || []);
          
          const { data: metro } = await supabase.from('os_metrologia_execucoes').select('status_execucao').eq('ordem_servico_id', osId).maybeSingle();
          setStatusExecucaoMetrologia(metro?.status_execucao || '');
        }
    } catch (err) { console.error("Erro carga dependências:", err); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (targetOsId) { setSelectedOsId(targetOsId); refreshDependencies(targetOsId); }
  }, [targetOsId]);

  const fetchChecklistData = async (osId: number) => {
    try {
      const { data: exec, error: execErr } = await supabase.from('os_checklists_execucao').select('*').eq('ordem_servico_id', osId).maybeSingle();
      if (execErr || !exec) return null;
      
      const { data: modelo, error: modErr } = await supabase.from('checklists_modelos').select('*').eq('id', exec.checklist_id).maybeSingle();
      if (modErr || !modelo) return null;
      
      return {
         perguntas: typeof modelo.perguntas === 'string' ? JSON.parse(modelo.perguntas) : modelo.perguntas,
         respostas: typeof exec.respostas === 'string' ? JSON.parse(exec.respostas) : exec.respostas
      };
    } catch (e) {
      return null;
    }
  };

  const handleFinalize = async () => {
    if (!osForm.id) return;
    try {
        setLoading(true);
        let sigTec = osForm.assinatura_tecnico || null;
        let sigCli = osForm.assinatura_cliente || null;

        if (assinaturasRef.current) {
            const sigs = assinaturasRef.current.getAssinaturas();
            sigTec = sigs.tecnico || sigTec;
            sigCli = sigs.cliente || sigCli;
        }

        if (!sigTec || !sigCli) {
            showToast('As assinaturas são obrigatórias para encerrar.', 'error');
            setActiveTab('assinaturas');
            setLoading(false); return;
        }

        const { error } = await supabase.from('ordens_servico').update({ 
            status: 'Concluída', assinatura_tecnico: sigTec, assinatura_cliente: sigCli, data_conclusao: new Date().toISOString()
        }).eq('id', osForm.id);
        
        if (error) throw error;
        setOsForm((prev: any) => ({ ...prev, status: 'Concluída', assinatura_tecnico: sigTec, assinatura_cliente: sigCli }));
        showToast('Ordem de Serviço finalizada!', 'success');
        fetchAll();
    } catch(e: any) { showToast('Erro ao gravar encerramento.', 'error'); } finally { setLoading(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!osForm.id) return;
    await supabase.from('ordens_servico').update({ status: newStatus }).eq('id', osForm.id);
    setOsForm((prev: any) => ({ ...prev, status: newStatus }));
    showToast(`Status atualizado`, 'info');
    fetchAll();
  };

  const handlePrint = async () => {
    setPrinting(true);
    const logoPath = systemConfig?.logo_url;
    const logoFullUrl = logoPath ? getImageUrl(logoPath, 'configuração') : '';
    const checklist = await fetchChecklistData(osForm.id); 
    
    setTimeout(() => { 
      imprimirRelatorio({ 
        os: osForm, apontamentos, checklistData: checklist, logoUrl: logoFullUrl, nomeEmpresa: systemConfig?.nome_fantasia || 'Empresa' 
      }); 
      setPrinting(false); 
    }, 500);
  };

  const handleQuickPrint = async (os: any) => {
      showToast('Compilando relatório técnico...', 'info');
      try {
          const { data: fullOs } = await supabase.from('ordens_servico').select('*, equipamentos(*, clientes(*))').eq('id', os.id).single();
          const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', os.id).order('data_inicio');
          const checklist = await fetchChecklistData(os.id); 
          
          const logoPath = systemConfig?.logo_url;
          const logoFullUrl = logoPath ? getImageUrl(logoPath, 'configuração') : '';
          
          imprimirRelatorio({ 
              os: { ...(fullOs || os), cliente: fullOs?.equipamentos?.clientes }, 
              apontamentos: aptData || [], checklistData: checklist, logoUrl: logoFullUrl, nomeEmpresa: systemConfig?.nome_fantasia || 'Empresa' 
          });
      } catch (err) {
          showToast('Erro ao compilar dados do relatório', 'error');
      }
  };

  const handleBulkPrintOs = async (ids: number[]) => {
      showToast(`Processando lote de ${ids.length} relatórios O.S...`, 'info');
      try {
          const { data: fullOsList } = await supabase.from('ordens_servico').select('*, equipamentos(*, clientes(*))').in('id', ids);
          const { data: aptData } = await supabase.from('apontamentos').select('*').in('os_id', ids);
          
          const logoPath = systemConfig?.logo_url;
          const logoFullUrl = logoPath ? getImageUrl(logoPath, 'configuração') : '';
          
          const listaDados = await Promise.all((fullOsList || []).map(async (os) => {
              const checklist = await fetchChecklistData(os.id);
              return {
                os: { ...os, cliente: os.equipamentos?.clientes },
                apontamentos: aptData?.filter(a => a.os_id === os.id) || [],
                checklistData: checklist,
                logoUrl: logoFullUrl,
                nomeEmpresa: systemConfig?.nome_fantasia || 'Empresa'
              };
          }));
          imprimirRelatoriosEmLote(listaDados);
      } catch (err) { showToast('Falha ao gerar o lote.', 'error'); }
  };

  const handleQuickPrintCertificado = async (id: number) => {
    showToast('Gerando certificado RBC...', 'info');
    try {
        const payload = await CertificadoService.gerarPayload(id);
        const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
        saveAs(blob, `CERTIFICADO-${payload.numero}.pdf`);
        showToast('Certificado baixado!', 'success');
    } catch (err: any) { 
        showToast(err.message || 'Dados de calibração insuficientes.', 'error'); 
    }
  };

  const handleBulkPrintCertificados = async (ids: number[]) => {
      showToast('Compilando lote de certificados...', 'info');
      const payloads = [];
      
      for (const id of ids) {
          try {
              const os = ordens.find(o => o.id === id);
              if (os && os.tipo === 'Calibração') {
                  const p = await CertificadoService.gerarPayload(id);
                  if (p) payloads.push(p);
              }
          } catch(e) {
              console.warn(`OS #${id} pulada no lote (dados pendentes).`);
          }
      }
      
      if (payloads.length === 0) {
          return showToast('Nenhuma OS selecionada possui dados de calibração finalizados.', 'error');
      }

      showToast(`Gerando PDF único com ${payloads.length} certificados...`, 'info');
      const blob = await pdf(<LoteCertificadosPDF lista={payloads} />).toBlob();
      saveAs(blob, `LOTE_CERTIFICADOS_${Date.now()}.pdf`);
      showToast('Lote de certificados concluído!', 'success');
  };

  const changeTabAndScroll = (tab: any) => { 
    setActiveTab(tab); 
    if (tabContainerRef.current) tabContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
  };

  const handleCloseOs = () => {
      setSelectedOsId(null);
      window.history.replaceState(null, '', '/ordens');
  };

  if (selectedOsId && osForm.id) {
    return (
      <div className="max-w-[1600px] mx-auto p-4 animate-fadeIn pb-24" ref={tabContainerRef}>
         <div className="bg-theme-card p-6 rounded-t-[32px] border-b border-theme flex justify-between items-center shadow-xl">
            <div>
                <h2 className="text-4xl font-black text-theme-main uppercase">{systemConfig?.nome_fantasia || 'EMPRESA'}</h2>
                <div className="flex gap-2 mt-1">
                   <span className="px-3 py-1 bg-theme-page border rounded-lg text-[10px] font-black uppercase text-theme-muted">OS #{osForm.id}</span>
                   <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white ${osForm.status === 'Concluída' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{osForm.status}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <MetrologiaCertificadoButton osId={osForm.id} statusOs={osForm.status || ''} statusExecucao={statusExecucaoMetrologia} />
                {osForm.status === 'Aberta' && <button onClick={() => handleStatusChange('Em Execução')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2"><PlayCircle size={18}/> INICIAR</button>}
                <button onClick={handlePrint} disabled={printing} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2">{printing ? <Loader2 className="animate-spin" size={18}/> : <Printer size={18}/>} IMPRIMIR</button>
                <button onClick={handleCloseOs} className="px-4 py-3 bg-theme-page text-theme-muted border border-theme rounded-xl font-bold hover:text-rose-500 transition-all"><X size={18}/></button>
            </div>
         </div>

         <div className="bg-theme-page p-1 flex gap-1 border-b border-theme overflow-x-auto">
            {[ { id: 'geral', label: 'Geral' }, { id: 'checklist', label: 'Inspeção' }, ...(osForm.tipo === 'Calibração' ? [{ id: 'metrologia', label: 'Metrologia' }] : []), { id: 'apontamentos', label: 'Mão de Obra' }, { id: 'evidencias', label: 'Fotos' }, { id: 'assinaturas', label: 'Assinaturas' }, { id: 'fechamento', label: 'Finalizar' } ].map(tab => (
               <button key={tab.id} onClick={() => changeTabAndScroll(tab.id as any)} className={`flex-1 min-w-[120px] py-4 font-black uppercase text-[10px] rounded-t-[20px] ${activeTab === tab.id ? 'bg-theme-card text-primary-theme border-t-4 border-primary-theme' : 'text-theme-muted hover:bg-theme-card/50'}`}>{tab.label}</button>
            ))}
         </div>

         <div className="bg-theme-card p-8 rounded-b-[32px] shadow-2xl border border-theme border-t-0 pb-10">
            <div className={activeTab === 'geral' ? 'block' : 'hidden'}><GeralTab osForm={osForm} setOsForm={setOsForm} tecnicos={equipeReal} status={osForm.status} /></div>
            <div className={activeTab === 'checklist' ? 'block' : 'hidden'}>{osForm.id && osForm.equipamento_id && <ChecklistTab osId={osForm.id} equipamentoId={osForm.equipamento_id} tipoServico={osForm.tipo} showToast={showToast} />}</div>
            <div className={activeTab === 'metrologia' ? 'block' : 'hidden'}>{osForm.id && osForm.equipamento_id && <MetrologiaTab osId={osForm.id} equipamentoId={osForm.equipamento_id} onUpdate={() => refreshDependencies(osForm.id!)} />}</div>
            <div className={activeTab === 'apontamentos' ? 'block' : 'hidden'}><ApontamentosTab osId={osForm.id!} tecnicos={equipeReal} status={osForm.status} showToast={showToast} onUpdate={() => refreshDependencies(osForm.id!)} /></div>
            <div className={activeTab === 'evidencias' ? 'block' : 'hidden'}><EvidenciasTab osId={osForm.id!} currentAnexos={osForm.anexos} showToast={showToast} onUpdate={() => refreshDependencies(osForm.id!)} /></div>
            <div className={activeTab === 'assinaturas' ? 'block' : 'hidden'}><AssinaturasTab ref={assinaturasRef} osId={osForm.id!} status={osForm.status} tecnicos={equipeReal} assinaturaTecnico={osForm.assinatura_tecnico} assinaturaCliente={osForm.assinatura_cliente} /></div>
            <div className={activeTab === 'fechamento' ? 'block' : 'hidden'}><FechamentoTab osForm={osForm} setOsForm={setOsForm} apontamentos={apontamentos} onFinalize={handleFinalize} status={osForm.status} onPrint={handlePrint} showToast={showToast} /></div>
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