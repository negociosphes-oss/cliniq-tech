import { useState, useEffect } from 'react'
import { 
  Clock, Plus, Trash2, User, Calendar, Edit2, 
  Briefcase, Truck, Coffee, AlertCircle, Timer, Loader2, Save, X 
} from 'lucide-react'
import { supabase } from '../../supabaseClient'
import type { Tecnico } from '../../types'

interface ApontamentosTabProps {
  osId: number;
  tecnicos: Tecnico[];
  status?: string; // Adicionado para segurança de OS Concluída
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUpdate: () => void;
}

export function ApontamentosTab({ osId, tecnicos, status, showToast, onUpdate }: ApontamentosTabProps) {
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [apontamentos, setApontamentos] = useState<any[]>([]);
  
  // 🚀 NOVO ESTADO: Lista autônoma e completa da equipe
  const [equipeCompleta, setEquipeCompleta] = useState<any[]>(tecnicos || []);
  
  const [totalHoras, setTotalHoras] = useState({ horas: 0, minutos: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [novoApontamento, setNovoApontamento] = useState({
    tecnico_id: '',
    tipo: 'Mão de Obra', 
    data_inicio: '',
    data_fim: '',
    descricao: ''
  });

  const isReadOnly = status === 'Concluída';

  const getIconByType = (tipo: string) => {
    switch (tipo) {
      case 'Deslocamento': return <Truck size={16} />;
      case 'Refeição': return <Coffee size={16} />;
      default: return <Briefcase size={16} />;
    }
  };

  useEffect(() => {
    if (osId) {
        fetchApontamentos();
        fetchEquipeCompleta(); // Dispara a busca total da equipe
    }
  }, [osId]);

  // 🚀 O MOTOR AUTÔNOMO: Busca todos os usuários sem filtros limitantes
  const fetchEquipeCompleta = async () => {
    try {
        const { data, error } = await supabase.from('usuarios').select('id, nome, cargo').order('nome');
        if (!error && data && data.length > 0) {
            setEquipeCompleta(data);
        }
    } catch (e) {
        console.error("Erro ao buscar equipe autônoma:", e);
    }
  };

  const fetchApontamentos = async () => {
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from('apontamentos')
        .select('*') 
        .eq('os_id', osId)
        .order('data_inicio', { ascending: false });
      
      if (error) throw error;
      
      const listaSegura = data || [];
      setApontamentos(listaSegura);
      calcularTotalHoras(listaSegura);
      
    } catch (error: any) {
      console.error('Erro ao buscar apontamentos:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const calcularTotalHoras = (lista: any[]) => {
    const totalMinutos = lista.reduce((acc, curr) => {
      const inicio = new Date(curr.data_inicio).getTime();
      const fim = new Date(curr.data_fim).getTime();
      if (isNaN(inicio) || isNaN(fim)) return acc;
      const diff = Math.max(0, Math.floor((fim - inicio) / 60000));
      return acc + diff;
    }, 0);

    setTotalHoras({
      horas: Math.floor(totalMinutos / 60),
      minutos: totalMinutos % 60
    });
  };

  const handleEdit = (item: any) => {
      const formatForInput = (dateStr: string) => {
          if (!dateStr) return '';
          const d = new Date(dateStr);
          const pad = (n: number) => n < 10 ? '0' + n : n;
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      // Procura na equipe completa primeiro
      const tec = equipeCompleta.find(t => t.nome === item.tecnico_nome);
      
      setNovoApontamento({
          tecnico_id: tec ? String(tec.id) : '0',
          tipo: item.tipo,
          data_inicio: formatForInput(item.data_inicio),
          data_fim: formatForInput(item.data_fim),
          descricao: item.descricao || ''
      });
      setEditingId(item.id);
      
      const formElement = document.getElementById('form-apontamento');
      if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
      setEditingId(null);
      setNovoApontamento({
          tecnico_id: '',
          tipo: 'Mão de Obra',
          data_inicio: '',
          data_fim: '',
          descricao: ''
      });
  };

  const handleSave = async () => {
    if(!novoApontamento.tecnico_id && equipeCompleta.length > 0) return showToast('Selecione o profissional.', 'error');
    if(!novoApontamento.data_inicio) return showToast('Data Início obrigatória.', 'error');
    if(!novoApontamento.data_fim) return showToast('Data Fim obrigatória.', 'error');
    
    const dataInicio = new Date(novoApontamento.data_inicio);
    const dataFim = new Date(novoApontamento.data_fim);

    if (dataInicio >= dataFim) {
        return showToast('Data fim deve ser maior que início.', 'error');
    }

    setLoading(true);
    
    // Puxa o nome exato do banco de usuários completo
    const tecnicoSelecionado = equipeCompleta.find(t => String(t.id) === String(novoApontamento.tecnico_id));
    const nomeTecnico = tecnicoSelecionado?.nome || 'Profissional Não Identificado';

    try {
      const payload = {
        os_id: osId,
        tecnico_nome: nomeTecnico,
        tipo: novoApontamento.tipo,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        descricao: novoApontamento.descricao || `Registro de ${novoApontamento.tipo}`
      };

      let error;
      
      if (editingId) {
          const { error: err } = await supabase.from('apontamentos').update(payload).eq('id', editingId);
          error = err;
      } else {
          const { error: err } = await supabase.from('apontamentos').insert([payload]);
          error = err;
      }

      if (error) {
          console.error("Erro Supabase:", error);
          throw error;
      }

      showToast(editingId ? 'Apontamento atualizado!' : 'Apontamento salvo!', 'success');
      handleCancelEdit();
      await fetchApontamentos();
      if(onUpdate) onUpdate();

    } catch (error: any) {
      alert(`Erro ao salvar no banco de dados:\n${error.message || error.details || JSON.stringify(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Excluir este apontamento?')) return;
    try {
      const { error } = await supabase.from('apontamentos').delete().eq('id', id);
      if(error) throw error;
      fetchApontamentos();
      if(onUpdate) onUpdate();
    } catch (e: any) { 
        showToast('Erro: ' + e.message, 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* CARD RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-5 shadow-sm">
            <div className="p-4 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 rounded-full"><Timer size={28}/></div>
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Total Horas</p>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{totalHoras.horas}h <span className="text-lg text-slate-400 font-medium">{totalHoras.minutos}m</span></h3>
            </div>
         </div>
         <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-5 shadow-sm">
            <div className="p-4 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full border"><Briefcase size={28}/></div>
            <div>
               <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Registros</p>
               <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-1">{apontamentos.length}</h3>
            </div>
         </div>
      </div>

      {/* FORMULÁRIO (Protegido contra leitura) */}
      {!isReadOnly && (
          <div id="form-apontamento" className={`bg-white dark:bg-slate-800 p-6 rounded-xl border ${editingId ? 'border-orange-400 ring-2 ring-orange-100' : 'border-slate-200'} dark:border-slate-700 shadow-sm relative overflow-hidden transition-all`}>
            <div className={`absolute top-0 left-0 w-1 h-full ${editingId ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
            <h4 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-700 dark:text-white">
                {editingId ? <><Edit2 className="text-orange-500"/> Editando Apontamento</> : <><Plus className="text-blue-500"/> Novo Apontamento</>}
            </h4>
            
            <div className="grid md:grid-cols-12 gap-5 mb-4">
               <div className="md:col-span-4">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Profissional *</label>
                  <select className="input-form pl-2 w-full" value={novoApontamento.tecnico_id} onChange={e => setNovoApontamento({...novoApontamento, tecnico_id: e.target.value})}>
                     <option value="">Selecione o profissional...</option>
                     {equipeCompleta.length > 0 ? (
                         equipeCompleta.map(t => (
                             <option key={t.id} value={t.id}>
                                {t.nome} {t.cargo ? `- ${t.cargo}` : ''}
                             </option>
                         ))
                     ) : (
                         <option value="0">Carregando equipe...</option>
                     )}
                  </select>
               </div>
               <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo *</label>
                  <select className="input-form w-full" value={novoApontamento.tipo} onChange={e => setNovoApontamento({...novoApontamento, tipo: e.target.value})}>
                    <option>Mão de Obra</option>
                    <option>Deslocamento</option>
                    <option>Refeição</option>
                    <option>Outros</option>
                  </select>
               </div>
               <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Início *</label>
                  <input type="datetime-local" className="input-form w-full" value={novoApontamento.data_inicio} onChange={e => setNovoApontamento({...novoApontamento, data_inicio: e.target.value})} />
               </div>
               <div className="md:col-span-3">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fim *</label>
                  <input type="datetime-local" className="input-form w-full" value={novoApontamento.data_fim} onChange={e => setNovoApontamento({...novoApontamento, data_fim: e.target.value})} />
               </div>
            </div>

            <div className="flex gap-4 items-end">
                <div className="flex-1">
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
                    <input className="input-form w-full" placeholder="Detalhes da atividade..." value={novoApontamento.descricao} onChange={e => setNovoApontamento({...novoApontamento, descricao: e.target.value})} />
                </div>
                {editingId && (
                    <button onClick={handleCancelEdit} className="btn-secondary h-[46px] px-4 border border-slate-300 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50">
                        <X size={18}/> Cancelar
                    </button>
                )}
                <button onClick={handleSave} disabled={loading} className={`btn-primary h-[46px] px-8 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {loading ? <Loader2 size={18} className="animate-spin"/> : editingId ? <><Save size={18}/> Salvar</> : <><Plus size={18}/> Adicionar</>}
                </button>
            </div>
          </div>
      )}

      {/* LISTA DE REGISTROS */}
      <div className="space-y-3">
        {loadingList ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2"><Loader2 className="animate-spin" /> Carregando...</div>
        ) : apontamentos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">Nenhum registro.</div>
        ) : (
            apontamentos.map(apt => {
                const inicio = new Date(apt.data_inicio);
                const fim = new Date(apt.data_fim);
                const diffMs = fim.getTime() - inicio.getTime();
                const duracaoH = !isNaN(diffMs) ? Math.floor(diffMs / 3600000) : 0;
                const duracaoM = !isNaN(diffMs) ? Math.floor((diffMs % 3600000) / 60000) : 0;

                return (
                  <div key={apt.id} className={`bg-white dark:bg-slate-800 border p-4 rounded-xl flex flex-col md:flex-row justify-between items-center shadow-sm hover:shadow-md transition gap-4 group ${editingId === apt.id ? 'border-orange-400 ring-1 ring-orange-100' : 'border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-3 mb-2">
                           <span className={`p-1.5 rounded-lg ${apt.tipo === 'Mão de Obra' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{getIconByType(apt.tipo)}</span>
                           <span className="font-bold text-slate-700 dark:text-white text-sm uppercase">{apt.tecnico_nome}</span>
                           <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-500 px-2 py-0.5 rounded border">{apt.tipo}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 ml-1">
                           <span>{inicio.toLocaleString()}</span> <span>➜</span> <span>{fim.toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 pl-2 border-l-2 border-slate-200">{apt.descricao}</p>
                      </div>
                      <div className="flex items-center gap-6 min-w-max">
                        <div className="text-right">
                            <span className="block text-[10px] uppercase font-bold text-slate-400">Duração</span>
                            <span className="text-xl font-black text-slate-800 dark:text-white">{duracaoH}h {duracaoM}m</span>
                        </div>
                        {!isReadOnly && (
                            <>
                                <button onClick={() => handleEdit(apt)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar">
                                    <Edit2 size={18}/>
                                </button>
                                <button onClick={() => handleDelete(apt.id)} className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir">
                                    <Trash2 size={18}/>
                                </button>
                            </>
                        )}
                      </div>
                  </div>
                )
            })
        )}
      </div>
    </div>
  )
}