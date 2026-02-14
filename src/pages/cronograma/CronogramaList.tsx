import { useState } from 'react'
import { 
  FileText, Trash2, AlertCircle, CheckCircle, Clock, Edit3, ExternalLink, AlertTriangle, ShieldAlert
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import type { Cronograma } from '../../types'
import { EditarItemModal } from './EditarItemModal'

interface CronogramaListProps {
  data: Cronograma[];
  onRefresh: () => void;
}

export function CronogramaList({ data, onRefresh }: CronogramaListProps) {
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Cronograma | null>(null);

  // --- AÇÕES ---
  const handleGerarOS = async (item: Cronograma) => {
    if (!confirm(`Confirmar abertura de O.S. para ${item.equipamentos?.tag}?`)) return;
    setLoadingId(item.id);
    try {
      const { data: novaOS, error: erroOS } = await supabase
        .from('ordens_servico')
        .insert([{
          equipamento_id: item.equipamento_id,
          tipo: item.tipo_servico,
          status: 'Aberta',
          prioridade: 'Média', 
          descricao: `Gerado via Cronograma. ${item.observacao || ''}`,
          solicitante_nome: 'Sistema (Cronograma)',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (erroOS) throw erroOS;

      await supabase
        .from('cronogramas')
        .update({ status: 'Realizada', os_gerada_id: novaOS.id })
        .eq('id', item.id);

      // Feedback visual rápido (pode ser substituído por Toast no futuro)
      alert('Sucesso! O.S. gerada.');
      onRefresh();
    } catch (error: any) {
      alert('Erro: ' + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este item do planejamento?')) return;
    const { error } = await supabase.from('cronogramas').delete().eq('id', id);
    if (!error) onRefresh();
    else alert('Erro ao excluir: ' + error.message);
  };

  // --- HELPERS VISUAIS ---
  const getStatusInfo = (item: Cronograma) => {
    if (item.status === 'Realizada') return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle size={14}/>, label: 'Realizada' };
    if (item.status === 'Cancelada') return { color: 'bg-slate-100 text-slate-500 border-slate-200', icon: <FileText size={14}/>, label: 'Cancelada' };
    
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    const dataProg = new Date(item.data_programada); dataProg.setHours(0,0,0,0);
    
    if (dataProg < hoje) return { color: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle size={14}/>, label: 'Atrasada' };
    if (dataProg.getTime() === hoje.getTime()) return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock size={14}/>, label: 'Hoje' };
    
    return { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: <Clock size={14}/>, label: 'Pendente' }; 
  };

  const getCriticidade = (criticidade?: string) => {
     const c = criticidade?.toLowerCase() || 'baixa';
     if (c.includes('alta')) return <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1 w-fit"><ShieldAlert size={10}/> CRÍTICO</span>;
     if (c.includes('média') || c.includes('media')) return <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit">MÉDIA</span>;
     return null; // Baixa não mostra nada para poluir menos
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-4">
           <FileText size={32} className="opacity-50"/>
        </div>
        <p>Nenhum item encontrado com os filtros atuais.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="p-4 text-xs font-bold uppercase text-slate-500 w-32">Status</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-500">Data Programada</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-500">Ativo / Equipamento</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-500">Serviço / Local</th>
              <th className="p-4 text-xs font-bold uppercase text-slate-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
            {data.map(item => {
                const status = getStatusInfo(item);
                
                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition group">
                    
                    {/* STATUS */}
                    <td className="p-4 align-top">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </td>

                    {/* DATA */}
                    <td className="p-4 align-top">
                      <div className="font-bold text-slate-700 dark:text-slate-200">
                         {new Date(item.data_programada + 'T00:00:00').toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                         {new Date(item.data_programada).toLocaleDateString('pt-BR', { weekday: 'long' })}
                      </div>
                    </td>

                    {/* EQUIPAMENTO */}
                    <td className="p-4 align-top">
                      <div className="flex flex-col gap-1">
                         <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {item.equipamentos?.tecnologias?.nome || 'Equipamento Desconhecido'}
                         </div>
                         {getCriticidade(item.equipamentos?.tecnologias?.criticidade)}
                         <div className="text-xs text-slate-500 font-mono mt-0.5">
                            TAG: <span className="text-slate-700 dark:text-slate-300 font-bold">{item.equipamentos?.tag}</span>
                            {item.equipamentos?.serie && <span className="opacity-70 ml-2">NS: {item.equipamentos?.serie}</span>}
                         </div>
                      </div>
                    </td>

                    {/* SERVIÇO / LOCAL */}
                    <td className="p-4 align-top">
                      <div className="font-medium text-slate-700 dark:text-slate-200">{item.tipo_servico}</div>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                         <span className="truncate max-w-[150px]">{item.equipamentos?.clientes?.nome_fantasia}</span>
                         {item.equipamentos?.setor && (
                            <>
                               <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                               <span className="font-medium">{item.equipamentos?.setor}</span>
                            </>
                         )}
                      </div>
                    </td>

                    {/* AÇÕES */}
                    <td className="p-4 align-top text-right">
                      <div className="flex justify-end items-center gap-2">
                        
                        {/* Botão de OS Inteligente */}
                        {item.os_gerada_id ? (
                           <button 
                              onClick={() => alert(`Acesse o menu "Atendimentos" para ver a O.S. #${item.os_gerada_id}`)}
                              className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
                              title="Ordem de Serviço Gerada"
                           >
                              <FileText size={14}/> Ver O.S. #{item.os_gerada_id}
                           </button>
                        ) : (
                           item.status !== 'Cancelada' && (
                              <button 
                                 onClick={() => handleGerarOS(item)}
                                 disabled={loadingId === item.id}
                                 className="btn-primary py-1.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                                 title="Gerar Ordem de Serviço"
                              >
                                 {loadingId === item.id ? <span className="animate-spin">⏳</span> : <FileText size={14}/>} Gerar OS
                              </button>
                           )
                        )}

                        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <button onClick={() => setEditingItem(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar Data/Status">
                          <Edit3 size={16}/>
                        </button>

                        <button onClick={() => handleExcluir(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir do Cronograma">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal de Edição */}
      {editingItem && (
        <EditarItemModal 
          item={editingItem} 
          onClose={() => setEditingItem(null)} 
          onUpdate={() => {
            onRefresh();
            setEditingItem(null);
          }} 
        />
      )}
    </>
  )
}