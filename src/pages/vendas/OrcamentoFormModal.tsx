import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calculator, User, Calendar, Loader2, CreditCard, Clock, Phone, Mail, Contact } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  editId?: number | null; 
}

export function OrcamentoFormModal({ isOpen, onClose, onSuccess, editId }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  
  const [clienteId, setClienteId] = useState('');
  const [validade, setValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Boleto Bancário');
  const [prazoPagamento, setPrazoPagamento] = useState('À vista');
  
  // Novos Campos de Contato
  const [solicitante, setSolicitante] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');

  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);

  useEffect(() => { 
    if (isOpen) {
        fetchClientes();
        if (editId) carregarOrcamento(editId);
        else resetForm();
    }
  }, [isOpen, editId]);

  const resetForm = () => {
      setClienteId(''); setValidade(''); setObservacoes('');
      setMetodoPagamento('Boleto Bancário'); setPrazoPagamento('À vista');
      setSolicitante(''); setEmailContato(''); setTelefoneContato('');
      setItens([{ descricao: '', quantidade: 1, valor_unitario: 0 }]);
  };

  const fetchClientes = async () => {
    // Agora puxa os dados de contato do cliente também para auto-completar
    const { data } = await supabase.from('clientes').select('id, nome_fantasia, responsavel, email, telefone').order('nome_fantasia');
    setClientes(data || []);
  };

  const handleClienteChange = (e: any) => {
      const id = e.target.value;
      setClienteId(id);
      
      // Auto-preenchimento Mágico
      const clienteSelecionado = clientes.find(c => c.id.toString() === id);
      if (clienteSelecionado && !editId) {
          setSolicitante(clienteSelecionado.responsavel || '');
          setEmailContato(clienteSelecionado.email || '');
          setTelefoneContato(clienteSelecionado.telefone || '');
      }
  };

  const carregarOrcamento = async (id: number) => {
      setLoadingData(true);
      try {
          const { data: orc } = await supabase.from('orçamentos').select('*').eq('id', id).single();
          const { data: itensOrc } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', id);

          if (orc) {
              setClienteId(orc.cliente_id?.toString() || '');
              setValidade(orc.validade || '');
              setObservacoes(orc.observacoes || '');
              setMetodoPagamento(orc.metodo_pagamento || 'Boleto Bancário');
              setPrazoPagamento(orc.prazo_pagamento || 'À vista');
              setSolicitante(orc.solicitante || '');
              setEmailContato(orc.email_contato || '');
              setTelefoneContato(orc.telefone_contato || '');
          }

          if (itensOrc && itensOrc.length > 0) {
              setItens(itensOrc.map(i => ({ descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario })));
          }
      } catch (error) { console.error(error); } finally { setLoadingData(false); }
  };

  const addItem = () => setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: 0 }]);
  const removeItem = (index: number) => { if (itens.length > 1) setItens(itens.filter((_, i) => i !== index)); };
  const updateItem = (index: number, field: string, value: any) => {
    const novos = [...itens];
    novos[index] = { ...novos[index], [field]: value };
    setItens(novos);
  };

  const totalGeral = itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);

  const handleSave = async () => {
    if (!clienteId) return alert("Selecione um cliente.");
    if (itens.some(i => !i.descricao)) return alert("Preencha a descrição dos itens.");
    setLoading(true);

    try {
      const orcamentoPayload = {
        cliente_id: clienteId, validade: validade || null, valor_total: totalGeral,
        observacoes, metodo_pagamento: metodoPagamento, prazo_pagamento: prazoPagamento,
        solicitante, email_contato: emailContato, telefone_contato: telefoneContato
      };

      let orcamentoIdFinal = editId;

      if (editId) {
          await supabase.from('orçamentos').update(orcamentoPayload).eq('id', editId);
          await supabase.from('orcamento_itens').delete().eq('orcamento_id', editId);
      } else {
          const numOrcamento = `ORC-${Date.now().toString().slice(-6)}`;
          const { data: orc, error: errOrc } = await supabase.from('orçamentos').insert([{ ...orcamentoPayload, numero_orcamento: numOrcamento, status: 'PENDENTE' }]).select().single();
          if (errOrc) throw errOrc;
          orcamentoIdFinal = orc.id;
      }

      const itensPayload = itens.map(item => ({
        orcamento_id: orcamentoIdFinal, descricao: item.descricao, quantidade: item.quantidade,
        valor_unitario: item.valor_unitario, valor_total: item.quantidade * item.valor_unitario
      }));

      await supabase.from('orcamento_itens').insert(itensPayload);

      alert(editId ? 'Orçamento atualizado!' : 'Orçamento gerado!');
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-fadeIn">
        
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <Calculator className="text-indigo-600" size={24}/>
            <h3 className="font-black text-slate-800 uppercase tracking-tighter">{editId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
        </div>

        {loadingData ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-bold text-sm">Carregando dados da proposta...</p>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><User size={14}/> Cliente</label>
                  <select value={clienteId} onChange={handleClienteChange} className="w-full h-12 bg-white border border-slate-300 rounded-xl px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Selecione o Cliente...</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Calendar size={14}/> Validade da Proposta</label>
                  <input type="date" value={validade} onChange={e => setValidade(e.target.value)} className="w-full h-12 bg-white border border-slate-300 rounded-xl px-4 text-sm font-bold outline-none"/>
                </div>
              </div>

              {/* NOVO BLOCO: DADOS DE CONTATO / SOLICITANTE */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Contact size={14}/> Solicitante (A/C)</label>
                  <input placeholder="Ex: Dr. João..." value={solicitante} onChange={e => setSolicitante(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Phone size={14}/> WhatsApp</label>
                  <input placeholder="(00) 00000-0000" value={telefoneContato} onChange={e => setTelefoneContato(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2"><Mail size={14}/> E-mail</label>
                  <input placeholder="email@hospital.com" value={emailContato} onChange={e => setEmailContato(e.target.value)} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex justify-between items-center">
                  Serviços e Materiais
                  <button onClick={addItem} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"><Plus size={16}/> Adicionar Item</button>
                </h4>
                <div className="space-y-3">
                  {itens.map((item, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end animate-fadeIn">
                      <div className="md:col-span-6">
                        <input placeholder="Descrição..." value={item.descricao} onChange={e => updateItem(index, 'descricao', e.target.value)} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500" />
                      </div>
                      <div className="md:col-span-2">
                        <input type="number" placeholder="Qtd" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', Number(e.target.value))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm text-center font-bold outline-none" />
                      </div>
                      <div className="md:col-span-3">
                        <input type="number" placeholder="V. Unit" value={item.valor_unitario} onChange={e => updateItem(index, 'valor_unitario', Number(e.target.value))} className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm font-bold text-emerald-600 outline-none" />
                      </div>
                      <div className="md:col-span-1 flex justify-center"><button onClick={() => removeItem(index)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                 <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-2"><CreditCard size={14}/> Método de Pagamento</label>
                  <select value={metodoPagamento} onChange={e => setMetodoPagamento(e.target.value)} className="w-full h-11 bg-white border border-indigo-200 rounded-xl px-4 text-sm font-bold outline-none">
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="PIX">Transferência PIX</option>
                    <option value="Transferência TED/DOC">Transferência TED/DOC</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-2"><Clock size={14}/> Prazo de Pagamento</label>
                  <select value={prazoPagamento} onChange={e => setPrazoPagamento(e.target.value)} className="w-full h-11 bg-white border border-indigo-200 rounded-xl px-4 text-sm font-bold outline-none">
                    <option value="À vista">À vista (Antecipado)</option>
                    <option value="15 dias">15 dias após faturamento</option>
                    <option value="30 dias">30 dias após faturamento</option>
                    <option value="15 / 30 dias">Parcelado 15 e 30 dias</option>
                    <option value="30 / 60 / 90 dias">Parcelado 30, 60 e 90 dias</option>
                    <option value="Sinal 50% + Saldo na Entrega">Sinal 50% + Saldo na Entrega</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Observações Adicionais</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="w-full h-20 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:bg-white transition-all" placeholder="Ex: Garantia de 90 dias..."/>
              </div>
            </div>
        )}

        <div className="p-6 border-t bg-slate-900 flex justify-between items-center shrink-0">
          <div className="text-white">
            <p className="text-[10px] font-bold uppercase text-slate-400">Total da Proposta</p>
            <p className="text-2xl font-black text-emerald-400">R$ {totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-sm hover:text-white">Cancelar</button>
            <button onClick={handleSave} disabled={loading || loadingData} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} {editId ? 'SALVAR EDIÇÃO' : 'GERAR PROPOSTA'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}