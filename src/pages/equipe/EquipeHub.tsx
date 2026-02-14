import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Shield, CreditCard, Briefcase, Lock, FileBadge, Plus, Trash2, Mail, Phone, MapPin, Eraser, Loader2, Upload } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../supabaseClient';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  techToEdit?: any;
}

export function EquipeHub({ isOpen, onClose, onSuccess, techToEdit }: Props) {
  const [activeTab, setActiveTab] = useState<'profissional' | 'pessoal' | 'certificados'>('profissional');
  const [loading, setLoading] = useState(false);
  const sigRef = useRef<any>(null);
  
  // DADOS DO TÉCNICO
  const [formData, setFormData] = useState(() => {
    if (techToEdit) return { ...techToEdit };
    return { 
        nome: '', cargo: '', registro_profissional: '', assinatura_url: '', // Profissional
        cpf: '', rg: '', email: '', telefone: '', cep: '', endereco: '', cidade: '', estado: '' // Pessoal
    };
  });

  // CERTIFICADOS (Sub-tabela)
  const [certificados, setCertificados] = useState<any[]>([]);

  useEffect(() => {
    if (techToEdit?.id) fetchCertificados();
  }, [techToEdit]);

  const fetchCertificados = async () => {
    const { data } = await supabase.from('equipe_certificados').select('*').eq('tecnico_id', techToEdit.id).order('data_conclusao', { ascending: false });
    setCertificados(data || []);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Salva no estado o desenho da assinatura se o usuário rabiscou algo antes de mudar de aba
  const handleCanvasUpdate = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
        handleChange('assinatura_url', sigRef.current.toDataURL('image/png'));
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!formData.nome) return alert('O nome do técnico é obrigatório.');
    setLoading(true);
    
    try {
        // Se a aba atual é a profissional, pega a assinatura do quadro
        if (activeTab === 'profissional' && sigRef.current && !sigRef.current.isEmpty()) {
            formData.assinatura_url = sigRef.current.toDataURL('image/png');
        }

        if (techToEdit) {
            await supabase.from('equipe_tecnica').update(formData).eq('id', techToEdit.id);
            alert('Dados atualizados com sucesso!');
            onSuccess(); // Fecha o modal e atualiza
        } else {
            const { data, error } = await supabase.from('equipe_tecnica').insert([formData]).select().single();
            if (error) throw error;
            // Se for novo, não fecha imediatamente, apenas atualiza para permitir add certificados
            techToEdit = data;
            alert('Técnico criado! Agora você pode adicionar Certificados na aba correspondente.');
            onSuccess(); 
        }
    } catch (error: any) {
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  // --- FUNÇÕES DE CERTIFICADOS ---
  const handleAddCertificado = async () => {
    if (!techToEdit?.id) return alert('Salve o cadastro principal do técnico primeiro.');
    const curso = prompt('Nome do Treinamento/Curso (Ex: NR-10):');
    if (!curso) return;

    await supabase.from('equipe_certificados').insert([{ 
        tecnico_id: techToEdit.id, 
        nome_curso: curso,
        data_conclusao: new Date().toISOString()
    }]);
    fetchCertificados();
  };

  const handleDeleteCertificado = async (id: number) => {
    if (!confirm('Excluir certificado?')) return;
    await supabase.from('equipe_certificados').delete().eq('id', id);
    fetchCertificados();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
        
        {/* HEADER ESCURO CORPORATIVO */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-md z-10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-xl shadow-inner border border-indigo-400">
                    {formData.nome ? formData.nome.charAt(0).toUpperCase() : <User size={24}/>}
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{formData.nome || 'Novo Cadastro Técnico'}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{techToEdit?.id ? `MATRÍCULA: ${techToEdit.id}` : 'PREENCHENDO DADOS...'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        {/* ABAS */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-4 gap-2 shrink-0">
            <TabButton active={activeTab === 'profissional'} onClick={() => setActiveTab('profissional')} label="Perfil Profissional" icon={<Briefcase size={16}/>} />
            <TabButton active={activeTab === 'pessoal'} onClick={() => { handleCanvasUpdate(); setActiveTab('pessoal'); }} label="Dados Internos (RH)" icon={<Lock size={16}/>} />
            <TabButton active={activeTab === 'certificados'} onClick={() => { handleCanvasUpdate(); setActiveTab('certificados'); }} label={`Certificados (${certificados.length})`} icon={<FileBadge size={16}/>} disabled={!techToEdit?.id}/>
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-100">
            
            {/* ABA 1: PROFISSIONAL & ASSINATURA */}
            {activeTab === 'profissional' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-2">
                            <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
                            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Dados de Identificação nas OSs</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <Field label="Nome Completo (Aparecerá nos Laudos) *" icon={<User size={16}/>} value={formData.nome} onChange={(e:any) => handleChange('nome', e.target.value)} autoFocus />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Cargo / Função" icon={<Briefcase size={16}/>} value={formData.cargo} onChange={(e:any) => handleChange('cargo', e.target.value)} placeholder="Ex: Engenheiro Clínico" />
                                <Field label="Registro Profissional (CREA/CFT)" icon={<Shield size={16}/>} value={formData.registro_profissional} onChange={(e:any) => handleChange('registro_profissional', e.target.value)} placeholder="Nº do Registro" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Assinatura Digitalizada</h3>
                            </div>
                            <button type="button" onClick={() => { if(sigRef.current) sigRef.current.clear(); handleChange('assinatura_url', ''); }} className="text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded flex items-center gap-1 font-bold transition-colors">
                                <Eraser size={12}/> Apagar Quadro
                            </button>
                        </div>

                        <div className="border-2 border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative cursor-crosshair" style={{ height: '180px' }}>
                            {/* Fundo fantasma da assinatura atual (se não tocarem no quadro, mantemos a antiga) */}
                            {formData.assinatura_url && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <img src={formData.assinatura_url} className="h-24 object-contain" alt="Assinatura atual"/>
                                </div>
                            )}
                            {/* Quadro interativo */}
                            <SignatureCanvas 
                                ref={sigRef} 
                                penColor="#0f172a"
                                canvasProps={{ className: 'w-full h-full relative z-10' }} 
                                onEnd={handleCanvasUpdate}
                            />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 text-center font-medium">Desenhe sua assinatura no quadro acima usando o mouse ou touch.</p>
                    </div>
                </div>
            )}

            {/* ABA 2: DADOS PESSOAIS (Controle Interno) */}
            {activeTab === 'pessoal' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex gap-3 text-sm mb-6">
                        <Lock className="shrink-0" size={20}/>
                        <p><b>Controle Interno:</b> Estes dados são sensíveis e protegidos. Eles não aparecem em Ordens de Serviço ou laudos emitidos para clientes.</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="CPF" icon={<CreditCard size={16}/>} value={formData.cpf} onChange={(e:any) => handleChange('cpf', e.target.value)} />
                            <Field label="RG / Órgão Expedidor" value={formData.rg} onChange={(e:any) => handleChange('rg', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Email Pessoal/Corporativo" icon={<Mail size={16}/>} value={formData.email} onChange={(e:any) => handleChange('email', e.target.value)} />
                            <Field label="Telefone / Emergência" icon={<Phone size={16}/>} value={formData.telefone} onChange={(e:any) => handleChange('telefone', e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide mb-4">Endereço Residencial</h3>
                        <Field label="CEP" icon={<MapPin size={16}/>} value={formData.cep} onChange={(e:any) => handleChange('cep', e.target.value)} />
                        <Field label="Endereço Completo (Rua, Número, Bairro)" value={formData.endereco} onChange={(e:any) => handleChange('endereco', e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Cidade" value={formData.cidade} onChange={(e:any) => handleChange('cidade', e.target.value)} />
                            <Field label="Estado (UF)" value={formData.estado} onChange={(e:any) => handleChange('estado', e.target.value)} maxLength={2}/>
                        </div>
                    </div>
                </div>
            )}

            {/* ABA 3: CERTIFICADOS */}
            {activeTab === 'certificados' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800">Certificados e Treinamentos</h3>
                            <p className="text-sm text-slate-500">Mantenha os comprovantes de capacitação atualizados.</p>
                        </div>
                        <button onClick={handleAddCertificado} className="btn-secondary bg-white text-emerald-600 border border-emerald-200 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-emerald-50 shadow-sm">
                            <Plus size={16}/> Adicionar Certificado
                        </button>
                    </div>

                    <div className="space-y-3">
                        {certificados.map(cert => (
                            <div key={cert.id} className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-slate-800 flex items-center gap-2 text-base">
                                        <FileBadge size={18} className="text-emerald-500"/> {cert.nome_curso}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 flex gap-4">
                                        <span>Conclusão: <b>{cert.data_conclusao ? format(new Date(cert.data_conclusao), 'dd/MM/yyyy') : 'N/A'}</b></span>
                                        {cert.validade && <span className="text-amber-600 font-medium">Validade: {format(new Date(cert.validade), 'dd/MM/yyyy')}</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                        <Upload size={14}/> Anexar PDF
                                    </button>
                                    <button onClick={() => handleDeleteCertificado(cert.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {certificados.length === 0 && (
                            <div className="text-center p-12 bg-white border-2 border-dashed border-slate-300 rounded-2xl text-slate-400">
                                <FileBadge size={32} className="mx-auto mb-3 opacity-50"/>
                                Nenhum certificado registrado para este técnico.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER FIXO (Ações Globais) */}
        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Fechar</button>
            <button onClick={handleSave} disabled={loading} className="btn-primary bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold hover:bg-black flex items-center gap-2 shadow-lg text-sm transition-transform active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                Salvar Perfil Completo
            </button>
        </div>
      </div>
    </div>
  );
}

// Componente de Input "Caixa Forte"
const Field = ({ label, icon, ...props }: any) => (
    <div className="flex flex-col gap-1.5 group">
        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider group-focus-within:text-indigo-600 transition-colors flex items-center gap-1.5">
            {label}
        </label>
        <div className="relative">
            {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">{icon}</div>}
            <input 
                className={`w-full h-11 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm ${icon ? 'pl-10' : 'px-4'}`}
                {...props}
            />
        </div>
    </div>
);

// Componente de Aba Visual
const TabButton = ({ active, onClick, label, icon, disabled }: any) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`px-6 py-3 text-xs font-bold border-t-2 rounded-t-lg transition-all flex items-center gap-2 
        ${active ? 'bg-white border-indigo-600 text-indigo-700 shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {icon} {label}
    </button>
);