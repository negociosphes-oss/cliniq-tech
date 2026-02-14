import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Loader2, List, ShieldCheck, Activity } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export function TiposOSList() {
  const [tipos, setTipos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [form, setForm] = useState({ nome: '', exige_metrologia: false, cor_etiqueta: 'bg-slate-100 text-slate-700 border-slate-200' });

  const coresOptions = [
    { label: 'Cinza (Padrão)', value: 'bg-slate-100 text-slate-700 border-slate-200' },
    { label: 'Vermelho (Crítico)', value: 'bg-rose-100 text-rose-700 border-rose-200' },
    { label: 'Azul (Padrão)', value: 'bg-blue-100 text-blue-700 border-blue-200' },
    { label: 'Verde (Conclusão)', value: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { label: 'Roxo (Especial)', value: 'bg-purple-100 text-purple-700 border-purple-200' },
    { label: 'Laranja (Atenção)', value: 'bg-orange-100 text-orange-700 border-orange-200' }
  ];

  useEffect(() => { fetchTipos(); }, []);

  const fetchTipos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tipos_ordem_servico').select('*').order('nome');
    if (!error && data) setTipos(data);
    setLoading(false);
  };

  const handleEdit = (t: any) => {
    setForm({ nome: t.nome, exige_metrologia: t.exige_metrologia, cor_etiqueta: t.cor_etiqueta || coresOptions[0].value });
    setEditingId(t.id);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({ nome: '', exige_metrologia: false, cor_etiqueta: coresOptions[0].value });
  };

  const handleSave = async () => {
    if (!form.nome) return alert('O nome do serviço é obrigatório.');
    setLoading(true);
    try {
      if (editingId) {
        await supabase.from('tipos_ordem_servico').update(form).eq('id', editingId);
      } else {
        await supabase.from('tipos_ordem_servico').insert([form]);
      }
      handleCancel();
      await fetchTipos();
    } catch (e: any) {
      alert('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este tipo de serviço? Isso pode afetar Ordens antigas.')) return;
    try {
      await supabase.from('tipos_ordem_servico').delete().eq('id', id);
      fetchTipos();
    } catch (e: any) { alert('Erro: ' + e.message); }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
        
      {/* FORMULÁRIO DE CRIAÇÃO/EDIÇÃO */}
      <div className="bg-theme-card rounded-2xl border border-theme shadow-sm overflow-hidden flex flex-col md:flex-row">
        <div className="w-full md:w-1/3 bg-theme-page p-6 border-b md:border-b-0 md:border-r border-theme">
            <h3 className="font-bold text-theme-main text-base flex items-center gap-2">
                <List size={18} className="text-primary-theme"/> Parâmetros de OS
            </h3>
            <p className="text-xs text-theme-muted mt-2 leading-relaxed">
                Crie as naturezas de serviço que sua equipe executa. Defina cores para organização visual e ative a flag <strong>LIMS RBC</strong> se este tipo de serviço exigir a emissão de Certificado de Calibração.
            </p>
        </div>
        
        <div className="w-full md:w-2/3 p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-black uppercase text-theme-muted tracking-wider">Nome do Serviço *</label>
                    <input className="input-theme h-10 px-3 rounded-lg font-bold text-sm" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} placeholder="Ex: Qualificação Térmica"/>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                    <label className="text-[10px] font-black uppercase text-theme-muted tracking-wider">Cor da Etiqueta Visual</label>
                    <select className="input-theme h-10 px-3 rounded-lg font-bold text-sm cursor-pointer" value={form.cor_etiqueta} onChange={e => setForm({...form, cor_etiqueta: e.target.value})}>
                        {coresOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </div>
            </div>
            
            <div className="flex items-center gap-4 bg-theme-page p-4 rounded-xl border border-theme">
                <input type="checkbox" id="rbc" className="w-5 h-5 rounded border-theme text-primary-theme focus:ring-primary-theme cursor-pointer" checked={form.exige_metrologia} onChange={e => setForm({...form, exige_metrologia: e.target.checked})} />
                <div>
                    <label htmlFor="rbc" className="text-sm font-black text-theme-main cursor-pointer block">Exige Laudo Metrológico (RBC)?</label>
                    <p className="text-[10px] text-theme-muted mt-0.5">Se marcado, o sistema abrirá a aba de Padrões e LIMS na tela de Execução da OS.</p>
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                {editingId && <button onClick={handleCancel} className="px-6 py-2 bg-theme-page text-theme-muted border border-theme rounded-lg font-bold flex items-center gap-2 hover:bg-theme-card"><X size={16}/> Cancelar</button>}
                <button onClick={handleSave} disabled={loading} className={`px-8 py-2 text-white font-black rounded-lg flex items-center gap-2 shadow-lg transition-all ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-primary-theme hover:bg-primary-theme/90'}`}>
                    {loading ? <Loader2 size={16} className="animate-spin"/> : editingId ? <><Save size={16}/> Salvar Edição</> : <><Plus size={16}/> Criar Serviço</>}
                </button>
            </div>
        </div>
      </div>

      {/* LISTAGEM DOS SERVIÇOS CADASTRADOS */}
      <div className="bg-theme-card border border-theme rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
              <thead>
                  <tr className="bg-theme-page border-b border-theme text-[10px] font-black uppercase text-theme-muted tracking-widest">
                      <th className="p-4">Natureza do Serviço</th>
                      <th className="p-4 text-center">Regra de Negócio</th>
                      <th className="p-4 text-right">Ações</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                  {tipos.map(t => (
                      <tr key={t.id} className="hover:bg-theme-page/50 transition-colors">
                          <td className="p-4">
                              <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${t.cor_etiqueta}`}>
                                  {t.nome}
                              </span>
                          </td>
                          <td className="p-4 text-center">
                              {t.exige_metrologia 
                                  ? <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded text-[10px] font-black uppercase"><Activity size={12}/> Habilita LIMS RBC</span>
                                  : <span className="inline-flex items-center gap-1.5 text-theme-muted text-[10px] font-bold uppercase"><ShieldCheck size={12}/> OS Padrão</span>
                              }
                          </td>
                          <td className="p-4 flex justify-end gap-2">
                              <button onClick={() => handleEdit(t)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                              <button onClick={() => handleDelete(t.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
                  {tipos.length === 0 && !loading && (
                      <tr><td colSpan={3} className="p-8 text-center text-theme-muted font-bold">Nenhum tipo de serviço cadastrado.</td></tr>
                  )}
              </tbody>
          </table>
      </div>
    </div>
  );
}