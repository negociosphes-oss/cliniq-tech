import { useState, useEffect } from 'react';
import { X, Save, Zap, ShieldCheck, Activity, Loader2, AlertTriangle, Info, Check, XCircle, Type, ToggleLeft } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface TseFormModalProps {
  isOpen: boolean; onClose: () => void; onSuccess: () => void;
  editId?: number | null; tenantId: number; osId?: number; defaultEquipamentoId?: number; 
}

export function TseFormModal({ isOpen, onClose, onSuccess, editId, tenantId, osId, defaultEquipamentoId }: TseFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'resultados'>('geral');

  const [equipamentos, setEquipamentos] = useState<any[]>();
  const [equipe, setEquipe] = useState<any[]>();
  const [perfis, setPerfis] = useState<any[]>(); 
  const [padroes, setPadroes] = useState<any[]>(); 

  const [form, setForm] = useState({
    equipamento_id: defaultEquipamentoId ? defaultEquipamentoId.toString() : '',
    id_tecnico_executor: '', analisador_utilizado: '', data_ensaio: new Date().toISOString().split('T')[0],
    perfil_id: '', norma_aplicada: 'NBR IEC 62353', resultado: 'APROVADO', observacoes_gerais: '', resultados_json: [] as any[] 
  });

  useEffect(() => {
    if (isOpen && tenantId) {
      fetchSupportData();
      if (editId) loadEnsaio(editId);
      else setForm(prev => ({...prev, equipamento_id: defaultEquipamentoId ? defaultEquipamentoId.toString() : ''}));
    }
  }, [isOpen, editId, tenantId, defaultEquipamentoId]);

  const fetchSupportData = async () => {
    const { data: equipData } = await supabase.from('equipamentos').select('id, tag, modelo, tecnologias(nome)').eq('tenant_id', tenantId).order('tag');
    if (equipData) setEquipamentos(equipData);

    const { data: equipeData } = await supabase.from('equipe_tecnica').select('id, nome, cargo').eq('tenant_id', tenantId).order('nome');
    if (equipeData) setEquipe(equipeData);

    const { data: perfisData } = await supabase.from('metrologia_tse_normas').select('*').eq('tenant_id', tenantId).order('nome_perfil');
    if (perfisData) setPerfis(perfisData);

    try {
        const { data: padroesData, error } = await supabase.from('padroes').select('*');
        if (!error && padroesData && padroesData.length > 0) {
            setPadroes(padroesData);
        }
    } catch (e) { console.warn("Tabela de Padrões não encontrada."); }
  };

  const loadEnsaio = async (id: number) => {
    setLoadingData(true);
    try {
      const { data } = await supabase.from('metrologia_tse').select('*').eq('id', id).single();
      if (data) {
        setForm({
          ...data, equipamento_id: data.equipamento_id.toString(), id_tecnico_executor: data.id_tecnico_executor?.toString() || '',
          perfil_id: data.perfil_id?.toString() || '', resultados_json: typeof data.resultados_json === 'string' ? JSON.parse(data.resultados_json) : (data.resultados_json || []),
          analisador_utilizado: data.analisador_utilizado || '' // Carrega o que estiver no banco
        });
      }
    } catch (err: any) { alert(err.message); } finally { setLoadingData(false); }
  };

  const handlePerfilChange = (pid: string) => {
     const pSelecionado = (perfis || []).find(p => p.id.toString() === pid);
     if (pSelecionado) {
        const parametros = typeof pSelecionado.parametros === 'string' ? JSON.parse(pSelecionado.parametros) : (pSelecionado.parametros || []);
        
        const novosPontos = parametros.map((param: any) => ({
           id_parametro: param.id,
           tipo_campo: param.tipo_campo || 'medicao',
           nome: param.nome,
           unidade: param.unidade,
           operador: param.operador,
           limite: param.tipo_campo === 'medicao' ? Number(param.limite) : null,
           valor_medido: '',
           aprovado: param.tipo_campo === 'secao' ? true : null
        }));

        setForm(prev => ({ ...prev, perfil_id: pid, norma_aplicada: pSelecionado.norma_referencia, resultados_json: novosPontos }));
     }
  };

  const handleMedicaoChange = (index: number, valor: string) => {
     const novosResultados = [...form.resultados_json];
     const ponto = novosResultados[index];
     ponto.valor_medido = valor;
     
     if (valor === '') ponto.aprovado = null;
     else {
        const numValor = parseFloat(valor);
        if (ponto.operador === '<=') ponto.aprovado = numValor <= ponto.limite;
        if (ponto.operador === '>=') ponto.aprovado = numValor >= ponto.limite;
     }
     
     novosResultados[index] = ponto;
     checkGlobalResult(novosResultados);
  };

  const handleBooleanChange = (index: number, aprovado: boolean) => {
     const novosResultados = [...form.resultados_json];
     novosResultados[index].aprovado = aprovado;
     novosResultados[index].valor_medido = aprovado ? 'Conforme' : 'Não Conforme';
     checkGlobalResult(novosResultados);
  };

  const checkGlobalResult = (resultados: any[]) => {
      const temFalha = resultados.some(r => r.aprovado === false);
      setForm(prev => ({ ...prev, resultados_json: resultados, resultado: temFalha ? 'REPROVADO' : 'APROVADO' }));
  };

  const handleSave = async () => {
    if (!form.equipamento_id) return alert('Selecione o equipamento.');
    if (!form.perfil_id) return alert('Selecione o Perfil TSE (Norma).');
    if (!form.analisador_utilizado) return alert('Selecione o Analisador Utilizado.');

    setLoading(true);
    try {
      const payload = {
        tenant_id: tenantId, equipamento_id: Number(form.equipamento_id), ordem_servico_id: osId || null, perfil_id: Number(form.perfil_id), id_tecnico_executor: form.id_tecnico_executor ? Number(form.id_tecnico_executor) : null, analisador_utilizado: form.analisador_utilizado, data_ensaio: form.data_ensaio, norma_aplicada: form.norma_aplicada, resultado: form.resultado, observacoes_gerais: form.observacoes_gerais, resultados_json: form.resultados_json 
      };

      if (editId) {
        const { error } = await supabase.from('metrologia_tse').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('metrologia_tse').insert([payload]);
        if (error) throw error;
      }

      alert('Ensaio registrado com sucesso!'); onSuccess(); onClose();
    } catch (err: any) { alert('Erro ao salvar: ' + err.message); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/90 backdrop-blur-sm custom-scrollbar">
      <div className="flex min-h-full items-center justify-center p-4 py-12">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden relative animate-slideUp">
          
          <div className="p-6 bg-slate-900 flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400"><Zap size={24}/></div>
              <div>
                <h2 className="text-xl font-black text-white tracking-tight">{editId ? 'Editar Ensaio Elétrico' : 'Novo Ensaio Dinâmico'}</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Laudo Flexível de Segurança Elétrica</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-800 hover:text-white rounded-full transition-colors"><X size={24}/></button>
          </div>

          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-8 pt-4 gap-4">
            <button onClick={() => setActiveTab('geral')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'geral' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><Info size={18}/> Dados Gerais</button>
            <button onClick={() => setActiveTab('resultados')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'resultados' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}><Activity size={18}/> Execução do Teste</button>
          </div>

          <div className="p-6 md:p-10 bg-white dark:bg-slate-900 space-y-8">
            {loadingData ? (
               <div className="flex justify-center py-20 text-slate-400"><Loader2 className="animate-spin" size={32}/></div>
            ) : (
              <>
                {activeTab === 'geral' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                      
                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-indigo-600">Perfil de Teste (Norma) *</label>
                        <select className="w-full h-14 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 text-base font-bold text-indigo-900 dark:text-indigo-300 outline-none focus:border-indigo-500 transition-colors" value={form.perfil_id} onChange={e => handlePerfilChange(e.target.value)}>
                          <option value="">Selecione o perfil criado no painel...</option>
                          {(perfis || []).map(p => <option key={p.id} value={p.id}>{p.nome_perfil} ({p.classe_equipamento} | {p.tipo_peca_aplicada})</option>)}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">Equipamento Avaliado *</label>
                        <select className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 disabled:opacity-50" value={form.equipamento_id} disabled={!!defaultEquipamentoId} onChange={e => setForm({...form, equipamento_id: e.target.value})}>
                          <option value="">Selecione...</option>
                          {(equipamentos || []).map(eq => <option key={eq.id} value={eq.id}>[TAG: {eq.tag}] - {eq.tecnologias?.nome}</option>)}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">Técnico Executor</label>
                          <select className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold text-slate-800 dark:text-slate-200 outline-none" value={form.id_tecnico_executor} onChange={e => setForm({...form, id_tecnico_executor: e.target.value})}>
                            <option value="">Selecione...</option>
                            {(equipe || []).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400">Data do Ensaio *</label>
                          <input type="date" className="w-full h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold text-slate-800 dark:text-slate-200 outline-none" value={form.data_ensaio} onChange={e => setForm({...form, data_ensaio: e.target.value})}/>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                       <label className="text-[11px] font-black uppercase text-indigo-700 dark:text-indigo-400 block mb-2">Padrão / Analisador Utilizado (Rastreabilidade RBC) *</label>
                       
                       {(padroes && padroes.length > 0) ? (
                           <select 
                              className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500" 
                              value={form.analisador_utilizado} 
                              onChange={e => setForm({...form, analisador_utilizado: e.target.value})}
                           >
                              <option value="">Selecione o Analisador da Frota...</option>
                              {padroes.map(p => {
                                 // Aqui salva o JSON limpo para o PDF ler depois
                                 const pJson = JSON.stringify(p);
                                 return (
                                    <option key={p.id} value={pJson}>
                                       {p.nome || 'Padrão'} {p.fabricante || ''} - S/N: {p.n_serie || 'N/A'}
                                    </option>
                                 );
                              })}
                           </select>
                       ) : (
                           <input placeholder="Digite o nome e N. Série do analisador..." className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500" value={form.analisador_utilizado} onChange={e => setForm({...form, analisador_utilizado: e.target.value})} />
                       )}
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">Selecione para preencher a tabela completa de rastreabilidade (ONA/ISO) no PDF final.</p>
                    </div>

                  </div>
                )}

                {activeTab === 'resultados' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    {!form.perfil_id ? (
                       <div className="text-center py-12 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-200 dark:border-amber-800">
                          <AlertTriangle className="mx-auto text-amber-500 mb-3" size={40}/>
                          <p className="font-bold text-amber-800 dark:text-amber-400 text-lg">Selecione um Perfil de Teste na aba Geral primeiro.</p>
                       </div>
                    ) : (
                       <div className="space-y-4">
                          
                          {form.resultados_json.map((ponto, index) => {
                             if (ponto.tipo_campo === 'secao') {
                                return <div key={index} className="bg-slate-800 text-white p-4 px-5 rounded-xl font-black uppercase text-sm mt-10 mb-4 tracking-widest shadow-md flex items-center gap-3"><Type size={18} className="text-slate-400"/> {ponto.nome}</div>;
                             }

                             if (ponto.tipo_campo === 'booleano') {
                                return (
                                   <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-indigo-300">
                                      <label className="text-[13px] font-black uppercase text-slate-800 dark:text-slate-200 flex-1 flex items-center gap-3"><ToggleLeft size={20} className="text-slate-400"/> {ponto.nome}</label>
                                      <div className="flex gap-2 w-full sm:w-auto">
                                         <button onClick={() => handleBooleanChange(index, true)} className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all flex justify-center items-center gap-2 ${ponto.aprovado === true ? 'bg-emerald-50 text-emerald-700 border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-emerald-300'}`}><Check size={18}/> Passa</button>
                                         <button onClick={() => handleBooleanChange(index, false)} className={`flex-1 sm:flex-none px-5 py-3 rounded-xl text-sm font-bold border-2 transition-all flex justify-center items-center gap-2 ${ponto.aprovado === false ? 'bg-rose-50 text-rose-700 border-rose-500 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500 hover:border-rose-300'}`}><XCircle size={18}/> Falha</button>
                                      </div>
                                   </div>
                                );
                             }

                             return (
                                <div key={index} className="bg-slate-50 dark:bg-slate-800/50 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-indigo-300">
                                   <div className="flex-1 w-full sm:w-auto">
                                      <label className="text-[13px] font-black uppercase text-slate-800 dark:text-slate-200 block mb-2">{ponto.nome}</label>
                                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg inline-block border border-slate-200 dark:border-slate-700">Limite: {ponto.operador} {ponto.limite} {ponto.unidade}</span>
                                   </div>
                                   <div className="flex items-center gap-4 w-full sm:w-auto">
                                      <div className="relative w-full sm:w-40">
                                         <input type="number" step="0.01" className="w-full h-14 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl pl-4 pr-12 text-xl font-black text-slate-800 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 text-right transition-all" placeholder="0.00" value={ponto.valor_medido} onChange={e => handleMedicaoChange(index, e.target.value)}/>
                                         <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">{ponto.unidade}</span>
                                      </div>
                                      <div className="w-24 sm:w-28 text-center shrink-0">
                                         {ponto.aprovado === true && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl font-black text-xs uppercase shadow-sm border border-emerald-200 dark:border-emerald-800 w-full block">Passa</span>}
                                         {ponto.aprovado === false && <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 px-4 py-2 rounded-xl font-black text-xs uppercase shadow-sm border border-rose-200 dark:border-rose-800 w-full block">Falha</span>}
                                         {ponto.aprovado === null && <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 px-4 py-2 rounded-xl font-black text-xs uppercase border border-slate-300 dark:border-slate-700 w-full block">Pendente</span>}
                                      </div>
                                   </div>
                                </div>
                             );
                          })}

                          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 mt-10 shadow-sm">
                             <label className="text-[12px] font-black uppercase text-slate-500 block mb-4 text-center">Parecer Automático do Ensaio</label>
                             <div className="flex gap-4">
                               <div className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all font-black uppercase text-base ${form.resultado === 'APROVADO' ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600'}`}><ShieldCheck size={24}/> Aprovado</div>
                               <div className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all font-black uppercase text-base ${form.resultado === 'REPROVADO' ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400' : 'border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600'}`}><AlertTriangle size={24}/> Reprovado</div>
                             </div>
                          </div>

                       </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-4">
            <button onClick={onClose} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
            {activeTab === 'geral' ? (
               <button onClick={() => setActiveTab('resultados')} className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 px-10 py-3 rounded-xl font-black shadow-sm flex items-center gap-2 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all uppercase tracking-widest text-base">Próximo <Activity size={20}/></button>
            ) : (
               <button onClick={handleSave} disabled={loading || form.resultados_json.length === 0} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-xl flex items-center gap-2 hover:bg-indigo-700 transition-all uppercase tracking-widest text-base disabled:opacity-50">
                 {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Registrar Laudo
               </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}