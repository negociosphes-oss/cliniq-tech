import { useState, useEffect, useMemo } from 'react'
import { 
  Calendar, List, Plus, Filter, ArrowLeft, Home, Download, ChevronRight, Settings, FileText, Trash2, AlertCircle
} from 'lucide-react'
import { supabase } from '../../supabaseClient'

// Importando tipos centralizados
import type { Cronograma, CronogramaPlano, PlanWithStats } from '../../types' 

import { CronogramaList } from './CronogramaList'
import { CronogramaCalendar } from './CronogramaCalendar'
import { GeradorModal } from './GeradorModal'
import { CronogramaPlans } from './CronogramaPlans'
import { RelatorioConfigModal } from './RelatorioConfigModal'

export function CronogramaPage() {
  const [viewLevel, setViewLevel] = useState<'plans' | 'details'>('plans'); 
  const [activePlan, setActivePlan] = useState<PlanWithStats | null>(null); 
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list'); 
  
  const [loading, setLoading] = useState(true);
  const [planosRaw, setPlanosRaw] = useState<CronogramaPlano[]>([]);
  const [itensRaw, setItensRaw] = useState<Cronograma[]>([]); 
  
  const [tenantId, setTenantId] = useState<number>(1); // 🚀 ESTADO DO FAREJADOR

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
        const hostname = window.location.hostname;
        let slug = hostname.split('.')[0];
        
        if (slug === 'localhost' || slug === 'app' || slug === 'www') {
            slug = 'atlasum';
        }

        const { data: tenant } = await supabase
            .from('empresas_inquilinas')
            .select('id')
            .eq('slug_subdominio', slug)
            .maybeSingle();

        const tId = tenant ? tenant.id : 1;
        setTenantId(tId);
        fetchData(tId);
      } catch (err) {
        console.error("Erro ao identificar inquilino:", err);
      }
    };
    initTenant();
  }, []);

  // 🚀 2. BUSCA DE DADOS BLINDADA (FECHADURA TRIPLA)
  const fetchData = async (tId: number) => {
    setLoading(true);
    try {
      // 1. Busca Planos apenas deste inquilino
      const { data: planosData } = await supabase
        .from('cronograma_planos')
        .select(`*, clientes(nome_fantasia)`)
        .eq('tenant_id', tId) // Trava
        .order('created_at', { ascending: false });

      // 2. Busca Cronogramas (Apenas dados puros deste inquilino)
      const { data: cronoData } = await supabase
        .from('cronogramas')
        .select('*')
        .eq('tenant_id', tId) // Trava
        .order('data_programada', { ascending: true });

      // 3. Busca Equipamentos (Apenas deste inquilino)
      const { data: equipData } = await supabase
        .from('equipamentos')
        .select('*, tecnologias(nome, criticidade), clientes(nome_fantasia)')
        .eq('tenant_id', tId); // Trava

      // 4. HIDRATAÇÃO MANUAL
      const itensCompletos = (cronoData || []).map((item: any) => {
          const equip = (equipData || []).find((e: any) => e.id === item.equipamento_id);
          return {
              ...item,
              equipamentos: equip || { tag: 'Equip. Excluído', tecnologias: { nome: 'N/A' } }
          };
      });

      setPlanosRaw(planosData || []);
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
      
      const highRiskCount = itensDoPlano.filter(i => 
         i.equipamentos?.tecnologias?.criticidade?.toLowerCase().includes('alta')
      ).length;

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

  // 🚀 3. TRAVA DE EXCLUSÃO DUPLA
  const handleDeletePlan = async () => {
     if (!activePlan) return;
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

  return (
    <div className="p-6 md:p-8 max-w-[1920px] mx-auto min-h-screen animate-fadeIn">
      
      {/* HEADER */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6 font-medium">
         <button onClick={handleBackToPlans} className="hover:text-blue-600 flex items-center gap-1 transition-colors">
            <Home size={14}/> Gestão
         </button>
         <ChevronRight size={14} className="opacity-50"/>
         <button onClick={handleBackToPlans} className={`hover:text-blue-600 transition-colors ${viewLevel === 'plans' ? 'text-blue-600 font-bold' : ''}`}>
            Cronogramas
         </button>
         {viewLevel === 'details' && activePlan && (
            <>
               <ChevronRight size={14} className="opacity-50"/>
               <span className="text-blue-600 font-bold flex items-center gap-1">
                  <FileText size={14}/> {activePlan.nome}
               </span>
            </>
         )}
      </nav>

      {/* VIEWS */}
      {viewLevel === 'plans' ? (
         <div className="animate-slideIn">
            <div className="flex justify-end mb-2">
               <button onClick={() => setShowRelatorio(true)} className="text-slate-500 hover:text-blue-700 text-xs font-bold flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all">
                  <Download size={14}/> Exportar Dados
               </button>
            </div>

            {loading ? (
               <div className="flex flex-col items-center justify-center h-96 text-slate-400">
                  <div className="animate-spin mb-4 text-blue-500"><Settings size={32}/></div>
                  <p>Carregando cronogramas...</p>
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
               <button onClick={handleAddItems} className="btn-primary bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-5 py-2.5 shadow-md active:scale-95"><Plus size={18}/> Adicionar Equipamentos</button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden min-h-[500px]">
               {viewMode === 'list' ? <CronogramaList data={activeItems} onRefresh={() => fetchData(tenantId)} /> : <div className="p-6"><CronogramaCalendar data={activeItems} onRefresh={() => fetchData(tenantId)} /></div>}
            </div>
         </div>
      )}

      {/* 🚀 4. PROPAGAÇÃO DE INQUILINO PARA OS MODAIS */}
      {showGerador && <GeradorModal onClose={() => setShowGerador(false)} onGenerated={() => fetchData(tenantId)} initialPlanName={preSelectedPlanName} initialPlanId={preSelectedPlanId} tenantId={tenantId} />}
      {showRelatorio && <RelatorioConfigModal onClose={() => setShowRelatorio(false)} tenantId={tenantId} />}
    </div>
  )
}