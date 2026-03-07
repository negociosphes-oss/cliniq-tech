import { useState, useEffect, useMemo } from 'react';
import { X, Save, Loader2, QrCode, Server, Lock, Calendar, Hash, Factory, Building, FileText, Activity, Search, Check, ChevronDown, AlertOctagon, Cpu, Layers, User, DollarSign, UploadCloud, ShieldCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void; editId?: number | null; equipmentToEdit?: any; tenantId?: number; }

export function EquipamentosForm({ isOpen, onClose, onSuccess, editId, equipmentToEdit, tenantId = 1 }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Estados do Dicionário Limpo
  const [dictTecnologias, setDictTecnologias] = useState<any[]>([]);
  const [dictFabricantes, setDictFabricantes] = useState<any[]>([]);
  const [dictModelos, setDictModelos] = useState<any[]>([]);

  // 🚀 ESTADO DO FORMULÁRIO (INICIA VAZIO E É HIDRATADO DEPOIS)
  const [formData, setFormData] = useState({
        modelo_dict_id: '',
        cliente_id: '',
        nome: '',
        fabricante: '',
        modelo: '',
        registro_anvisa: '',
        tag: '',
        n_serie: '',
        patrimonio: '',
        status: 'Operacional',
        data_instalacao: '',
        classe_risco: 'I - Baixo Risco',
        data_aquisicao: '',
        vencimento_garantia: '',
        valor_bem: 0,
        manual_url: ''
  });

  // 🚀 BUSCA BLINDADA DE DEPENDÊNCIAS
  useEffect(() => {
    const loadDependencies = async () => {
      try {
          const { data: cli } = await supabase.from('clientes').select('id, nome_fantasia');
          if (cli) setClientes(cli);
      } catch (e) { console.error("Erro Clientes:", e); }

      try {
          const { data: tec } = await supabase.from('dict_tecnologias').select('*').order('nome');
          if (tec) setDictTecnologias(tec);
      } catch (e) { console.error("Erro Tecnologias:", e); }

      try {
          const { data: fab } = await supabase.from('dict_fabricantes').select('*').order('nome');
          if (fab) setDictFabricantes(fab);
      } catch (e) { console.error("Erro Fabricantes:", e); }

      try {
          const { data: mod } = await supabase.from('dict_modelos').select('*').order('nome');
          if (mod) setDictModelos(mod);
      } catch (e) { console.error("Erro Modelos:", e); }
    };
    
    loadDependencies();
  }, []);

  // 🚀 A CURA DOS FANTASMAS: O MOTOR DE HIDRATAÇÃO DO MODO "EDIÇÃO"
  useEffect(() => {
      const fetchEquipmentToEdit = async () => {
          // Se recebemos o objeto já pronto da tabela principal, usamos ele.
          if (equipmentToEdit) {
              hydrateForm(equipmentToEdit);
              return;
          }

          // Se recebemos apenas o ID, nós buscamos no banco (Forma Segura)
          if (editId && isOpen) {
              setLoading(true);
              try {
                  const { data, error } = await supabase
                      .from('equipamentos')
                      .select('*') // 🚀 Busca limpa, sem pedir tabelas relacionadas para não dar o erro do "Could not embed"
                      .eq('id', editId)
                      .single();
                  
                  if (error) throw error;
                  if (data) hydrateForm(data);

              } catch (error) {
                  console.error('Erro ao carregar dados para edição:', error);
              } finally {
                  setLoading(false);
              }
          } else if (!editId && !equipmentToEdit) {
              // É um Novo Ativo, reseta o form
              setFormData({
                  modelo_dict_id: '', cliente_id: '', nome: '', fabricante: '', modelo: '', registro_anvisa: '',
                  tag: '', n_serie: '', patrimonio: '', status: 'Operacional', data_instalacao: '',
                  classe_risco: 'I - Baixo Risco', data_aquisicao: '', vencimento_garantia: '', valor_bem: 0, manual_url: ''
              });
          }
      };

      fetchEquipmentToEdit();
  }, [editId, equipmentToEdit, isOpen]);

  // Função auxiliar para preencher o state sem repetição de código
  const hydrateForm = (base: any) => {
      setFormData({
          modelo_dict_id: base.modelo_dict_id ? String(base.modelo_dict_id) : '',
          cliente_id: base.cliente_id ? String(base.cliente_id) : '',
          nome: base.nome || base.tecnologia?.nome || '',
          fabricante: base.fabricante || base.tecnologia?.fabricante || '',
          modelo: base.modelo || base.tecnologia?.modelo || '',
          registro_anvisa: base.registro_anvisa || '',
          tag: base.tag || '',
          n_serie: base.n_serie || '',
          patrimonio: base.patrimonio || '',
          status: base.status || 'Operacional',
          data_instalacao: base.data_instalacao || '',
          classe_risco: base.classe_risco || 'I - Baixo Risco',
          data_aquisicao: base.data_aquisicao || '',
          vencimento_garantia: base.vencimento_garantia || '',
          valor_bem: base.valor_bem || 0,
          manual_url: base.manual_url || ''
      });
  };


  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectModeloDict = (modeloSelecionado: any, tecNome: string, fabNome: string) => {
      if (!modeloSelecionado) {
          setFormData(prev => ({ ...prev, modelo_dict_id: '', nome: '', fabricante: '', modelo: '' }));
      } else {
          setFormData(prev => ({
              ...prev, 
              modelo_dict_id: String(modeloSelecionado.id),
              nome: tecNome, 
              fabricante: fabNome, 
              modelo: modeloSelecionado.nome
          }));
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `manuais/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
      const { error: uploadError } = await supabase.storage.from('app-assets').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
      handleChange('manual_url', data.publicUrl);
    } catch (err) { alert('Erro ao fazer upload do documento.'); } finally { setUploading(false); }
  };

  const checkDuplicity = async () => {
    const conditions = [];
    if (formData.tag) conditions.push(`tag.eq.${formData.tag}`);
    if (formData.n_serie && formData.n_serie.length > 3) conditions.push(`n_serie.eq.${formData.n_serie}`);
    if (conditions.length === 0) return;

    const { data } = await supabase.from('equipamentos').select('id, tag, n_serie').or(conditions.join(','));
    if (data && data.length > 0) {
        // Usa o editId ou o equipmentToEdit.id para comparar
        const currentId = editId || equipmentToEdit?.id;
        const conflitos = data.filter(item => String(item.id) !== String(currentId));
        
        if (conflitos.length > 0) {
            const erro = conflitos[0];
            if (erro.tag === formData.tag) throw new Error(`A TAG "${formData.tag}" já existe noutro equipamento.`);
            if (erro.n_serie === formData.n_serie) throw new Error(`O Nº Série "${formData.n_serie}" já existe.`);
        }
    }
  };

  const handlePreSave = async (e: any) => {
    e.preventDefault();
    if (!formData.modelo_dict_id && !formData.nome) return alert('Você deve selecionar um Modelo no Dicionário (Cascata). Se a lista estiver vazia, vá no Menu de Tecnologias e cadastre um Modelo na aba 3.');
    if (!formData.tag || !formData.cliente_id) return alert('Campos obrigatórios: TAG e Cliente.');
    try {
        setLoading(true);
        await checkDuplicity();
        setLoading(false);
        setIsConfirming(true);
    } catch (err: any) {
        setLoading(false);
        alert('BLOQUEIO DE SEGURANÇA:\n' + err.message);
    }
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const cliId = Number(formData.cliente_id);
      const modDictId = Number(formData.modelo_dict_id);

      const payload: any = {
        tenant_id: tenantId, 
        tag: formData.tag, 
        n_serie: formData.n_serie, 
        patrimonio: formData.patrimonio, 
        status: formData.status,
        cliente_id: cliId > 0 ? cliId : null, 
        data_instalacao: formData.data_instalacao || null, 
        
        modelo_dict_id: modDictId > 0 ? modDictId : null,
        
        nome: formData.nome, 
        fabricante: formData.fabricante, 
        modelo: formData.modelo, 
        registro_anvisa: formData.registro_anvisa,
        classe_risco: formData.classe_risco, 
        data_aquisicao: formData.data_aquisicao || null, 
        vencimento_garantia: formData.vencimento_garantia || null, 
        valor_bem: Number(formData.valor_bem) || 0, 
        manual_url: formData.manual_url
      };

      const currentId = editId || equipmentToEdit?.id;

      if (currentId) {
        await supabase.from('equipamentos').update(payload).eq('id', currentId);
      } else {
        await supabase.from('equipamentos').insert([payload]);
      }
      setIsConfirming(false);
      onSuccess(); // Isso fecha o modal e chama o fetchData da listagem principal
    } catch (error: any) { alert('Erro ao salvar: ' + error.message); setIsConfirming(false); } finally { setLoading(false); }
  };

  if (!isOpen) return null;
  const isLocked = !!formData.modelo_dict_id;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
      {isConfirming && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 animate-pulse"><Save size={32} /></div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Salvar Dados?</h3>
                <p className="text-sm text-slate-500 mb-6">Você está prestes a gravar o ativo <strong>{formData.tag}</strong>. Confirme para prosseguir.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsConfirming(false)} className="py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Voltar</button>
                    <button onClick={executeSave} disabled={loading} className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>} Confirmar</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-[90vh] border border-slate-200 overflow-hidden relative">
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Server size={24}/></div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{(editId || equipmentToEdit) ? 'Editar Ativo' : 'Novo Ativo'}</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prontuário Completo</span>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={22}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          
          {/* Se estiver carregando, mostra tela de Loading (previne renderizar vazio) */}
          {loading && (editId || equipmentToEdit) ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 size={40} className="animate-spin mb-4 text-blue-500"/>
                  <p className="font-bold">Buscando dados no banco...</p>
              </div>
          ) : (
              <div className="space-y-8 max-w-5xl mx-auto">
                 
                 <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 relative group ${isLocked ? 'bg-slate-50 border-slate-200' : 'bg-white border-blue-200 ring-4 ring-blue-50'}`}>
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xs font-black text-blue-800 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> 1. Matriz de Tecnologia</h3>
                            <p className="text-[10px] text-blue-600 font-medium mt-1">Selecione o modelo exato no Dicionário Padrão da Engenharia Clínica.</p>
                        </div>
                        {isLocked && (<button type="button" onClick={() => handleSelectModeloDict(null, '', '')} className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer z-10 border border-rose-100"><X size={12}/> Trocar Modelo</button>)}
                    </div>
                    
                    <CascadingDictSelect 
                        dictTecnologias={dictTecnologias} 
                        dictFabricantes={dictFabricantes} 
                        dictModelos={dictModelos}
                        selectedModeloId={formData.modelo_dict_id} 
                        onSelectModelo={handleSelectModeloDict}
                        isLocked={isLocked}
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><QrCode size={14}/> 2. Identidade do Equipamento</h3>
                        <div className="space-y-5">
                            <div className="relative">
                                <label className="text-[11px] font-bold text-blue-600 mb-1.5 block ml-1 uppercase">TAG do Ativo *</label>
                                <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18}/>
                                <input className="w-full h-12 pl-12 pr-4 bg-blue-50/30 border border-blue-100 rounded-xl text-lg font-mono font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:text-slate-300" value={formData.tag} onChange={e => handleChange('tag', e.target.value)} placeholder="TAG-0000" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableField label="Nº de Série *" value={formData.n_serie} onChange={(v:string) => handleChange('n_serie', v)} icon={<Hash size={14}/>} />
                                <EditableField label="Patrimônio" value={formData.patrimonio} onChange={(v:string) => handleChange('patrimonio', v)} icon={<Hash size={14}/>} />
                            </div>
                            <EditableField label="Registro ANVISA / MS" value={formData.registro_anvisa} onChange={(v:string) => handleChange('registro_anvisa', v)} icon={<FileText size={14}/>} />
                        </div>
                     </div>

                     <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Building size={14}/> 3. Localização e Status</h3>
                        <div className="space-y-5">
                            <div>
                                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">Cliente / Unidade *</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <select className="w-full h-12 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none" value={formData.cliente_id} onChange={e => handleChange('cliente_id', e.target.value)}>
                                        <option value="">Selecione o cliente...</option>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia}</option>)}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">Status Atual</label>
                                    <div className="relative">
                                        <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                        <select className="w-full h-12 pl-12 pr-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none" value={formData.status} onChange={e => handleChange('status', e.target.value)}><option>Operacional</option><option>Manutenção</option><option>Inativo</option></select>
                                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                                    </div>
                                </div>
                                <EditableField label="Data Instalação" type="date" value={formData.data_instalacao} onChange={(v:string) => handleChange('data_instalacao', v)} icon={<Calendar size={14}/>} />
                            </div>
                        </div>
                     </div>
                 </div>

                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><FileText size={14}/> 4. Prontuário Avançado (Financeiro / Risco)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">Classe de Risco (ANVISA)</label>
                            <select className="w-full h-12 px-4 bg-white border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={formData.classe_risco} onChange={e => handleChange('classe_risco', e.target.value)}>
                                <option>I - Baixo Risco</option><option>II - Médio Risco</option><option>III - Alto Risco</option><option>IV - Máximo Risco</option>
                            </select>
                        </div>
                        <EditableField label="Valor Aquisição (R$)" type="number" value={formData.valor_bem} onChange={(v:any) => handleChange('valor_bem', v)} icon={<DollarSign size={14}/>} />
                        <EditableField label="Data de Aquisição" type="date" value={formData.data_aquisicao} onChange={(v:any) => handleChange('data_aquisicao', v)} icon={<Calendar size={14}/>} />
                        <EditableField label="Vencimento Garantia" type="date" value={formData.vencimento_garantia} onChange={(v:any) => handleChange('vencimento_garantia', v)} icon={<ShieldCheck size={14}/>} />
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <label className="text-[11px] font-bold text-slate-500 mb-2 block">Manual do Equipamento / Datasheet (PDF)</label>
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <label className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-50 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl cursor-pointer hover:bg-slate-100 hover:border-blue-400 transition-all font-bold text-sm w-full md:w-auto">
                                <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                                {uploading ? <Loader2 className="animate-spin" size={18}/> : <UploadCloud size={18}/>} 
                                {uploading ? 'Enviando...' : 'Fazer Upload do Documento'}
                            </label>
                            {formData.manual_url && (
                                <a href={formData.manual_url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:text-blue-800 underline flex items-center gap-1"><FileText size={16}/> Ver Manual Salvo</a>
                            )}
                        </div>
                    </div>
                 </div>

              </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 z-20">
          <button type="button" onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
          <button type="button" onClick={handlePreSave} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 flex items-center gap-3 transition-all active:scale-95"><Save size={20}/> Salvar Ativo</button>
        </div>
      </div>
    </div>
  );
}

// MOTOR DE CASCATA
function CascadingDictSelect({ dictTecnologias, dictFabricantes, dictModelos, selectedModeloId, onSelectModelo, isLocked }: any) {
  const [tecId, setTecId] = useState('');
  const [fabId, setFabId] = useState('');
  
  useEffect(() => {
      if (selectedModeloId && dictModelos.length > 0) {
          const mod = dictModelos.find((m: any) => String(m.id) === String(selectedModeloId));
          if (mod) { 
              setTecId(String(mod.tecnologia_id)); 
              setFabId(String(mod.fabricante_id)); 
          }
      } else if (!selectedModeloId) { 
          setTecId(''); 
          setFabId(''); 
      }
  }, [selectedModeloId, dictModelos]);

  const availableFabs = useMemo(() => {
      if (!tecId || !dictModelos || !dictFabricantes) return [];
      const modelosDaTec = dictModelos.filter((m:any) => String(m.tecnologia_id) === String(tecId));
      const fabIdsUnicos = Array.from(new Set(modelosDaTec.map((m:any) => String(m.fabricante_id))));
      return dictFabricantes.filter((f:any) => fabIdsUnicos.includes(String(f.id)));
  }, [tecId, dictModelos, dictFabricantes]);

  const availableModels = useMemo(() => {
      if (!tecId || !fabId || !dictModelos) return [];
      return dictModelos.filter((m:any) => String(m.tecnologia_id) === String(tecId) && String(m.fabricante_id) === String(fabId));
  }, [tecId, fabId, dictModelos]);

  const handleModChange = (e: any) => {
      const mId = e.target.value;
      if (!mId) {
          onSelectModelo(null, '', '');
          return;
      }
      const selectedMod = dictModelos.find((m: any) => String(m.id) === String(mId));
      const nomeTec = dictTecnologias.find((t:any) => String(t.id) === String(selectedMod.tecnologia_id))?.nome || '';
      const nomeFab = dictFabricantes.find((f:any) => String(f.id) === String(selectedMod.fabricante_id))?.nome || '';
      
      onSelectModelo(selectedMod, nomeTec, nomeFab);
  };

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-blue-600 mb-1.5 block ml-1">1. Tecnologia (Tipo) *</label>
            <div className="relative">
                <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16}/>
                <select className={`w-full h-12 pl-12 pr-4 border-2 rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer ${isLocked ? 'bg-slate-100 border-slate-200 text-slate-500 pointer-events-none' : 'bg-white border-blue-200 text-slate-700 focus:border-blue-500'}`} value={tecId} onChange={e => { setTecId(e.target.value); setFabId(''); onSelectModelo(null, '', ''); }} disabled={isLocked}>
                    <option value="">Selecione a Tecnologia...</option>{(dictTecnologias || []).map((t: any) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
                {!isLocked && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-blue-600 mb-1.5 block ml-1">2. Fabricante *</label>
            <div className="relative">
                <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16}/>
                <select className={`w-full h-12 pl-12 pr-4 border-2 rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer ${!tecId || isLocked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-blue-200 text-slate-700 focus:border-blue-500'}`} value={fabId} onChange={e => { setFabId(e.target.value); onSelectModelo(null, '', ''); }} disabled={!tecId || isLocked}>
                    <option value="">Selecione o Fabricante...</option>{availableFabs.map((f: any) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                </select>
                {!isLocked && tecId && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-blue-600 mb-1.5 block ml-1">3. Modelo Exato *</label>
            <div className="relative">
                <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={16}/>
                <select className={`w-full h-12 pl-12 pr-4 border-2 rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer ${!fabId || isLocked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-blue-500 text-blue-700 ring-2 ring-blue-500/20'}`} value={selectedModeloId || ''} onChange={handleModChange} disabled={!fabId || isLocked}>
                    <option value="">Selecione o Modelo...</option>{availableModels.map((m: any) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
                {!isLocked && fabId && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"/>}
            </div>
          </div>
      </div>
  );
}

const EditableField = ({ label, value, onChange, type = "text", icon }: any) => (
  <div>
    <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">{label}</label>
    <div className="relative group">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors">{icon}</div>}
        <input type={type} className="w-full h-12 rounded-xl text-sm font-bold border-2 border-slate-100 bg-white text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all pl-12 pr-4" value={value || ''} onChange={e => onChange(e.target.value)} />
    </div>
  </div>
);