import { useState } from 'react';
import { X, ArrowDownCircle, ArrowUpCircle, Loader2, Save } from 'lucide-react';
// 🚀 CAMINHO CORRIGIDO AQUI:
import { supabase } from '../../supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: any;
  tenantId: number;
}

export function MovimentacaoModal({ isOpen, onClose, onSuccess, item, tenantId }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ tipo: 'ENTRADA', quantidade: 1, observacao: '' });

  const handleSave = async () => {
    if (form.quantidade <= 0) return alert("A quantidade deve ser maior que zero.");
    setLoading(true);
    try {
      // 1. Registra no Kardex (Movimentações)
      await supabase.from('estoque_movimentacoes').insert([{
        tenant_id: tenantId, item_id: item.id, tipo: form.tipo, quantidade: form.quantidade, observacao: form.observacao
      }]);

      // 2. Calcula e atualiza o Saldo Atual na tabela pai
      const novoSaldo = form.tipo === 'ENTRADA' ? Number(item.estoque_atual) + Number(form.quantidade) : Number(item.estoque_atual) - Number(form.quantidade);
      
      await supabase.from('estoque_itens').update({ estoque_atual: novoSaldo }).eq('id', item.id);

      onSuccess();
      onClose();
    } catch (error) {
      alert("Erro ao registrar movimentação.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        <div className={`px-6 py-4 border-b flex justify-between items-center ${form.tipo === 'ENTRADA' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex items-center gap-3">
            {form.tipo === 'ENTRADA' ? <ArrowDownCircle className="text-emerald-600"/> : <ArrowUpCircle className="text-rose-600"/>}
            <div>
               <h2 className="text-sm font-bold text-slate-800 uppercase">Movimentar Estoque</h2>
               <p className="text-xs font-medium text-slate-500">{item.nome}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="flex gap-4">
            <button onClick={() => setForm({...form, tipo: 'ENTRADA'})} className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all ${form.tipo === 'ENTRADA' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-400 hover:border-emerald-200'}`}>+ ENTRADA</button>
            <button onClick={() => setForm({...form, tipo: 'SAIDA'})} className={`flex-1 py-3 text-sm font-bold rounded-xl border-2 transition-all ${form.tipo === 'SAIDA' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 text-slate-400 hover:border-rose-200'}`}>- SAÍDA</button>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase">Quantidade ({item.unidade_medida})</label>
             <input type="number" min="1" className="w-full h-14 px-4 border-2 border-slate-200 rounded-xl mt-1 text-2xl font-black text-slate-800 outline-none focus:border-indigo-500 text-center" value={form.quantidade} onChange={e => setForm({...form, quantidade: Number(e.target.value)})}/>
             <p className="text-[10px] text-center mt-2 text-slate-400 font-medium">Saldo após movimento: <strong className={form.tipo === 'ENTRADA' ? 'text-emerald-600' : 'text-rose-600'}>{form.tipo === 'ENTRADA' ? Number(item.estoque_atual) + Number(form.quantidade) : Number(item.estoque_atual) - Number(form.quantidade)}</strong> {item.unidade_medida}</p>
          </div>

          <div>
             <label className="text-xs font-bold text-slate-500 uppercase">Motivo / Observação</label>
             <input type="text" className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none focus:border-indigo-500" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} placeholder={form.tipo === 'ENTRADA' ? 'Ex: NF-e 1234' : 'Ex: Ajuste de inventário, perda...'}/>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className={`flex items-center gap-2 px-6 py-2 text-white rounded-lg text-sm font-bold transition-colors disabled:opacity-50 ${form.tipo === 'ENTRADA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} Confirmar {form.tipo}
          </button>
        </div>
      </div>
    </div>
  );
}