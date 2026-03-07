import { useState, useEffect } from 'react';
import { X, Save, Loader2, Package, ImagePlus } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; itemToEdit?: any; tenantId: number; }

export function ItemFormModal({ isOpen, onClose, onSuccess, itemToEdit, tenantId }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    codigo_sku: '', nome: '', fabricante: '', categoria: 'Acessório', unidade_medida: 'Un',
    estoque_minimo: 0, custo_medio: 0, valor_venda: 0, imagem_url: '' 
  });

  useEffect(() => { if (itemToEdit) setForm(itemToEdit); }, [itemToEdit]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `pecas/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: uploadError } = await supabase.storage.from('app-assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, imagem_url: data.publicUrl }));
    } catch (err) { alert('Erro ao fazer upload da foto.'); } finally { setUploading(false); }
  };

  const handleSave = async () => {
    if (!form.nome) return alert("O nome do item/serviço é obrigatório.");
    setLoading(true);
    try {
      const payload = { ...form, tenant_id: tenantId };
      if (itemToEdit?.id) await supabase.from('estoque_itens').update(payload).eq('id', itemToEdit.id);
      else await supabase.from('estoque_itens').insert([payload]);
      onSuccess(); onClose();
    } catch (error) { alert("Erro ao salvar."); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  const isServico = form.categoria === 'Serviço';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Package size={20}/></div>
            <h2 className="text-lg font-bold text-slate-800">{itemToEdit ? 'Editar Item' : 'Novo Produto / Serviço'}</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>

        <div className="p-6 space-y-5">
          
          <div className="flex flex-col md:flex-row gap-5 items-start">
             {!isServico && (
                 <div className="shrink-0">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Foto da Peça</label>
                    <div className="w-24 h-24 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-500 transition-colors">
                       <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                       {uploading ? <Loader2 className="animate-spin text-indigo-500" size={20}/> : 
                        form.imagem_url ? <img src={form.imagem_url} className="w-full h-full object-cover" alt="Peça"/> : 
                        <ImagePlus size={24} className="text-slate-300 group-hover:text-indigo-500"/>}
                    </div>
                 </div>
             )}

             <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome / Descrição *</label>
                  <input className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none focus:border-indigo-500" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder={isServico ? "Ex: Avaliação Técnica Preventiva" : "Ex: Sensor de SpO2"}/>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Código SKU / Referência</label>
                  <input className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none focus:border-indigo-500" value={form.codigo_sku} onChange={e => setForm({...form, codigo_sku: e.target.value})} placeholder={isServico ? "Ex: SERV-001" : "Ex: SN-001"}/>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Categoria</label>
              <select className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none focus:border-indigo-500" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                <option>Acessório</option><option>Peça de Reposição</option><option>Material de Consumo</option><option>Ferramenta / Padrão</option>
                <option className="font-bold text-indigo-600">Serviço</option> {/* 🚀 NOVA CATEGORIA AQUI */}
              </select>
            </div>
            {!isServico && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Fabricante</label>
                  <input className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none focus:border-indigo-500" value={form.fabricante} onChange={e => setForm({...form, fabricante: e.target.value})}/>
                </div>
            )}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">Un. Medida</label>
              <select className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none focus:border-indigo-500" value={form.unidade_medida} onChange={e => setForm({...form, unidade_medida: e.target.value})}>
                <option>Un</option><option>Pç</option><option>Cx</option><option>Mt</option><option>L</option>
                <option>Sv</option><option>Hr</option> {/* 🚀 UNIDADES PARA SERVIÇO */}
              </select>
            </div>
          </div>

          {/* 🚀 LÓGICA INTELIGENTE: Se for serviço, esconde o "Estoque Mínimo" */}
          <div className={`grid grid-cols-1 ${isServico ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200`}>
            {!isServico && (
                <div><label className="text-xs font-bold text-slate-500 uppercase">Estoque Mínimo</label><input type="number" className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none" value={form.estoque_minimo} onChange={e => setForm({...form, estoque_minimo: Number(e.target.value)})}/></div>
            )}
            <div><label className="text-xs font-bold text-slate-500 uppercase">Custo Médio (R$)</label><input type="number" step="0.01" className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none" value={form.custo_medio} onChange={e => setForm({...form, custo_medio: Number(e.target.value)})}/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Preço Venda (R$)</label><input type="number" step="0.01" className="w-full h-10 px-3 border border-slate-300 rounded-lg mt-1 text-sm outline-none" value={form.valor_venda} onChange={e => setForm({...form, valor_venda: Number(e.target.value)})}/></div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button onClick={handleSave} disabled={loading || uploading} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Salvar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
}