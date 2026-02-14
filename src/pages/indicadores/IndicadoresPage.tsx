import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Activity, Wrench, Clock, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';

import { BiService } from '../../services/BiService';
import { KpiCard } from '../../components/KpiCard';

export function IndicadoresPage() {
  const [indicadores, setIndicadores] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const loadBiData = async () => {
          setLoading(true);
          // Busca todas as ordens para calcular histórico
          const { data: ordens } = await supabase.from('ordens_servico').select('*, equipamentos(nome)');
          
          if (ordens) {
              // Usa o Serviço de Inteligência para calcular
              const calculated = BiService.calcularIndicadores(ordens);
              
              // Prepara dados para os gráficos (Mock de exemplo para visualização)
              // Num cenário real, BiService agruparia isso por mês
              const chartStatus = [
                  { name: 'Concluídas', value: calculated?.concluidas || 0, color: '#10b981' },
                  { name: 'Pendentes', value: calculated?.pendentes || 0, color: '#f59e0b' },
              ];

              const chartCustos = [
                  { name: 'Jan', custo: 1200 }, { name: 'Fev', custo: 1900 },
                  { name: 'Mar', custo: 1500 }, { name: 'Abr', custo: 2100 },
                  { name: 'Mai', custo: calculated?.custoTotal || 2500 }, // Ponto atual
              ];

              setIndicadores({ ...calculated, chartStatus, chartCustos });
          }
          setLoading(false);
      };
      loadBiData();
  }, []);

  if(loading) return <div className="p-10 flex justify-center text-slate-500 font-bold">Carregando Inteligência de Dados...</div>;
  if(!indicadores) return <div className="p-10">Sem dados suficientes para BI.</div>;

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
        
        <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-6">
            <div>
                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                    <span className="p-3 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-100"><Activity size={24}/></span>
                    Indicadores de Performance (KPIs)
                </h2>
                <p className="text-slate-500 font-medium mt-2">Métricas de confiabilidade e eficiência da Engenharia Clínica.</p>
            </div>
        </div>

        {/* CARDS DE TOPO (Usando KpiCard) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <KpiCard label="MTTR (Médio)" value={indicadores.mttr} icon={Clock} color="blue" subtext="Tempo Médio de Reparo" />
            <KpiCard label="MTBF (Estimado)" value={indicadores.mtbf} icon={AlertTriangle} color="violet" subtext="Tempo Entre Falhas" />
            <KpiCard label="Taxa de Solução" value={indicadores.taxaSucesso} icon={TrendingUp} color="emerald" subtext="% de OS Concluídas" />
            <KpiCard label="Custo Manutenção" value={`R$ ${indicadores.custoTotal}`} icon={DollarSign} color="rose" subtext="Custo total em peças/serviços" />
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Status Chart */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-96">
                <h3 className="font-bold text-slate-700 mb-2">Eficiência Operacional</h3>
                <p className="text-xs text-slate-400 mb-6">Comparativo entre chamados resolvidos e pendentes.</p>
                
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={indicadores.chartStatus} 
                                cx="50%" cy="50%" 
                                innerRadius={60} outerRadius={90} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
                                {indicadores.chartStatus.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Custo Chart */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-96">
                <h3 className="font-bold text-slate-700 mb-2">Evolução de Custos</h3>
                <p className="text-xs text-slate-400 mb-6">Tendência de gastos com manutenção nos últimos meses.</p>
                
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={indicadores.chartCustos}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} />
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                formatter={(val: number) => [`R$ ${val}`, 'Custo']}
                            />
                            <Line type="monotone" dataKey="custo" stroke="#f43f5e" strokeWidth={4} dot={{r: 4, strokeWidth: 0, fill: '#f43f5e'}} activeDot={{r: 6}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    </div>
  );
}