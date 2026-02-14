import { Monitor, AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { KpiCard } from '../../components/KpiCard';

// Recebe os dados já carregados do App.tsx para ser instantâneo
interface DashboardProps {
  equipamentos: any[];
  ordens: any[];
}

export function DashboardPage({ equipamentos, ordens }: DashboardProps) {
  
  // 1. Processamento Rápido de Dados
  const totalAtivos = equipamentos.length;
  const emManutencao = ordens.filter(o => o.status === 'Em Execução').length;
  // Consideramos crítico: Alta prioridade e não concluído
  const criticos = ordens.filter(o => o.prioridade === 'Alta' && o.status !== 'Concluída').length; 
  const concluidos = ordens.filter(o => o.status === 'Concluída').length;

  // Dados para o Gráfico
  const chartData = [
      { name: 'Abertas', v: ordens.filter(o => o.status === 'Aberta').length, fill: '#60a5fa' }, // Azul Claro
      { name: 'Execução', v: emManutencao, fill: '#f59e0b' }, // Laranja
      { name: 'Pendente', v: ordens.filter(o => o.status === 'Pendente').length, fill: '#94a3b8' }, // Cinza
      { name: 'Concluída', v: concluidos, fill: '#10b981' }, // Verde
  ];

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
        
        <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-800">Painel de Controle</h2>
            <p className="text-slate-500 font-medium mt-1">Visão geral da operação em tempo real.</p>
        </div>
        
        {/* LINHA 1: CARDS DE RESUMO (Usando o Componente Novo) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KpiCard 
                label="Total de Ativos" 
                value={totalAtivos} 
                icon={Monitor} 
                color="blue" 
                subtext="Equipamentos cadastrados"
            />
            <KpiCard 
                label="Em Manutenção" 
                value={emManutencao} 
                icon={Wrench} 
                color="amber" 
                subtext="Ordens em execução agora"
            />
            <KpiCard 
                label="Alertas Críticos" 
                value={criticos} 
                icon={AlertTriangle} 
                color="rose" 
                subtext="Prioridade Alta pendente"
            />
            <KpiCard 
                label="Total Concluído" 
                value={concluidos} 
                icon={CheckCircle} 
                color="emerald" 
                subtext="Histórico total"
            />
        </div>

        {/* LINHA 2: GRÁFICOS E LISTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* GRÁFICO DE BARRAS */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <Monitor size={18} className="text-slate-400"/>
                    Volume de Ordens de Serviço
                </h3>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{top: 20, right: 30, left: 0, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 600}} />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}} 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                            />
                            <Bar dataKey="v" radius={[6,6,0,0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* LISTA DE ATENÇÃO (ALERTAS) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-500"/> 
                    Atenção Necessária
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {ordens.filter(o => o.status !== 'Concluída' && o.status !== 'Cancelada')
                           .sort((a,b) => (a.prioridade === 'Alta' ? -1 : 1)) // Prioridade Alta primeiro
                           .slice(0, 10) // Mostrar apenas os top 10
                           .map(o => (
                        <div key={o.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-black text-slate-700 text-xs bg-white px-2 py-1 rounded border border-slate-200">OS #{o.id}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${o.prioridade === 'Alta' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {o.prioridade}
                                </span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm mb-1">{o.equipamentos?.nome || 'Equipamento'}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{o.descricao_problema}</p>
                        </div>
                    ))}
                    
                    {ordens.filter(o => o.status !== 'Concluída').length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <CheckCircle size={48} className="mb-4 opacity-20 text-emerald-500"/>
                            <p className="text-sm font-medium">Tudo limpo! Nenhuma pendência.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}