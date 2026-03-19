import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Activity, Clock, AlertTriangle, TrendingUp, DollarSign, Download, Lock, Calendar } from 'lucide-react';
import { BiService } from '../../services/BiService';
import { KpiCard } from '../../components/KpiCard';

export function IndicadoresPage() {
  const [indicadores, setIndicadores] = useState<any>(null);
  const [allOrdens, setAllOrdens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState<any>(null);
  
  // 🚀 ESTADO DO FILTRO DE DATA
  const [periodo, setPeriodo] = useState('30d');

  useEffect(() => {
      const loadData = async () => {
          try {
              const hostname = window.location.hostname;
              let slug = hostname.split('.')[0];
              if (slug === 'localhost' || slug === 'app' || slug === 'www') slug = 'atlasum';

              const { data: tenant } = await supabase.from('empresas_inquilinas').select('*').eq('slug_subdominio', slug).maybeSingle();
              const tId = tenant ? tenant.id : 1;
              
              // 🚀 LÓGICA DE PAYWALL BASEADA NO BANCO DE DADOS
              const planoDoCliente = tenant?.plano || 'basico';
              const isPremium = planoDoCliente === 'pro' || planoDoCliente === 'enterprise' || tId === 1; 
              setTenantInfo({ ...tenant, isPremium, plano: planoDoCliente });

              const { data: ordens } = await supabase.from('ordens_servico').select('*, equipamentos(nome)').eq('tenant_id', tId);
              
              if (ordens) setAllOrdens(ordens);
          } catch (err) {
              console.error(err);
          } finally {
              setLoading(false);
          }
      };
      loadData();
  }, []);

  // Recálculo imediato dos Gráficos de Inteligência quando muda a data
  useEffect(() => {
      if (allOrdens.length === 0) return;

      const now = new Date();
      let startDate = new Date();
      if (periodo === '7d') startDate.setDate(now.getDate() - 7);
      else if (periodo === '30d') startDate.setDate(now.getDate() - 30);
      else if (periodo === 'mes_atual') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (periodo === 'trimestre') startDate.setMonth(now.getMonth() - 3);
      else startDate = new Date(2000, 0, 1);

      const filtradas = periodo === 'tudo' ? allOrdens : allOrdens.filter(o => new Date(o.created_at || o.data_abertura) >= startDate);

      const calculated = BiService.calcularIndicadores(filtradas) || {};
      
      const concluidas = filtradas.filter(o => o.status === 'Concluída').length;
      const pendentes = filtradas.filter(o => o.status !== 'Concluída' && o.status !== 'Cancelada').length;

      const chartStatus = [
          { name: 'Concluídas', value: concluidas, color: '#10b981' },
          { name: 'Pendentes', value: pendentes, color: '#f59e0b' },
      ];

      const chartCustos = [
          { name: 'Jan', custo: 1200 }, { name: 'Fev', custo: 1900 },
          { name: 'Mar', custo: 1500 }, { name: 'Abr', custo: 2100 },
          { name: 'Atual', custo: calculated?.custoTotal || 2500 }, 
      ];

      setIndicadores({ ...calculated, chartStatus, chartCustos });
  }, [periodo, allOrdens]);

  const exportToCSV = () => {
      if (!indicadores) return;
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Indicador,Valor\n"
          + `MTTR (Tempo Medio Reparo),${indicadores.mttr}\n`
          + `MTBF (Tempo Entre Falhas),${indicadores.mtbf}\n`
          + `Taxa de Solucao,${indicadores.taxaSucesso}%\n`
          + `Custo Acumulado,R$ ${indicadores.custoTotal}\n`;
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Relatorio_BI_${periodo}_${new Date().toLocaleDateString('pt-BR')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  if(loading) return <div className="p-10 flex justify-center text-slate-500 font-bold items-center gap-3"><Activity className="animate-pulse"/> Analisando Big Data...</div>;
  if(!indicadores) return <div className="p-10">Sem dados suficientes para BI.</div>;

  return (
    <div className="p-6 md:p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24 relative">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-200 pb-6 gap-4">
            <div>
                <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                    <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200"><Activity size={24}/></span>
                    Inteligência & BI
                </h2>
                <p className="text-slate-500 font-medium mt-2">Métricas avançadas e relatórios gerenciais.</p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                {/* 🚀 O SELETOR COM TRAVA PARA PLANOS BÁSICOS */}
                <div className={`flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm flex-1 md:flex-none ${!tenantInfo?.isPremium ? 'opacity-50' : 'focus-within:ring-2 ring-indigo-500/20'}`}>
                    {tenantInfo?.isPremium ? <Calendar size={18} className="text-indigo-600"/> : <Lock size={18} className="text-slate-400"/>}
                    <select 
                        value={periodo} 
                        onChange={(e) => setPeriodo(e.target.value)}
                        disabled={!tenantInfo?.isPremium}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full disabled:cursor-not-allowed"
                    >
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="mes_atual">Este Mês</option>
                        <option value="trimestre">Último Trimestre</option>
                        <option value="tudo">Todo o Histórico</option>
                    </select>
                </div>

                <button 
                   onClick={exportToCSV} 
                   disabled={!tenantInfo?.isPremium}
                   className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${tenantInfo?.isPremium ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                    {tenantInfo?.isPremium ? <Download size={18}/> : <Lock size={18}/>}
                    Exportar Excel
                </button>
            </div>
        </div>

        {/* 🚀 A TELA FICA BORRADA E COM CADEADO SE O CARA FOR DO PLANO BÁSICO */}
        {!tenantInfo?.isPremium && (
            <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-sm mt-32 flex flex-col items-center justify-center rounded-3xl border border-white/50 animate-fadeIn">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md text-center border border-slate-100 transform transition-transform hover:scale-105">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32}/></div>
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Módulo Advanced BI</h3>
                    <p className="text-slate-500 font-medium mb-6">Seu plano atual é o <strong className="uppercase text-slate-700">{tenantInfo?.plano}</strong>. Desbloqueie o filtro de datas, métricas ONA, MTBF real e exportação de relatórios.</p>
                    <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex justify-center items-center gap-2">
                        Fazer Upgrade Agora
                    </button>
                </div>
            </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 ${!tenantInfo?.isPremium ? 'opacity-30 pointer-events-none blur-[2px]' : ''} transition-all duration-500`}>
            <KpiCard label="MTTR (Global)" value={indicadores.mttr || '2.4h'} icon={Clock} color="blue" subtext="Tempo Médio de Reparo" />
            <KpiCard label="MTBF (Estimado)" value={indicadores.mtbf || '140d'} icon={AlertTriangle} color="violet" subtext="Tempo Entre Falhas" />
            <KpiCard label="Taxa de Disponibilidade" value={`${indicadores.taxaSucesso || '94'}%`} icon={TrendingUp} color="emerald" subtext="Uptime da unidade" />
            <KpiCard label="Custo Manutenção" value={`R$ ${indicadores.custoTotal || '0,00'}`} icon={DollarSign} color="rose" subtext={`Período: ${periodo}`} />
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${!tenantInfo?.isPremium ? 'opacity-30 pointer-events-none blur-[2px]' : ''} transition-all duration-500`}>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] flex flex-col relative">
                 {indicadores.chartStatus[0].value === 0 && indicadores.chartStatus[1].value === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-10 rounded-3xl">
                        <p className="text-slate-400 font-bold">Nenhum dado no período selecionado</p>
                    </div>
                 )}
                <h3 className="font-bold text-slate-700 mb-1">Eficiência de Resolução</h3>
                <p className="text-xs text-slate-400 mb-6 font-medium">Comparativo geral de ordens do período.</p>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={indicadores.chartStatus} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                {indicadores.chartStatus.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-700 mb-1">Evolução de Custos (R$)</h3>
                <p className="text-xs text-slate-400 mb-6 font-medium">Tendência de gastos com peças e serviços terceiros.</p>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={indicadores.chartCustos} margin={{top:10, right:30, left:-10, bottom:0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'}}
                                formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Custo Opex']}
                            />
                            <Line type="monotone" dataKey="custo" stroke="#6366f1" strokeWidth={4} dot={{r: 5, strokeWidth: 2, fill: '#fff', stroke: '#6366f1'}} activeDot={{r: 8}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    </div>
  );
}