import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowRight, Layers, GitBranch, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

export function ChecklistRules() {
  const [regras, setRegras] = useState<any[]>([]);
  const [tecnologias, setTecnologias] = useState<any[]>([]);
  const [modelos, setModelos] = useState<any[]>([]);
  
  const [tiposOs, setTiposOs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [novoTipo, setNovoTipo] = useState('');
  const [novoTecId, setNovoTecId] = useState(''); 
  const [novoCheckId, setNovoCheckId] = useState('');

  useEffect(() => {
    fetchDados();
  }, []);

  const fetchDados = async () => {
    setLoading(true);
    // 🚀 CORREÇÃO CRÍTICA: Removido o 'nome' de checklists_biblioteca, pedindo apenas o 'titulo' que existe no banco
    const [resRegras, resTecs, resMods, resTipos] = await Promise.all([
      supabase.from('checklists_regras').select('*, tecnologias(nome), checklists_biblioteca(titulo)'),
      supabase.from('tecnologias').select('id, nome').order('nome'),
      supabase.from('checklists_biblioteca').select('id, titulo').order('id', { ascending: false }),
      supabase.from('tipos_ordem_servico').select('*').order('nome') 
    ]);

    setRegras(resRegras.data || []);
    setTecnologias(resTecs.data || []);
    setModelos(resMods.data || []);
    setTiposOs(resTipos.data || []);
    setLoading(false);
  };

  const handleAddRule = async () => {
    if (!novoTipo || !novoCheckId) return alert('Selecione o Tipo de Serviço e o Modelo de Checklist.');

    setSaving(true);
    const techIdParaSalvar = novoTecId ? Number(novoTecId) : null;

    const { error } = await supabase.from('checklists_regras').insert([{
      tipo_servico: novoTipo,
      tecnologia_id: techIdParaSalvar, 
      checklist_id: Number(novoCheckId)
    }]);

    if (error) {
      if(error.code === '23505') alert('Já existe uma regra igual cadastrada.');
      else alert('Erro ao criar regra: ' + error.message);
    } else {
      fetchDados();
      setNovoTecId(''); 
      setNovoCheckId('');
      setNovoTipo('');
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if(!confirm('Remover esta regra de automação?')) return;
    await supabase.from('checklists_regras').delete().eq('id', id);
    fetchDados();
  };

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center py-20 text-theme-muted">
              <Loader2 className="animate-spin mb-4" size={40}/>
              <p className="font-bold">Sincronizando motor de regras...</p>
          </div>
      );
  }

  return (
    <div className="animate-fadeIn">
      
      <div className="bg-theme-card border border-theme p-6 md:p-8 rounded-[32px] shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-theme"></div>
        
        <h4 className="font-black text-lg text-theme-main mb-6 flex items-center gap-2">
            <GitBranch size={20} className="text-primary-theme"/> Nova Regra de Automação
        </h4>
        
        <div className="flex flex-col md:flex-row gap-5 items-end">
          
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase text-theme-muted tracking-wider mb-1.5 block">Se a OS for do tipo...</label>
            <select 
                className="input-theme w-full h-12 px-4 rounded-xl font-bold text-sm cursor-pointer" 
                value={novoTipo} 
                onChange={e => setNovoTipo(e.target.value)}
            >
              <option value="">Selecione a Natureza...</option>
              {tiposOs.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase text-theme-muted tracking-wider mb-1.5 block">E o Equipamento for...</label>
            <select 
                className="input-theme w-full h-12 px-4 rounded-xl font-bold text-sm cursor-pointer" 
                value={novoTecId} 
                onChange={e => setNovoTecId(e.target.value)}
            >
              <option value="" className="font-black text-primary-theme">✨ QUALQUER UM (Regra Global)</option>
              <optgroup label="Específico por Tecnologia">
                {tecnologias.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </optgroup>
            </select>
          </div>

          <div className="hidden md:flex pb-3 text-theme-muted"><ArrowRight size={24}/></div>

          <div className="flex-1 w-full">
            <label className="text-[10px] font-black uppercase text-theme-muted tracking-wider mb-1.5 block">Exigir este Formulário:</label>
            <select 
                className="input-theme w-full h-12 px-4 rounded-xl font-bold text-sm cursor-pointer" 
                value={novoCheckId} 
                onChange={e => setNovoCheckId(e.target.value)}
            >
              <option value="">Selecione o Modelo...</option>
              {modelos.map(m => <option key={m.id} value={m.id}>{m.titulo || 'Sem Título'}</option>)}
            </select>
          </div>

          <button 
            onClick={handleAddRule} 
            disabled={saving || !novoTipo || !novoCheckId}
            className="h-12 px-8 bg-primary-theme text-white rounded-xl font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} strokeWidth={3}/>} 
            SALVAR REGRA
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 px-2">
          <h3 className="font-black text-theme-main text-lg">Regras Ativas</h3>
          <span className="bg-theme-page text-theme-muted px-3 py-1 rounded-full text-xs font-bold border border-theme">{regras.length} configuradas</span>
      </div>

      <div className="space-y-3">
        {regras.map(regra => {
            const tituloChecklist = regra.checklists_biblioteca?.titulo || 'Checklist Excluído';
            
            return (
              <div key={regra.id} className="bg-theme-card border border-theme p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-sm hover:border-primary-theme transition-all group gap-4">
                
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <span className="px-4 py-1.5 bg-theme-page border border-theme text-theme-main rounded-lg font-black text-xs uppercase tracking-widest">
                      {regra.tipo_servico}
                  </span>
                  
                  <span className="text-theme-muted font-bold">+</span>
                  
                  {regra.tecnologia_id ? (
                     <span className="font-bold text-theme-main flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                         {regra.tecnologias?.nome}
                     </span>
                  ) : (
                     <span className="font-black text-primary-theme bg-primary-theme/10 border border-primary-theme/20 px-3 py-1 rounded-md text-xs flex items-center gap-1.5 uppercase tracking-widest">
                         <Layers size={14}/> TODOS (Global)
                     </span>
                  )}

                  <ArrowRight size={18} className="text-theme-muted hidden md:block mx-2"/>
                  
                  <span className="font-black text-primary-theme flex items-center gap-2">
                      {tituloChecklist}
                  </span>
                </div>
                
                <button 
                  onClick={() => handleDelete(regra.id)} 
                  className="p-2.5 text-theme-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all self-end md:self-auto"
                  title="Excluir Regra"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            );
        })}
        {regras.length === 0 && (
            <div className="p-12 text-center border-2 border-dashed border-theme rounded-3xl text-theme-muted font-bold">
                Nenhuma regra de automação definida.
            </div>
        )}
      </div>
    </div>
  );
}