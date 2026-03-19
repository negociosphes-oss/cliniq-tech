import { useState, useMemo } from 'react';
import { Monitor, AlertTriangle, CheckCircle, Clock, Wrench, Activity, Plus, ArrowRight, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '../../components/KpiCard';

interface DashboardProps {
  equipamentos: any[];
  ordens: any[];
}

export function DashboardPage({ equipamentos, ordens }: DashboardProps) {
  const navigate = useNavigate();
  
  // 🚀 ESTADO DO FILTRO GLOBAL (Padrão: Últimos 30 dias)
  const [periodo, setPeriodo] = useState('30d');

  // 🚀 MOTOR DE FILTRAGEM INSTANTÂNEA: Recalcula todas as O.S. sem recarregar a página
  const ordensFiltradas = useMemo(() => {
     if (periodo === 'tudo') return ordens;
     
     const now = new Date();
     let startDate = new Date();
     
     if (periodo === '7d') startDate.setDate(now.getDate() - 7);
     if (periodo === '30d') startDate.setDate(now.getDate() - 30);
     if (periodo === 'mes_atual') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
     if (periodo === 'trimestre') startDate.setMonth(now.getMonth() - 3);
     
     return ordens.filter(o => new Date(o.created_at || o.data_abertura || new Date()) >= startDate);
  }, [ordens, periodo]);

  // KPIs baseados no filtro
  const totalAtivos = equipamentos.length; // Parque total nunca muda com o filtro de data
  const emManutencao = ordensFiltradas.filter(o => o.status === 'Em Execução' || o.status === 'Aberta').length;
  const concluidos = ordensFiltradas.filter(o => o.status === 'Concluída').length;
  
  const doisDiasAtras = new Date();
  doisDiasAtras.setDate(doisDiasAtras.getDate() - 2);
  
  const criticos = ordensFiltradas.filter(o => 
      o.status !== 'Concluída' && o.status !== 'Cancelada' && 
      (o.prioridade === 'Alta' || new Date(o.created_at) < doisDiasAtras)
  );

  // Dados do Gráfico Baseados no Filtro
  const osPorTipo = ordensFiltradas.reduce((acc, os) => {
      const tipo = os.tipo || 'Outros';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
  }, {} as Record<string, number>);
  
  const chartTipoData = Object.keys(osPorTipo).map(key => ({
      name: key,
      Quantidade: osPorTipo[key],
      fill: key.includes('Corretiva') ? '#f43f5e' : key.includes('Preventiva') ? '#3b82f6' : '#10b981'
  })).sort((a, b) => b.Quantidade - a.Quantidade);

  return (
    <div className="p-6 md:p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
            <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Comando Operacional</h2>
                <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    Atualizado em tempo real
                </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* 🚀 COMPONENTE DO FILTRO ELEGANTEMENTE POSICIONADO NO TOPO */}
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm focus-within:ring-2 ring-blue-500/20 transition-all flex-1 md:flex-none">
                    <Calendar size={18} className="text-blue-500"/>
                    <select 
                        value={periodo} 
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full"
                    >
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="mes_atual">Este Mês</option>
                        <option value="trimestre">Último Trimestre</option>
                        <option value="tudo">Todo o Histórico</option>
                    </select>
                </div>

                <button onClick={() => navigate('/novo-chamado')} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                    <Plus size={18}/> Nova O.S.
                </button>
            </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard label="Parque Tecnológico" value={totalAtivos} icon={Monitor} color="blue" subtext="Total na unidade" />
            <KpiCard label="Fila de Trabalho" value={emManutencao} icon={Wrench} color="amber" subtext="No período selecionado" />
            
            <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-3xl p-6 shadow-lg shadow-rose-500/20 text-white relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-rose-400/30 group-hover:scale-110 transition-transform"><AlertTriangle size={120}/></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md"><Clock size={24} className="text-white"/></div>
                        <span className="font-bold text-rose-100 uppercase tracking-wider text-xs">SLA em Risco</span>
                    </div>
                    <div className="text-4xl font-black mb-1">{criticos.length}</div>
                    <div className="text-sm font-medium text-rose-100">No período selecionado</div>
                </div>
            </div>

            <KpiCard label="Eficiência" value={concluidos} icon={CheckCircle} color="emerald" subtext="Concluídas no período" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[420px] flex flex-col relative">
                {chartTipoData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-3xl">
                        <p className="text-slate-400 font-bold">Nenhum dado no período selecionado</p>
                    </div>
                )}
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Activity size={18} className="text-blue-500"/> Natureza dos Chamados
                    </h3>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartTipoData} margin={{top: 20, right: 30, left: -10, bottom: 0}} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9"/>
                            <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12, fontWeight: 600}} width={120} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                            <Bar dataKey="Quantidade" radius={[0,6,6,0]} barSize={32} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-[420px] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-rose-500"/> Fila Crítica
                    </h3>
                    <span className="bg-rose-100 text-rose-600 text-xs font-black px-2 py-1 rounded-lg">{criticos.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {criticos.length > 0 ? criticos.sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).slice(0, 8).map(o => (
                        <div key={o.id} onClick={() => navigate('/ordens')} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-black text-slate-700 text-xs">#{o.id}</span>
                                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md bg-rose-100 text-rose-600">Atenção</span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{o.equipamentos?.nome || 'Equipamento'}</p>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-slate-500 font-bold">{new Date(o.created_at).toLocaleDateString()}</span>
                                <ArrowRight size={14} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0"/>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <CheckCircle size={48} className="mb-4 opacity-20 text-emerald-500"/>
                            <p className="text-sm font-bold text-center">Nenhum equipamento<br/>crítico no período!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}