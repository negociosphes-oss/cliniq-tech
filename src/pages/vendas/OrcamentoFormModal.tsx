import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Calculator, User, Calendar, Loader2, CreditCard, Clock, Phone, Mail, Contact, PackageSearch, AlertTriangle, FileText } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void; 
  editId?: number | null; 
  tenantId: number; 
}

export function OrcamentoFormModal({ isOpen, onClose, onSuccess, editId, tenantId }: Props) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [modelosTermos, setModelosTermos] = useState<any[]>([]);
  const [termosCondicoes, setTermosCondicoes] = useState('');

  const [clienteId, setClienteId] = useState('');
  const [validade, setValidade] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Boleto Bancário');
  const [prazoPagamento, setPrazoPagamento] = useState('À vista');
  const [solicitante, setSolicitante] = useState('');
  const [emailContato, setEmailContato] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');

  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, valor_unitario: 0, item_estoque_id: '' }]);

  useEffect(() => { 
    if (isOpen && tenantId) {
        fetchClientes();
        fetchEstoque();
        fetchModelosTermos();
        if (editId) carregarOrcamento(editId);
        else resetForm();
    }
  }, [isOpen, editId, tenantId]);

  const resetForm = () => {
      setClienteId(''); setValidade(''); setObservacoes(''); setTermosCondicoes('');
      setMetodoPagamento('Boleto Bancário'); setPrazoPagamento('À vista');
      setSolicitante(''); setEmailContato(''); setTelefoneContato('');
      setItens([{ descricao: '', quantidade: 1, valor_unitario: 0, item_estoque_id: '' }]);
  };

  const fetchClientes = async () => {
    const { data } = await supabase.from('clientes').select('id, nome_fantasia, responsavel, email, telefone').eq('tenant_id', tenantId).order('nome_fantasia');
    setClientes(data || []);
  };

  // 🚀 BUSCANDO TAMBÉM A "CATEGORIA" DO BANCO
  const fetchEstoque = async () => {
    const { data } = await supabase.from('estoque_itens').select('id, nome, valor_venda, codigo_sku, estoque_atual, categoria').eq('tenant_id', tenantId).order('nome');
    setEstoque(data || []);
  };

  const fetchModelosTermos = async () => {
    const { data } = await supabase.from('orcamento_modelos_termos').select('*').eq('tenant_id', tenantId).order('titulo');
    setModelosTermos(data || []);
  };

  const handleClienteChange = (e: any) => {
      const id = e.target.value;
      setClienteId(id);
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
          const { data: orc } = await supabase.from('orçamentos').select('*').eq('id', id).eq('tenant_id', tenantId).single();
          const { data: itensOrc } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', id);

          if (orc) {
              setClienteId(orc.cliente_id?.toString() || '');
              setValidade(orc.validade || '');
              setObservacoes(orc.observacoes || '');
              setTermosCondicoes(orc.termos_condicoes || ''); 
              setMetodoPagamento(orc.metodo_pagamento || 'Boleto Bancário');
              setPrazoPagamento(orc.prazo_pagamento || 'À vista');
              setSolicitante(orc.solicitante || '');
              setEmailContato(orc.email_contato || '');
              setTelefoneContato(orc.telefone_contato || '');
          }

          if (itensOrc && itensOrc.length > 0) {
              setItens(itensOrc.map(i => ({ 
                descricao: i.descricao, quantidade: i.quantidade, valor_unitario: i.valor_unitario, item_estoque_id: i.item_estoque_id?.toString() || '' 
              })));
          }
      } catch (error) { console.error(error); } finally { setLoadingData(false); }
  };

  const addItem = () => setItens([...itens, { descricao: '', quantidade: 1, valor_unitario: 0, item_estoque_id: '' }]);
  const removeItem = (index: number) => { if (itens.length > 1) setItens(itens.filter((_, i) => i !== index)); };
  
  const updateItem = (index: number, field: string, value: any) => {
    const novos = [...itens];
    novos[index] = { ...novos[index], [field]: value };
    setItens(novos);
  };

  const handleEstoqueChange = (index: number, estoqueId: string) => {
      const novos = [...itens];
      const peca = estoque.find(p => p.id.toString() === estoqueId);
      
      if (peca) {
          novos[index] = { 
            ...novos[index], item_estoque_id: estoqueId,
            descricao: peca.codigo_sku ? `[${peca.codigo_sku}] ${peca.nome}` : peca.nome,
            valor_unitario: Number(peca.valor_venda) || 0
          };
      } else { novos[index] = { ...novos[index], item_estoque_id: '' }; }
      setItens(novos);
  };

  const handleSaveTemplate = async () => {
      if (!termosCondicoes.trim()) return alert("Escreva algum termo antes de salvar o modelo.");
      const titulo = window.prompt("Digite um nome para este modelo de termo (ex: Padrão Manutenção):");
      if (!titulo) return;
      
      try {
          await supabase.from('orcamento_modelos_termos').insert([{ tenant_id: tenantId, titulo, texto: termosCondicoes }]);
          alert("Novo modelo salvo com sucesso! Agora ele aparecerá na lista.");
          fetchModelosTermos();
      } catch (err) { alert("Erro ao salvar modelo."); }
  };

  const totalGeral = itens.reduce((acc, item) => acc + (item.quantidade * item.valor_unitario), 0);

  const handleSave = async () => {
    if (!clienteId) return alert("Selecione um cliente.");
    if (itens.some(i => !i.descricao)) return alert("Preencha a descrição dos itens.");
    setLoading(true);

    try {
      const orcamentoPayload = {
        tenant_id: tenantId, cliente_id: clienteId, validade: validade || null, valor_total: totalGeral,
        observacoes, termos_condicoes: termosCondicoes, metodo_pagamento: metodoPagamento, 
        prazo_pagamento: prazoPagamento, solicitante, email_contato: emailContato, telefone_contato: telefoneContato
      };

      let orcamentoIdFinal = editId;

      if (editId) {
          await supabase.from('orçamentos').update(orcamentoPayload).eq('id', editId).eq('tenant_id', tenantId);
          await supabase.from('orcamento_itens').delete().eq('orcamento_id', editId);
      } else {
          const numOrcamento = `ORC-${Date.now().toString().slice(-6)}`;
          const { data: orc, error: errOrc } = await supabase.from('orçamentos').insert([{ ...orcamentoPayload, numero_orcamento: numOrcamento, status: 'PENDENTE' }]).select().single();
          if (errOrc) throw errOrc;
          orcamentoIdFinal = orc.id;
      }

      const itensPayload = itens.map(item => ({
        orcamento_id: orcamentoIdFinal, descricao: item.descricao, quantidade: item.quantidade,
        valor_unitario: item.valor_unitario, valor_total: item.quantidade * item.valor_unitario,
        item_estoque_id: item.item_estoque_id ? Number(item.item_estoque_id) : null
      }));

      await supabase.from('orcamento_itens').insert(itensPayload);

      alert(editId ? 'Orçamento atualizado!' : 'Orçamento gerado!');
      onSuccess(); onClose();
    } catch (e: any) { alert(e.message); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 animate-fadeIn">
        
        <div className="p-6 border-b flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <Calculator className="text-indigo-600" size={24}/>
            <h3 className="font-black text-slate-800 uppercase tracking-tighter">{editId ? 'Editar Orçamento' : 'Novo Orçamento'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
        </div>

        {loadingData ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <Loader2 className="animate-spin mb-4" size={32} /><p className="font-bold text-sm">Carregando dados...</p>
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
                  {itens.map((item, index) => {
                    const pecaNoEstoque = estoque.find(e => e.id.toString() === item.item_estoque_id);
                    // 🚀 SE FOR SERVIÇO, NÃO APITA ESTOQUE INSUFICIENTE
                    const isServico = pecaNoEstoque?.categoria === 'Serviço';
                    const estoqueInsuficiente = pecaNoEstoque && !isServico && item.quantidade > pecaNoEstoque.estoque_atual;
                    const faltam = pecaNoEstoque && !isServico ? item.quantidade - pecaNoEstoque.estoque_atual : 0;

                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end animate-fadeIn bg-slate-50 p-3 rounded-xl border border-slate-200 relative">
                        <div className="md:col-span-3">
                           <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1"><PackageSearch size={12}/> Buscar Catálogo</label>
                           <select value={item.item_estoque_id} onChange={e => handleEstoqueChange(index, e.target.value)} className="w-full h-11 bg-white border border-indigo-200 text-indigo-700 rounded-xl px-3 text-xs font-bold outline-none cursor-pointer truncate">
                              <option value="">Texto Livre...</option>
                              {estoque.map(e => (
                                 <option key={e.id} value={e.id}>
                                    {e.categoria === 'Serviço' ? `[SERVIÇO] ${e.nome}` : `${e.nome} (Saldo: ${e.estoque_atual})`}
                                 </option>
                              ))}
                           </select>
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Descrição do Serviço/Peça</label>
                          <input placeholder="Descrição..." value={item.descricao} onChange={e => updateItem(index, 'descricao', e.target.value)} className="w-full h-11 bg-white border border-slate-300 rounded-xl px-4 text-sm font-medium outline-none focus:border-indigo-500" />
                        </div>
                        <div className="md:col-span-2 relative">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block text-center">Qtd</label>
                          <input type="number" min="1" value={item.quantidade} onChange={e => updateItem(index, 'quantidade', Number(e.target.value))} className={`w-full h-11 bg-white rounded-xl px-4 text-sm text-center font-bold outline-none transition-colors ${estoqueInsuficiente ? 'border-2 border-amber-400 text-amber-700' : 'border border-slate-300'}`} />
                          {estoqueInsuficiente && (<div className="absolute -bottom-5 left-0 w-full text-center flex items-center justify-center gap-1 text-[9px] font-black text-amber-600 uppercase tracking-tight"><AlertTriangle size={10}/> Faltam {faltam}</div>)}
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Valor Un. (R$)</label>
                          <input type="number" step="0.01" value={item.valor_unitario} onChange={e => updateItem(index, 'valor_unitario', Number(e.target.value))} className="w-full h-11 bg-white border border-slate-300 rounded-xl px-4 text-sm font-bold text-emerald-600 outline-none" />
                        </div>
                        <div className="md:col-span-1 flex justify-center pb-2">
                            <button onClick={() => removeItem(index)} className="p-2 text-slate-400 hover:text-rose-500 bg-white rounded-lg border border-slate-200 shadow-sm"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 mt-6">
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
                    <option value="À vista">À vista (Antecipado)</option><option value="15 dias">15 dias após faturamento</option><option value="30 dias">30 dias após faturamento</option>
                    <option value="15 / 30 dias">Parcelado 15 e 30 dias</option><option value="30 / 60 / 90 dias">Parcelado 30, 60 e 90 dias</option><option value="Sinal 50% + Saldo na Entrega">Sinal 50% + Saldo na Entrega</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-6">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-indigo-600"/> Termos e Condições
                    </h4>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <select 
                            className="flex-1 md:w-48 h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-bold outline-none cursor-pointer text-slate-600"
                            onChange={(e) => {
                                const modelo = modelosTermos.find(m => m.id.toString() === e.target.value);
                                if (modelo) setTermosCondicoes(modelo.texto);
                            }}
                        >
                            <option value="">Carregar um modelo...</option>
                            {modelosTermos.map(m => <option key={m.id} value={m.id}>{m.titulo}</option>)}
                        </select>
                        <button onClick={handleSaveTemplate} className="h-9 px-3 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors whitespace-nowrap">
                            Salvar como Modelo
                        </button>
                    </div>
                 </div>
                 <textarea 
                    value={termosCondicoes} 
                    onChange={e => setTermosCondicoes(e.target.value)} 
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:bg-white focus:border-indigo-400 transition-all custom-scrollbar" 
                    placeholder="Descreva os termos específicos para este orçamento ou carregue um modelo acima..."
                 ></textarea>
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Observações Curtas (Rodapé)</label>
                <textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm outline-none focus:bg-white transition-all" placeholder="Ex: Frete por conta do cliente..."></textarea>
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