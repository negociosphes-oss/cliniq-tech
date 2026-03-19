import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, User, Tag, Loader2, Link as LinkIcon, Receipt, Repeat, Layers } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  editId?: number | null;
  tenantId: number; 
}

export function FinanceiroFormModal({ isOpen, onClose, onSuccess, editId, tenantId }: Props) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  
  // Dados Básicos
  const [descricao, setDescricao] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [valor, setValor] = useState('');
  const [vencimento, setVencimento] = useState('');
  const [status, setStatus] = useState('PENDENTE');
  
  // Classificação
  const [categoria, setCategoria] = useState('SERVICO');
  const [centroCusto, setCentroCusto] = useState('OPERACIONAL');

  // Recorrência
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState('MENSAL');

  // Faturamento
  const [nfeNumero, setNfeNumero] = useState('');
  const [nfeUrl, setNfeUrl] = useState('');
  const [linkPagamento, setLinkPagamento] = useState(''); 

  useEffect(() => {
    if (isOpen) {
        fetchClientes();
        if (editId) carregarDados(editId);
        else resetForm();
    }
  }, [isOpen, editId]);

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nome_fantasia').eq('tenant_id', tenantId).order('nome_fantasia');
    setClientes(data || []);
  };

  const carregarDados = async (id: number) => {
      const { data } = await supabase.from('financeiro_receitas').select('*').eq('id', id).single();
      if (data) {
          setDescricao(data.descricao);
          setClienteId(data.cliente_id || '');
          setValor(data.valor_total);
          setVencimento(data.data_vencimento);
          setStatus(data.status);
          setCategoria(data.categoria || 'SERVICO');
          setCentroCusto(data.centro_custo || 'OPERACIONAL');
          setIsRecorrente(data.recorrente || false);
          setFrequencia(data.frequencia || 'MENSAL');
          setNfeNumero(data.nfe_numero || '');
          setNfeUrl(data.nfe_url || '');
          setLinkPagamento(data.link_pagamento || '');
      }
  };

  const resetForm = () => {
      setDescricao(''); setClienteId(''); setValor(''); 
      setVencimento(''); setStatus('PENDENTE'); 
      setCategoria('SERVICO'); setCentroCusto('OPERACIONAL');
      setIsRecorrente(false); setFrequencia('MENSAL');
      setNfeNumero(''); setNfeUrl(''); setLinkPagamento('');
  };

  const handleSave = async () => {
      if (!descricao || !valor || !vencimento) return alert("Preencha Descrição, Valor e Vencimento.");
      setLoading(true);

      const payload = {
          tenant_id: tenantId,
          descricao,
          cliente_id: clienteId || null,
          valor_total: parseFloat(valor.toString().replace(',', '.')),
          data_vencimento: vencimento,
          status,
          categoria,
          centro_custo: centroCusto,
          recorrente: isRecorrente,
          frequencia: isRecorrente ? frequencia : null,
          nfe_numero: nfeNumero,
          nfe_url: nfeUrl,
          link_pagamento: linkPagamento
      };

      try {
          if (editId) await supabase.from('financeiro_receitas').update(payload).eq('id', editId);
          else await supabase.from('financeiro_receitas').insert([payload]);
          
          onSuccess();
          onClose();
      } catch (error) {
          alert("Erro ao salvar.");
          console.error(error);
      } finally {
          setLoading(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><DollarSign size={20}/></div>
                {editId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <button onClick={onClose} className="p-2 bg-slate-200/50 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            
            <div className="flex gap-4 mb-2 p-1 bg-slate-100 rounded-xl w-max border border-slate-200">
                <button onClick={() => setIsRecorrente(false)} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${!isRecorrente ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                    Receita Avulsa
                </button>
                <button onClick={() => setIsRecorrente(true)} className={`px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isRecorrente ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
                    <Repeat size={14}/> Contrato Recorrente
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Descrição / Serviço</label>
                    <input value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 transition-colors" placeholder={isRecorrente ? "Ex: Manutenção Preventiva Mensal" : "Ex: Troca de Placa Fonte"} />
                </div>

                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><DollarSign size={12}/> Valor (R$)</label>
                    <input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-emerald-700 text-lg outline-none focus:bg-white focus:border-emerald-500 transition-colors" placeholder="0.00" />
                </div>
                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><Calendar size={12}/> {isRecorrente ? 'Primeiro Vencimento' : 'Data de Vencimento'}</label>
                    <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 transition-colors" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><User size={12}/> Cliente Vinculado</label>
                    <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 cursor-pointer transition-colors">
                        <option value="">Cliente Balcão / Avulso</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia}</option>)}
                    </select>
                </div>
                
                {isRecorrente ? (
                    <div>
                        <label className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><Repeat size={12}/> Cobrança</label>
                        <select value={frequencia} onChange={e => setFrequencia(e.target.value)} className="w-full h-12 bg-indigo-50/50 border border-indigo-200 text-indigo-700 rounded-xl px-4 font-bold outline-none focus:bg-white focus:border-indigo-500 cursor-pointer">
                            <option value="MENSAL">Mensal (Todo mês)</option>
                            <option value="BIMESTRAL">Bimestral (A cada 2 meses)</option>
                            <option value="TRIMESTRAL">Trimestral (A cada 3 meses)</option>
                            <option value="SEMESTRAL">Semestral (A cada 6 meses)</option>
                            <option value="ANUAL">Anual (1x por ano)</option>
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={`w-full h-12 border rounded-xl px-4 font-bold outline-none cursor-pointer transition-colors ${status === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:border-emerald-500'}`}>
                            <option value="PENDENTE">A Receber (No Prazo)</option>
                            <option value="PAGO">Já Recebido (Pago)</option>
                            <option value="ATRASADO">Inadimplente (Atrasado)</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><Tag size={12}/> Categoria</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 cursor-pointer">
                        <option value="SERVICO">Serviço Técnico Avulso</option>
                        <option value="CONTRATO">Contrato de Manutenção</option>
                        <option value="VENDA_PECA">Venda de Peças</option>
                        <option value="VENDA_EQUIPAMENTO">Venda de Equipamento</option>
                        <option value="OUTROS">Outras Receitas</option>
                    </select>
                </div>
                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1 block flex items-center gap-1"><Layers size={12}/> Centro de Custo</label>
                    <select value={centroCusto} onChange={e => setCentroCusto(e.target.value)} className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 cursor-pointer">
                        <option value="OPERACIONAL">Operacional (Oficina)</option>
                        <option value="VENDAS">Comercial</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                    </select>
                </div>
            </div>

            <div className="pt-4 mt-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-4">
                    <Receipt size={14}/> Dados de Faturamento / Cobrança
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Nota Fiscal Emitida (Nº)</label>
                        <input value={nfeNumero} onChange={e => setNfeNumero(e.target.value)} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 font-medium text-slate-700 outline-none focus:border-emerald-500" placeholder="Ex: 004512" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block flex items-center gap-1"><LinkIcon size={12}/> Link Boleto / Link Pagamento</label>
                        <input value={linkPagamento} onChange={e => setLinkPagamento(e.target.value)} className="w-full h-10 bg-white border border-slate-200 rounded-xl px-4 text-xs font-medium text-blue-600 outline-none focus:border-blue-500" placeholder="https://nubank.com.br/..." />
                    </div>
                </div>
            </div>

        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2 active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SALVAR LANÇAMENTO
            </button>
        </div>
      </div>
    </div>
  );
}