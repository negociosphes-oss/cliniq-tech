import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, DollarSign, TrendingUp, AlertCircle, CheckCircle2, Calendar, Trash2, Edit, FileText, Filter, X, Loader2, ExternalLink, ArrowUp, ArrowDown, ChevronsUpDown, Layers, Repeat, Package } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { format, isAfter, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

import { FinanceiroFormModal } from './FinanceiroFormModal';
import { FinanceiroPdfService } from '../../services/FinanceiroPdfService';

type SortConfig = { key: string; direction: 'asc' | 'desc'; };

export function FinanceiroPage() {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [tenantId, setTenantId] = useState<number>(1); // 🚀 ESTADO DO FAREJADOR

  // Filtros
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroCentroCusto, setFiltroCentroCusto] = useState('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  
  // Ordenação
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'data_vencimento', direction: 'asc' });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

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
        fetchFinanceiro(tId);
      } catch (err) {
        console.error("Erro ao identificar inquilino:", err);
      }
    };
    initTenant();
  }, []);

  // 🚀 2. FECHADURA NO FLUXO DE CAIXA
  const fetchFinanceiro = async (tId: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('financeiro_receitas')
      .select('*, clientes(nome_fantasia)')
      .eq('tenant_id', tId); // Trava de Segurança
      
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

  // 🚀 3. TRAVAS DE AÇÃO (PAGAMENTO E EXCLUSÃO)
  const confirmarRecebimento = async (id: number) => {
      if(!confirm("Confirmar entrada do valor?")) return;
      await supabase
        .from('financeiro_receitas')
        .update({ status: 'PAGO', data_pagamento: new Date().toISOString().split('T')[0] })
        .eq('id', id)
        .eq('tenant_id', tenantId); // Trava extra
      fetchFinanceiro(tenantId);
  };

  const excluirLancamento = async (id: number) => {
      if(!confirm("Excluir este lançamento?")) return;
      await supabase
        .from('financeiro_receitas')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId); // Trava extra
      fetchFinanceiro(tenantId);
  }

  const handleNovo = () => { setEditId(null); setIsModalOpen(true); };
  const handleEditar = (id: number) => { setEditId(id); setIsModalOpen(true); };

  // --- PROCESSAMENTO DE DADOS ---
  const dadosProcessados = useMemo(() => {
    let lista = receitas.filter(r => {
        const termo = busca.toLowerCase();
        const nomeCliente = r.clientes?.nome_fantasia || '';
        
        const matchBusca = r.descricao.toLowerCase().includes(termo) || 
                           nomeCliente.toLowerCase().includes(termo) ||
                           r.nfe_numero?.toLowerCase().includes(termo);
        
        const isVencido = r.status === 'PENDENTE' && isAfter(new Date(), parseISO(r.data_vencimento));
        let matchStatus = true;
        if (filtroStatus === 'PENDENTE') matchStatus = r.status === 'PENDENTE';
        if (filtroStatus === 'PAGO') matchStatus = r.status === 'PAGO';
        if (filtroStatus === 'ATRASADO') matchStatus = r.status === 'ATRASADO' || isVencido;

        const matchCC = filtroCentroCusto === 'TODOS' || r.centro_custo === filtroCentroCusto;
        const matchCat = filtroCategoria === 'TODOS' || r.categoria === filtroCategoria;

        const vencimento = r.data_vencimento;
        const matchData = (!dataInicio || vencimento >= dataInicio) && (!dataFim || vencimento <= dataFim);

        return matchBusca && matchStatus && matchCC && matchCat && matchData;
    });

    lista.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        if (sortConfig.key === 'cliente') { valA = a.clientes?.nome_fantasia || ''; valB = b.clientes?.nome_fantasia || ''; }
        if (typeof valA === 'string') return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return lista;
  }, [receitas, busca, filtroStatus, filtroCentroCusto, filtroCategoria, dataInicio, dataFim, sortConfig]);

  const kpis = useMemo(() => {
      return {
          recebido: dadosProcessados.filter(r => r.status === 'PAGO').reduce((acc, r) => acc + Number(r.valor_total), 0),
          pendente: dadosProcessados.filter(r => r.status === 'PENDENTE').reduce((acc, r) => acc + Number(r.valor_total), 0),
          total: dadosProcessados.reduce((acc, r) => acc + Number(r.valor_total), 0),
      }
  }, [dadosProcessados]);

  const chartData = useMemo(() => {
      const dataMap: any = {};
      dadosProcessados.forEach(r => {
          const diaMes = format(parseISO(r.data_vencimento), 'dd/MM');
          if(!dataMap[diaMes]) dataMap[diaMes] = { name: diaMes, Recebido: 0, Pendente: 0 };
          if(r.status === 'PAGO') dataMap[diaMes].Recebido += Number(r.valor_total); else dataMap[diaMes].Pendente += Number(r.valor_total);
      });
      return Object.values(dataMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
  }, [dadosProcessados]);

  const gerarRelatorioPDF = () => {
      if (dadosProcessados.length === 0) return alert("Sem dados para relatório.");
      FinanceiroPdfService.gerarRelatorio(dadosProcessados, { inicio: dataInicio, fim: dataFim });
  };

  const limparFiltros = () => { setDataInicio(''); setDataFim(''); setBusca(''); setFiltroStatus('TODOS'); setFiltroCentroCusto('TODOS'); setFiltroCategoria('TODOS'); };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-100"><DollarSign size={24}/></span>
            Gestão Financeira
          </h2>
          <p className="text-slate-500 font-medium mt-2 ml-1">Controle de faturamento, contratos e fluxo de caixa.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={gerarRelatorioPDF} className="h-12 px-6 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition"><FileText size={20}/> Relatório</button>
            <button onClick={handleNovo} className="h-12 px-8 bg-emerald-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition active:scale-95 text-sm uppercase tracking-widest"><Plus size={20}/> Novo</button>
        </div>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="z-10"><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Receita Realizada</p><p className="text-3xl font-black text-slate-800">R$ {kpis.recebido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl z-10"><CheckCircle2 size={32}/></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="z-10"><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Pendente</p><p className="text-3xl font-black text-slate-800">R$ {kpis.pendente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl z-10"><Calendar size={32}/></div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="z-10"><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Filtrado</p><p className="text-2xl font-black text-slate-800">R$ {kpis.total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p></div>
                <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl z-10"><TrendingUp size={32}/></div>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-slate-400"/> Fluxo Diário</h3>
              <div className="w-full h-[300px] min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, '']} />
                        <Legend wrapperStyle={{paddingTop: '20px'}}/>
                        <Bar name="Recebido" dataKey="Recebido" fill="#059669" radius={[4,4,0,0]} barSize={30} />
                        <Bar name="Pendente" dataKey="Pendente" fill="#fbbf24" radius={[4,4,0,0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* FILTROS AVANÇADOS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input className="w-full pl-12 pr-4 h-11 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:bg-white focus:border-emerald-500 transition-all" 
                   placeholder="Buscar Cliente, Descrição, NF..." 
                   value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 items-center">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400">De:</span>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-transparent outline-none font-bold text-sm text-slate-700 cursor-pointer"/>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 h-11 shrink-0">
                <span className="text-[10px] font-black uppercase text-slate-400">Até:</span>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-transparent outline-none font-bold text-sm text-slate-700 cursor-pointer"/>
            </div>
            <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors">
                <option value="TODOS">Status: Todos</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="PAGO">Recebidos</option>
                <option value="ATRASADO">Atrasados</option>
            </select>
            
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors">
                <option value="TODOS">Categoria: Todas</option>
                <option value="SERVICO">Serviços</option>
                <option value="VENDA_EQUIPAMENTO">Venda Equip.</option>
                <option value="VENDA_PECA">Venda Peças</option>
                <option value="CONTRATO">Contratos</option>
            </select>

            <select value={filtroCentroCusto} onChange={e => setFiltroCentroCusto(e.target.value)} className="h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-sm text-slate-700 outline-none cursor-pointer hover:bg-white transition-colors">
                <option value="TODOS">C. Custo: Todos</option>
                <option value="OPERACIONAL">Operacional</option>
                <option value="VENDAS">Vendas</option>
                <option value="ADMINISTRATIVO">Administrativo</option>
            </select>
            <button onClick={limparFiltros} className="h-11 px-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors shrink-0" title="Limpar Filtros"><X size={20}/></button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 select-none">
                    <tr>
                        <th onClick={() => handleSort('data_vencimento')} className="p-4 pl-8 cursor-pointer hover:bg-slate-100 transition-colors flex items-center gap-1">VENCIMENTO <SortIcon columnKey="data_vencimento" /></th>
                        <th onClick={() => handleSort('cliente')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">CLIENTE / DESCRIÇÃO <SortIcon columnKey="cliente" /></th>
                        <th onClick={() => handleSort('centro_custo')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">C. CUSTO <SortIcon columnKey="centro_custo" /></th>
                        <th onClick={() => handleSort('valor_total')} className="p-4 cursor-pointer hover:bg-slate-100 transition-colors">VALOR <SortIcon columnKey="valor_total" /></th>
                        <th className="p-4">STATUS</th>
                        <th className="p-4 text-center">AÇÕES</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {dadosProcessados.map(r => {
                        const isVencido = (r.status === 'PENDENTE' || r.status === 'ATRASADO') && isAfter(new Date(), parseISO(r.data_vencimento));
                        return (
                            <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4 pl-8 font-bold text-slate-600">{format(parseISO(r.data_vencimento), 'dd/MM/yyyy')}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800 flex items-center gap-2">
                                        {r.descricao}
                                        {r.recorrente && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1" title={`Contrato ${r.frequencia}`}><Repeat size={10}/> {r.frequencia}</span>}
                                    </div>
                                    <div className="text-xs text-slate-500 font-medium">{r.clientes?.nome_fantasia || 'Cliente Avulso'}</div>
                                    {r.categoria === 'VENDA_PECA' && <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-600"><Package size={10}/> Peças</div>}
                                    {r.link_pagamento && <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-emerald-600"><ExternalLink size={10}/> Boleto/Pix</div>}
                                </td>
                                <td className="p-4"><span className="px-2.5 py-1 bg-slate-100 text-slate-500 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wide">{r.centro_custo || 'Geral'}</span></td>
                                <td className="p-4 font-black text-slate-800 text-base">R$ {Number(r.valor_total).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                <td className="p-4">
                                    {r.status === 'PAGO' ? <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 w-max"><CheckCircle2 size={14}/> Recebido</span> : 
                                     isVencido ? <span className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 w-max"><AlertCircle size={14}/> Atrasado</span> : 
                                     <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-black uppercase flex items-center gap-1.5 w-max"><Calendar size={14}/> Pendente</span>}
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                        {r.nfe_url && <a href={r.nfe_url} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title={`Nota Fiscal: ${r.nfe_numero}`}><FileText size={18}/></a>}
                                        {r.status !== 'PAGO' && <button onClick={() => confirmarRecebimento(r.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Confirmar"><CheckCircle2 size={18}/></button>}
                                        <button onClick={() => handleEditar(r.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit size={18}/></button>
                                        <button onClick={() => excluirLancamento(r.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {dadosProcessados.length === 0 && !loading && (
                        <tr><td colSpan={6} className="p-16 text-center text-slate-400 font-medium">Nenhum lançamento encontrado para os filtros selecionados.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* 🚀 4. PASSAGEM DO INQUILINO PARA O MODAL */}
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