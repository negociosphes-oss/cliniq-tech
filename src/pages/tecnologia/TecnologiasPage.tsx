import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Server, Edit3, Trash2, CheckCircle, XCircle, FileSpreadsheet, Download, Cpu, Factory, FileText, Save, X, Loader2 } from 'lucide-react';import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';

export function TecnologiasPage() {
  const [loading, setLoading] = useState(true);
  const [tecnologias, setTecnologias] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  
  const [tenantId, setTenantId] = useState<number>(1); // 🚀 ESTADO DO FAREJADOR
  
  // Modal e Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    nome: '', 
    fabricante: '',
    modelo: '',
    registro_anvisa: '',
    criticidade: 'Média', 
    ativo: true
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🚀 1. MOTOR FAREJADOR
  useEffect(() => {
    const initTenant = async () => {
      try {
        const hostname = window.location.hostname;
        let slug = hostname.split('.')[0];
        
        if (slug === 'localhost' || slug === 'app' || slug === 'www') {
            slug = 'atlasum';
        }

        const { data: tenant } = await supabase
            .from('empresas_inquilinas')
            .select('id')
            .eq('slug_subdominio', slug)
            .maybeSingle();

        const tId = tenant ? tenant.id : 1;
        setTenantId(tId);
        fetchTecnologias(tId);
      } catch (err) {
        console.error("Erro ao identificar inquilino:", err);
      }
    };
    initTenant();
  }, []);

  // 🚀 2. FECHADURA DE LEITURA
  const fetchTecnologias = async (tId: number) => {
    setLoading(true);
    const { data, error } = await supabase
        .from('tecnologias')
        .select('*')
        .eq('tenant_id', tId) // Trava de Segurança
        .order('nome');
    if (!error) setTecnologias(data || []);
    setLoading(false);
  };

  // 🚀 3. CARIMBO DE AUTORIA NO SALVAMENTO MANUAL
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.nome || !formData.fabricante || !formData.modelo) return alert('Preencha os campos obrigatórios (*).');

    try {
      // Injeta o tenant_id silenciosamente
      const payload = { ...formData, nome: formData.nome.toUpperCase(), tenant_id: tenantId };

      if (editingItem) {
        await supabase.from('tecnologias').update(payload).eq('id', editingItem.id).eq('tenant_id', tenantId);
      } else {
        await supabase.from('tecnologias').insert([payload]);
      }
      setIsModalOpen(false);
      fetchTecnologias(tenantId);
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    }
  };

  // 🚀 4. TRAVA DE EXCLUSÃO (HACKER-PROOF)
  const handleDelete = async (id: number) => {
    if (!confirm('ATENÇÃO: Excluir este modelo pode afetar equipamentos vinculados. Continuar?')) return;
    const { error } = await supabase
        .from('tecnologias')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId); // Trava
        
    if (error) alert('Erro ao excluir. Verifique vínculos.');
    else fetchTecnologias(tenantId);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { TIPO: 'VENTILADOR PULMONAR', FABRICANTE: 'DRAGER', MODELO: 'EVITA V300', ANVISA: '80012345678', CRITICIDADE: 'Alta' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelos");
    XLSX.writeFile(wb, "Template_Importacao.xlsx");
  };

  // 🚀 5. CARIMBO DE AUTORIA NO UPLOAD EM LOTE
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) return alert('Arquivo vazio.');

        const payload = data.map((row: any) => ({
          nome: row['TIPO'] || row['NOME'] || 'DESCONHECIDO',
          fabricante: row['FABRICANTE'] || '',
          modelo: row['MODELO'] || '',
          registro_anvisa: row['ANVISA'] || '',
          criticidade: row['CRITICIDADE'] || 'Média',
          ativo: true,
          tenant_id: tenantId // 🚀 Injeta o dono em todas as linhas
        }));

        const { error } = await supabase.from('tecnologias').insert(payload);
        if (error) throw error;
        
        alert(`${payload.length} modelos importados com sucesso!`);
        fetchTecnologias(tenantId);
      } catch (error) {
        alert('Erro na importação.');
      } finally {
        if(fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const openNew = () => {
    setEditingItem(null);
    setFormData({ nome: '', fabricante: '', modelo: '', registro_anvisa: '', criticidade: 'Média', ativo: true });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ 
       nome: item.nome, 
       fabricante: item.fabricante, 
       modelo: item.modelo, 
       registro_anvisa: item.registro_anvisa, 
       criticidade: item.criticidade, 
       ativo: item.ativo 
    });
    setIsModalOpen(true);
  };

  const filteredList = tecnologias.filter(t => 
    t.nome.toLowerCase().includes(busca.toLowerCase()) ||
    t.modelo?.toLowerCase().includes(busca.toLowerCase()) ||
    t.fabricante?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-8 animate-fadeIn max-w-7xl mx-auto pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
         <div>
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
               <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100"><Cpu size={24} strokeWidth={1.5}/></span>
               Catálogo de Tecnologias
            </h2>
            <p className="text-slate-500 font-medium mt-2 ml-1">Padronização de modelos para inventário.</p>
         </div>
         
         <div className="flex gap-2">
            <button onClick={handleDownloadTemplate} className="h-12 px-4 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl font-bold flex items-center gap-2 shadow-sm">
                <Download size={18}/>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="h-12 px-4 bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 rounded-xl font-bold flex items-center gap-2 shadow-sm transition-all">
               <FileSpreadsheet size={18}/> Importar Excel
            </button>
            <button onClick={openNew} className="h-12 px-6 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95">
               <Plus size={20}/> Novo Modelo
            </button>
         </div>
      </div>

      {/* Busca */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6 flex gap-2">
         <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
               className="w-full h-12 pl-12 pr-4 bg-white rounded-xl outline-none text-slate-700 font-medium placeholder:text-slate-400 focus:bg-slate-50 transition-colors"
               placeholder="Buscar por Nome, Fabricante ou Modelo..."
               value={busca}
               onChange={e => setBusca(e.target.value)}
            />
         </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {loading ? (
           <div className="col-span-full py-12 flex justify-center text-indigo-500"><Loader2 className="animate-spin" size={32}/></div>
         ) : filteredList.length === 0 ? (
           <div className="col-span-full py-12 text-center text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl">Nenhum modelo cadastrado.</div>
         ) : filteredList.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group relative">
               
               <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                     <Factory size={20}/>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${item.ativo ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                     {item.ativo ? 'Ativo' : 'Inativo'}
                  </div>
               </div>

               <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{item.nome}</h3>
               <p className="text-sm text-slate-500 font-medium">{item.fabricante} • {item.modelo}</p>

               <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">{item.registro_anvisa ? `ANVISA: ${item.registro_anvisa}` : 'Sem Registro'}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => openEdit(item)} className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-colors"><Edit3 size={18}/></button>
                     <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"><Trash2 size={18}/></button>
                  </div>
               </div>
            </div>
         ))}
      </div>

      {/* Modal Clean */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden">
               
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Server size={20}/></div>
                     <h3 className="text-xl font-black text-slate-800">{editingItem ? 'Editar Modelo' : 'Novo Modelo'}</h3>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"><X size={24}/></button>
               </div>
               
               <div className="p-8 grid md:grid-cols-2 gap-6 bg-slate-50/50">
                  <div className="col-span-2">
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block ml-1">Tipo de Equipamento *</label>
                     <input className="input-theme w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} placeholder="Ex: VENTILADOR PULMONAR" />
                  </div>
                  <div>
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block ml-1">Fabricante *</label>
                     <input className="input-theme w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" value={formData.fabricante} onChange={e => setFormData({...formData, fabricante: e.target.value})} placeholder="Ex: DRAGER" />
                  </div>
                  <div>
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block ml-1">Modelo *</label>
                     <input className="input-theme w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all" value={formData.modelo} onChange={e => setFormData({...formData, modelo: e.target.value})} placeholder="Ex: EVITA V300" />
                  </div>
                  <div>
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block ml-1">Registro ANVISA</label>
                     <input className="input-theme w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all font-mono" value={formData.registro_anvisa} onChange={e => setFormData({...formData, registro_anvisa: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-[11px] font-bold text-slate-500 uppercase mb-1.5 block ml-1">Criticidade</label>
                     <select className="input-theme w-full h-12 px-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer" value={formData.criticidade} onChange={e => setFormData({...formData, criticidade: e.target.value})}>
                        <option>Baixa</option><option>Média</option><option>Alta</option><option>Crítica</option>
                     </select>
                  </div>
                  <div className="col-span-2 pt-2">
                     <label className="flex items-center gap-3 cursor-pointer p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 transition-all">
                        <input type="checkbox" className="w-5 h-5 accent-indigo-600 rounded" checked={formData.ativo} onChange={e => setFormData({...formData, ativo: e.target.checked})} />
                        <div>
                           <span className="text-sm font-bold text-slate-700 block">Cadastro Ativo</span>
                           <span className="text-xs text-slate-400">Disponível para seleção no inventário</span>
                        </div>
                     </label>
                  </div>
               </div>

               <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                  <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
                  <button onClick={() => handleSave()} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2">
                     <CheckCircle size={18}/> Salvar Modelo
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  )
}