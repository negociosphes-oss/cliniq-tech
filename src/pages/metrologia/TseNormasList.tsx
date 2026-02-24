import { useState, useEffect } from 'react';
import { Plus, Settings, Zap, Edit, Trash2, Loader2, ShieldCheck, CheckSquare, Type, ToggleLeft, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { tenantId: number; }

export function TseNormasList({ tenantId }: Props) {
  const [normas, setNormas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    nome_perfil: '', norma_referencia: 'NBR IEC 62353', classe_equipamento: 'Classe I', tipo_peca_aplicada: 'Tipo BF', parametros: [] as any[]
  });

  useEffect(() => { if (tenantId) fetchNormas(); }, [tenantId]);

  const fetchNormas = async () => {
    setLoading(true);
    const { data } = await supabase.from('metrologia_tse_normas').select('*').eq('tenant_id', tenantId).order('nome_perfil');
    if (data) setNormas(data);
    setLoading(false);
  };

  const handleEdit = (norma: any) => {
    setForm({
      nome_perfil: norma.nome_perfil, norma_referencia: norma.norma_referencia || 'NBR IEC 62353', classe_equipamento: norma.classe_equipamento || 'Classe I', tipo_peca_aplicada: norma.tipo_peca_aplicada || 'Tipo BF',
      parametros: typeof norma.parametros === 'string' ? JSON.parse(norma.parametros) : (norma.parametros || [])
    });
    setEditingId(norma.id); setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este perfil de configuração?')) return;
    await supabase.from('metrologia_tse_normas').delete().eq('id', id).eq('tenant_id', tenantId);
    fetchNormas();
  };

  const handleAddParam = (tipo_campo: 'medicao' | 'booleano' | 'secao') => {
    setForm(prev => ({
      ...prev,
      parametros: [...prev.parametros, { 
        id: crypto.randomUUID(), 
        tipo_campo, 
        nome: tipo_campo === 'secao' ? 'Nova Seção...' : '', 
        unidade: tipo_campo === 'medicao' ? 'µA' : '', 
        operador: tipo_campo === 'medicao' ? '<=' : '', 
        limite: '' 
      }]
    }));
  };

  const handleParamChange = (id: string, field: string, value: string) => {
    setForm(prev => ({ ...prev, parametros: prev.parametros.map(p => p.id === id ? { ...p, [field]: value } : p) }));
  };

  const handleRemoveParam = (id: string) => {
    setForm(prev => ({ ...prev, parametros: prev.parametros.filter(p => p.id !== id) }));
  };

  const handleSave = async () => {
    if (!form.nome_perfil) return alert('Dê um nome para o perfil');
    const payload = { tenant_id: tenantId, nome_perfil: form.nome_perfil, norma_referencia: form.norma_referencia, classe_equipamento: form.classe_equipamento, tipo_peca_aplicada: form.tipo_peca_aplicada, parametros: form.parametros };
    if (editingId) await supabase.from('metrologia_tse_normas').update(payload).eq('id', editingId).eq('tenant_id', tenantId);
    else await supabase.from('metrologia_tse_normas').insert([payload]);
    setIsModalOpen(false); fetchNormas();
  };

  const resetForm = () => {
    setForm({ 
      nome_perfil: '', norma_referencia: 'NBR IEC 62353', classe_equipamento: 'Classe I', tipo_peca_aplicada: 'Tipo BF',
      parametros: [
        { id: crypto.randomUUID(), tipo_campo: 'secao', nome: 'Inspeção Visual' },
        { id: crypto.randomUUID(), tipo_campo: 'booleano', nome: 'Integridade do Cabo de Força' },
        { id: crypto.randomUUID(), tipo_campo: 'secao', nome: 'Ensaios Elétricos' },
        { id: crypto.randomUUID(), tipo_campo: 'medicao', nome: 'Resistência de Aterramento', unidade: 'Ω', operador: '<=', limite: '0.3' }
      ]
    });
    setEditingId(null); setIsModalOpen(true);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Settings size={24} className="text-indigo-600"/> Construtor de Normas TSE</h2>
          <p className="text-sm text-slate-500">Crie seções, check-lists visuais e medições elétricas.</p>
        </div>
        <button onClick={resetForm} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"><Plus size={18}/> Novo Perfil TSE</button>
      </div>

      {loading ? ( <div className="py-20 flex justify-center text-indigo-500"><Loader2 className="animate-spin" size={32}/></div> ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {normas.map(norma => {
            const parametros = typeof norma.parametros === 'string' ? JSON.parse(norma.parametros) : (norma.parametros || []);
            return (
              <div key={norma.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                <div className="flex items-start justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"><ShieldCheck size={24}/></div>
                      <div>
                         <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{norma.nome_perfil}</h3>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{norma.norma_referencia} • {norma.classe_equipamento} • {norma.tipo_peca_aplicada}</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-2 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                   {parametros.map((p: any, idx: number) => {
                      const tipo = p.tipo_campo || 'medicao';
                      if (tipo === 'secao') return <div key={idx} className="bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 px-3 py-1.5 rounded mt-2">{p.nome}</div>;
                      if (tipo === 'booleano') return <div key={idx} className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><ToggleLeft size={12}/> {p.nome}</span><span className="font-bold text-slate-400">Passa/Falha</span></div>;
                      return <div key={idx} className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><CheckSquare size={12}/> {p.nome}</span><span className="font-black text-slate-700 dark:text-slate-200">{p.operador} {p.limite} {p.unidade}</span></div>;
                   })}
                </div>

                <div className="flex gap-2">
                   <button onClick={() => handleEdit(norma)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-2"><Edit size={14}/> Editar Estrutura</button>
                   <button onClick={() => handleDelete(norma.id)} className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 🚀 MODAL COM ROLAGEM NATIVA DO NAVEGADOR (INQUEBRÁVEL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/90 backdrop-blur-sm custom-scrollbar">
          
          {/* Este flex garante o centro, mas se a tela for menor, o padding py-12 dá espaço em cima e embaixo */}
          <div className="flex min-h-full items-center justify-center p-4 py-12">
            
            {/* Modal Box - Sem limites de altura, ele cresce naturalmente */}
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative animate-slideUp">
              
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Zap className="text-indigo-500"/> {editingId ? 'Editar Perfil de Teste' : 'Novo Perfil de Teste'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
              </div>
              
              {/* Body (Livre de flex-col e scrolls internos) */}
              <div className="p-6 md:p-8 space-y-8">
                
                {/* 🚀 CAMPO DE NOME BLINDADO AQUI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Nome do Perfil *</label>
                    <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold outline-none focus:border-indigo-500 text-slate-800 dark:text-white transition-colors" placeholder="Ex: Monitor de Sinais - Classe I" value={form.nome_perfil} onChange={e => setForm({...form, nome_perfil: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Norma Referência</label>
                    <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold outline-none text-slate-800 dark:text-white" value={form.norma_referencia} onChange={e => setForm({...form, norma_referencia: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Classe de Proteção</label>
                    <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold outline-none text-slate-800 dark:text-white" value={form.classe_equipamento} onChange={e => setForm({...form, classe_equipamento: e.target.value})}>
                      <option>Classe I</option><option>Classe II</option><option>Alimentação Interna</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Peça Aplicada</label>
                    <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold outline-none text-slate-800 dark:text-white" value={form.tipo_peca_aplicada} onChange={e => setForm({...form, tipo_peca_aplicada: e.target.value})}>
                      <option>Tipo B</option><option>Tipo BF</option><option>Tipo CF</option><option>Sem Peça Aplicada</option>
                    </select>
                  </div>
                </div>

                {/* Estrutura de Pontos */}
                <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-indigo-100 dark:border-slate-700">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h4 className="text-indigo-800 dark:text-indigo-400 font-black text-sm uppercase tracking-wider">Estrutura do Laudo (Pontos)</h4>
                      <div className="flex flex-wrap gap-2">
                         <button onClick={() => handleAddParam('secao')} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition shadow-sm"><Type size={16}/> Nova Seção</button>
                         <button onClick={() => handleAddParam('booleano')} className="bg-white dark:bg-slate-700 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-50 transition shadow-sm"><ToggleLeft size={16}/> Check Visual</button>
                         <button onClick={() => handleAddParam('medicao')} className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-indigo-700 transition shadow-sm"><Plus size={16}/> Medição Elétrica</button>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      {form.parametros.map((p, index) => {
                         const tipo = p.tipo_campo || 'medicao';
                         return (
                           <div key={p.id} className={`flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl border shadow-sm ${tipo === 'secao' ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600' : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-slate-700'}`}>
                              
                              <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                                  <span className="font-black text-slate-300 dark:text-slate-600 w-6 text-center hidden md:block">{index + 1}</span>
                                  
                                  {tipo === 'secao' && (
                                    <>
                                        <Type size={18} className="text-slate-400 shrink-0"/>
                                        <input placeholder="Título da Seção (Ex: Inspeção Visual)" className="flex-1 w-full bg-transparent h-12 px-3 outline-none text-base font-black uppercase text-slate-700 dark:text-white" value={p.nome} onChange={e => handleParamChange(p.id, 'nome', e.target.value)} />
                                    </>
                                  )}

                                  {tipo === 'booleano' && (
                                    <>
                                        <ToggleLeft size={18} className="text-indigo-400 shrink-0"/>
                                        <input placeholder="Pergunta Visual (Ex: Cabo de força íntegro?)" className="flex-1 w-full bg-slate-50 dark:bg-slate-800 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm font-bold text-slate-800 dark:text-white" value={p.nome} onChange={e => handleParamChange(p.id, 'nome', e.target.value)} />
                                        <span className="text-[10px] font-bold text-slate-400 px-2 hidden md:block uppercase">Aprovado/Reprovado</span>
                                    </>
                                  )}

                                  {tipo === 'medicao' && (
                                    <>
                                        <input placeholder="Nome do Ponto (Ex: Corrente de Fuga)" className="flex-1 w-full bg-slate-50 dark:bg-slate-800 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm font-bold text-slate-800 dark:text-white" value={p.nome} onChange={e => handleParamChange(p.id, 'nome', e.target.value)} />
                                    </>
                                  )}
                              </div>

                              {tipo === 'medicao' && (
                                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
                                    <select className="flex-1 sm:w-24 bg-slate-50 dark:bg-slate-800 h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm font-bold text-center text-slate-800 dark:text-white" value={p.unidade} onChange={e => handleParamChange(p.id, 'unidade', e.target.value)}>
                                        <option value="µA">µA</option><option value="mA">mA</option><option value="Ω">Ω</option><option value="MΩ">MΩ</option><option value="V">V</option>
                                    </select>
                                    <select className="w-20 sm:w-24 bg-indigo-50 dark:bg-indigo-900/30 h-12 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 outline-none text-sm font-black text-indigo-700 dark:text-indigo-400 text-center" value={p.operador} onChange={e => handleParamChange(p.id, 'operador', e.target.value)}>
                                        <option value="<=">&le; Máx</option><option value=">=">&ge; Mín</option>
                                    </select>
                                    <input placeholder="Limite" type="number" step="0.01" className="flex-1 sm:w-28 bg-white dark:bg-slate-900 h-12 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 outline-none text-sm font-black text-indigo-700 dark:text-indigo-400 text-center" value={p.limite} onChange={e => handleParamChange(p.id, 'limite', e.target.value)} />
                                  </div>
                              )}

                              <div className="flex justify-end w-full lg:w-auto mt-2 lg:mt-0">
                                <button onClick={() => handleRemoveParam(p.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"><Trash2 size={20}/></button>
                              </div>
                           </div>
                         );
                      })}
                      {form.parametros.length === 0 && (
                        <div className="text-center text-slate-400 py-10 text-sm font-bold border-2 border-dashed border-indigo-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">
                          Nenhum item configurado no laudo. Clique nos botões acima para adicionar.
                        </div>
                      )}
                   </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-4">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all text-base">Salvar Estrutura</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}