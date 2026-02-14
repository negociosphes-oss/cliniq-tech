import { useState, useEffect, useMemo } from 'react';
import { 
  X, Save, Loader2, QrCode, Server, Lock, Calendar, 
  Hash, Factory, Building, FileText, Activity, 
  Search, Check, ChevronDown, AlertOctagon, Cpu, Layers, User 
} from 'lucide-react'; // <--- Check importado corretamente
import { supabase } from '../../supabaseClient';
import { LoggerService } from '../../services/LoggerService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipmentToEdit?: any;
}

export function EquipamentosForm({ isOpen, onClose, onSuccess, equipmentToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tecnologias, setTecnologias] = useState<any[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  // Inicializa o formulário com tratamento seguro de dados
  const [formData, setFormData] = useState(() => {
    const base = equipmentToEdit || {};
    return {
        // Converte IDs para string para funcionar nos selects (evita problema do 0)
        tecnologia_id: base.tecnologia_id ? String(base.tecnologia_id) : '',
        cliente_id: base.cliente_id ? String(base.cliente_id) : '',
        
        nome: base.tecnologia?.nome || base.nome || '',
        fabricante: base.tecnologia?.fabricante || base.fabricante || '',
        modelo: base.tecnologia?.modelo || base.modelo || '',
        registro_anvisa: base.tecnologia?.registro_anvisa || base.registro_anvisa || '',
        
        tag: base.tag || '',
        n_serie: base.n_serie || '',
        patrimonio: base.patrimonio || '',
        status: base.status || 'Operacional',
        data_instalacao: base.data_instalacao || ''
    };
  });

  // Carrega listas de apoio
  useEffect(() => {
    const loadDependencies = async () => {
      const [cli, tec] = await Promise.all([
        supabase.from('clientes').select('id, nome_fantasia'),
        supabase.from('tecnologias').select('*').eq('ativo', true).order('nome')
      ]);
      setClientes(cli.data || []);
      setTecnologias(tec.data || []);
    };
    loadDependencies();
  }, []);

  // Garante que o formulário atualize se o item mudar (Edição)
  useEffect(() => {
    if (equipmentToEdit) {
        setFormData({
            tecnologia_id: equipmentToEdit.tecnologia_id ? String(equipmentToEdit.tecnologia_id) : '',
            cliente_id: equipmentToEdit.cliente_id ? String(equipmentToEdit.cliente_id) : '',
            nome: equipmentToEdit.tecnologia?.nome || equipmentToEdit.nome || '',
            fabricante: equipmentToEdit.tecnologia?.fabricante || equipmentToEdit.fabricante || '',
            modelo: equipmentToEdit.tecnologia?.modelo || equipmentToEdit.modelo || '',
            registro_anvisa: equipmentToEdit.tecnologia?.registro_anvisa || equipmentToEdit.registro_anvisa || '',
            tag: equipmentToEdit.tag || '',
            n_serie: equipmentToEdit.n_serie || '',
            patrimonio: equipmentToEdit.patrimonio || '',
            status: equipmentToEdit.status || 'Operacional',
            data_instalacao: equipmentToEdit.data_instalacao || ''
        });
    }
  }, [equipmentToEdit]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Seleção de Tecnologia
  const handleTecnologiaSelect = (tec: any) => {
    if (!tec) {
        setFormData(prev => ({ ...prev, tecnologia_id: '', nome: '', fabricante: '', modelo: '', registro_anvisa: '' }));
    } else {
        setFormData(prev => ({
            ...prev,
            tecnologia_id: String(tec.id),
            nome: tec.nome || '',           
            fabricante: tec.fabricante || '', 
            modelo: tec.modelo || '',       
            registro_anvisa: tec.registro_anvisa || ''
        }));
    }
  };

  // Trava de Duplicidade
  const checkDuplicity = async () => {
    const conditions = [];
    if (formData.tag) conditions.push(`tag.eq.${formData.tag}`);
    if (formData.n_serie && formData.n_serie.length > 3) conditions.push(`n_serie.eq.${formData.n_serie}`);
    
    if (conditions.length === 0) return;

    const { data } = await supabase.from('equipamentos').select('id, tag, n_serie').or(conditions.join(','));

    if (data && data.length > 0) {
        const conflitos = data.filter(item => String(item.id) !== String(equipmentToEdit?.id));
        if (conflitos.length > 0) {
            const erro = conflitos[0];
            if (erro.tag === formData.tag) throw new Error(`O TAG "${formData.tag}" já existe.`);
            if (erro.n_serie === formData.n_serie) throw new Error(`O Nº Série "${formData.n_serie}" já existe.`);
        }
    }
  };

  const handlePreSave = async (e: any) => {
    e.preventDefault();
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
      // PREPARAÇÃO BLINDADA DO PAYLOAD (Corrige erro RLS de ID 0)
      const tecId = Number(formData.tecnologia_id);
      const cliId = Number(formData.cliente_id);

      const payload: any = {
        tag: formData.tag,
        n_serie: formData.n_serie,
        patrimonio: formData.patrimonio,
        status: formData.status,
        // Garante NULL se for 0 ou NaN
        cliente_id: cliId > 0 ? cliId : null,
        tecnologia_id: tecId > 0 ? tecId : null, 
        data_instalacao: formData.data_instalacao || null,
        // Textos redundantes para busca
        nome: formData.nome,
        fabricante: formData.fabricante,
        modelo: formData.modelo,
        registro_anvisa: formData.registro_anvisa
      };

      console.log('Enviando:', payload); 

      if (equipmentToEdit) {
        const { error } = await supabase.from('equipamentos').update(payload).eq('id', equipmentToEdit.id);
        if (error) throw error;
        try { await LoggerService.auditarUpdate('Equipamentos', equipmentToEdit.id, formData.tag, equipmentToEdit, payload, 'Admin'); } catch {}
      } else {
        const { data, error } = await supabase.from('equipamentos').insert([payload]).select().single();
        if (error) throw error;
        try { await LoggerService.log(`Criou Equipamento ${formData.tag}`, 'Admin', 'Equipamentos', {}, String(data.id)); } catch {}
      }
      onSuccess();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message + '\n\n(Dica: Verifique se rodou o script SQL de permissão!)');
      setIsConfirming(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;
  const isTechLocked = !!formData.tecnologia_id && formData.tecnologia_id !== '0';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
      
      {/* MODAL DE CONFIRMAÇÃO */}
      {isConfirming && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 text-center transform transition-all scale-100">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 animate-pulse">
                    <Save size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Salvar Dados?</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                    Você está prestes a gravar o ativo <strong>{formData.tag}</strong>. Confirme para prosseguir.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsConfirming(false)} className="py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">Voltar</button>
                    <button onClick={executeSave} disabled={loading} className="py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="animate-spin" size={18}/> : <Check size={18}/>} Confirmar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* FORMULÁRIO */}
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl flex flex-col h-[90vh] border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Server size={24}/></div>
             <div>
                <h2 className="text-xl font-black text-slate-800 tracking-tight">{equipmentToEdit ? 'Editar Ativo' : 'Novo Ativo'}</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ficha Técnica</span>
             </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-colors"><X size={22}/></button>
        </div>

        {/* Corpo Scrollável */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
          <div className="space-y-8 max-w-5xl mx-auto">
             
             {/* 1. SELEÇÃO CASCATA */}
             <div className={`p-6 rounded-3xl border shadow-sm transition-all duration-300 relative group ${isTechLocked ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100'}`}>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Layers size={14}/> 1. Padrão de Tecnologia</h3>
                        {isTechLocked ? (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1"><Lock size={10}/> Modelo Padronizado Selecionado</p>
                        ) : (
                            <p className="text-[10px] text-slate-400 font-medium mt-1">Selecione na ordem: Tipo &rarr; Marca &rarr; Modelo</p>
                        )}
                    </div>
                    {isTechLocked && (
                        <button type="button" onClick={() => handleTecnologiaSelect(null)} className="text-[10px] font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full hover:bg-rose-100 transition-colors flex items-center gap-1 cursor-pointer z-10 border border-rose-100">
                            <X size={12}/> Trocar Modelo
                        </button>
                    )}
                </div>

                <CascadingTechSelect 
                    tecnologias={tecnologias} 
                    selectedId={formData.tecnologia_id} 
                    onSelect={handleTecnologiaSelect} 
                    isLocked={isTechLocked}
                />

                <div className="mt-6 pt-6 border-t border-slate-200/60 grid grid-cols-12 gap-4 opacity-90">
                    <div className="col-span-12 md:col-span-10">
                        <LockedField label="Registro ANVISA (Automático)" value={formData.registro_anvisa} icon={<FileText size={14}/>} />
                    </div>
                </div>
             </div>

             {/* 2. IDENTIDADE & ADMIN */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><QrCode size={14}/> 2. Identidade</h3>
                    <div className="space-y-5">
                        <div className="relative">
                            <label className="text-[11px] font-bold text-blue-600 mb-1.5 block ml-1 uppercase">TAG *</label>
                            <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18}/>
                            <input className="w-full h-12 pl-12 pr-4 bg-blue-50/30 border border-blue-100 rounded-xl text-lg font-mono font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all uppercase placeholder:text-slate-300" value={formData.tag} onChange={e => handleChange('tag', e.target.value)} placeholder="TAG-0000" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField label="Nº de Série *" value={formData.n_serie} onChange={(v:string) => handleChange('n_serie', v)} icon={<Hash size={14}/>} />
                            <EditableField label="Patrimônio" value={formData.patrimonio} onChange={(v:string) => handleChange('patrimonio', v)} icon={<Hash size={14}/>} />
                        </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Building size={14}/> 3. Localização</h3>
                    <div className="space-y-5">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">Cliente *</label>
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
                                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">Status</label>
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
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 z-20">
          <button type="button" onClick={onClose} className="px-8 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all">Cancelar</button>
          <button type="button" onClick={handlePreSave} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-600/20 flex items-center gap-3 transition-all active:scale-95"><Save size={20}/> Salvar</button>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTES (Corrigidos) ---

function CascadingTechSelect({ tecnologias, selectedId, onSelect, isLocked }: any) {
    const [tipo, setTipo] = useState('');
    const [fabricante, setFabricante] = useState('');
    
    useEffect(() => {
        if (selectedId && tecnologias.length > 0) {
            const tec = tecnologias.find((t: any) => String(t.id) === String(selectedId));
            if (tec) { setTipo(tec.nome); setFabricante(tec.fabricante); }
        } else if (!selectedId) { setTipo(''); setFabricante(''); }
    }, [selectedId, tecnologias]);

    const uniqueTypes = useMemo(() => Array.from(new Set(tecnologias.map((t: any) => t.nome))).sort(), [tecnologias]);
    const availableFabs = useMemo(() => tipo ? Array.from(new Set(tecnologias.filter((t: any) => t.nome === tipo).map((t: any) => t.fabricante))).sort() : [], [tecnologias, tipo]);
    const availableModels = useMemo(() => (tipo && fabricante) ? tecnologias.filter((t: any) => t.nome === tipo && t.fabricante === fabricante).sort((a: any, b: any) => a.modelo.localeCompare(b.modelo)) : [], [tecnologias, tipo, fabricante]);

    const handleModelChange = (e: any) => {
        const modelId = e.target.value;
        if (!modelId) return;
        const selectedTech = tecnologias.find((t: any) => String(t.id) === String(modelId));
        onSelect(selectedTech);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">1. Tipo</label>
                <div className="relative">
                    <Cpu className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <select className={`w-full h-12 pl-12 pr-4 border-2 rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer ${isLocked ? 'bg-slate-100 border-slate-200 text-slate-500 pointer-events-none' : 'bg-white border-slate-200 text-slate-700 focus:border-blue-500'}`} value={tipo} onChange={e => { setTipo(e.target.value); setFabricante(''); onSelect(null); }} disabled={isLocked}>
                        <option value="">Selecione...</option>{uniqueTypes.map((t: any) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {!isLocked && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
                </div>
            </div>
            <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">2. Fabricante</label>
                <div className="relative">
                    <Factory className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <select className={`w-full h-12 pl-12 pr-4 border-2 rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer ${!tipo || isLocked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-slate-200 text-slate-700 focus:border-blue-500'}`} value={fabricante} onChange={e => { setFabricante(e.target.value); onSelect(null); }} disabled={!tipo || isLocked}>
                        <option value="">Selecione...</option>{availableFabs.map((f: any) => <option key={f} value={f}>{f}</option>)}
                    </select>
                    {!isLocked && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>}
                </div>
            </div>
            <div>
                <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">3. Modelo</label>
                <div className="relative">
                    <Server className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <select className={`w-full h-12 pl-12 pr-4 border-2 rounded-xl text-sm font-bold outline-none transition-all appearance-none cursor-pointer ${!fabricante || isLocked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-blue-500 text-blue-700 ring-2 ring-blue-500/10'}`} value={selectedId || ''} onChange={handleModelChange} disabled={!fabricante || isLocked}>
                        <option value="">Selecione...</option>{availableModels.map((m: any) => <option key={m.id} value={m.id}>{m.modelo}</option>)}
                    </select>
                    {!isLocked && <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none"/>}
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

const LockedField = ({ label, value, icon }: any) => (
    <div className="opacity-70 pointer-events-none select-none">
        <label className="text-[11px] font-bold text-slate-500 mb-1.5 block ml-1">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock size={14}/></div>
            <input readOnly className="w-full h-12 rounded-xl text-sm font-bold border-transparent bg-slate-100 text-slate-500 pl-12 pr-4 shadow-none" value={value || ''} />
        </div>
    </div>
);