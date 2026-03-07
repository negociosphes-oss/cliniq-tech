import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Loader2, AlertTriangle, Hash, Briefcase } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props {
  osId: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  status: string;
}

export function PecasTab({ osId, showToast, status }: Props) {
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [estoque, setEstoque] = useState<any[]>([]);
  const [pecasUsadas, setPecasUsadas] = useState<any[]>([]);
  
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const fetchDados = async () => {
    setLoading(true);
    try {
      // 1. Busca o catálogo TODO (mas filtra: ou é Serviço, ou tem saldo na prateleira)
      const { data: itens } = await supabase.from('estoque_itens').select('*').order('nome');
      if (itens) {
          const disponiveis = itens.filter(i => i.categoria === 'Serviço' || i.estoque_atual > 0);
          setEstoque(disponiveis);
      }

      // 2. Busca as peças e serviços já aplicados NESSA OS
      const { data: movs } = await supabase
        .from('estoque_movimentacoes')
        .select('*, estoque_itens(*)')
        .eq('os_id', osId)
        .eq('tipo', 'SAIDA');
      
      if (movs) setPecasUsadas(movs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDados(); }, [osId]);

  const handleAddPeca = async () => {
    if (!selectedItemId || quantidade <= 0) return;
    
    const item = estoque.find(i => i.id === Number(selectedItemId));
    if (!item) return;

    const isServico = item.categoria === 'Serviço';

    // 🚀 LÓGICA INTELIGENTE: Só barra se for Peça e não tiver estoque. Serviço passa direto!
    if (!isServico && quantidade > item.estoque_atual) {
       return showToast(`Saldo insuficiente! Você só tem ${item.estoque_atual} ${item.unidade_medida} no estoque.`, 'error');
    }

    setAdding(true);
    try {
      // Registra a Saída vinculada à O.S.
      const { error: movError } = await supabase.from('estoque_movimentacoes').insert([{
        tenant_id: item.tenant_id,
        item_id: item.id,
        tipo: 'SAIDA',
        quantidade: quantidade,
        os_id: osId,
        observacao: `Aplicado na O.S. #${osId}`
      }]);
      if (movError) throw movError;

      // Desconta do Estoque Principal APENAS se for produto físico
      if (!isServico) {
          const novoSaldo = Number(item.estoque_atual) - Number(quantidade);
          await supabase.from('estoque_itens').update({ estoque_atual: novoSaldo }).eq('id', item.id);
      }

      showToast(isServico ? 'Serviço adicionado à O.S.!' : 'Peça adicionada à O.S. e baixada do estoque!', 'success');
      setSelectedItemId('');
      setQuantidade(1);
      fetchDados();
    } catch (err) {
      showToast('Erro ao aplicar item.', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemovePeca = async (movId: number, itemId: number, qty: number, isServico: boolean) => {
    const confirmar = window.confirm(isServico ? "Deseja remover este serviço da O.S.?" : "Deseja remover esta peça da O.S.? Ela retornará para o estoque.");
    if (!confirmar) return;

    try {
      await supabase.from('estoque_movimentacoes').delete().eq('id', movId);

      // Só devolve o saldo pro item se for produto físico
      if (!isServico) {
          const itemDb = await supabase.from('estoque_itens').select('estoque_atual').eq('id', itemId).single();
          if (itemDb.data) {
             const saldoEstornado = Number(itemDb.data.estoque_atual) + Number(qty);
             await supabase.from('estoque_itens').update({ estoque_atual: saldoEstornado }).eq('id', itemId);
          }
      }

      showToast(isServico ? 'Serviço removido.' : 'Peça removida e devolvida ao estoque.', 'info');
      fetchDados();
    } catch (err) {
      showToast('Erro ao remover.', 'error');
    }
  };

  const osFechada = status === 'Concluída' || status === 'Finalizada';

  if (loading) return <div className="py-20 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-4" size={32}/> Carregando catálogo...</div>;

  return (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Package size={24}/></div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Serviços e Materiais Aplicados</h3>
            <p className="text-sm text-slate-500">Registre os serviços e componentes. O estoque de peças será baixado automaticamente.</p>
          </div>
       </div>

       {!osFechada ? (
         <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
               <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Selecione no Catálogo</label>
               <select className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-sm font-medium outline-none focus:border-indigo-500" value={selectedItemId} onChange={e => setSelectedItemId(Number(e.target.value))}>
                  <option value="">-- Escolha um serviço ou peça --</option>
                  {estoque.map(item => {
                      const isServico = item.categoria === 'Serviço';
                      return (
                        <option key={item.id} value={item.id}>
                          {isServico ? `[SERVIÇO] ${item.nome}` : `${item.codigo_sku ? `[${item.codigo_sku}] ` : ''}${item.nome} (Saldo: ${item.estoque_atual})`}
                        </option>
                      )
                  })}
               </select>
            </div>
            
            <div className="w-full md:w-32">
               <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Qtd.</label>
               <input type="number" min="1" className="w-full h-12 px-4 bg-white border border-slate-300 rounded-xl text-lg font-black outline-none focus:border-indigo-500 text-center" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))} />
            </div>

            <button onClick={handleAddPeca} disabled={adding || !selectedItemId} className="h-12 px-6 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
               {adding ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18}/>} Adicionar
            </button>
         </div>
       ) : (
         <div className="p-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl flex items-center gap-3 text-sm font-bold">
            <AlertTriangle size={20}/> Esta Ordem de Serviço está finalizada. Não é possível alterar os serviços e peças.
         </div>
       )}

       <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mt-6">
          <table className="w-full text-left whitespace-nowrap">
             <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider pl-6">Item / Serviço Aplicado</th>
                   <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Quantidade</th>
                   <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right pr-6">Ações</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {pecasUsadas.length === 0 ? (
                   <tr><td colSpan={3} className="py-12 text-center text-slate-400 font-medium">Nenhum serviço ou peça foi aplicado nesta O.S. ainda.</td></tr>
                ) : (
                   pecasUsadas.map(mov => {
                      const isServico = mov.estoque_itens?.categoria === 'Serviço';
                      
                      return (
                          <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                             <td className="px-4 py-4 pl-6">
                                <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                                   {isServico && <Briefcase size={14} className="text-indigo-500"/>}
                                   {mov.estoque_itens?.nome || 'Item Desconhecido'}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Hash size={12}/> {mov.estoque_itens?.codigo_sku || 'Sem Ref.'}
                                </div>
                             </td>
                             <td className="px-4 py-4 text-center">
                                <span className={`px-3 py-1 rounded-lg text-sm font-black border ${isServico ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                   {mov.quantidade} {mov.estoque_itens?.unidade_medida}
                                </span>
                             </td>
                             <td className="px-4 py-4 text-right pr-6">
                                {!osFechada && (
                                  <button onClick={() => handleRemovePeca(mov.id, mov.item_id, mov.quantidade, isServico)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title={isServico ? "Remover serviço" : "Remover e estornar ao estoque"}>
                                     <Trash2 size={18}/>
                                  </button>
                                )}
                             </td>
                          </tr>
                      )
                   })
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
}