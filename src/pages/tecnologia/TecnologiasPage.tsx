import { useState, useEffect } from 'react';
import { Plus, Layers, Factory, Server, Trash2, Save, X, Loader2, UploadCloud, Zap } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export function TecnologiasPage() {
  const [activeTab, setActiveTab] = useState<'tecnologias' | 'fabricantes' | 'modelos'>('tecnologias');
  
  const [tecnologias, setTecnologias] = useState<any[]>([]);
  const [fabricantes, setFabricantes] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [saving, setSaving] = useState(false);

  // Formulários
  const [modeloForm, setModeloForm] = useState({ tecnologia_id: '', fabricante_id: '', nome: '', classe_protecao_eletrica: 'Classe I', tipo_peca_aplicada: 'Tipo BF' });
  const [simpleName, setSimpleName] = useState('');

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tecnologias') {
        const { data } = await supabase.from('dict_tecnologias').select('*').order('nome');
        setTecnologias(data || []);
      } else if (activeTab === 'fabricantes') {
        const { data } = await supabase.from('dict_fabricantes').select('*').order('nome');
        setFabricantes(data || []);
      } else {
        const { data } = await supabase.from('dict_modelos').select('*, tecnologia:dict_tecnologias(nome), fabricante:dict_fabricantes(nome)').order('nome');
        setModelos(data || []);
        
        // Carrega tec e fab para os selects do Modal de Modelo
        const [tec, fab] = await Promise.all([
            supabase.from('dict_tecnologias').select('*').order('nome'),
            supabase.from('dict_fabricantes').select('*').order('nome')
        ]);
        setTecnologias(tec.data || []);
        setFabricantes(fab.data || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSaveSingle = async () => {
    setSaving(true);
    try {
      if (activeTab === 'tecnologias') {
        if(!simpleName) return alert('Digite o nome do Tipo de Equipamento.');
        await supabase.from('dict_tecnologias').insert([{ nome: simpleName }]);
      } else if (activeTab === 'fabricantes') {
        if(!simpleName) return alert('Digite o nome do Fabricante.');
        await supabase.from('dict_fabricantes').insert([{ nome: simpleName }]);
      } else {
        if(!modeloForm.nome || !modeloForm.tecnologia_id || !modeloForm.fabricante_id) return alert('Preencha os campos obrigatórios do Modelo.');
        await supabase.from('dict_modelos').insert([modeloForm]);
      }
      setIsSingleModalOpen(false);
      setSimpleName('');
      setModeloForm({ tecnologia_id: '', fabricante_id: '', nome: '', classe_protecao_eletrica: 'Classe I', tipo_peca_aplicada: 'Tipo BF' });
      fetchData();
    } catch (err) { alert('Erro ao salvar. Verifique se os dados estão corretos.'); } finally { setSaving(false); }
  };

  const handleSaveBulk = async () => {
    if(!bulkText) return alert('Cole a lista de itens.');
    setSaving(true);
    const items = bulkText.split('\n').map(i => i.trim()).filter(i => i.length > 0);
    
    try {
      const payload = items.map(nome => ({ nome }));
      if (activeTab === 'tecnologias') {
        await supabase.from('dict_tecnologias').insert(payload);
      } else if (activeTab === 'fabricantes') {
        await supabase.from('dict_fabricantes').insert(payload);
      }
      setIsBulkModalOpen(false);
      setBulkText('');
      fetchData();
      alert(`${items.length} itens importados com sucesso!`);
    } catch (err) { alert('Erro na importação.'); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Deseja excluir este item?')) return;
    try {
        const table = activeTab === 'tecnologias' ? 'dict_tecnologias' : activeTab === 'fabricantes' ? 'dict_fabricantes' : 'dict_modelos';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
        fetchData();
    } catch(e: any) {
        alert('Não é possível excluir. Este item já está sendo usado no sistema e foi bloqueado por segurança.');
    }
  };

  return (
    <div className="p-8 animate-fadeIn max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><Layers size={24}/></span> 
            Dicionário Estrutural
          </h2>
          <p className="text-slate-500 font-medium mt-2">Construa a base hierárquica de tecnologias da Engenharia Clínica.</p>
        </div>
        <div className="flex gap-3">
           {(activeTab === 'tecnologias' || activeTab === 'fabricantes') && (
              <button onClick={() => setIsBulkModalOpen(true)} className="h-12 px-6 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <UploadCloud size={20}/> Subir em Massa
              </button>
           )}
           <button onClick={() => setIsSingleModalOpen(true)} className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
             <Plus size={20}/> Novo Registro
           </button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button onClick={() => setActiveTab('tecnologias')} className={`py-4 px-6 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'tecnologias' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>1. Tipos (Tecnologias)</button>
        <button onClick={() => setActiveTab('fabricantes')} className={`py-4 px-6 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'fabricantes' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>2. Fabricantes</button>
        <button onClick={() => setActiveTab('modelos')} className={`py-4 px-6 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'modelos' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>3. Modelos & IEC</button>
      </div>

      {/* TABELA DE DADOS */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" size={32}/></div> : (
           <div className="overflow-x-auto">
             <table className="w-full text-left whitespace-nowrap">
               <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                 <tr>
                   <th className="p-5 pl-8">{activeTab === 'modelos' ? 'Tecnologia > Fabricante' : 'Nomenclatura Padrão'}</th>
                   {activeTab === 'modelos' && <th className="p-5">Modelo Exato</th>}
                   {activeTab === 'modelos' && <th className="p-5">Segurança Elétrica</th>}
                   <th className="p-5 text-right pr-8">Ações</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {activeTab === 'tecnologias' && tecnologias.map(t => (
                     <tr key={t.id} className="hover:bg-slate-50"><td className="p-5 pl-8">{t.nome}</td><td className="p-5 text-right pr-8"><button onClick={() => handleDelete(t.id)} className="text-rose-500"><Trash2 size={18}/></button></td></tr>
                  ))}
                  {activeTab === 'fabricantes' && fabricantes.map(f => (
                     <tr key={f.id} className="hover:bg-slate-50"><td className="p-5 pl-8">{f.nome}</td><td className="p-5 text-right pr-8"><button onClick={() => handleDelete(f.id)} className="text-rose-500"><Trash2 size={18}/></button></td></tr>
                  ))}
                  {activeTab === 'modelos' && modelos.map(m => (
                     <tr key={m.id} className="hover:bg-slate-50">
                         <td className="p-5 pl-8">
                             <div className="font-bold text-slate-700">{m.tecnologia?.nome}</div>
                             <div className="text-xs text-slate-500">{m.fabricante?.nome}</div>
                         </td>
                         <td className="p-5 font-black text-indigo-700">{m.nome}</td>
                         <td className="p-5">
                             <div className="flex gap-2">
                                <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-black uppercase">{m.classe_protecao_eletrica}</span>
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-black uppercase flex items-center gap-1"><Zap size={10}/> {m.tipo_peca_aplicada}</span>
                             </div>
                         </td>
                         <td className="p-5 text-right pr-8"><button onClick={() => handleDelete(m.id)} className="text-rose-500"><Trash2 size={18}/></button></td>
                     </tr>
                  ))}
               </tbody>
             </table>
           </div>
        )}
      </div>

      {/* MODAL DE CADASTRO INDIVIDUAL */}
      {isSingleModalOpen && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl">
                 <h3 className="font-black text-xl mb-4">Novo Cadastro</h3>
                 
                 {activeTab !== 'modelos' ? (
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">{activeTab === 'tecnologias' ? 'Nome do Tipo (Ex: Monitor)' : 'Nome do Fabricante (Ex: Philips)'}</label>
                         <input className="w-full h-12 px-4 border rounded-xl mt-2 outline-none focus:border-indigo-500" value={simpleName} onChange={e => setSimpleName(e.target.value)}/>
                     </div>
                 ) : (
                     <div className="space-y-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">1. Selecione a Tecnologia *</label>
                            <select className="w-full h-12 px-4 border rounded-xl mt-1 outline-none focus:border-indigo-500" value={modeloForm.tecnologia_id} onChange={e => setModeloForm({...modeloForm, tecnologia_id: e.target.value})}>
                                <option value="">Selecione...</option>{tecnologias.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">2. Selecione o Fabricante *</label>
                            <select className="w-full h-12 px-4 border rounded-xl mt-1 outline-none focus:border-indigo-500" value={modeloForm.fabricante_id} onChange={e => setModeloForm({...modeloForm, fabricante_id: e.target.value})}>
                                <option value="">Selecione...</option>{fabricantes.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                            </select>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">3. Nome do Modelo Exato *</label>
                            <input className="w-full h-12 px-4 border rounded-xl mt-1 outline-none focus:border-indigo-500" placeholder="Ex: MX40" value={modeloForm.nome} onChange={e => setModeloForm({...modeloForm, nome: e.target.value})}/>
                         </div>
                         <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Proteção Elétrica</label>
                                <select className="w-full h-10 px-3 border rounded-lg mt-1 outline-none focus:border-indigo-500" value={modeloForm.classe_protecao_eletrica} onChange={e => setModeloForm({...modeloForm, classe_protecao_eletrica: e.target.value})}><option>Classe I</option><option>Classe II</option><option>Energizado Internamente</option></select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Peça Aplicada</label>
                                <select className="w-full h-10 px-3 border rounded-lg mt-1 outline-none focus:border-indigo-500" value={modeloForm.tipo_peca_aplicada} onChange={e => setModeloForm({...modeloForm, tipo_peca_aplicada: e.target.value})}><option>Não se aplica</option><option>Tipo B</option><option>Tipo BF</option><option>Tipo CF</option></select>
                            </div>
                         </div>
                     </div>
                 )}

                 <div className="flex justify-end gap-3 mt-8">
                    <button onClick={() => setIsSingleModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                    <button onClick={handleSaveSingle} disabled={saving} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl flex gap-2 items-center hover:bg-indigo-700 transition-colors shadow-lg">{saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar</button>
                 </div>
             </div>
         </div>
      )}

      {/* MODAL DE UPLOAD EM MASSA */}
      {isBulkModalOpen && (
         <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
             <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl">
                 <h3 className="font-black text-xl mb-2 flex items-center gap-2"><UploadCloud className="text-indigo-600"/> Importação Rápida</h3>
                 <p className="text-sm text-slate-500 mb-4">Copie uma coluna do Excel e cole aqui. Cada linha será salva como um novo registro em <strong>{activeTab === 'tecnologias' ? 'Tipos de Equipamento' : 'Fabricantes'}</strong>.</p>
                 
                 <textarea 
                    className="w-full h-64 p-4 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-500 text-sm font-mono whitespace-pre custom-scrollbar bg-slate-50"
                    placeholder={`Bomba de Infusão\nMonitor Multiparâmetro\nVentilador Pulmonar...`}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                 />

                 <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setIsBulkModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                    <button onClick={handleSaveBulk} disabled={saving} className="px-8 py-3 bg-emerald-600 text-white font-black rounded-xl flex gap-2 items-center shadow-lg hover:bg-emerald-700 transition-colors">{saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Importar Tudo</button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}