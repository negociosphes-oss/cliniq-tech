import { useState, useEffect } from 'react'
import { X, Save, Plus, Trash2, HelpCircle, FlaskConical, AlertCircle, Layers, ShieldAlert } from 'lucide-react'
import { supabase } from '../../../supabaseClient'

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: any;
}

export function ProcedimentosForm({ isOpen, onClose, onSuccess, itemToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [tecnologias, setTecnologias] = useState<any[]>([]);
  
  const [header, setHeader] = useState({
    titulo: '',
    tipo_equipamento_id: '',
    norma_base: '',
    versao: 1,
    status: 'ATIVO' 
  });

  const [itens, setItens] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        try {
          const { data } = await supabase.from('tecnologias').select('*').eq('ativo', true);
          setTecnologias(data || []);

          if (itemToEdit) {
            setHeader({
              titulo: itemToEdit.titulo || '',
              tipo_equipamento_id: itemToEdit.tipo_equipamento_id?.toString() || '',
              norma_base: itemToEdit.norma_base || '',
              versao: itemToEdit.versao || 1,
              status: itemToEdit.status || 'ATIVO'
            });
            const { data: itensData } = await supabase
              .from('metrologia_procedimento_itens')
              .select('*')
              .eq('procedimento_id', itemToEdit.id)
              .order('ordem');
            setItens(itensData || []);
          } else {
            setHeader({ titulo: '', tipo_equipamento_id: '', norma_base: '', versao: 1, status: 'ATIVO' });
            setItens([{ secao: 'GERAL', titulo_item: '', grandeza: '', unidade: '', valor_referencia: '', tolerancia_mais: '', tolerancia_menos: '', tolerancia_tipo: 'Absoluta', critico: false }]);
          }
        } catch (error) {
          console.error("Erro Auditoria Load:", error);
        }
      };
      load();
    }
  }, [isOpen, itemToEdit]);

  const handleAddItem = () => {
    const ultimaSecao = itens.length > 0 ? itens[itens.length - 1].secao : 'GERAL';
    setItens([...itens, { secao: ultimaSecao, titulo_item: '', grandeza: '', unidade: '', valor_referencia: '', tolerancia_mais: '', tolerancia_menos: '', tolerancia_tipo: 'Absoluta', critico: false }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItens = [...itens];
    newItens[index] = { ...newItens[index], [field]: value };
    setItens(newItens);
  };

  const handleSave = async () => {
    if (!header.titulo || !header.tipo_equipamento_id) return alert('Auditoria: Título e Tecnologia são obrigatórios.');
    setLoading(true);
    try {
      let procId = itemToEdit?.id;
      const payloadHeader = { 
        titulo: header.titulo, 
        tipo_equipamento_id: Number(header.tipo_equipamento_id), 
        norma_base: header.norma_base, 
        versao: header.versao, 
        status: header.status 
      };
      
      if (procId) {
        await supabase.from('metrologia_procedimentos').update(payloadHeader).eq('id', procId);
        await supabase.from('metrologia_procedimento_itens').delete().eq('procedimento_id', procId);
      } else {
        const { data, error } = await supabase.from('metrologia_procedimentos').insert(payloadHeader).select().single();
        if (error) throw error;
        procId = data.id;
      }

      const itensPayload = itens.map((item, idx) => ({
        procedimento_id: procId,
        ordem: idx + 1,
        secao: item.secao || 'GERAL',
        titulo_item: item.titulo_item,
        grandeza: item.grandeza || 'Geral',
        unidade: item.unidade,
        valor_referencia: item.valor_referencia === '' ? null : Number(item.valor_referencia),
        tolerancia_mais: Number(item.tolerancia_mais || 0),
        tolerancia_menos: Number(item.tolerancia_menos || 0),
        tolerancia_tipo: item.tolerancia_tipo || 'Absoluta',
        critico: item.critico || false
      }));

      const { error: errItens } = await supabase.from('metrologia_procedimento_itens').insert(itensPayload);
      if (errItens) throw errItens;

      onSuccess();
    } catch (e: any) { 
      alert('Erro ao salvar POP: ' + e.message); 
    } finally { 
      setLoading(false); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-7xl rounded-3xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border dark:border-slate-700">
        
        {/* Cabeçalho de Auditoria */}
        <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900">
           <div className="flex items-center gap-4">
             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600"><FlaskConical/></div>
             <div>
               <h2 className="text-xl font-black dark:text-white leading-tight">Procedimento Operacional (POP)</h2>
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter flex items-center gap-1">
                 <ShieldAlert size={12} className="text-amber-500"/> Configuração de Matriz de Conformidade Normativa
               </p>
             </div>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-all text-slate-400"><X size={24}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 dark:bg-slate-900/50 custom-scrollbar">
            {/* Dados do Protocolo */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Título do Protocolo *</label>
                    <input className="input-form h-12 rounded-2xl shadow-sm bg-white" placeholder="Ex: Calibração Monitor" value={header.titulo} onChange={e => setHeader({...header, titulo: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Tecnologia *</label>
                    <select className="input-form h-12 rounded-2xl shadow-sm bg-white" value={header.tipo_equipamento_id} onChange={e => setHeader({...header, tipo_equipamento_id: e.target.value})}>
                        <option value="">Selecione...</option>
                        {tecnologias.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Norma de Referência</label>
                    <input className="input-form h-12 rounded-2xl shadow-sm bg-white" placeholder="Ex: NBR IEC 60601-1" value={header.norma_base} onChange={e => setHeader({...header, norma_base: e.target.value})} />
                </div>
            </div>

            {/* Matriz de Pontos */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 overflow-hidden shadow-sm">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase border-b dark:border-slate-700">
                        <tr>
                          <th className="p-4 w-40 text-indigo-600"><div className="flex items-center gap-2"><Layers size={14}/> Seção</div></th>
                          <th className="p-4">Descrição do Ponto</th>
                          <th className="p-4 text-center">Unid.</th>
                          <th className="p-4 text-center">Ref. Nominal</th>
                          <th className="p-4 text-center">Tolerâncias (±)</th>
                          <th className="p-4 text-center">Tipo</th>
                          <th className="p-4 text-center">Crítico?</th>
                          <th className="p-4 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                        {itens.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3">
                                    <input 
                                      className="w-full bg-indigo-50/50 dark:bg-indigo-900/20 px-3 py-2 rounded-xl outline-none font-black text-[10px] text-indigo-600 uppercase border border-indigo-100 dark:border-indigo-900/30" 
                                      placeholder="EX: BPM" 
                                      value={item.secao} 
                                      onChange={e => updateItem(idx, 'secao', e.target.value.toUpperCase())} 
                                    />
                                </td>
                                <td className="p-3"><input className="w-full bg-transparent outline-none font-bold dark:text-white" placeholder="O que medir?" value={item.titulo_item} onChange={e=>updateItem(idx, 'titulo_item', e.target.value)} /></td>
                                <td className="p-3 text-center"><input className="w-16 bg-slate-50 dark:bg-slate-900 text-center rounded-lg p-2 font-bold" placeholder="Un" value={item.unidade} onChange={e=>updateItem(idx, 'unidade', e.target.value)} /></td>
                                <td className="p-3 text-center"><input type="number" className="w-20 bg-slate-50 dark:bg-slate-900 text-center rounded-lg p-2 font-mono font-black" value={item.valor_referencia} onChange={e=>updateItem(idx, 'valor_referencia', e.target.value)} /></td>
                                <td className="p-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <input type="number" className="w-14 bg-rose-50 text-rose-600 text-center rounded-lg p-2 font-black" placeholder="-" value={item.tolerancia_menos} onChange={e=>updateItem(idx, 'tolerancia_menos', e.target.value)} />
                                        <input type="number" className="w-14 bg-emerald-50 text-emerald-600 text-center rounded-lg p-2 font-black" placeholder="+" value={item.tolerancia_mais} onChange={e=>updateItem(idx, 'tolerancia_mais', e.target.value)} />
                                    </div>
                                </td>
                                <td className="p-3 text-center">
                                    <select className="text-[9px] font-black uppercase bg-slate-100 dark:bg-slate-900 p-2 rounded-lg outline-none" value={item.tolerancia_tipo} onChange={e=>updateItem(idx, 'tolerancia_tipo', e.target.value)}>
                                        <option value="Absoluta">Pontos</option>
                                        <option value="Percentual">%</option>
                                    </select>
                                </td>
                                <td className="p-3 text-center">
                                    <input type="checkbox" className="w-5 h-5 accent-rose-500 cursor-pointer" checked={item.critico} onChange={e=>updateItem(idx, 'critico', e.target.checked)} />
                                </td>
                                <td className="p-3"><button onClick={()=>setItens(itens.filter((_,i)=>i!==idx))} className="text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t dark:border-slate-700">
                    <button onClick={handleAddItem} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 font-black text-[10px] uppercase hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-600 hover:border-indigo-200 rounded-2xl transition-all">+ Inserir Novo Ponto de Calibração</button>
                </div>
            </div>
        </div>

        <div className="p-6 border-t dark:border-slate-700 bg-white dark:bg-slate-900 flex justify-end gap-4">
            <button onClick={onClose} className="px-8 py-3 rounded-2xl text-xs font-black uppercase text-slate-500 hover:bg-slate-50">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                {loading ? 'Validando Matriz...' : <><Save size={18}/> Salvar Protocolo POP</>}
            </button>
        </div>
      </div>
    </div>
  )
}