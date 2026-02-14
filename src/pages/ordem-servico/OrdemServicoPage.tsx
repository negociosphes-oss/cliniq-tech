import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Printer, X, UserCheck, FileText, Plus, ChevronRight, Loader2,
  CheckCircle, PlayCircle, Wrench, Download, Filter, Tag, Cpu, Briefcase, Search 
} from 'lucide-react'; // <-- CORREÇÃO CRÍTICA AQUI: 'Search' foi importado.
import { supabase } from '../../supabaseClient';

// --- COMPONENTES DAS ABAS ---
import { GeralTab } from './GeralTab';
import { ApontamentosTab } from './ApontamentosTab';
import { EvidenciasTab } from './EvidenciasTab';
import { AssinaturasTab, type AssinaturasTabHandle } from './AssinaturasTab';
import { FechamentoTab } from './FechamentoTab';
import { MetrologiaTab } from './MetrologiaTab';
import { MetrologiaCertificadoButton } from './components/MetrologiaCertificadoButton';
import { ChecklistTab } from './ChecklistTab'; 

import { imprimirRelatorio } from './reports/RelatorioTecnicoTemplate';
import type { OrdemServico, Equipamento, Cliente, Tecnico, Apontamento } from '../../types';

interface OrdemServicoPageProps {
  view: string;
  setView: (view: string) => void;
  equipamentos: Equipamento[];
  clientes: Cliente[];
  tecnicos: Tecnico[];
  ordens: OrdemServico[];
  fetchAll: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  targetOsId?: number | null;
}

export function OrdemServicoPage({ 
  equipamentos, clientes, tecnicos, ordens, fetchAll, showToast, targetOsId 
}: OrdemServicoPageProps) {
  const navigate = useNavigate();

  const [selectedOsId, setSelectedOsId] = useState<number | null>(targetOsId || null);
  const [osForm, setOsForm] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'geral' | 'checklist' | 'metrologia' | 'apontamentos' | 'evidencias' | 'assinaturas' | 'fechamento'>('geral');
  const [apontamentos, setApontamentos] = useState<Apontamento[]>([]);
  const [statusExecucaoMetrologia, setStatusExecucaoMetrologia] = useState<string>('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [printing, setPrinting] = useState(false);

  // --- FILTROS AVANÇADOS ENTERPRISE ---
  const [buscaLivre, setBuscaLivre] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');

  const assinaturasRef = useRef<AssinaturasTabHandle>(null);
  const tabContainerRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracoes').select('logo_url').maybeSingle();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (targetOsId) { setSelectedOsId(targetOsId); refreshDependencies(targetOsId); }
  }, [targetOsId]);

  const refreshDependencies = async (osId: number) => {
    setLoading(true);
    try {
        const { data: osData, error } = await supabase.from('ordens_servico').select('*').eq('id', osId).single();
        if (error) throw error;
        if (osData) {
          const eq = equipamentos.find(e => e.id === osData.equipamento_id);
          const cli = clientes.find(c => c.id === (eq?.cliente_id || osData.cliente_id));

          setOsForm({ ...osData, tipo: osData.tipo || 'Corretiva', equipamento: eq || {}, cliente: cli || {} });
          
          const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', osId).order('data_inicio');
          setApontamentos(aptData || []);
          const { data: metro } = await supabase.from('os_metrologia_execucoes').select('status_execucao').eq('ordem_servico_id', osId).maybeSingle();
          setStatusExecucaoMetrologia(metro?.status_execucao || '');
        }
    } catch (err: any) { console.error("Erro:", err); } finally { setLoading(false); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!osForm.id) return;
    await supabase.from('ordens_servico').update({ status: newStatus }).eq('id', osForm.id);
    setOsForm((prev: any) => ({ ...prev, status: newStatus }));
    showToast(`Status atualizado: ${newStatus}`, 'info');
    fetchAll();
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
            showToast('As assinaturas do Técnico e do Cliente são obrigatórias para o encerramento.', 'error');
            setActiveTab('assinaturas');
            setLoading(false); return;
        }

        const { error } = await supabase.from('ordens_servico').update({ 
            status: 'Concluída', falha_constatada: osForm.falha_constatada, solucao_aplicada: osForm.solucao_aplicada, 
            causa_raiz: osForm.causa_raiz, assinatura_tecnico: sigTec, assinatura_cliente: sigCli, 
            data_conclusao: new Date().toISOString()
        }).eq('id', osForm.id);
        
        if (error) throw error;
        if (osForm.equipamento_id) await supabase.from('equipamentos').update({ status: 'Operacional' }).eq('id', osForm.equipamento_id);
        
        setOsForm((prev: any) => ({ ...prev, status: 'Concluída', assinatura_tecnico: sigTec, assinatura_cliente: sigCli }));
        showToast('OS Finalizada com sucesso!', 'success');
        fetchAll();
    } catch(e: any) { showToast('Erro crítico ao salvar: ' + e.message, 'error'); } finally { setLoading(false); }
  };

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => { imprimirRelatorio({ os: osForm, apontamentos, checklistData: null, logoUrl, nomeEmpresa: 'Atlasum' }); setPrinting(false); }, 500);
  };

  // --- FUNÇÃO DE IMPRESSÃO RÁPIDA PELA LISTA ---
  const handleQuickPrint = async (os: any) => {
      showToast('Compilando relatório técnico...', 'info');
      try {
          const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
          const cli = clientes.find(c => c.id === (eq.cliente_id || os.cliente_id)) || {};
          const { data: aptData } = await supabase.from('apontamentos').select('*').eq('os_id', os.id).order('data_inicio');
          
          const fullOs = { ...os, equipamento: eq, cliente: cli };
          imprimirRelatorio({ os: fullOs, apontamentos: aptData || [], checklistData: null, logoUrl, nomeEmpresa: 'Atlasum' });
      } catch (err) { showToast('Erro ao gerar relatório.', 'error'); }
  };

  const changeTabAndScroll = (tab: any) => { setActiveTab(tab); if (tabContainerRef.current) tabContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  // --- TELA DE EXECUÇÃO DA OS ---
  if (selectedOsId && osForm.id) {
    const tecNome = osForm.equipamento?.tecnologia?.nome || osForm.equipamentos?.tecnologias?.nome || 'Equipamento não definido';
    const cliNome = osForm.cliente?.nome_fantasia || osForm.clientes?.nome_fantasia || 'Cliente não definido';

    return (
      <div className="max-w-[1600px] mx-auto p-4 animate-fadeIn pb-24" ref={tabContainerRef}>
         <div className="bg-theme-card p-6 rounded-t-[32px] border-b border-theme flex flex-col md:flex-row justify-between items-center gap-4 relative z-20 shadow-xl">
           <div>
               <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black text-theme-main tracking-tighter">OS #{osForm.id}</h2>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-md ${osForm.status==='Aberta'?'bg-orange-500':osForm.status==='Concluída'?'bg-emerald-600':'bg-blue-600'}`}>{osForm.status}</span>
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase text-white shadow-md bg-purple-600`}>{osForm.tipo || 'Corretiva'}</span>
               </div>
               <p className="text-sm font-bold text-theme-muted mt-2 flex items-center gap-2"><Wrench size={14}/> {tecNome} <span className="opacity-30">|</span> <UserCheck size={14}/> {cliNome}</p>
           </div>
           <div className="flex gap-2 flex-wrap justify-end">
               <MetrologiaCertificadoButton osId={osForm.id} statusOs={osForm.status || ''} statusExecucao={statusExecucaoMetrologia} />
               {osForm.status === 'Aberta' && <button onClick={() => handleStatusChange('Em Execução')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black shadow-lg flex items-center gap-2 hover:bg-blue-700 transition-all"><PlayCircle size={20}/> INICIAR</button>}
               <button onClick={handlePrint} disabled={printing} className="px-4 py-3 bg-theme-page text-theme-muted border border-theme rounded-xl font-bold hover:bg-theme-card flex items-center gap-2 transition-all">{printing ? <Loader2 size={18} className="animate-spin"/> : <Printer size={18}/>}</button>
               <button onClick={() => { setSelectedOsId(null); setOsForm({}); navigate('/ordens'); }} className="px-4 py-3 bg-theme-page text-theme-muted border border-theme rounded-xl font-bold hover:bg-theme-card hover:text-rose-500 transition-all"><X size={18}/></button>
           </div>
         </div>

         <div className="bg-theme-page p-1 flex gap-1 overflow-x-auto relative z-10 border-b border-theme shadow-sm">
            {[ { id: 'geral', label: 'Visão Geral' }, { id: 'checklist', label: 'Inspeção' }, ...(osForm.tipo === 'Calibração' ? [{ id: 'metrologia', label: 'LIMS RBC' }] : []), { id: 'apontamentos', label: 'Horas / MO' }, { id: 'evidencias', label: 'Fotos' }, { id: 'assinaturas', label: 'Assinaturas' }, { id: 'fechamento', label: 'Finalizar' } ].map(tab => (
               <button key={tab.id} onClick={() => changeTabAndScroll(tab.id)} className={`flex-1 min-w-[120px] py-4 font-black uppercase text-[10px] tracking-widest transition-all rounded-t-[20px] ${activeTab === tab.id ? 'bg-theme-card text-primary-theme shadow-sm border-t-4 border-primary-theme' : 'text-theme-muted hover:bg-theme-card/50'}`}>{tab.label}</button>
            ))}
         </div>

         <div className="bg-theme-card p-4 sm:p-8 rounded-b-[32px] shadow-2xl border border-theme border-t-0 block w-full h-auto pb-10">
            <div className={activeTab === 'geral' ? 'block' : 'hidden'}><GeralTab osForm={osForm} setOsForm={setOsForm} tecnicos={tecnicos} status={osForm.status || 'Aberta'} /></div>
            <div className={activeTab === 'checklist' ? 'block' : 'hidden'}>{osForm.id && osForm.equipamento_id && (<ChecklistTab osId={osForm.id} equipamentoId={osForm.equipamento_id} tipoServico={String(osForm.tipo || 'Corretiva')} showToast={showToast} />)}</div>
            <div className={activeTab === 'metrologia' ? 'block' : 'hidden'}>{osForm.id && osForm.equipamento_id && (<MetrologiaTab osId={osForm.id} equipamentoId={osForm.equipamento_id} onUpdate={() => refreshDependencies(osForm.id!)} />)}</div>
            <div className={activeTab === 'apontamentos' ? 'block' : 'hidden'}><ApontamentosTab osId={osForm.id!} tecnicos={tecnicos} status={osForm.status} showToast={showToast} onUpdate={() => refreshDependencies(osForm.id!)} /></div>
            <div className={activeTab === 'evidencias' ? 'block' : 'hidden'}><EvidenciasTab osId={osForm.id!} currentAnexos={osForm.anexos} showToast={showToast} onUpdate={() => refreshDependencies(osForm.id!)} /></div>
            <div className={activeTab === 'assinaturas' ? 'block' : 'hidden'}><AssinaturasTab ref={assinaturasRef} osId={osForm.id!} status={osForm.status || 'Aberta'} tecnicos={tecnicos} assinaturaTecnico={osForm.assinatura_tecnico} assinaturaCliente={osForm.assinatura_cliente} /></div>
            <div className={activeTab === 'fechamento' ? 'block' : 'hidden'}><FechamentoTab osForm={osForm} setOsForm={setOsForm} apontamentos={apontamentos} onFinalize={handleFinalize} status={osForm.status || 'Aberta'} onPrint={handlePrint} showToast={showToast} /></div>
         </div>
      </div>
    );
  }

  // --- MOTOR DE FILTROS AVANÇADOS ---
  const list = (ordens || []).filter(os => {
    const eq = equipamentos.find(e => e.id === os.equipamento_id) || os.equipamento || os.equipamentos || {};
    const cli = clientes.find(c => c.id === (eq?.cliente_id || os.cliente_id)) || os.cliente || {};

    const termo = buscaLivre.toLowerCase();
    const osIdStr = String(os.id);
    const tag = (eq.tag || '').toLowerCase();
    const serie = (eq.n_serie || eq.serie || '').toLowerCase();
    const patrimonio = (eq.patrimonio || '').toLowerCase();
    const tecName = (os.tecnico || '').toLowerCase();

    // 1. Filtro de Texto Global (Busca Profunda)
    const matchTexto = !termo || osIdStr.includes(termo) || tag.includes(termo) || serie.includes(termo) || patrimonio.includes(termo) || tecName.includes(termo);
    
    // 2. Filtros Específicos (Dropdowns)
    const matchStatus = !filtroStatus || os.status === filtroStatus;
    const matchTipo = !filtroTipo || os.tipo === filtroTipo;
    const matchCliente = !filtroCliente || String(cli.id) === filtroCliente;

    return matchTexto && matchStatus && matchTipo && matchCliente;
  }).sort((a, b) => b.id - a.id);

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
       <div className="flex justify-between items-end mb-8 border-b border-theme pb-6">
          <div>
             <h2 className="text-3xl font-black text-theme-main flex items-center gap-3"><span className="p-3 bg-blue-600 text-white rounded-xl shadow-lg"><FileText size={24}/></span> Gestão de Ordens</h2>
             <p className="text-theme-muted font-medium mt-2">Fila de atendimento técnico especializado.</p>
          </div>
          <button onClick={() => navigate('/novo-chamado')} className="bg-primary-theme px-6 py-3 rounded-xl font-black text-white shadow-lg hover:scale-105 transition-all flex items-center gap-2"><Plus size={20}/> NOVA O.S.</button>
       </div>

       {/* --- BARRA DE FILTROS AVANÇADOS ENTERPRISE --- */}
       <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm mb-8 space-y-4">
           <div className="flex items-center gap-2 text-theme-main font-black uppercase text-xs mb-2">
               <Filter size={16} className="text-primary-theme"/> Filtros Avançados
           </div>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               {/* Busca Universal */}
               <div className="relative md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block pl-1">ID, TAG, Série, Patrimônio ou Técnico</label>
                  <div className="relative">
                      <input className="input-theme pl-10 w-full h-12 rounded-xl font-bold" placeholder="Digite para buscar em todos os campos..." value={buscaLivre} onChange={e => setBuscaLivre(e.target.value)} />
                      <Search className="absolute left-3 top-3.5 text-theme-muted" size={18}/>
                  </div>
               </div>
               
               {/* Filtro Status */}
               <div>
                  <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block pl-1">Status</label>
                  <select className="input-theme w-full h-12 rounded-xl font-bold cursor-pointer" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                      <option value="">Todos os Status</option>
                      <option value="Aberta">Aberta</option>
                      <option value="Em Execução">Em Execução</option>
                      <option value="Concluída">Concluída</option>
                  </select>
               </div>

               {/* Filtro Tipo */}
               <div>
                  <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block pl-1">Natureza do Serviço</label>
                  <select className="input-theme w-full h-12 rounded-xl font-bold cursor-pointer" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                      <option value="">Todos os Tipos</option>
                      <option value="Corretiva">Corretiva</option>
                      <option value="Preventiva">Preventiva</option>
                      <option value="Calibração">Calibração</option>
                      <option value="Instalação">Instalação</option>
                  </select>
               </div>

               {/* Filtro Cliente */}
               <div className="md:col-span-4">
                  <label className="text-[10px] font-black uppercase text-theme-muted mb-1 block pl-1 flex items-center gap-1"><Briefcase size={12}/> Filtrar por Unidade / Cliente</label>
                  <select className="input-theme w-full h-12 rounded-xl font-bold cursor-pointer" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
                      <option value="">Todos os Clientes</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                  </select>
               </div>
           </div>
       </div>

       {/* --- LISTAGEM DE CARDS APRIMORADA --- */}
       <div className="grid gap-4">
          {list.map(os => {
             const eq = equipamentos.find(e => e.id === os.equipamento_id) || os.equipamento || os.equipamentos || {};
             const tecNome = eq?.tecnologia?.nome || eq?.tecnologias?.nome || 'Equipamento';
             const tag = eq?.tag || 'S/T';
             const serie = eq?.n_serie || eq?.serie || '-';
             const pat = eq?.patrimonio || '-';
             
             const cli = clientes.find(c => c.id === (eq?.cliente_id || os.cliente_id)) || os.cliente || os.equipamentos?.clientes || {};
             const cliNome = cli?.nome_fantasia || 'Unidade não informada';
             
             const tipoColor = os.tipo === 'Preventiva' ? 'bg-indigo-100 text-indigo-700' : os.tipo === 'Calibração' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700';

             return (
               <div key={os.id} onClick={() => { setSelectedOsId(os.id); refreshDependencies(os.id); }} className="bg-theme-card p-5 rounded-3xl border border-theme shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary-theme transition-all group cursor-pointer relative overflow-hidden">
                  
                  {/* Faixa Lateral de Status */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${os.status === 'Concluída' ? 'bg-emerald-500' : os.status === 'Em Execução' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>

                  {/* Informações Principais */}
                  <div className="flex gap-4 items-center w-full pl-2">
                      <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-sm border shadow-inner shrink-0 ${os.status === 'Concluída' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                          <span>#{os.id}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-black text-theme-main text-lg truncate">{tecNome}</h3>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${tipoColor}`}>{os.tipo || 'Corretiva'}</span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                              <span className="flex items-center gap-1 text-primary-theme bg-primary-theme/10 px-2 py-0.5 rounded"><Tag size={10}/> {tag}</span>
                              <span title="Série">SN: {serie}</span>
                              <span title="Patrimônio">PAT: {pat}</span>
                              <span className="opacity-40">|</span>
                              <span className="flex items-center gap-1"><UserCheck size={10}/> {cliNome}</span>
                          </div>

                          <p className="text-sm text-theme-muted mt-2 line-clamp-1 italic">Técnico: {os.tecnico || 'Não atribuído'}</p>
                      </div>
                  </div>

                  {/* Ações Rápidas (INLINE) */}
                  <div className="flex items-center justify-end gap-2 w-full md:w-auto shrink-0 border-t border-theme md:border-t-0 pt-4 md:pt-0">
                      
                      {/* Botões de Ação Direta (Impedem a abertura da OS ao clicar) */}
                      <button onClick={(e) => { e.stopPropagation(); handleQuickPrint(os); }} className="p-2.5 bg-theme-page border border-theme text-theme-muted hover:text-primary-theme hover:border-primary-theme rounded-xl transition-all tooltip-trigger" title="Gerar e Baixar PDF">
                          <Download size={18}/>
                      </button>

                      <div className="w-px h-8 bg-theme-muted opacity-20 mx-2 hidden md:block"></div>

                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border ${os.status==='Aberta'?'bg-orange-100 text-orange-700 border-orange-200':os.status==='Em Execução'?'bg-blue-100 text-blue-700 border-blue-200':'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                          {os.status}
                      </span>
                      <ChevronRight className="text-slate-300 group-hover:text-primary-theme transition-colors ml-2" size={24}/>
                  </div>
               </div>
             );
          })}
          {list.length === 0 && (
              <div className="p-12 text-center text-theme-muted font-bold flex flex-col items-center justify-center bg-theme-card border border-dashed border-theme rounded-3xl">
                  <Search size={48} className="opacity-20 mb-4"/>
                  <p>Nenhuma Ordem de Serviço encontrada com os filtros atuais.</p>
              </div>
          )}
       </div>
    </div>
  );
}