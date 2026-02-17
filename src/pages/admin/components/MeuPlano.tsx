import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { CreditCard, Zap, CheckCircle2, AlertCircle, TrendingUp, Loader2, ArrowUpRight } from 'lucide-react';

// Farejador de Subdomínio
const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
        return parts[0];
    }
    return 'admin'; 
};

// Configuração de Limites do SaaS
const PLANOS: any = {
    'basico': { nome: 'Plano Básico', limite_os: 50, cor: 'bg-slate-500', texto: 'text-slate-700' },
    'pro': { nome: 'Plano Pro', limite_os: 500, cor: 'bg-blue-600', texto: 'text-blue-700' },
    'enterprise': { nome: 'Enterprise', limite_os: 99999, cor: 'bg-purple-600', texto: 'text-purple-700' }
};

export function MeuPlano() {
    const [tenant, setTenant] = useState<any>(null);
    const [osCount, setOsCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDados = async () => {
            const slug = getSubdomain();
            
            // 1. Pega os dados do Inquilino atual
            const { data: tData } = await supabase.from('empresas_inquilinas').select('*').eq('slug_subdominio', slug).maybeSingle();
            
            if (tData) {
                setTenant(tData);

                // 2. Conta quantas OS foram abertas neste mês
                const dataInicial = new Date();
                dataInicial.setDate(1);
                dataInicial.setHours(0, 0, 0, 0);

                const { count } = await supabase
                    .from('ordens_servico')
                    .select('*', { count: 'exact', head: true })
                    .eq('tenant_id', tData.id)
                    .gte('created_at', dataInicial.toISOString());

                setOsCount(count || 0);
            }
            setLoading(false);
        };
        fetchDados();
    }, []);

    if (loading) return <div className="p-12 text-center text-theme-muted"><Loader2 className="animate-spin mx-auto mb-4" size={32}/> Calculando uso de dados...</div>;
    if (!tenant) return null;

    const planoAtual = tenant.plano_atual || 'basico';
    const configPlano = PLANOS[planoAtual] || PLANOS['basico'];
    const porcentagemUso = planoAtual === 'enterprise' ? 0 : Math.min((osCount / configPlano.limite_os) * 100, 100);
    const pertoDoLimite = porcentagemUso > 85;

    return (
        <div className="space-y-6 animate-fadeIn">
            
            {/* CARD PRINCIPAL DE ASSINATURA */}
            <div className="bg-theme-card rounded-3xl border border-theme shadow-sm overflow-hidden relative">
                {/* Efeito Visual de Fundo */}
                <div className={`absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 ${configPlano.cor}`}></div>
                
                <div className="p-8 relative z-10 flex flex-col md:flex-row justify-between gap-8 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-black text-theme-main">Sua Assinatura</h2>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Ativa
                            </span>
                        </div>
                        <p className="text-theme-muted font-medium text-sm">Você está atualmente no <b>{configPlano.nome}</b>.</p>
                    </div>
                    
                    <div className="flex gap-3 w-full md:w-auto">
                        <button className="flex-1 md:flex-none px-6 py-3 bg-theme-page border border-theme text-theme-main font-bold rounded-xl hover:bg-theme-page/50 transition-colors shadow-sm text-sm">
                            Ver Faturas
                        </button>
                        <button className={`flex-1 md:flex-none px-6 py-3 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 text-sm ${configPlano.cor} hover:opacity-90`}>
                            <Zap size={16}/> Upgrade de Plano
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CARD DE USO (BARRA DE PROGRESSO) */}
                <div className="bg-theme-card p-8 rounded-3xl border border-theme shadow-sm">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-lg font-black text-theme-main flex items-center gap-2">
                                <TrendingUp className="text-primary-theme" size={20}/> Consumo do Mês
                            </h3>
                            <p className="text-xs text-theme-muted mt-1">Renova no dia 1º do próximo mês.</p>
                        </div>
                        <div className={`p-3 rounded-2xl ${pertoDoLimite ? 'bg-rose-50 text-rose-500' : 'bg-theme-page text-primary-theme'}`}>
                            {pertoDoLimite ? <AlertCircle size={24}/> : <CreditCard size={24}/>}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-sm font-bold text-theme-muted">Ordens de Serviço Geradas</span>
                            <span className="text-2xl font-black text-theme-main">
                                {osCount} <span className="text-sm text-theme-muted font-medium">/ {planoAtual === 'enterprise' ? 'Ilimitado' : configPlano.limite_os}</span>
                            </span>
                        </div>
                        
                        {planoAtual !== 'enterprise' && (
                            <div className="w-full bg-theme-page h-4 rounded-full overflow-hidden border border-theme shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-1000 ${pertoDoLimite ? 'bg-rose-500' : 'bg-primary-theme'}`} 
                                    style={{ width: `${porcentagemUso}%` }}
                                ></div>
                            </div>
                        )}

                        {pertoDoLimite && planoAtual !== 'enterprise' && (
                            <p className="text-xs font-bold text-rose-500 flex items-center gap-1.5 mt-2">
                                <AlertCircle size={14}/> Você está se aproximando do limite do plano.
                            </p>
                        )}
                    </div>
                </div>

                {/* CARD DE BENEFÍCIOS DO PLANO */}
                <div className="bg-theme-card p-8 rounded-3xl border border-theme shadow-sm">
                    <h3 className="text-lg font-black text-theme-main mb-6">O que está incluso no seu plano</h3>
                    <ul className="space-y-4">
                        <li className="flex items-center gap-3 text-sm font-medium text-theme-main">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={18}/> 
                            {planoAtual === 'enterprise' ? 'Usuários Ilimitados' : (planoAtual === 'pro' ? 'Até 20 Usuários da Equipe' : 'Até 5 Usuários da Equipe')}
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-theme-main">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={18}/> 
                            Dashboard e Analytics de Negócios
                        </li>
                        <li className="flex items-center gap-3 text-sm font-medium text-theme-main">
                            <CheckCircle2 className="text-emerald-500 shrink-0" size={18}/> 
                            Gestão de Equipamentos e Preventivas
                        </li>
                        <li className={`flex items-center gap-3 text-sm font-medium ${planoAtual === 'basico' ? 'text-theme-muted opacity-50' : 'text-theme-main'}`}>
                            {planoAtual === 'basico' ? <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 shrink-0"></div> : <CheckCircle2 className="text-emerald-500 shrink-0" size={18}/>}
                            LIMS Metrologia e Certificados
                        </li>
                        <li className={`flex items-center gap-3 text-sm font-medium ${planoAtual !== 'enterprise' ? 'text-theme-muted opacity-50' : 'text-theme-main'}`}>
                            {planoAtual !== 'enterprise' ? <div className="w-[18px] h-[18px] rounded-full border-2 border-slate-300 shrink-0"></div> : <CheckCircle2 className="text-emerald-500 shrink-0" size={18}/>}
                            API para Integração com ERPs e Hospitais
                        </li>
                    </ul>
                </div>
            </div>

            {/* BANNER DE UPGRADE */}
            {planoAtual !== 'enterprise' && (
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="relative z-10">
                        <h4 className="text-xl font-black mb-2 flex items-center gap-2"><Zap className="text-amber-400"/> Desbloqueie o poder total.</h4>
                        <p className="text-slate-400 text-sm max-w-lg">Atualize para o plano {planoAtual === 'basico' ? 'Pro' : 'Enterprise'} e ganhe acesso a metrologia RBC, assinaturas ilimitadas e integrações via API.</p>
                    </div>
                    <button className="px-6 py-3 bg-white text-slate-900 font-black rounded-xl hover:scale-105 transition-transform flex items-center gap-2 relative z-10 shrink-0 shadow-xl">
                        Falar com Consultor <ArrowUpRight size={18}/>
                    </button>
                </div>
            )}
        </div>
    );
}