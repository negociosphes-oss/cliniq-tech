import { useState, useEffect } from 'react';
import { Plus, Settings, Zap, Edit, Trash2, Loader2, ShieldCheck, CheckSquare, Type, ToggleLeft, X, BookOpen, Activity, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { tenantId: number; }

export function TseNormasList({ tenantId }: Props) {
  const [normas, setNormas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'configuracao' | 'wiki'>('configuracao');

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
    <div className="animate-fadeIn p-8 max-w-7xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <span className="p-3 bg-emerald-600 text-white rounded-2xl shadow-lg"><ShieldCheck size={24}/></span> 
            Normas de Segurança Elétrica (TSE)
          </h2>
          <p className="text-slate-500 font-medium mt-2">Parametrização de limites da IEC 62353 e Wiki Educacional.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button onClick={() => setActiveTab('configuracao')} className={`py-4 px-6 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'configuracao' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>1. Parametrização de Ensaios</button>
        <button onClick={() => setActiveTab('wiki')} className={`py-4 px-6 text-sm font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'wiki' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>2. Guia Prático IEC (Wiki)</button>
      </div>

      {activeTab === 'wiki' && (
          <div className="space-y-6 animate-fadeIn pb-24">
              
              {/* 🚀 AVISO LEGAL DE RESPONSABILIDADE (COMPLIANCE) */}
              <div className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-500 p-6 rounded-r-3xl shadow-sm flex items-start gap-5">
                  <AlertTriangle size={28} className="text-amber-500 shrink-0 mt-1"/>
                  <div>
                      <h4 className="text-amber-800 dark:text-amber-400 font-black uppercase tracking-wider text-sm mb-2">Aviso Legal: Uso de Modelos e Responsabilidade Técnica</h4>
                      <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed text-justify mb-3">
                          Os perfis de teste pré-cadastrados neste sistema são <strong>modelos de referência educativos</strong>, elaborados com base nas diretrizes da <strong>ABNT NBR IEC 62353, NBR IEC 60601-1</strong>, resoluções da <strong>ANVISA</strong> e nos Procedimentos Operacionais Padrão (POPs) emitidos pela <strong>EBSERH / Governo Federal</strong>.
                      </p>
                      <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed text-justify">
                          <strong>Nosso sistema atua exclusivamente como uma ferramenta facilitadora de registro e rastreabilidade.</strong> Não assumimos qualquer responsabilidade legal, clínica ou técnica pela aplicação destes limites na sua operação. Cabe única e exclusivamente ao <strong>Engenheiro Clínico / Responsável Técnico (RT)</strong> da instituição avaliar, calibrar e aprovar os parâmetros. O cliente possui <strong>total controle e autonomia</strong> para editar, excluir ou criar novos perfis de ensaio conforme as políticas de segurança específicas da sua organização.
                      </p>
                  </div>
              </div>

              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-8 text-white shadow-xl flex items-center gap-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0"><BookOpen size={40} className="text-white"/></div>
                  <div>
                      <h3 className="text-2xl font-black">Base de Conhecimento: NBR IEC 62353</h3>
                      <p className="text-blue-100 font-medium mt-1 max-w-2xl text-sm leading-relaxed">Entenda a diferença entre as classes de proteção e os tipos de peças aplicadas para garantir a segurança dos pacientes e operadores na Engenharia Clínica.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                      <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2 mb-6"><Zap size={16} className="text-amber-500"/> Classes de Proteção Elétrica</h4>
                      <div className="space-y-4">
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl">
                              <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded flex items-center justify-center text-xs">I</span> Classe I</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Proteção adicional contra choque elétrico baseada na conexão das partes condutivas ao <strong>pino de aterramento de proteção (terra)</strong>.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl">
                              <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded flex items-center justify-center text-xs">II</span> Classe II</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Protegido por <strong>dupla isolação</strong> ou isolação reforçada. Não possui pino de terra. O plugue tem apenas 2 pinos.</p>
                          </div>
                          <div className="p-4 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl">
                              <h5 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded flex items-center justify-center text-xs">IP</span> Energizado Internamente</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Opera a partir de bateria interna. Se conectado à rede para carregar, é avaliado como Classe I ou II.</p>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                      <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-xs flex items-center gap-2 mb-6"><Activity size={16} className="text-emerald-500"/> Tipos de Peça Aplicada</h4>
                      <div className="space-y-4">
                          <div className="p-4 border border-blue-100 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800 rounded-2xl relative overflow-hidden">
                              <div className="absolute right-0 top-0 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 font-black text-[10px] px-3 py-1 rounded-bl-xl">Baixo Risco</div>
                              <h5 className="font-bold text-slate-800 dark:text-white">Tipo B (Body)</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Adequada para aplicação externa. Tem os limites mais tolerantes. <strong>NÃO para uso cardíaco</strong>. Ex: Camas, fototerapia.</p>
                          </div>
                          <div className="p-4 border border-amber-100 bg-amber-50/50 dark:bg-amber-900/20 dark:border-amber-800 rounded-2xl relative overflow-hidden">
                              <div className="absolute right-0 top-0 bg-amber-100 dark:bg-amber-800 text-amber-800 dark:text-amber-200 font-black text-[10px] px-3 py-1 rounded-bl-xl">Risco Médio</div>
                              <h5 className="font-bold text-slate-800 dark:text-white">Tipo BF (Body Floating)</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Maior proteção. Peça isolada/flutuante. <strong>NÃO para uso cardíaco</strong>. Ex: SpO2, Ultrassom, PNI.</p>
                          </div>
                          <div className="p-4 border border-rose-100 bg-rose-50/50 dark:bg-rose-900/20 dark:border-rose-800 rounded-2xl relative overflow-hidden">
                              <div className="absolute right-0 top-0 bg-rose-100 dark:bg-rose-800 text-rose-800 dark:text-rose-200 font-black text-[10px] px-3 py-1 rounded-bl-xl">Risco Crítico</div>
                              <h5 className="font-bold text-slate-800 dark:text-white">Tipo CF (Cardiac Floating)</h5>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Nível máximo de proteção. Peça isolada adequada para <strong>aplicação cardíaca direta</strong>. Limites muito rígidos. Ex: ECG, Marca-passo externo.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'configuracao' && (
        <div className="pb-24 animate-fadeIn">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
               <Info size={16}/> O cliente tem total controle para editar os perfis abaixo ou criar os seus próprios.
            </div>
            <button onClick={resetForm} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-all active:scale-95"><Plus size={18}/> Novo Perfil TSE (IEC)</button>
          </div>

          {loading ? ( <div className="py-20 flex justify-center text-emerald-500"><Loader2 className="animate-spin" size={32}/></div> ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {normas.map(norma => {
                const parametros = typeof norma.parametros === 'string' ? JSON.parse(norma.parametros) : (norma.parametros || []);
                return (
                  <div key={norma.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative group flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl"><ShieldCheck size={24}/></div>
                          <div>
                              <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{norma.nome_perfil}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{norma.norma_referencia} • {norma.classe_equipamento} • {norma.tipo_peca_aplicada}</p>
                          </div>
                        </div>
                    </div>

                    <div className="space-y-2 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-2 flex-1">
                        {parametros.map((p: any, idx: number) => {
                          const tipo = p.tipo_campo || 'medicao';
                          if (tipo === 'secao') return <div key={idx} className="bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase text-slate-500 dark:text-slate-300 px-3 py-1.5 rounded mt-2">{p.nome}</div>;
                          if (tipo === 'booleano') return <div key={idx} className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><ToggleLeft size={12}/> {p.nome}</span><span className="font-bold text-slate-400">Passa/Falha</span></div>;
                          return <div key={idx} className="flex justify-between text-xs border-b border-slate-100 dark:border-slate-700 pb-2"><span className="text-slate-500 dark:text-slate-400 flex items-center gap-2"><CheckSquare size={12}/> {p.nome}</span><span className="font-black text-slate-700 dark:text-slate-200">{p.operador} {p.limite} {p.unidade}</span></div>;
                        })}
                    </div>

                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => handleEdit(norma)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors flex justify-center items-center gap-2"><Edit size={14}/> Editar Estrutura</button>
                        <button onClick={() => handleDelete(norma.id)} className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-slate-900/90 backdrop-blur-sm custom-scrollbar">
          <div className="flex min-h-full items-center justify-center p-4 py-12">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden relative animate-slideUp">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                <h2 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Zap className="text-emerald-500"/> {editingId ? 'Editar Perfil de Teste' : 'Novo Perfil de Teste'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
              </div>
              
              <div className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Nome do Perfil *</label>
                    <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 text-base font-bold outline-none focus:border-emerald-500 text-slate-800 dark:text-white transition-colors" placeholder="Ex: Monitor de Sinais - Classe I" value={form.nome_perfil} onChange={e => setForm({...form, nome_perfil: e.target.value})}/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Norma / Referência Base</label>
                    <input className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold outline-none text-slate-800 dark:text-white" value={form.norma_referencia} onChange={e => setForm({...form, norma_referencia: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Classe de Proteção</label>
                    <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold outline-none text-slate-800 dark:text-white" value={form.classe_equipamento} onChange={e => setForm({...form, classe_equipamento: e.target.value})}>
                      <option>Classe I</option><option>Classe II</option><option>Energizado Internamente</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block">Peça Aplicada</label>
                    <select className="w-full h-14 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-bold outline-none text-slate-800 dark:text-white" value={form.tipo_peca_aplicada} onChange={e => setForm({...form, tipo_peca_aplicada: e.target.value})}>
                      <option>Não se aplica</option><option>Tipo B</option><option>Tipo BF</option><option>Tipo CF</option>
                    </select>
                  </div>
                </div>

                <div className="bg-emerald-50/50 dark:bg-slate-800/50 p-6 rounded-2xl border border-emerald-100 dark:border-slate-700">
                   <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                      <h4 className="text-emerald-800 dark:text-emerald-400 font-black text-sm uppercase tracking-wider">Estrutura do Laudo (Pontos)</h4>
                      <div className="flex flex-wrap gap-2">
                         <button onClick={() => handleAddParam('secao')} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-50 transition shadow-sm"><Type size={16}/> Nova Seção</button>
                         <button onClick={() => handleAddParam('booleano')} className="bg-white dark:bg-slate-700 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-50 transition shadow-sm"><ToggleLeft size={16}/> Check Visual</button>
                         <button onClick={() => handleAddParam('medicao')} className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-700 transition shadow-sm"><Plus size={16}/> Medição Elétrica</button>
                      </div>
                   </div>
                   
                   <div className="space-y-4">
                      {form.parametros.map((p, index) => {
                         const tipo = p.tipo_campo || 'medicao';
                         return (
                           <div key={p.id} className={`flex flex-col lg:flex-row lg:items-center gap-4 p-4 rounded-xl border shadow-sm ${tipo === 'secao' ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-600' : 'bg-white dark:bg-slate-900 border-emerald-100 dark:border-slate-700'}`}>
                              <div className="flex items-center gap-3 w-full lg:w-auto flex-1">
                                  <span className="font-black text-slate-300 dark:text-slate-600 w-6 text-center hidden md:block">{index + 1}</span>
                                  {tipo === 'secao' && (<><Type size={18} className="text-slate-400 shrink-0"/><input placeholder="Título da Seção (Ex: Inspeção Visual)" className="flex-1 w-full bg-transparent h-12 px-3 outline-none text-base font-black uppercase text-slate-700 dark:text-white" value={p.nome} onChange={e => handleParamChange(p.id, 'nome', e.target.value)} /></>)}
                                  {tipo === 'booleano' && (<><ToggleLeft size={18} className="text-emerald-400 shrink-0"/><input placeholder="Pergunta Visual (Ex: Cabo de força íntegro?)" className="flex-1 w-full bg-slate-50 dark:bg-slate-800 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm font-bold text-slate-800 dark:text-white" value={p.nome} onChange={e => handleParamChange(p.id, 'nome', e.target.value)} /><span className="text-[10px] font-bold text-slate-400 px-2 hidden md:block uppercase">Passa/Falha</span></>)}
                                  {tipo === 'medicao' && (<><input placeholder="Nome do Ponto (Ex: Corrente de Fuga)" className="flex-1 w-full bg-slate-50 dark:bg-slate-800 h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm font-bold text-slate-800 dark:text-white" value={p.nome} onChange={e => handleParamChange(p.id, 'nome', e.target.value)} /></>)}
                              </div>
                              {tipo === 'medicao' && (
                                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
                                    <select className="flex-1 sm:w-24 bg-slate-50 dark:bg-slate-800 h-12 px-3 rounded-xl border border-slate-200 dark:border-slate-600 outline-none text-sm font-bold text-center text-slate-800 dark:text-white" value={p.unidade} onChange={e => handleParamChange(p.id, 'unidade', e.target.value)}><option value="µA">µA</option><option value="mA">mA</option><option value="Ω">Ω</option><option value="MΩ">MΩ</option><option value="V">V</option></select>
                                    <select className="w-20 sm:w-24 bg-emerald-50 dark:bg-emerald-900/30 h-12 px-3 rounded-xl border border-emerald-200 dark:border-emerald-800 outline-none text-sm font-black text-emerald-700 dark:text-emerald-400 text-center" value={p.operador} onChange={e => handleParamChange(p.id, 'operador', e.target.value)}><option value="<=">&le; Máx</option><option value=">=">&ge; Mín</option></select>
                                    <input placeholder="Limite" type="number" step="0.01" className="flex-1 sm:w-28 bg-white dark:bg-slate-900 h-12 px-4 rounded-xl border border-emerald-200 dark:border-emerald-800 outline-none text-sm font-black text-emerald-700 dark:text-emerald-400 text-center" value={p.limite} onChange={e => handleParamChange(p.id, 'limite', e.target.value)} />
                                  </div>
                              )}
                              <div className="flex justify-end w-full lg:w-auto mt-2 lg:mt-0"><button onClick={() => handleRemoveParam(p.id)} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors"><Trash2 size={20}/></button></div>
                           </div>
                         );
                      })}
                      {form.parametros.length === 0 && (<div className="text-center text-slate-400 py-10 text-sm font-bold border-2 border-dashed border-emerald-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900">Nenhum item configurado no laudo. Clique nos botões acima para adicionar.</div>)}
                   </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-4">
                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Cancelar</button>
                <button onClick={handleSave} className="bg-emerald-600 text-white px-10 py-3 rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all text-base">Salvar Estrutura</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}