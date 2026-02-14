import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Calendar, User, Tag, Loader2, Link as LinkIcon, Receipt, Repeat, Layers, Package } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
  editId?: number | null; 
}

export function FinanceiroFormModal({ isOpen, onClose, onSuccess, editId }: Props) {
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

  // Recorrência (Completa)
  const [isRecorrente, setIsRecorrente] = useState(false);
  const [frequencia, setFrequencia] = useState('MENSAL');

  // Dados Fiscais
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
    const { data } = await supabase.from('clientes').select('id, nome_fantasia').order('nome_fantasia');
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
      if (!descricao || !valor || !vencimento) return alert("Preencha os campos obrigatórios.");
      setLoading(true);

      const payload = {
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
          if (editId) {
              await supabase.from('financeiro_receitas').update(payload).eq('id', editId);
          } else {
              await supabase.from('financeiro_receitas').insert([payload]);
          }
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
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-fadeIn flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                <DollarSign className="text-emerald-600"/> 
                {editId ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* TIPO DE LANÇAMENTO (Recorrência) */}
            <div className="flex gap-4 mb-4 p-1 bg-slate-100 rounded-xl w-max">
                <button 
                    onClick={() => setIsRecorrente(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!isRecorrente ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Receita Única
                </button>
                <button 
                    onClick={() => setIsRecorrente(true)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isRecorrente ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Repeat size={14}/> Contrato / Recorrente
                </button>
            </div>

            {/* CAMPOS PRINCIPAIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-600 uppercase mb-1 block">Descrição</label>
                    <input value={descricao} onChange={e => setDescricao(e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-emerald-500" placeholder={isRecorrente ? "Ex: Contrato Mensal - Manutenção" : "Ex: Venda de Peças Avulsas"} />
                </div>

                <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-1 block flex items-center gap-1"><DollarSign size={12}/> Valor (R$)</label>
                    <input type="number" value={valor} onChange={e => setValor(e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-emerald-500" placeholder="0.00" />
                </div>
                <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-1 block flex items-center gap-1"><Calendar size={12}/> {isRecorrente ? 'Primeiro Vencimento' : 'Vencimento'}</label>
                    <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-emerald-500" />
                </div>
            </div>

            {/* SELEÇÃO DE CLIENTE E FREQUÊNCIA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-1 block flex items-center gap-1"><User size={12}/> Cliente</label>
                    <select value={clienteId} onChange={e => setClienteId(e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-emerald-500">
                        <option value="">Selecione...</option>
                        {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia}</option>)}
                    </select>
                </div>
                
                {isRecorrente ? (
                    <div>
                        <label className="text-xs font-black text-indigo-600 uppercase mb-1 block flex items-center gap-1"><Repeat size={12}/> Frequência de Cobrança</label>
                        <select value={frequencia} onChange={e => setFrequencia(e.target.value)} className="w-full h-11 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 font-bold outline-none focus:border-indigo-500">
                            <option value="MENSAL">Mensal (Todo mês)</option>
                            <option value="BIMESTRAL">Bimestral (A cada 2 meses)</option>
                            <option value="TRIMESTRAL">Trimestral (A cada 3 meses)</option>
                            <option value="QUADRIMESTRAL">Quadrimestral (A cada 4 meses)</option>
                            <option value="SEMESTRAL">Semestral (A cada 6 meses)</option>
                            <option value="ANUAL">Anual (1x por ano)</option>
                            <option value="BIANUAL">Bianual (A cada 2 anos)</option>
                        </select>
                    </div>
                ) : (
                    <div>
                        <label className="text-xs font-black text-slate-600 uppercase mb-1 block">Status Atual</label>
                        <select value={status} onChange={e => setStatus(e.target.value)} className={`w-full h-11 border rounded-xl px-4 font-bold outline-none focus:border-emerald-500 ${status === 'PAGO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <option value="PENDENTE">Pendente</option>
                            <option value="PAGO">Pago / Recebido</option>
                            <option value="ATRASADO">Atrasado</option>
                        </select>
                    </div>
                )}
            </div>

            {/* CLASSIFICAÇÃO (Com Venda de Peças) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-1 block flex items-center gap-1"><Tag size={12}/> Categoria</label>
                    <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-emerald-500">
                        <option value="SERVICO">Serviço Técnico</option>
                        <option value="VENDA_EQUIPAMENTO">Venda de Equipamento</option>
                        <option value="VENDA_PECA">Venda de Peças / Acessórios</option>
                        <option value="CONTRATO">Contrato de Manutenção</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs font-black text-slate-600 uppercase mb-1 block flex items-center gap-1"><Layers size={12}/> Centro de Custo</label>
                    <select value={centroCusto} onChange={e => setCentroCusto(e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-emerald-500">
                        <option value="OPERACIONAL">Operacional (Técnico)</option>
                        <option value="VENDAS">Comercial / Vendas</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                    </select>
                </div>
            </div>

            {/* FATURAMENTO & FISCAL */}
            <div className="space-y-4 pt-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 border-b border-slate-200 pb-2 mb-4 flex items-center gap-2">
                    <Receipt size={14}/> Faturamento & Fiscal
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase mb-1 block">Nota Fiscal (NF-e)</label>
                        <input value={nfeNumero} onChange={e => setNfeNumero(e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:border-indigo-500" placeholder="Nº da Nota" />
                    </div>
                    <div>
                        <label className="text-xs font-black text-slate-500 uppercase mb-1 block flex items-center gap-1"><LinkIcon size={12}/> Link do Boleto / Pix</label>
                        <input value={linkPagamento} onChange={e => setLinkPagamento(e.target.value)} className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-medium text-blue-600 outline-none focus:border-indigo-500" placeholder="https://..." />
                    </div>
                </div>
            </div>

        </div>

        {/* FOOTER */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-200 transition">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-black shadow-lg hover:bg-emerald-700 transition flex items-center gap-2">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SALVAR
            </button>
        </div>
      </div>
    </div>
  );
}