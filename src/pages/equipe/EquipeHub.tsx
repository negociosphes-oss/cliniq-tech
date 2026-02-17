import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Shield, CreditCard, Briefcase, Lock, FileBadge, Plus, Trash2, Mail, Phone, MapPin, Eraser, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../supabaseClient';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  techToEdit?: any;
  tenantId: number; // 🚀 Nova Prop Obrigatória
}

const CARGOS_PERMITIDOS = [
  'Engenheiro Clínico',
  'Técnico em Equipamentos Médicos',
  'Técnico em Metrologia',
  'Responsável Técnico',
  'Coordenador de Engenharia',
  'Auxiliar Técnico',
  'Administrativo'
];

export function EquipeHub({ isOpen, onClose, onSuccess, techToEdit, tenantId }: Props) {
  const [activeTab, setActiveTab] = useState<'profissional' | 'pessoal' | 'certificados'>('profissional');
  const [loading, setLoading] = useState(false);
  const sigRef = useRef<any>(null);
  
  const [formData, setFormData] = useState(() => {
    if (techToEdit) {
        return {
            ...techToEdit,
            nome: techToEdit.nome || '',
            cargo: techToEdit.cargo || 'Técnico em Equipamentos Médicos',
            registro_profissional: techToEdit.registro_profissional || '',
            assinatura_url: techToEdit.assinatura_url || '',
            cpf: techToEdit.cpf || '',
            rg: techToEdit.rg || '',
            email_login: techToEdit.email_login || '',
            telefone: techToEdit.telefone || '',
            cep: techToEdit.cep || '',
            endereco: techToEdit.endereco || '',
            cidade: techToEdit.cidade || '',
            estado: techToEdit.estado || ''
        };
    }
    return { 
        nome: '', cargo: 'Técnico em Equipamentos Médicos', registro_profissional: '', assinatura_url: '', 
        cpf: '', rg: '', email_login: '', telefone: '', cep: '', endereco: '', cidade: '', estado: '' 
    };
  });

  const [certificados, setCertificados] = useState<any[]>([]);

  useEffect(() => {
    if (techToEdit?.id) fetchCertificados();
  }, [techToEdit]);

  const fetchCertificados = async () => {
    const { data } = await supabase.from('equipe_certificados').select('*').eq('tecnico_id', techToEdit.id).order('data_conclusao', { ascending: false });
    setCertificados(data || []);
  };

  const handleChange = (field: string, value: string) => {
    if (field === 'nome') {
        const titleCaseName = value.toLowerCase().replace(/(?:^|\s)\w/g, match => match.toUpperCase());
        setFormData(prev => ({ ...prev, [field]: titleCaseName }));
    } 
    else if (field === 'email_login') {
        setFormData(prev => ({ ...prev, [field]: value.toLowerCase() }));
    }
    else {
        setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleCanvasUpdate = () => {
    if (sigRef.current && !sigRef.current.isEmpty()) {
        handleChange('assinatura_url', sigRef.current.toDataURL('image/png'));
    }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!formData.nome) return alert('O nome do técnico é obrigatório.');
    if (!formData.email_login) return alert('O E-mail de Login é obrigatório para vincular as horas.');
    setLoading(true);
    
    try {
        if (activeTab === 'profissional' && sigRef.current && !sigRef.current.isEmpty()) {
            formData.assinatura_url = sigRef.current.toDataURL('image/png');
        }

        // 🔒 INJETA O TENANT_ID ANTES DE SALVAR
        const payload = { ...formData, tenant_id: tenantId };

        if (techToEdit) {
            await supabase.from('equipe_tecnica').update(payload).eq('id', techToEdit.id);
            alert('Dados atualizados com sucesso!');
            onSuccess(); 
        } else {
            const { data, error } = await supabase.from('equipe_tecnica').insert([payload]).select().single();
            if (error) throw error;
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
      <div className="bg-theme-card w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden border border-theme flex flex-col">
        
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-md z-10 shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-theme flex items-center justify-center font-bold text-xl shadow-inner border border-white/20">
                    {formData.nome ? formData.nome.charAt(0).toUpperCase() : <User size={24}/>}
                </div>
                <div>
                    <h2 className="text-xl font-bold tracking-tight">{formData.nome || 'Novo Cadastro Técnico'}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{techToEdit?.id ? `MATRÍCULA: ${techToEdit.id}` : 'PREENCHENDO DADOS...'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
        </div>
        
        <div className="flex border-b border-theme bg-theme-page px-6 pt-4 gap-2 shrink-0 overflow-x-auto">
            <TabButton active={activeTab === 'profissional'} onClick={() => setActiveTab('profissional')} label="Perfil Profissional" icon={<Briefcase size={16}/>} />
            <TabButton active={activeTab === 'pessoal'} onClick={() => { handleCanvasUpdate(); setActiveTab('pessoal'); }} label="Dados de Login e RH" icon={<Lock size={16}/>} />
            <TabButton active={activeTab === 'certificados'} onClick={() => { handleCanvasUpdate(); setActiveTab('certificados'); }} label={`Certificados (${certificados.length})`} icon={<FileBadge size={16}/>} disabled={!techToEdit?.id}/>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-theme-page/50">
            
            {activeTab === 'profissional' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                    <div className="bg-theme-card p-6 rounded-xl border border-theme shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-theme pb-2">
                            <div className="w-1 h-6 bg-primary-theme rounded-full"></div>
                            <h3 className="text-sm font-black text-theme-main uppercase tracking-wide">Dados de Identificação nas OSs</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <Field label="Nome Completo (Aparecerá nos Laudos) *" icon={<User size={16}/>} value={formData.nome} onChange={(e:any) => handleChange('nome', e.target.value)} autoFocus />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5 group">
                                    <label className="text-[11px] font-bold uppercase text-theme-muted tracking-wider flex items-center gap-1.5">Cargo / Função *</label>
                                    <div className="relative">
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted"><Briefcase size={16}/></div>
                                        <select 
                                            className="input-theme w-full h-11 rounded-lg font-bold pl-10 appearance-none cursor-pointer"
                                            value={formData.cargo} 
                                            onChange={(e) => handleChange('cargo', e.target.value)}
                                        >
                                            {CARGOS_PERMITIDOS.map(cargo => (
                                                <option key={cargo} value={cargo}>{cargo}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <Field label="Registro Profissional (CREA/CFT)" icon={<Shield size={16}/>} value={formData.registro_profissional} onChange={(e:any) => handleChange('registro_profissional', e.target.value)} placeholder="Nº do Registro" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-theme-card p-6 rounded-xl border border-theme shadow-sm">
                        <div className="flex justify-between items-center mb-4 border-b border-theme pb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                                <h3 className="text-sm font-black text-theme-main uppercase tracking-wide">Assinatura Digitalizada</h3>
                            </div>
                            <button type="button" onClick={() => { if(sigRef.current) sigRef.current.clear(); handleChange('assinatura_url', ''); }} className="text-[11px] text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 px-2 py-1 rounded flex items-center gap-1 font-bold transition-colors">
                                <Eraser size={12}/> Apagar Quadro
                            </button>
                        </div>

                        <div className="border-2 border-theme rounded-xl bg-white overflow-hidden relative cursor-crosshair" style={{ height: '180px' }}>
                            {formData.assinatura_url && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                    <img src={formData.assinatura_url} className="h-24 object-contain" alt="Assinatura atual"/>
                                </div>
                            )}
                            <SignatureCanvas 
                                ref={sigRef} 
                                penColor="#0f172a"
                                canvasProps={{ className: 'w-full h-full relative z-10' }} 
                                onEnd={handleCanvasUpdate}
                            />
                        </div>
                        <p className="text-[11px] text-theme-muted mt-2 text-center font-medium">Desenhe sua assinatura no quadro acima usando o mouse ou touch.</p>
                    </div>
                </div>
            )}

            {activeTab === 'pessoal' && (
                <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex gap-3 text-sm mb-6 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                        <Lock className="shrink-0" size={20}/>
                        <p><b>Atenção:</b> O campo <b>"E-mail de Login"</b> abaixo é fundamental. É através dele que o sistema vincula o usuário que acessou a plataforma aos apontamentos na Ordem de Serviço.</p>
                    </div>

                    <div className="bg-theme-card p-6 rounded-xl border border-theme shadow-sm space-y-4">
                        <Field label="E-mail de Login no Sistema *" icon={<Mail size={16}/>} value={formData.email_login} onChange={(e:any) => handleChange('email_login', e.target.value)} placeholder="email.do.tecnico@empresa.com" />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Telefone / Emergência" icon={<Phone size={16}/>} value={formData.telefone} onChange={(e:any) => handleChange('telefone', e.target.value)} />
                            <Field label="CPF" icon={<CreditCard size={16}/>} value={formData.cpf} onChange={(e:any) => handleChange('cpf', e.target.value)} />
                        </div>
                    </div>

                    <div className="bg-theme-card p-6 rounded-xl border border-theme shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-theme-main uppercase tracking-wide mb-4">Endereço Residencial</h3>
                        <Field label="CEP" icon={<MapPin size={16}/>} value={formData.cep} onChange={(e:any) => handleChange('cep', e.target.value)} />
                        <Field label="Endereço Completo (Rua, Número, Bairro)" value={formData.endereco} onChange={(e:any) => handleChange('endereco', e.target.value)} />
                    </div>
                </div>
            )}

            {activeTab === 'certificados' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-lg text-theme-main">Certificados e Treinamentos</h3>
                            <p className="text-sm text-theme-muted">Mantenha os comprovantes de capacitação atualizados.</p>
                        </div>
                        <button onClick={handleAddCertificado} className="bg-theme-page text-emerald-600 border border-theme px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:border-emerald-500 hover:shadow-sm">
                            <Plus size={16}/> Adicionar Certificado
                        </button>
                    </div>

                    <div className="space-y-3">
                        {certificados.length === 0 ? (
                            <div className="text-center py-10 text-theme-muted font-bold border-2 border-dashed border-theme rounded-xl">
                                Nenhum certificado registrado ainda.
                            </div>
                        ) : certificados.map(cert => (
                            <div key={cert.id} className="bg-theme-card p-5 rounded-xl border border-theme shadow-sm flex justify-between items-center group">
                                <div>
                                    <div className="font-bold text-theme-main flex items-center gap-2 text-base">
                                        <FileBadge size={18} className="text-emerald-500"/> {cert.nome_curso}
                                    </div>
                                    <div className="text-xs text-theme-muted mt-1 flex gap-4">
                                        <span>Conclusão: <b>{cert.data_conclusao ? format(new Date(cert.data_conclusao), 'dd/MM/yyyy') : 'N/A'}</b></span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleDeleteCertificado(cert.id)} className="p-2 text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                                        <Trash2 size={18}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <div className="p-6 border-t border-theme bg-theme-card flex justify-end gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
            <button onClick={onClose} className="px-5 py-2.5 text-theme-muted font-bold hover:bg-theme-page rounded-xl transition-colors text-sm">Fechar</button>
            <button onClick={handleSave} disabled={loading} className="bg-primary-theme text-white px-8 py-2.5 rounded-xl font-bold hover:opacity-90 flex items-center gap-2 shadow-lg text-sm transition-transform active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                Salvar Perfil Completo
            </button>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, icon, ...props }: any) => (
    <div className="flex flex-col gap-1.5 group">
        <label className="text-[11px] font-bold uppercase text-theme-muted tracking-wider group-focus-within:text-primary-theme transition-colors flex items-center gap-1.5">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-primary-theme transition-colors">{icon}</div>}
            <input 
                className={`input-theme w-full h-11 rounded-lg font-bold shadow-sm ${icon ? 'pl-10' : 'px-4'}`}
                {...props}
            />
        </div>
    </div>
);

const TabButton = ({ active, onClick, label, icon, disabled }: any) => (
    <button 
        onClick={onClick} disabled={disabled}
        className={`px-6 py-3 text-xs font-bold border-t-2 rounded-t-lg transition-all flex items-center gap-2 shrink-0
        ${active ? 'bg-theme-card border-primary-theme text-primary-theme shadow-sm' : 'border-transparent text-theme-muted hover:text-theme-main hover:bg-theme-card/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {icon} {label}
    </button>
);