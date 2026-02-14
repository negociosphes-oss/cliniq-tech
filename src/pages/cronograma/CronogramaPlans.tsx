import { 
  Folder, Calendar, ChevronRight, Plus, 
  AlertTriangle, CheckCircle, Clock, ShieldAlert,
  TrendingUp, Building2
} from 'lucide-react'

// CORREÇÃO: Importamos o tipo centralizado e removemos a definição local
import type { PlanWithStats } from '../../types'

interface CronogramaPlansProps {
  planos: PlanWithStats[]; 
  onSelectPlan: (plano: PlanWithStats) => void;
  onCreateNew: () => void;
}

export function CronogramaPlans({ planos, onSelectPlan, onCreateNew }: CronogramaPlansProps) {
  
  return (
    <div className="animate-fadeIn pb-10">
       
       {/* HEADER DA SEÇÃO */}
       <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 dark:border-slate-700 pb-6">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-blue-600"/> Painel de Planejamento
             </h2>
             <p className="text-slate-500 mt-1 text-sm">Gerencie seus contratos e cronogramas ativos.</p>
          </div>
          <button 
            onClick={onCreateNew} 
            className="btn-primary bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 dark:shadow-none px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:-translate-y-1"
          >
             <Plus size={20}/> Novo Plano
          </button>
       </div>

       {/* EMPTY STATE */}
       {planos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
             <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-full mb-6 animate-pulse">
                <Folder size={48} className="text-slate-300"/>
             </div>
             <h3 className="font-bold text-xl text-slate-700 dark:text-white mb-2">Nenhum plano ativo</h3>
             <p className="text-slate-500 mb-8 max-w-md text-center">Os planos criados aparecerão aqui automaticamente.</p>
             <button onClick={onCreateNew} className="text-blue-600 font-bold hover:underline">Criar primeiro plano agora</button>
          </div>
       ) : (
          
          /* GRID DE CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {planos.map((plano) => {
                // Definição de Cor de Status baseada no progresso real
                let statusColor = 'bg-blue-600'; 
                if (plano.progresso === 100) statusColor = 'bg-emerald-500';
                if (plano.atrasados > 0) statusColor = 'bg-red-500';

                return (
                  <div 
                     key={plano.id} 
                     onClick={() => onSelectPlan(plano)}
                     className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between h-full relative overflow-hidden"
                  >
                     {/* Barra Decorativa Superior */}
                     <div className={`absolute top-0 left-0 w-full h-1 ${statusColor}`}></div>

                     <div>
                        {/* Título e Cliente */}
                        <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-600 dark:text-slate-400 group-hover:text-blue-600 transition">
                                 <Building2 size={24}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h3 className="font-bold text-lg text-slate-800 dark:text-white truncate" title={plano.nome}>
                                    {plano.nome}
                                 </h3>
                                 <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                                    {plano.clientes?.nome_fantasia || 'Cliente não vinculado'}
                                 </p>
                              </div>
                           </div>
                        </div>

                        {/* Badges de Risco */}
                        <div className="flex flex-wrap gap-2 mb-6 min-h-[24px]">
                           {plano.atrasados > 0 && (
                              <span className="flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-bold px-2 py-1 rounded border border-red-100">
                                 <AlertTriangle size={10}/> {plano.atrasados} Atrasados
                              </span>
                           )}
                           {plano.highRiskCount > 0 && (
                              <span className="flex items-center gap-1 bg-orange-50 text-orange-700 text-[10px] font-bold px-2 py-1 rounded border border-orange-100">
                                 <ShieldAlert size={10}/> {plano.highRiskCount} Críticos
                              </span>
                           )}
                           {plano.progresso === 100 && (
                              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-100">
                                 <CheckCircle size={10}/> Concluído
                              </span>
                           )}
                        </div>

                        {/* Barra de Progresso Visual */}
                        <div className="mb-6">
                           <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-500">
                              <span>Progresso da Execução</span>
                              <span className="text-slate-800 dark:text-white font-bold">{plano.progresso}%</span>
                           </div>
                           <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                              <div 
                                 className={`h-full rounded-full transition-all duration-1000 ease-out ${statusColor}`} 
                                 style={{ width: `${plano.progresso}%` }}
                              ></div>
                           </div>
                        </div>

                        {/* Mini Dashboard de Métricas */}
                        <div className="grid grid-cols-3 gap-px bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden mb-4 border border-slate-200 dark:border-slate-600">
                           <div className="bg-white dark:bg-slate-800/80 p-2 text-center">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Total</span>
                              <span className="font-bold text-slate-700 dark:text-slate-200">{plano.total}</span>
                           </div>
                           <div className="bg-white dark:bg-slate-800/80 p-2 text-center">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Feito</span>
                              <span className="font-bold text-emerald-600">{plano.concluidos}</span>
                           </div>
                           <div className="bg-white dark:bg-slate-800/80 p-2 text-center">
                              <span className="block text-[10px] font-bold text-slate-400 uppercase">Pendente</span>
                              <span className="font-bold text-blue-600">{plano.pendentes}</span>
                           </div>
                        </div>
                     </div>

                     {/* Footer com Data */}
                     <div className="pt-4 border-t dark:border-slate-700 flex justify-between items-center mt-auto">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                           {plano.proximaData ? (
                              <>
                                 <Clock size={14} className={plano.atrasados > 0 ? "text-red-500" : "text-slate-400"}/>
                                 <span className={plano.atrasados > 0 ? "text-red-600 font-bold" : ""}>
                                    Próx: {new Date(plano.proximaData).toLocaleDateString()}
                                 </span>
                              </>
                           ) : (
                              <span className="text-emerald-600 font-medium flex items-center gap-1"><CheckCircle size={14}/> Tudo pronto</span>
                           )}
                        </div>
                        <button className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 group-hover:gap-2 transition-all">
                           Abrir Detalhes <ChevronRight size={14}/>
                        </button>
                     </div>
                  </div>
                )
             })}
          </div>
       )}
    </div>
  )
}