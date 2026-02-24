import { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, List, Plus, Filter, ArrowLeft, Home, Download, ChevronRight, Settings, FileText, Trash2, Loader2
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

import type { Cronograma, CronogramaPlano, PlanWithStats } from '../../types' 

import { CronogramaList } from './CronogramaList'
import { CronogramaCalendar } from './CronogramaCalendar'
import { GeradorModal } from './GeradorModal'
import { CronogramaPlans } from './CronogramaPlans'
import { RelatorioConfigModal } from './RelatorioConfigModal'

// 🚀 FAREJADOR DE SUBDOMÍNIO
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
      return parts[0];
  }
  return 'admin'; 
};

export function CronogramaPage() {
  const [viewLevel, setViewLevel] = useState<'plans' | 'details'>('plans'); 
  const [activePlan, setActivePlan] = useState<PlanWithStats | null>(null); 
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list'); 
  
  const [loading, setLoading] = useState(true);
  const [planosRaw, setPlanosRaw] = useState<CronogramaPlano[]>([]);
  const [itensRaw, setItensRaw] = useState<Cronograma[]>([]); 
  
  const [tenantId, setTenantId] = useState<number | null>(null); 

  // MODAIS
  const [showGerador, setShowGerador] = useState(false);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [preSelectedPlanId, setPreSelectedPlanId] = useState<number | undefined>(undefined);
  const [preSelectedPlanName, setPreSelectedPlanName] = useState('');
  
  const [filtroStatus, setFiltroStatus] = useState('');

  // 🚀 1. MOTOR FAREJADOR
  useEffect(() => {
    const initTenant = async () => {
      try {
        const slug = getSubdomain();
        
        let { data } = await supabase
          .from('empresas_inquilinas')
          .select('id')
          .eq('slug_subdominio', slug)
          .maybeSingle();

        if (!data) {
            const { data: fallbackData } = await supabase
              .from('empresas_inquilinas')
              .select('id')
              .order('id', { ascending: true })
              .limit(1)
              .maybeSingle();
            data = fallbackData;
        }

        if (data) {
            setTenantId(data.id);
            fetchData(data.id);
        } else {
            setTenantId(-1);
            setLoading(false);
        }
      } catch (err) {
        console.error("Erro no farejador:", err);
        setTenantId(-1);
        setLoading(false);
      }
    };
    initTenant();
  }, []);

  // 🚀 2. BUSCA BLINDADA TOTAL
  const fetchData = async (tId: number) => {
    if (tId === -1) return;
    setLoading(true);
    try {
      // 1. Busca Planos PUROS (Sem Join para evitar erro do Supabase)
      const { data: planosData } = await supabase
        .from('cronograma_planos')
        .select('*')
        .eq('tenant_id', tId)
        .order('created_at', { ascending: false });

      // 2. Busca Cronogramas PUROS
      const { data: cronoData } = await supabase
        .from('cronogramas')
        .select('*')
        .eq('tenant_id', tId)
        .order('data_programada', { ascending: true });

      // 3. Busca Auxiliares
      const { data: equipData } = await supabase.from('equipamentos').select('*').eq('tenant_id', tId);
      const { data: tecData } = await supabase.from('tecnologias').select('id, nome, criticidade').eq('tenant_id', tId);
      const { data: cliData } = await supabase.from('clientes').select('id, nome_fantasia').eq('tenant_id', tId);

      // 4. HIDRATAÇÃO MANUAL (O Segredo para não quebrar a tela)
      
      // Hidratando os Planos com os nomes dos clientes
      const planosCompletos = (planosData || []).map((plano: any) => {
         const clienteDoPlano = (cliData || []).find((c: any) => c.id === plano.cliente_id);
         return {
            ...plano,
            clientes: { nome_fantasia: clienteDoPlano ? clienteDoPlano.nome_fantasia : 'Cliente Não Encontrado' }
         };
      });

      // Hidratando os Itens do Cronograma
      const itensCompletos = (cronoData || []).map((item: any) => {
          const equip = (equipData || []).find((e: any) => e.id === item.equipamento_id);
          
          let tecObj = { nome: 'N/A', criticidade: 'N/A' };
          let cliObj = { nome_fantasia: 'N/A' };

          if (equip) {
              const t = (tecData || []).find((x: any) => x.id === equip.tecnologia_id);
              if (t) tecObj = t;
              
              const c = (cliData || []).find((x: any) => x.id === equip.cliente_id);
              if (c) cliObj = c;
          }

          return {
              ...item,
              equipamentos: equip ? {
                  ...equip,
                  tecnologias: tecObj,
                  clientes: cliObj
              } : { 
                  tag: 'Equip. Desconhecido', 
                  clientes: cliObj,
                  tecnologias: tecObj 
              }
          };
      });

      setPlanosRaw(planosCompletos);
      setItensRaw(itensCompletos);

    } catch (error: any) {
      console.error('Erro ao carregar dados:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const planosComStats: PlanWithStats[] = useMemo(() => {
    return planosRaw.map(plano => {
      const itensDoPlano = itensRaw.filter(item => item.plano_id === plano.id);
      
      const total = itensDoPlano.length;
      const concluidos = itensDoPlano.filter(i => i.status === 'Realizada').length;
      const pendentes = itensDoPlano.filter(i => i.status === 'Pendente').length;
      const atrasados = itensDoPlano.filter(i => i.status === 'Atrasada').length;
      
      const highRiskCount = itensDoPlano.filter(i => {
         const criticidade = i.equipamentos?.tecnologias?.criticidade || '';
         return criticidade.toLowerCase().includes('alta');
      }).length;

      let proximaData = null;
      const itensPendentes = itensDoPlano.filter(i => i.status === 'Pendente' || i.status === 'Atrasada');
      if (itensPendentes.length > 0) {
         itensPendentes.sort((a,b) => new Date(a.data_programada).getTime() - new Date(b.data_programada).getTime());
         proximaData = itensPendentes[0].data_programada;
      }

      return {
        ...plano,
        total,
        concluidos,
        pendentes,
        atrasados,
        highRiskCount,
        proximaData,
        progresso: total > 0 ? Math.round((concluidos / total) * 100) : 0
      };
    });
  }, [planosRaw, itensRaw]);

  const activeItems = useMemo(() => {
     if (viewLevel === 'plans' || !activePlan) return [];
     
     return itensRaw.filter(item => {
        const matchPlan = item.plano_id === activePlan.id;
        const matchStatus = !filtroStatus || item.status === filtroStatus;
        return matchPlan && matchStatus;
     });
  }, [viewLevel, activePlan, itensRaw, filtroStatus]);

  const handleOpenPlan = (plano: PlanWithStats) => {
    setActivePlan(plano);
    setViewLevel('details');
    setViewMode('list');
  };

  const handleBackToPlans = () => {
    setActivePlan(null);
    setViewLevel('plans');
    setFiltroStatus('');
  };

  const handleCreateNew = () => {
    setPreSelectedPlanId(undefined);
    setPreSelectedPlanName('');
    setShowGerador(true);
  };

  const handleAddItems = () => {
    if (activePlan) {
       setPreSelectedPlanId(activePlan.id);
       setPreSelectedPlanName(activePlan.nome);
       setShowGerador(true);
    }
  };

  const handleDeletePlan = async () => {
     if (!activePlan || !tenantId) return;
     const confirmText = prompt(`DIGITE "DELETAR" PARA EXCLUIR O PLANO "${activePlan.nome}":`);
     if (confirmText !== 'DELETAR') return;

     setLoading(true);
     try {
        await supabase.from('cronogramas').delete().eq('plano_id', activePlan.id).eq('tenant_id', tenantId);
        await supabase.from('cronograma_planos').delete().eq('id', activePlan.id).eq('tenant_id', tenantId);
        handleBackToPlans();
        fetchData(tenantId);
     } catch (e: any) {
        alert('Erro ao excluir: ' + e.message);
     } finally {
        setLoading(false);
     }
  };

  if (!tenantId) {
      return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-[1920px] mx-auto min-h-screen animate-fadeIn">
      
      {/* HEADER RESTAURADO */}
      {viewLevel === 'plans' && (
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
               <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Painel de Planejamento</h1>
               <p className="text-slate-500 font-medium mt-2">Gerencie seus contratos e cronogramas ativos.</p>
            </div>
            <div className="flex gap-3">
               <button onClick={() => setShowRelatorio(true)} className="px-5 py-3 text-slate-600 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
                  <Download size={18}/> Exportar Dados
               </button>
               <button onClick={handleCreateNew} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all active:scale-95">
                  <Plus size={20}/> Novo Plano
               </button>
            </div>
         </div>
      )}

      {/* NAVEGAÇÃO DE DETALHES */}
      {viewLevel === 'details' && (
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
             <button onClick={handleBackToPlans} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
                <Home size={14}/> Gestão
             </button>
             <ChevronRight size={14} className="opacity-50"/>
             <button onClick={handleBackToPlans} className="hover:text-blue-600 transition-colors">
                Cronogramas
             </button>
             <ChevronRight size={14} className="opacity-50"/>
             <span className="text-blue-600 font-bold flex items-center gap-1">
                <FileText size={14}/> {activePlan?.nome}
             </span>
          </nav>
      )}

      {/* VIEWS */}
      {viewLevel === 'plans' ? (
         <div className="animate-slideIn">
            {loading ? (
               <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                  <div className="animate-spin mb-4 text-blue-500"><Settings size={32}/></div>
                  <p className="font-bold">Carregando cronogramas...</p>
               </div>
            ) : planosComStats.length === 0 ? (
               <div className="text-center py-16 text-slate-400 font-medium border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/50 mt-4">
                  <Calendar size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                  <p className="text-lg text-slate-500 dark:text-slate-400">Nenhum plano de manutenção cadastrado para esta base.</p>
                  <button onClick={handleCreateNew} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 mx-auto hover:bg-blue-700 shadow-lg transition-all active:scale-95">
                     <Plus size={18}/> Criar Meu Primeiro Plano
                  </button>
               </div>
            ) : (
               <CronogramaPlans planos={planosComStats} onSelectPlan={handleOpenPlan} onCreateNew={handleCreateNew} />
            )}
         </div>
      ) : (
         <div className="animate-slideIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <div className="flex items-center gap-4">
                  <button onClick={handleBackToPlans} className="p-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all group">
                     <ArrowLeft size={20} className="text-slate-500 group-hover:text-blue-600"/>
                  </button>
                  <div>
                     <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">{activePlan?.nome}</h1>
                     <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${activePlan?.progresso === 100 ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                        {activePlan?.clientes?.nome_fantasia} &bull; {activeItems.length} itens
                     </p>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                     <button onClick={() => setViewMode('list')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List size={16}/> Lista</button>
                     <button onClick={() => setViewMode('calendar')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Calendar size={16}/> Calendário</button>
                  </div>
                  <button onClick={handleDeletePlan} className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"><Trash2 size={20}/></button>
               </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Filter size={14}/> Filtrar:</div>
                  <select className="bg-transparent text-sm font-medium outline-none text-slate-700 dark:text-slate-200 cursor-pointer hover:text-blue-600 transition p-1" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                     <option value="">Todos os Status</option><option value="Pendente">Pendente</option><option value="Realizada">Realizada</option><option value="Atrasada">Atrasada</option>
                  </select>
               </div>
               <button onClick={handleAddItems} className="btn-primary bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-5 py-2.5 shadow-md active:scale-95 rounded-xl font-bold transition-all"><Plus size={18}/> Adicionar Equipamentos</button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden min-h-[500px]">
               {viewMode === 'list' ? <CronogramaList data={activeItems} onRefresh={() => tenantId && fetchData(tenantId)} /> : <div className="p-6"><CronogramaCalendar data={activeItems} onRefresh={() => tenantId && fetchData(tenantId)} /></div>}
            </div>
         </div>
      )}

      {showGerador && tenantId && <GeradorModal onClose={() => setShowGerador(false)} onGenerated={() => fetchData(tenantId)} initialPlanName={preSelectedPlanName} initialPlanId={preSelectedPlanId} tenantId={tenantId} />}
      {showRelatorio && tenantId && <RelatorioConfigModal onClose={() => setShowRelatorio(false)} tenantId={tenantId} />}
    </div>
  )
}