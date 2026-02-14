import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronRight, FlaskConical, ClipboardCheck, Loader2 } from 'lucide-react'
import { supabase } from '../../../supabaseClient'
import { ProcedimentosForm } from './ProcedimentosForm'

export function ProcedimentosList() {
  const [procs, setProcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => { fetchProcs(); }, []);

  const fetchProcs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('metrologia_procedimentos')
        .select('*, tecnologias(nome)')
        .eq('status', 'ATIVO') // FILTRO CRÍTICO: Mostra apenas ativos
        .order('titulo');
      
      if (error) throw error;
      setProcs(data || []);
    } catch (err) {
      console.error('Erro Auditoria List:', err);
    } finally {
      setLoading(false);
    }
  };

  // AUDITORIA: Função de exclusão lógica (Soft Delete)
  // Resolve o erro 409 Conflict
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Impede abrir o modal ao clicar no lixo
    
    if (!confirm('Deseja ARQUIVAR este protocolo? O histórico de calibrações antigas será mantido.')) return;

    try {
      // Atualiza para INATIVO em vez de deletar fisicamente
      const { error } = await supabase
        .from('metrologia_procedimentos')
        .update({ status: 'INATIVO' })
        .eq('id', id);

      if (error) throw error;
      
      // Atualiza a lista removendo o item arquivado
      fetchProcs();
    } catch (err: any) {
      alert('Erro ao arquivar: ' + err.message);
    }
  };

  return (
    <div className="animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <FlaskConical className="text-indigo-600"/> Protocolos (POP)
          </h2>
          <p className="text-slate-500 text-sm mt-1">Gestão de matrizes de tolerância hospitalar.</p>
        </div>
        <button onClick={() => { setSelectedItem(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all active:scale-95">
          <Plus size={20}/> Novo Protocolo
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 flex flex-col items-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-indigo-500" size={32}/>
            <p>Carregando protocolos...</p>
        </div>
      ) : procs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-3xl text-slate-400">
            <ClipboardCheck className="mx-auto mb-2 opacity-30" size={48}/>
            <p>Nenhum protocolo ativo encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {procs.map((proc) => (
            <div key={proc.id} onClick={() => { setSelectedItem(proc); setIsModalOpen(true); }} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border shadow-sm hover:shadow-xl hover:border-indigo-200 cursor-pointer group transition-all relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform"><ClipboardCheck size={24}/></div>
                    
                    {/* Botão Deletar Corrigido */}
                    <button 
                        onClick={(e) => handleDelete(e, proc.id)} 
                        className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                        title="Arquivar Protocolo"
                    >
                        <Trash2 size={18}/>
                    </button>
                </div>
                
                <h3 className="font-black text-lg truncate dark:text-white text-slate-800">{proc.titulo}</h3>
                <p className="text-[10px] font-black uppercase text-slate-400 mt-1 tracking-wide">{proc.tecnologias?.nome || 'Geral'}</p>
                
                <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-between items-center text-indigo-600 font-black text-xs">
                    <span>Ver Configuração</span> 
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-all"/>
                </div>
            </div>
            ))}
        </div>
      )}

      <ProcedimentosForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { setIsModalOpen(false); fetchProcs(); }} 
        itemToEdit={selectedItem} 
      />
    </div>
  );
}