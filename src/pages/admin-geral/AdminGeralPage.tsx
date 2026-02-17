import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Globe, TrendingUp, Users, Database, Play, Pause, ExternalLink, Loader2, Building2, Search, Plus, X, Shield, Mail, Key } from 'lucide-react';
import { format } from 'date-fns';

export function AdminGeralPage() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');
    
    // Estados do Modal de Novo Assinante
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        nome_fantasia: '',
        slug_subdominio: '',
        plano_atual: 'pro',
        email_admin: '',
        senha_admin: ''
    });
    
    // Métricas Globais
    const [metricas, setMetricas] = useState({
        totalClientes: 0,
        totalUsuarios: 0,
        totalOS: 0,
        mrrEstimado: 0
    });

    const fetchTenants = async () => {
        setLoading(true);
        const { data: empresas } = await supabase.from('empresas_inquilinas').select('*').order('created_at', { ascending: false });
        
        if (empresas) {
            setTenants(empresas);
            
            const planosValor: any = { 'basico': 197, 'pro': 497, 'enterprise': 997 };
            let mrr = 0;
            
            empresas.forEach(emp => {
                if (emp.status_assinatura === 'ativo' && emp.id !== 1) {
                    mrr += planosValor[emp.plano_atual || 'basico'] || 0;
                }
            });

            const { count: countOS } = await supabase.from('ordens_servico').select('*', { count: 'exact', head: true });
            const { count: countUsers } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });

            setMetricas({
                totalClientes: empresas.length - 1, // Desconta o admin matriz
                totalUsuarios: countUsers || 0,
                totalOS: countOS || 0,
                mrrEstimado: mrr
            });
        }
        setLoading(false);
    };

    useEffect(() => { fetchTenants(); }, []);

    // Formata o Subdomínio em tempo real (remove espaços e caracteres especiais)
    const handleSlugChange = (e: any) => {
        const slugFormatado = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-');
        setFormData({ ...formData, slug_subdominio: slugFormatado });
    };

    // 🚀 CRIAÇÃO DO NOVO ASSINANTE E SEU USUÁRIO MASTER
    const handleCriarAssinante = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            // 1. Verifica se o subdomínio já existe
            const { data: slugExiste } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', formData.slug_subdominio).maybeSingle();
            if (slugExiste) {
                alert('Este subdomínio (URL) já está em uso por outra empresa. Escolha outro.');
                setSaving(false);
                return;
            }

            // 2. Cria a Empresa Inquilina
            const { data: novoTenant, error: errorTenant } = await supabase.from('empresas_inquilinas').insert([{
                nome_fantasia: formData.nome_fantasia,
                slug_subdominio: formData.slug_subdominio,
                plano_atual: formData.plano_atual,
                status_assinatura: 'ativo'
            }]).select().single();

            if (errorTenant) throw errorTenant;

            // 3. Cria o Usuário Master do dono dessa nova empresa
            const { error: errorUser } = await supabase.from('usuarios').insert([{
                tenant_id: novoTenant.id,
                nome: `Admin - ${formData.nome_fantasia}`,
                email: formData.email_admin,
                senha: formData.senha_admin,
                cargo: 'Proprietário',
                nivel_acesso: 'master'
            }]);

            if (errorUser) throw errorUser;

            alert('Prestador de Serviço cadastrado com sucesso! O ambiente já está pronto para acesso.');
            setIsModalOpen(false);
            setFormData({ nome_fantasia: '', slug_subdominio: '', plano_atual: 'pro', email_admin: '', senha_admin: '' });
            fetchTenants();

        } catch (error: any) {
            alert(`Erro ao criar assinante: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (id: number, statusAtual: string, nome: string) => {
        if (id === 1) return alert('Você não pode bloquear o sistema raiz.');
        const novoStatus = statusAtual === 'ativo' ? 'bloqueado' : 'ativo';
        const acao = novoStatus === 'bloqueado' ? 'SUSPENDER' : 'REATIVAR';
        
        if (!window.confirm(`Tem certeza que deseja ${acao} o acesso da empresa ${nome}?`)) return;

        const { error } = await supabase.from('empresas_inquilinas').update({ status_assinatura: novoStatus }).eq('id', id);
        if (!error) fetchTenants();
    };

    const filtrados = tenants.filter(t => t.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) || t.slug_subdominio?.toLowerCase().includes(busca.toLowerCase()));

    return (
        <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-40">
            {/* HEADER */}
            <div className="mb-8 border-b border-theme pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-theme-main tracking-tight flex items-center gap-3">
                        <span className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20">
                            <Globe size={28} strokeWidth={2}/>
                        </span>
                        Administração Geral (SaaS)
                    </h2>
                    <p className="text-theme-muted font-bold mt-2 opacity-80 uppercase tracking-widest text-xs">Torre de Controle de Assinantes</p>
                </div>
                
                {/* 🚀 BOTÃO NOVO ASSINANTE */}
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-primary-theme text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-xl hover:opacity-90 transition-transform active:scale-95"
                >
                    <Plus size={20} strokeWidth={3}/> Novo Assinante
                </button>
            </div>

            {/* DASHBOARD MESTRE */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <MetricCard icon={<Building2/>} title="Prestadores Ativos" value={metricas.totalClientes} color="text-blue-500" bg="bg-blue-500/10" />
                <MetricCard icon={<TrendingUp/>} title="MRR Estimado" value={`R$ ${metricas.mrrEstimado},00`} color="text-emerald-500" bg="bg-emerald-500/10" />
                <MetricCard icon={<Users/>} title="Total de Usuários" value={metricas.totalUsuarios} color="text-amber-500" bg="bg-amber-500/10" />
                <MetricCard icon={<Database/>} title="O.S. Processadas" value={metricas.totalOS} color="text-purple-500" bg="bg-purple-500/10" />
            </div>

            {/* BARRA DE BUSCA E LISTA DE INQUILINOS */}
            <div className="bg-theme-card rounded-[2rem] border border-theme shadow-xl overflow-hidden">
                <div className="p-6 border-b border-theme flex flex-col sm:flex-row justify-between items-center gap-4 bg-theme-page/50">
                    <h3 className="font-black text-lg text-theme-main">Prestadores de Serviço (Inquilinos)</h3>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted" size={18}/>
                        <input 
                            className="input-theme w-full h-12 pl-12 pr-4 rounded-xl font-bold text-sm" 
                            placeholder="Buscar empresa ou subdomínio..."
                            value={busca} onChange={e => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap min-w-[800px]">
                        <thead className="bg-theme-page text-[10px] font-black uppercase text-theme-muted tracking-widest border-b border-theme">
                            <tr>
                                <th className="p-5 pl-6">Empresa Prestadora</th>
                                <th className="p-5">Acesso (Subdomínio)</th>
                                <th className="p-5">Plano Contratado</th>
                                <th className="p-5 text-center">Status</th>
                                <th className="p-5 pr-6 text-right">Controle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-theme/50 text-sm">
                            {loading ? (
                                <tr><td colSpan={5} className="p-12 text-center text-theme-muted"><Loader2 className="animate-spin mx-auto" size={32}/></td></tr>
                            ) : filtrados.map(tenant => (
                                <tr key={tenant.id} className={`transition-colors hover:bg-theme-page/30 ${tenant.status_assinatura === 'bloqueado' ? 'opacity-60' : ''}`}>
                                    <td className="p-5 pl-6">
                                        <div className="flex items-center gap-4">
                                            {tenant.logo_url ? (
                                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                                                    <img src={tenant.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                                </div>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center font-black text-lg shrink-0">
                                                    {tenant.nome_fantasia?.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-theme-main text-base">{tenant.nome_fantasia}</p>
                                                <p className="text-xs text-theme-muted">{tenant.id === 1 ? 'Matriz / Sistema Raiz' : `Cadastrado em: ${format(new Date(tenant.created_at), 'dd/MM/yyyy')}`}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <div className="flex flex-col">
                                            <span className="font-mono text-xs font-bold text-primary-theme bg-primary-theme/10 px-2 py-1 rounded w-max">
                                                {tenant.slug_subdominio}.atlasum.com.br
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        <span className="font-black uppercase text-xs tracking-wider text-slate-500 border-2 border-slate-200 px-3 py-1 rounded-lg">
                                            {tenant.plano_atual || 'Básico'}
                                        </span>
                                    </td>
                                    <td className="p-5 text-center">
                                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border ${tenant.status_assinatura === 'ativo' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${tenant.status_assinatura === 'ativo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                            {tenant.status_assinatura}
                                        </span>
                                    </td>
                                    <td className="p-5 pr-6 text-right">
                                        {tenant.id !== 1 && (
                                            <div className="flex items-center justify-end gap-2">
                                                <a href={`http://${tenant.slug_subdominio}.localhost:5173`} target="_blank" rel="noreferrer" className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all" title="Acessar Portal do Cliente">
                                                    <ExternalLink size={18}/>
                                                </a>
                                                <button 
                                                    onClick={() => toggleStatus(tenant.id, tenant.status_assinatura, tenant.nome_fantasia)}
                                                    className={`p-2.5 rounded-xl transition-all ${tenant.status_assinatura === 'ativo' ? 'text-amber-500 hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-500/10'}`} 
                                                    title={tenant.status_assinatura === 'ativo' ? 'Suspender Acesso' : 'Reativar Acesso'}
                                                >
                                                    {tenant.status_assinatura === 'ativo' ? <Pause size={18}/> : <Play size={18}/>}
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🚀 MODAL DE NOVO ASSINANTE (PRESTADOR) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                    <div className="bg-theme-card w-full max-w-2xl rounded-[2rem] shadow-2xl border border-theme overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
                        
                        <div className="p-6 border-b border-theme flex items-center justify-between bg-theme-page/50 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-theme-main flex items-center gap-2">
                                    <Globe className="text-primary-theme" size={24}/> Provisionar Novo Cliente SaaS
                                </h3>
                                <p className="text-sm text-theme-muted font-medium mt-1">Crie o ambiente e a conta do dono da empresa prestadora de serviços.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 text-theme-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors active:scale-95"><X size={20}/></button>
                        </div>
                        
                        <form onSubmit={handleCriarAssinante} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                            
                            <div className="bg-theme-page p-5 rounded-2xl border border-theme">
                                <h4 className="text-[10px] font-black uppercase text-theme-muted tracking-widest mb-4 flex items-center gap-2"><Building2 size={14}/> Dados da Empresa (Inquilino)</h4>
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">Nome da Empresa</label>
                                        <input className="input-theme w-full h-12 px-4 rounded-xl text-sm font-bold" value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} required placeholder="Ex: TecMed Manutenções Ltda" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">Subdomínio (Link de Acesso)</label>
                                        <div className="flex items-center">
                                            <input className="input-theme w-full h-12 px-4 rounded-l-xl border-r-0 text-sm font-bold font-mono text-primary-theme focus:ring-0" value={formData.slug_subdominio} onChange={handleSlugChange} required placeholder="tecmed" />
                                            <div className="h-12 px-4 bg-theme-page border border-l-0 border-theme rounded-r-xl flex items-center text-sm font-black text-theme-muted font-mono">
                                                .atlasum.com.br
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5 pt-2">
                                        <label className="text-[11px] font-black uppercase text-theme-muted tracking-widest ml-1">Plano Comercializado</label>
                                        <select className="input-theme w-full h-12 px-4 rounded-xl text-sm font-bold uppercase tracking-wider appearance-none cursor-pointer" value={formData.plano_atual} onChange={e => setFormData({...formData, plano_atual: e.target.value})}>
                                            <option value="basico">Plano Básico</option>
                                            <option value="pro">Plano Pro (Popular)</option>
                                            <option value="enterprise">Enterprise</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-primary-theme/5 p-5 rounded-2xl border border-primary-theme/20">
                                <h4 className="text-[10px] font-black uppercase text-primary-theme tracking-widest mb-4 flex items-center gap-2"><Shield size={14}/> Credenciais do Dono (Master)</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black uppercase text-theme-main opacity-70 tracking-widest ml-1">E-mail de Acesso</label>
                                        <div className="relative">
                                            <input type="email" className="w-full h-12 pl-10 pr-4 bg-white border border-primary-theme/20 rounded-xl text-sm font-bold outline-none focus:border-primary-theme focus:ring-2 focus:ring-primary-theme/20 transition-all text-slate-900" value={formData.email_admin} onChange={e => setFormData({...formData, email_admin: e.target.value})} required placeholder="diretoria@empresa.com" />
                                            <Mail className="absolute left-3.5 top-3.5 text-primary-theme/50" size={18}/>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-black uppercase text-theme-main opacity-70 tracking-widest ml-1">Senha Provisória</label>
                                        <div className="relative">
                                            <input type="text" className="w-full h-12 pl-10 pr-4 bg-white border border-primary-theme/20 rounded-xl text-sm font-bold outline-none focus:border-primary-theme focus:ring-2 focus:ring-primary-theme/20 transition-all text-slate-900" value={formData.senha_admin} onChange={e => setFormData({...formData, senha_admin: e.target.value})} required placeholder="Ex: Mudar@123" />
                                            <Key className="absolute left-3.5 top-3.5 text-primary-theme/50" size={18}/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4 shrink-0">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="w-1/3 h-14 bg-theme-page border border-theme text-theme-main font-black rounded-xl hover:bg-theme-card transition-all">Cancelar</button>
                                <button type="submit" disabled={saving} className="w-2/3 h-14 bg-primary-theme text-white font-black rounded-xl shadow-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3">
                                    {saving ? <Loader2 className="animate-spin" size={24}/> : <Globe size={20} strokeWidth={3}/>}
                                    {saving ? 'Provisionando Ambiente...' : 'Criar Novo Assinante'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const MetricCard = ({ icon, title, value, color, bg }: any) => (
    <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-sm flex items-center gap-5">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${bg} ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-[11px] font-black uppercase text-theme-muted tracking-widest mb-1">{title}</p>
            <h4 className="text-2xl font-black text-theme-main">{value}</h4>
        </div>
    </div>
);