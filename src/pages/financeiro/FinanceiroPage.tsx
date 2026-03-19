import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Calendar, Trash2, Edit, FileText, X, Loader2, ExternalLink, ArrowUp, ArrowDown, ChevronsUpDown, Repeat, Package, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { format, isAfter, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

import { FinanceiroFormModal } from './FinanceiroFormModal';
import { FinanceiroPdfService } from '../../services/FinanceiroPdfService';

type SortConfig = { key: string; direction: 'asc' | 'desc'; };

export function FinanceiroPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<number>(1);

  // 🚀 ESTADO DO FILTRO GLOBAL DE DATAS (Padrão: Este Mês)
  const [periodo, setPeriodo] = useState('mes_atual');
  
  // Filtros Secundários
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  
  // Ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'data_vencimento', direction: 'asc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => {
    const initTenant = async () => {
      try {
        const hostname = window.location.hostname;
        let slug = hostname.split('.')[0];
        if (slug === 'localhost' || slug === 'app' || slug === 'www') slug = 'atlasum';

        const { data: tenant } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
        const tId = tenant ? tenant.id : 1;
        setTenantId(tId);
        fetchFinanceiro(tId);
      } catch (err) {
        console.error("Erro ao identificar inquilino:", err);
      }
    };
    initTenant();
  }, []);

  const fetchFinanceiro = async (tId: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('financeiro_receitas')
      .select('*, clientes(nome_fantasia)')
      .eq('tenant_id', tId);
      
    if (error) console.error("Erro:", error);
    else setReceitas(data || []);
    setLoading(false);
  };

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
      if (sortConfig.key !== columnKey) return <ChevronsUpDown size={14} className="text-slate-300 ml-1" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-emerald-600 ml-1" /> : <ArrowDown size={14} className="text-emerald-600 ml-1" />;
  };

  const confirmarRecebimento = async (id: number) => {
      if(!confirm("Confirmar entrada do valor no caixa?")) return;
      await supabase.from('financeiro_receitas').update({ status: 'PAGO', data_pagamento: new Date().toISOString().split('T')[0] }).eq('id', id).eq('tenant_id', tenantId);
      fetchFinanceiro(tenantId);
  };

  const excluirLancamento = async (id: number) => {
      if(!confirm("Excluir este lançamento financeiro permanentemente?")) return;
      await supabase.from('financeiro_receitas').delete().eq('id', id).eq('tenant_id', tenantId);
      fetchFinanceiro(tenantId);
  }

  const handleNovo = () => { setEditId(null); setIsModalOpen(true); };
  const handleEditar = (id: number) => { setEditId(id); setIsModalOpen(true); };

  // --- 🚀 PROCESSAMENTO DE DADOS COM FILTRO GLOBAL ---
  const dadosProcessados = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    if (periodo === '7d') startDate.setDate(now.getDate() - 7);
    else if (periodo === '30d') startDate.setDate(now.getDate() - 30);
    else if (periodo === 'mes_atual') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (periodo === 'trimestre') startDate.setMonth(now.getMonth() - 3);
    else startDate = new Date(2000, 0, 1); // Tudo

    let lista = receitas.filter(r => {
        const vencimentoDate = parseISO(r.data_vencimento);
        const matchData = vencimentoDate >= startDate;

        const termo = busca.toLowerCase();
        const nomeCliente = r.clientes?.nome_fantasia || '';
        const matchBusca = r.descricao.toLowerCase().includes(termo) || nomeCliente.toLowerCase().includes(termo) || r.nfe_numero?.toLowerCase().includes(termo);
        
        const isVencido = r.status === 'PENDENTE' && isAfter(new Date(), vencimentoDate);
        let matchStatus = true;
        if (filtroStatus === 'PENDENTE') matchStatus = r.status === 'PENDENTE' && !isVencido;
        if (filtroStatus === 'PAGO') matchStatus = r.status === 'PAGO';
        if (filtroStatus === 'ATRASADO') matchStatus = r.status === 'ATRASADO' || isVencido;

        return matchData && matchBusca && matchStatus;
    });

    lista.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'cliente') { valA = a.clientes?.nome_fantasia || ''; valB = b.clientes?.nome_fantasia || ''; }
        if (typeof valA === 'string') return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return lista;
  }, [receitas, busca, filtroStatus, periodo, sortConfig]);

  // 🚀 KPIs FINANCEIROS AVANÇADOS
  const kpis = useMemo(() => {
      let recebido = 0;
      let aReceber = 0;
      let atrasado = 0;

      dadosProcessados.forEach(r => {
          const val = Number(r.valor_total);
          const isVencido = r.status === 'PENDENTE' && isAfter(new Date(), parseISO(r.data_vencimento));
          
          if (r.status === 'PAGO') recebido += val;
          else if (r.status === 'ATRASADO' || isVencido) atrasado += val;
          else aReceber += val;
      });

      return { recebido, aReceber, atrasado, total: recebido + aReceber + atrasado };
  }, [dadosProcessados]);

  // Dados Gráfico Pizza (Origem da Receita)
  const chartCategoriaData = useMemo(() => {
      const map: Record<string, number> = {};
      dadosProcessados.forEach(r => {
          const cat = r.categoria || 'OUTROS';
          map[cat] = (map[cat] || 0) + Number(r.valor_total);
      });
      const COLORS: any = { 'CONTRATO': '#10b981', 'SERVICO': '#3b82f6', 'VENDA_PECA': '#f59e0b', 'VENDA_EQUIPAMENTO': '#8b5cf6', 'OUTROS': '#94a3b8' };
      const NAMES: any = { 'CONTRATO': 'Contratos', 'SERVICO': 'Serviço Avulso', 'VENDA_PECA': 'Peças', 'VENDA_EQUIPAMENTO': 'Equipamentos', 'OUTROS': 'Outros' };
      
      return Object.keys(map).map(key => ({
          name: NAMES[key] || key,
          value: map[key],
          color: COLORS[key] || COLORS['OUTROS']
      })).sort((a, b) => b.value - a.value);
  }, [dadosProcessados]);

  const chartBarData = useMemo(() => {
      const dataMap: any = {};
      dadosProcessados.forEach(r => {
          const diaMes = format(parseISO(r.data_vencimento), 'dd/MM');
          if(!dataMap[diaMes]) dataMap[diaMes] = { name: diaMes, Recebido: 0, Pendente: 0 };
          if(r.status === 'PAGO') dataMap[diaMes].Recebido += Number(r.valor_total); else dataMap[diaMes].Pendente += Number(r.valor_total);
      });
      return Object.values(dataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [dadosProcessados]);

  const gerarRelatorioPDF = () => {
      if (dadosProcessados.length === 0) return alert("Sem dados para relatório no período selecionado.");
      FinanceiroPdfService.gerarRelatorio(dadosProcessados, { inicio: 'Período', fim: periodo });
  };

  const limparFiltros = () => { setBusca(''); setFiltroStatus('TODOS'); setPeriodo('mes_atual'); };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
            <span className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200"><DollarSign size={24}/></span>
            Gestão Financeira
          </h2>
          <p className="text-slate-500 font-medium mt-2">Controle de caixa, inadimplência e faturamento.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* 🚀 FILTRO GLOBAL DE DATA ELEGANT */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-sm focus-within:ring-2 ring-emerald-500/20 transition-all flex-1 md:flex-none">
                <Calendar size={18} className="text-emerald-600"/>
                <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full">
                    <option value="7d">Vencimentos: Últimos 7 dias</option>
                    <option value="30d">Vencimentos: Últimos 30 dias</option>
                    <option value="mes_atual">Vencimentos: Este Mês</option>
                    <option value="trimestre">Vencimentos: Último Trimestre</option>
                    <option value="tudo">Todo o Histórico</option>
                </select>
            </div>

            <button onClick={gerarRelatorioPDF} className="flex-1 md:flex-none h-11 px-5 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-50 transition active:scale-95"><FileText size={18}/> Relatório</button>
            <button onClick={handleNovo} className="flex-1 md:flex-none h-11 px-6 bg-emerald-600 text-white rounded-xl font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95"><Plus size={18}/> Novo Recebimento</button>
        </div>
      </div>

      {/* 🚀 DASHBOARD FINANCEIRO ENTERPRISE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform"><CheckCircle2 size={120}/></div>
              <div className="relative z-10">
                  <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-1"><CheckCircle2 size={14}/> Em Caixa (Pago)</p>
                  <p className="text-3xl font-black text-slate-800">R$ {kpis.recebido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">Valor já realizado no período</p>
              </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 text-blue-50 opacity-50 group-hover:scale-110 transition-transform"><TrendingUp size={120}/></div>
              <div className="relative z-10">
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-1"><Calendar size={14}/> A Receber (No Prazo)</p>
                  <p className="text-3xl font-black text-slate-800">R$ {kpis.aReceber.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  <p className="text-xs font-bold text-slate-400 mt-2">Previsão de entrada futura</p>
              </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-sm relative overflow-hidden group ${kpis.atrasado > 0 ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/30 border-rose-600' : 'bg-white border-slate-200'}`}>
              <div className={`absolute -right-4 -bottom-4 opacity-20 group-hover:scale-110 transition-transform ${kpis.atrasado > 0 ? 'text-white' : 'text-slate-100'}`}><AlertCircle size={120}/></div>
              <div className="relative z-10">
                  <p className={`text-[11px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 ${kpis.atrasado > 0 ? 'text-rose-100' : 'text-slate-500'}`}><AlertCircle size={14}/> Inadimplência (Atrasados)</p>
                  <p className="text-3xl font-black">R$ {kpis.atrasado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                  <p className={`text-xs font-bold mt-2 ${kpis.atrasado > 0 ? 'text-rose-100' : 'text-slate-400'}`}>Exige ação de cobrança</p>
              </div>
          </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[340px]">
              <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><PieChartIcon size={18} className="text-indigo-500"/> Origem da Receita</h3>
              <p className="text-xs text-slate-400 mb-4 font-medium">Distribuição do faturamento por categoria.</p>
              {chartCategoriaData.length > 0 ? (
                  <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie data={chartCategoriaData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                  {chartCategoriaData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />)}
                              </Pie>
                              <Tooltip formatter={(val: number) => [`R$ ${val.toLocaleString('pt-BR')}`, 'Total']} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold'}}/>
                              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '11px', fontWeight: 'bold'}}/>
                          </PieChart>
                      </ResponsiveContainer>
                  </div>
              ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 font-bold text-sm">Nenhuma receita registrada.</div>
              )}
          </div>

          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[340px]">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity size={18} className="text-emerald-500"/> Fluxo de Vencimentos</h3>
              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b', fontWeight: 'bold'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold'}} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '']} />
                        <Legend wrapperStyle={{paddingTop: '10px', fontSize: '12px', fontWeight: 'bold'}}/>
                        <Bar name="Pago" dataKey="Recebido" fill="#10b981" radius={[4,4,0,0]} barSize={24} />
                        <Bar name="A Receber / Atrasado" dataKey="Pendente" fill="#f59e0b" radius={[4,4,0,0]} barSize={24} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* ÁREA DE TABELA E FILTROS RAPIDOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input className="w-full pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl outline-none font-bold text-sm text-slate-700 focus:border-emerald-500 transition-all" placeholder="Buscar Cliente ou Descrição..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="h-10 bg-white border border-slate-200 rounded-xl px-4 font-bold text-sm text-slate-700 outline-none cursor-pointer flex-1 sm:flex-none">
                    <option value="TODOS">Todos os Status</option>
                    <option value="PENDENTE">No Prazo (A Receber)</option>
                    <option value="PAGO">Pago (Recebido)</option>
                    <option value="ATRASADO">Atrasados (Cobrar)</option>
                </select>
                <button onClick={limparFiltros} className="h-10 px-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 rounded-xl transition-colors" title="Limpar Filtros"><X size={18}/></button>
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 select-none">
                    <tr>
                        <th onClick={() => handleSort('data_vencimento')} className="p-4 pl-6 cursor-pointer hover:bg-slate-50 transition-colors flex items-center gap-1">Vencimento <SortIcon columnKey="data_vencimento" /></th>
                        <th onClick={() => handleSort('cliente')} className="p-4 cursor-pointer hover:bg-slate-50 transition-colors">Cliente / Serviço <SortIcon columnKey="cliente" /></th>
                        <th className="p-4">Classificação</th>
                        <th onClick={() => handleSort('valor_total')} className="p-4 cursor-pointer hover:bg-slate-50 transition-colors">Valor (R$) <SortIcon columnKey="valor_total" /></th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {dadosProcessados.map(r => {
                        const isVencido = (r.status === 'PENDENTE' || r.status === 'ATRASADO') && isAfter(new Date(), parseISO(r.data_vencimento));
                        return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                                <td className="p-4 pl-6 font-bold text-slate-600">
                                    {format(parseISO(r.data_vencimento), 'dd/MM/yyyy')}
                                    {isVencido && r.status !== 'PAGO' && <div className="text-[9px] text-rose-500 uppercase tracking-widest mt-0.5 font-black">Vencido</div>}
                                </td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        {r.descricao}
                                        {r.recorrente && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1"><Repeat size={10}/> {r.frequencia}</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">{r.clientes?.nome_fantasia || 'Cliente Avulso'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="w-max px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wide">{r.categoria?.replace('_', ' ')}</span>
                                        {r.link_pagamento && <span className="w-max flex items-center gap-1 text-[10px] font-bold text-emerald-600"><ExternalLink size={10}/> Boleto Gerado</span>}
                                    </div>
                                </td>
                                <td className="p-4 font-black text-slate-800 text-base">R$ {Number(r.valor_total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                <td className="p-4">
                                    {r.status === 'PAGO' ? <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 w-max"><CheckCircle2 size={14}/> Recebido</span> : 
                                     isVencido ? <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 w-max"><AlertCircle size={14}/> Atrasado</span> : 
                                     <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 w-max"><Calendar size={14}/> No Prazo</span>}
                                </td>
                                <td className="p-4 pr-6 text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {r.nfe_url && <a href={r.nfe_url} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={`Nota Fiscal: ${r.nfe_numero}`}><FileText size={18}/></a>}
                                        {r.status !== 'PAGO' && <button onClick={() => confirmarRecebimento(r.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Confirmar Recebimento"><CheckCircle2 size={18}/></button>}
                                        <button onClick={() => handleEditar(r.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit size={18}/></button>
                                        <button onClick={() => excluirLancamento(r.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {dadosProcessados.length === 0 && !loading && (
                        <tr><td colSpan={6} className="p-16 text-center text-slate-400 font-medium">Nenhum lançamento financeiro para os filtros atuais.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      <FinanceiroFormModal 
         isOpen={isModalOpen} 
         onClose={() => setIsModalOpen(false)} 
         onSuccess={() => fetchFinanceiro(tenantId)} 
         editId={editId} 
         tenantId={tenantId} 
      />
    </div>
  );
}