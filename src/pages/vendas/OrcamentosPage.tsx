import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Printer, Calculator, Filter, DollarSign, CheckCircle2, Clock, Edit, Calendar as CalendarIcon, X, ArrowRightCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { format } from 'date-fns';

import { OrcamentoFormModal } from './OrcamentoFormModal';
import { OrcamentoPdfService } from '../../services/OrcamentoPdfService';

export function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  useEffect(() => { fetchOrcamentos(); }, []);

  const fetchOrcamentos = async () => {
    setLoading(true);
    const { data } = await supabase.from('orçamentos').select('*, clientes(nome_fantasia, doc_id)').order('created_at', { ascending: false });
    setOrcamentos(data || []);
    setLoading(false);
  };

  const deleteOrcamento = async (id: number) => {
    if(!confirm("Deseja excluir este orçamento permanentemente?")) return;
    await supabase.from('orçamentos').delete().eq('id', id);
    fetchOrcamentos();
  };

  // --- NOVA FUNÇÃO INTELIGENTE: APROVAR E GERAR FINANCEIRO ---
  const aprovarEGerarFinanceiro = async (orcamento: any) => {
      if (orcamento.status === 'APROVADO') return alert("Este orçamento já está aprovado.");
      
      const confirmacao = confirm(
          `Deseja APROVAR este orçamento e gerar o LANÇAMENTO FINANCEIRO de R$ ${Number(orcamento.valor_total).toLocaleString('pt-BR')} automaticamente?`
      );

      if (!confirmacao) return;

      try {
          // 1. Atualiza o status do orçamento
          const { error: errOrc } = await supabase
              .from('orçamentos')
              .update({ status: 'APROVADO', data_aprovacao: new Date().toISOString() })
              .eq('id', orcamento.id);

          if (errOrc) throw new Error("Erro ao atualizar orçamento.");

          // 2. Cria o lançamento no Financeiro
          // Definimos o vencimento padrão para 30 dias se não houver lógica específica, ou usamos a data de hoje.
          // Aqui vou usar a data de hoje como data de lançamento/competência.
          const vencimentoEstimado = new Date();
          vencimentoEstimado.setDate(vencimentoEstimado.getDate() + 30); // Vencimento padrão p/ 30 dias (ajustável depois)

          const payloadFinanceiro = {
              descricao: `Faturamento Orçamento #${orcamento.numero_orcamento}`,
              cliente_id: orcamento.cliente_id,
              valor_total: orcamento.valor_total,
              data_vencimento: vencimentoEstimado.toISOString().split('T')[0],
              status: 'PENDENTE',
              categoria: 'SERVICO', // Padrão, já que vem de orçamento
              centro_custo: 'VENDAS',
              origem: 'ORCAMENTO',
              origem_id: orcamento.id,
              recorrente: false,
              metodo_pagamento: orcamento.metodo_pagamento || 'Boleto Bancário',
              observacoes: `Gerado automaticamente a partir da proposta ${orcamento.numero_orcamento}`
          };

          const { error: errFin } = await supabase.from('financeiro_receitas').insert([payloadFinanceiro]);

          if (errFin) throw new Error("Orçamento aprovado, mas erro ao gerar financeiro: " + errFin.message);

          alert("Sucesso! Orçamento aprovado e conta a receber gerada no Financeiro.");
          fetchOrcamentos();

      } catch (error: any) {
          alert(error.message);
      }
  };

  const handleOpenNovo = () => { setEditId(null); setIsModalOpen(true); };
  const handleOpenEdit = (id: number) => { setEditId(id); setIsModalOpen(true); };

  const limparFiltros = () => { setBusca(''); setFiltroStatus('TODOS'); setDataInicio(''); setDataFim(''); };

  // Lógica de Filtragem
  const orcamentosFiltrados = useMemo(() => {
    return orcamentos.filter(o => {
        const termoBusca = busca.toLowerCase();
        const matchesBusca = (o.numero_orcamento?.toLowerCase() || '').includes(termoBusca) || 
                             (o.clientes?.nome_fantasia?.toLowerCase() || '').includes(termoBusca) ||
                             (o.clientes?.doc_id?.toLowerCase() || '').includes(termoBusca);
        const matchesStatus = filtroStatus === 'TODOS' || o.status === filtroStatus;
        let matchesData = true;
        if (dataInicio) matchesData = matchesData && o.data_emissao >= dataInicio;
        if (dataFim) matchesData = matchesData && o.data_emissao <= dataFim;
        return matchesBusca && matchesStatus && matchesData;
    });
  }, [orcamentos, busca, filtroStatus, dataInicio, dataFim]);

  const kpis = useMemo(() => {
      return {
          total: orcamentosFiltrados.reduce((acc, o) => acc + Number(o.valor_total), 0),
          aprovados: orcamentosFiltrados.filter(o => o.status === 'APROVADO').reduce((acc, o) => acc + Number(o.valor_total), 0),
          pendentes: orcamentosFiltrados.filter(o => o.status === 'PENDENTE').reduce((acc, o) => acc + Number(o.valor_total), 0),
      }
  }, [orcamentosFiltrados]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100"><Calculator size={24}/></span>
            Propostas Comerciais
          </h2>
          <p className="text-slate-500 font-medium mt-2 ml-1">Gerencie seu pipeline de vendas e aprovações.</p>
        </div>
        <button onClick={handleOpenNovo} className="h-12 px-8 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition active:scale-95 text-sm uppercase tracking-widest">
            <Plus size={20}/> Novo Orçamento
        </button>
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
              <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl"><DollarSign size={28}/></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pipeline Filtrado</p><p className="text-2xl font-black text-slate-800 mt-1">R$ {kpis.total.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
              <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><CheckCircle2 size={28}/></div>
              <div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Aprovados</p><p className="text-2xl font-black text-slate-800 mt-1">R$ {kpis.aprovados.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm flex items-center gap-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10"></div>
              <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl"><Clock size={28}/></div>
              <div><p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Aguardando</p><p className="text-2xl font-black text-slate-800 mt-1">R$ {kpis.pendentes.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
          </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                <input className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-700 font-bold placeholder:text-slate-400 focus:bg-white focus:border-indigo-400 transition-all" placeholder="Pesquisar..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <div className="w-full md:w-64 relative">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-indigo-400 transition-all">
                    <option value="TODOS">Todos os Status</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="APROVADO">Aprovados</option>
                    <option value="REPROVADO">Reprovados</option>
                </select>
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center border-t border-slate-100 pt-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                    <CalendarIcon size={16} className="text-slate-400"/>
                    <span className="text-xs font-bold text-slate-500 uppercase">De:</span>
                    <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-700 w-32 cursor-pointer"/>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 h-12">
                    <span className="text-xs font-bold text-slate-500 uppercase">Até:</span>
                    <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="bg-transparent outline-none text-sm font-bold text-slate-700 w-32 cursor-pointer"/>
                </div>
            </div>
            {(busca !== '' || filtroStatus !== 'TODOS' || dataInicio !== '' || dataFim !== '') && (
                <button onClick={limparFiltros} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors ml-auto md:ml-4"><X size={16}/> Limpar Filtros</button>
            )}
        </div>
      </div>

      {/* LISTA DE ORÇAMENTOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                    <tr>
                        <th className="p-5 pl-8">Nº Orçamento / Data</th>
                        <th className="p-5">Cliente / Documento</th>
                        <th className="p-5">Condição de Pgto</th>
                        <th className="p-5 text-right">Valor Total</th>
                        <th className="p-5 text-center">Status & Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                    {orcamentosFiltrados.map(o => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="p-5 pl-8 font-black text-slate-800">
                                #{o.numero_orcamento}
                                <span className="block text-[10px] text-slate-400 font-bold mt-1">{format(new Date(o.data_emissao), 'dd/MM/yyyy')}</span>
                            </td>
                            <td className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-sm">{o.clientes?.nome_fantasia?.charAt(0) || '-'}</div>
                                    <div>
                                        <span className="block font-bold text-slate-700">{o.clientes?.nome_fantasia || 'Não Encontrado'}</span>
                                        <span className="block text-[10px] text-slate-400 font-bold tracking-widest">{o.clientes?.doc_id || 'CNPJ NÃO INFORMADO'}</span>
                                        {(o.solicitante || o.telefone_contato) && <span className="block text-[10px] text-indigo-500 font-bold mt-1">A/C: {o.solicitante || 'Resp.'}</span>}
                                    </div>
                                </div>
                            </td>
                            <td className="p-5">
                                <span className="block text-xs font-bold text-slate-700">{o.metodo_pagamento || '-'}</span>
                                <span className="block text-[10px] text-slate-400 font-bold">{o.prazo_pagamento || '-'}</span>
                            </td>
                            <td className="p-5 text-right font-black text-indigo-600 text-base">
                                R$ {Number(o.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="p-5">
                                <div className="flex items-center justify-center gap-2">
                                    
                                    {/* STATUS BADGE */}
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border 
                                        ${o.status === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                          o.status === 'REPROVADO' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                                          'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {o.status}
                                    </span>

                                    {/* BOTÃO DE AÇÃO PRINCIPAL (APROVAR E FATURAR) */}
                                    {o.status === 'PENDENTE' && (
                                        <button 
                                            onClick={() => aprovarEGerarFinanceiro(o)}
                                            className="ml-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase shadow-sm hover:bg-emerald-700 transition flex items-center gap-1"
                                            title="Aprovar e Gerar Financeiro"
                                        >
                                            <CheckCircle2 size={12}/> Aprovar
                                        </button>
                                    )}

                                    <div className="w-px h-6 bg-slate-200 mx-2"></div>

                                    <button onClick={() => handleOpenEdit(o.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar"><Edit size={18}/></button>
                                    <button onClick={() => OrcamentoPdfService.gerar(o.id)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="PDF"><Printer size={18}/></button>
                                    <button onClick={() => deleteOrcamento(o.id)} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {orcamentosFiltrados.length === 0 && !loading && (
                        <tr><td colSpan={5} className="p-16 text-center"><div className="flex flex-col items-center justify-center text-slate-400"><Filter size={32} className="mb-4 opacity-50"/><p className="font-bold">Nenhum orçamento encontrado.</p><button onClick={limparFiltros} className="mt-4 text-xs font-black uppercase text-indigo-600 hover:underline">Limpar Filtros</button></div></td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
      
      <OrcamentoFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchOrcamentos} editId={editId} />
    </div>
  );
}