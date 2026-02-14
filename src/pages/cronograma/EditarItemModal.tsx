import { useState } from 'react'
import { X, Wrench } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import type { Cronograma } from '../../types'

interface EditarItemModalProps {
  item: Cronograma;
  onClose: () => void;
  onUpdate: () => void;
}

export function EditarItemModal({ item, onClose, onUpdate }: EditarItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    data_programada: item.data_programada,
    tipo_servico: item.tipo_servico,
    status: item.status,
    observacao: item.observacao || ''
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('cronogramas')
        .update({
          data_programada: form.data_programada,
          tipo_servico: form.tipo_servico,
          status: form.status,
          observacao: form.observacao
        })
        .eq('id', item.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error: any) {
      alert('Erro ao atualizar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl animate-fadeIn">
        <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 dark:text-white"><Wrench size={18} className="text-blue-500"/> Editar Agendamento #{item.id}</h3>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border dark:border-slate-700 mb-4"><p className="text-xs font-bold text-slate-500 uppercase">Equipamento</p><p className="font-bold text-slate-700 dark:text-slate-200">{item.equipamentos?.tag} - {item.equipamentos?.tecnologias?.nome}</p></div>
          <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Nova Data</label><input type="date" className="input-form" value={form.data_programada} onChange={e => setForm({...form, data_programada: e.target.value})} /></div>
          <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Tipo de Serviço</label><select className="input-form" value={form.tipo_servico} onChange={e => setForm({...form, tipo_servico: e.target.value as any})}><option>Preventiva</option><option>Calibração</option><option>Qualificação</option><option>Corretiva</option></select></div>
          <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Status</label><select className="input-form" value={form.status} onChange={e => setForm({...form, status: e.target.value as any})}><option>Pendente</option><option>Realizada</option><option>Atrasada</option><option>Cancelada</option></select></div>
          <div className="space-y-1"><label className="text-xs font-bold uppercase text-slate-500">Observações</label><textarea className="input-form h-20" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}/></div>
        </div>
        <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-xl flex justify-end gap-2">
           <button onClick={onClose} className="btn-secondary">Cancelar</button>
           <button onClick={handleSave} disabled={loading} className="btn-primary">{loading ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  )
}