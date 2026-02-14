import { useState, useEffect } from 'react';
import { Search, Plus, Edit3, Trash2, Loader2, AlertTriangle, ListChecks } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ChecklistBuilder } from './ChecklistBuilder';

export function ChecklistManager() {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  useEffect(() => { fetchModelos(); }, []);

  const fetchModelos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('checklists_biblioteca').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const processados = (data || []).map(m => {
          let count = 0;
          try {
             // 🚀 Lê a coluna correta do seu banco de dados (itens_configuracao)
             const items = m.itens_configuracao || m.perguntas; 
             if (Array.isArray(items)) count = items.length;
             else if (typeof items === 'string') count = JSON.parse(items).length;
          } catch (e) { count = 0; }
          return { ...m, perguntas_count: count };
      });
      
      setModelos(processados);
    } catch (err) { console.error('Erro Fatal:', err); } finally { setLoading(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este modelo?')) return;
    const { error } = await supabase.from('checklists_biblioteca').delete().eq('id', id);
    if (error) {
        alert(`Não foi possível excluir.\nMotivo: Vinculado a Ordens de Serviço existentes.`);
    } else {
        fetchModelos();
    }
  };

  const handleEdit = (modelo: any) => {
    setSelectedModel(modelo);
    setIsBuilderOpen(true);
  };

  const handleNew = () => {
    setSelectedModel(null);
    setIsBuilderOpen(true);
  };

  if (isBuilderOpen) {
      return (
          <ChecklistBuilder 
              isOpen={isBuilderOpen} 
              onClose={() => setIsBuilderOpen(false)} 
              modeloInicial={selectedModel}
              onSuccess={() => { setIsBuilderOpen(false); fetchModelos(); }}
          />
      );
  }

  const lista = modelos.filter(m => {
      const termo = busca.toLowerCase();
      const titulo = (m.titulo || '').toLowerCase();
      const desc = (m.descricao || '').toLowerCase();
      const tipo = (m.tipo_os || '').toLowerCase();
      return titulo.includes(termo) || desc.includes(termo) || tipo.includes(termo);
  });

  return (
    <div className="animate-fadeIn">
      
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-theme-page p-4 rounded-2xl border border-theme shadow-inner">
         <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-primary-theme transition-colors" size={20}/>
            <input 
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl input-theme font-bold shadow-sm outline-none"
              placeholder="Pesquisar checklist ou vínculo..."
            />
         </div>

         <button 
            onClick={handleNew} 
            className="h-12 px-8 bg-primary-theme text-white rounded-xl font-black shadow-lg shadow-primary-theme/20 hover:scale-105 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
         >
            <Plus size={20} strokeWidth={3}/> NOVO MODELO
         </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-theme-muted">
            <Loader2 className="animate-spin mb-4" size={40}/>
            <p className="font-bold">Carregando biblioteca...</p>
        </div>
      ) : (
        <div className="bg-theme-card border border-theme rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-theme-page border-b border-theme text-[10px] font-black uppercase text-theme-muted tracking-widest">
                        <th className="p-4 pl-6">Nome do Checklist & Vínculo</th>
                        <th className="p-4 text-center">Itens / Perguntas</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 pr-6 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                    {lista.map(modelo => {
                        const tituloValid = modelo.titulo || 'Sem Título';

                        return (
                            <tr key={modelo.id} className="hover:bg-theme-page/50 transition-colors group">
                                <td className="p-4 pl-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-theme-page border border-theme text-theme-muted rounded-lg group-hover:bg-primary-theme group-hover:text-white group-hover:border-primary-theme transition-all">
                                            <ListChecks size={18}/>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-black text-sm ${modelo.titulo ? 'text-theme-main' : 'text-amber-500 flex items-center gap-1'}`}>
                                                    {!modelo.titulo && <AlertTriangle size={14}/>} {tituloValid}
                                                </h3>
                                                {modelo.tipo_os && (
                                                    <span className="px-2 py-0.5 bg-primary-theme/10 text-primary-theme border border-primary-theme/20 text-[9px] font-black uppercase rounded shadow-sm">
                                                        Vínculo: {modelo.tipo_os}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-theme-muted font-medium line-clamp-1 max-w-md mt-1">{modelo.descricao || 'Nenhuma descrição fornecida.'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-theme-muted bg-theme-page border border-theme px-3 py-1 rounded-lg">
                                        {modelo.perguntas_count} Campos
                                    </span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1.5">
                                        <span className={`w-2 h-2 rounded-full ${modelo.titulo ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                                        <span className="text-[10px] font-black uppercase tracking-wider text-theme-muted">{modelo.titulo ? 'Ativo' : 'Rascunho'}</span>
                                    </div>
                                </td>
                                <td className="p-4 pr-6 flex justify-end gap-2">
                                    <button onClick={() => handleEdit(modelo)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200" title="Editar"><Edit3 size={16}/></button>
                                    <button onClick={() => handleDelete(modelo.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors border border-transparent hover:border-rose-200" title="Excluir"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        );
                    })}
                    {lista.length === 0 && (
                        <tr><td colSpan={4} className="p-12 text-center text-theme-muted font-bold border-t border-dashed border-theme">Nenhum modelo de checklist encontrado.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
}