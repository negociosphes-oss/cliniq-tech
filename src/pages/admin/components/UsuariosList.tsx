import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Users, Plus, Edit, Trash2, Shield, Mail, Key, Briefcase, X, Loader2, MoreHorizontal } from 'lucide-react';

// 🚀 FAREJADOR DE SUBDOMÍNIO (Identifica o Cliente Atual)
const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
        return parts[0];
    }
    return 'admin'; 
};

// 🎨 Dicionário de cores para os crachás de acesso
const ROLE_COLORS: Record<string, string> = {
    'master': 'bg-purple-100 text-purple-700 border-purple-200',
    'administrativo': 'bg-pink-100 text-pink-700 border-pink-200',
    'gestor': 'bg-blue-100 text-blue-700 border-blue-200',
    'tecnico': 'bg-orange-100 text-orange-700 border-orange-200',
    'usuario': 'bg-slate-100 text-slate-700 border-slate-200',
    'cliente': 'bg-emerald-100 text-emerald-700 border-emerald-200'
};

export function UsuariosList() {
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tenantId, setTenantId] = useState<number | null>(null);

    // Estados do Modal Integrado
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    
    // Dados do Formulário
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        cargo: '',
        nivel_acesso: 'tecnico'
    });

    // 1. Busca o Inquilino e depois os usuários dele
    useEffect(() => {
        const init = async () => {
            const slug = getSubdomain();
            const { data } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
            if (data) {
                setTenantId(data.id);
                fetchUsuarios(data.id);
            }
        };
        init();
    }, []);

    const fetchUsuarios = async (tId: number) => {
        setLoading(true);
        const { data } = await supabase.from('usuarios').select('*').eq('tenant_id', tId).order('nome');
        setUsuarios(data || []);
        setLoading(false);
    };

    // 2. Controla Abertura do Modal (Para Criar ou Editar)
    const openModal = (user: any = null) => {
        if (user) {
            setEditingId(user.id);
            setFormData({
                nome: user.nome || '',
                email: user.email || '',
                senha: user.senha || '',
                cargo: user.cargo || '',
                nivel_acesso: user.nivel_acesso || 'tecnico'
            });
        } else {
            setEditingId(null);
            setFormData({ nome: '', email: '', senha: '', cargo: '', nivel_acesso: 'tecnico' });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    // 3. Salva no Banco de Dados
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!tenantId) return;
        setSaving(true);

        const payload = {
            ...formData,
            tenant_id: tenantId
        };

        try {
            if (editingId) {
                await supabase.from('usuarios').update(payload).eq('id', editingId);
            } else {
                await supabase.from('usuarios').insert([payload]);
            }
            await fetchUsuarios(tenantId);
            closeModal();
        } catch (error) {
            alert('Erro ao salvar usuário. Verifique sua conexão.');
        } finally {
            setSaving(false);
        }
    };

    // 4. Remove Usuário
    const handleDelete = async (id: number, nome: string) => {
        if (window.confirm(`Tem certeza que deseja remover o acesso de ${nome}? A pessoa perderá acesso imediatamente.`)) {
            await supabase.from('usuarios').delete().eq('id', id);
            if (tenantId) fetchUsuarios(tenantId);
        }
    };

    return (
        <div className="animate-fadeIn space-y-6">
            
            {/* CABEÇALHO DA TELA */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-card p-6 rounded-3xl border border-theme shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-theme/5 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h3 className="font-black text-xl text-theme-main flex items-center gap-2">
                        <Users className="text-primary-theme" size={24}/> Equipe Logada
                    </h3>
                    <p className="text-sm text-theme-muted mt-1 font-medium">Gerencie quem tem acesso ao painel do sistema.</p>
                </div>
                <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                    <button className="bg-theme-page border border-theme text-theme-muted px-4 py-2.5 rounded-xl text-sm font-bold hover:text-primary-theme hover:border-primary-theme transition-all shadow-sm">
                        Exportar Lista
                    </button>
                    <button 
                        onClick={() => openModal()}
                        className="bg-primary-theme text-white px-5 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95 flex-1 sm:flex-none"
                    >
                        <Plus size={18} strokeWidth={3}/> Convidar Usuário
                    </button>
                </div>
            </div>

            {/* TABELA DE USUÁRIOS */}
            <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[700px]">
                        <thead className="bg-theme-page/50 border-b border-theme text-[10px] font-black uppercase text-theme-muted tracking-widest">
                            <tr>
                                <th className="p-5 pl-6">Nome / E-mail</th>
                                <th className="p-5">Cargo Especialista</th>
                                <th className="p-5">Patente no Sistema</th>
                                <th className="p-5 text-center">Status</th>
                                <th className="p-5 pr-6 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme/50 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-theme-muted font-bold"><Loader2 className="animate-spin mx-auto mb-3 text-primary-theme" size={32}/> Sincronizando equipe com o banco...</td></tr>
                            ) : usuarios.length === 0 ? (
                                <tr><td colSpan={5} className="p-12 text-center text-theme-muted font-bold">Nenhum usuário cadastrado. Adicione o seu primeiro colaborador!</td></tr>
                            ) : (
                                usuarios.map(user => (
                                    <tr key={user.id} className="hover:bg-theme-page/30 transition-colors group">
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-theme-page border border-theme text-theme-main flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                                                    {user.nome.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-theme-main text-sm">{user.nome}</p>
                                                    <p className="text-xs text-theme-muted flex items-center gap-1 mt-0.5"><Mail size={10}/> {user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-theme-muted font-medium flex items-center gap-1.5"><Briefcase size={14} className="opacity-50"/> {user.cargo || 'Não definido'}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 w-max ${ROLE_COLORS[user.nivel_acesso] || ROLE_COLORS['usuario']}`}>
                                                <Shield size={12} strokeWidth={2.5}/> {user.nivel_acesso || 'Usuário'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-lg w-max border border-emerald-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Ativo
                                            </span>
                                        </td>
                                        <td className="p-4 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(user)} className="p-2 text-theme-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Editar">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(user.id, user.nome)} className="p-2 text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all" title="Remover Acesso">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🚀 MODAL DE CADASTRO/EDIÇÃO */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                    <div className="bg-theme-card w-full max-w-xl rounded-[2rem] shadow-2xl border border-theme overflow-hidden animate-slideUp">
                        
                        <div className="p-6 border-b border-theme flex items-center justify-between bg-theme-page/50">
                            <h3 className="text-xl font-black text-theme-main flex items-center gap-2">
                                <Users className="text-primary-theme" size={24}/> 
                                {editingId ? 'Editar Credenciais' : 'Convidar Novo Usuário'}
                            </h3>
                            <button onClick={closeModal} className="p-2 text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors active:scale-95"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-5">
                            
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">Nome Completo</label>
                                <div className="relative">
                                    <input className="input-theme w-full h-14 pl-12 pr-4 rounded-xl text-sm font-bold" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required placeholder="Ex: João da Silva" />
                                    <Users className="absolute left-4 top-4 text-theme-muted" size={20}/>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">E-mail de Acesso</label>
                                <div className="relative">
                                    <input type="email" className="input-theme w-full h-14 pl-12 pr-4 rounded-xl text-sm font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="joao@empresa.com.br" />
                                    <Mail className="absolute left-4 top-4 text-theme-muted" size={20}/>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">Cargo Técnico</label>
                                    <div className="relative">
                                        <input className="input-theme w-full h-14 pl-12 pr-4 rounded-xl text-sm font-bold" value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} placeholder="Ex: Engenheiro" />
                                        <Briefcase className="absolute left-4 top-4 text-theme-muted" size={20}/>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">Senha Inicial</label>
                                    <div className="relative">
                                        <input type="text" className="input-theme w-full h-14 pl-12 pr-4 rounded-xl text-sm font-bold" value={formData.senha} onChange={e => setFormData({...formData, senha: e.target.value})} required placeholder="Defina a senha" />
                                        <Key className="absolute left-4 top-4 text-theme-muted" size={20}/>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <div className="bg-theme-page border border-theme rounded-2xl p-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-theme/5 rounded-full blur-xl"></div>
                                    <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest mb-3 flex items-center gap-2 relative z-10"><Shield size={14}/> Patente do Sistema (Nível de Acesso)</label>
                                    <select 
                                        className="input-theme w-full h-14 px-4 rounded-xl text-sm font-black uppercase tracking-wider appearance-none cursor-pointer border-2 focus:border-primary-theme relative z-10"
                                        value={formData.nivel_acesso} 
                                        onChange={e => setFormData({...formData, nivel_acesso: e.target.value})}
                                    >
                                        <option value="master">🔴 Master (Acesso Total)</option>
                                        <option value="administrativo">🟣 Administrativo (Negócios)</option>
                                        <option value="gestor">🔵 Gestor (Engenharia)</option>
                                        <option value="tecnico">🟠 Técnico (Campo)</option>
                                        <option value="usuario">⚪ Usuário Padrão</option>
                                        <option value="cliente">🟢 Cliente Externo</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button type="button" onClick={closeModal} className="w-1/3 h-14 bg-theme-page border border-theme text-theme-main font-black rounded-xl hover:bg-theme-card transition-all">Cancelar</button>
                                <button type="submit" disabled={saving} className="w-2/3 h-14 bg-primary-theme text-white font-black rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3">
                                    {saving ? <Loader2 className="animate-spin" size={24}/> : <Users size={20} strokeWidth={3}/>}
                                    {saving ? 'Gravando...' : 'Salvar Colaborador'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}