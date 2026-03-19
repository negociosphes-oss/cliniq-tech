import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom' 
import { Menu, X, Loader2, AlertTriangle, ShieldCheck, Activity, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from './supabaseClient'

// --- SERVIÇOS ---
import { ThemeService } from './services/ThemeService'

// --- COMPONENTES ---
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './pages/ordem-servico/components/ErrorBoundary'
import { HelpWidget } from './components/HelpWidget' // 🚀 COMPONENTE DE AJUDA INJETADO

// --- PÁGINAS DO SISTEMA ---
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { IndicadoresPage } from './pages/indicadores/IndicadoresPage'
import { BibliotecaPage } from './pages/biblioteca/BibliotecaPage'
import { EquipamentosPage } from './pages/equipamentos/EquipamentosPage'
import { OrdemServicoPage } from './pages/ordem-servico/OrdemServicoPage'
import { AberturaChamadoPage } from './pages/ordem-servico/AberturaChamadoPage'
import { CentralChamados } from './pages/ordem-servico/CentralChamados' 
import { CronogramaPage } from './pages/cronograma/CronogramaPage' 
import { DicionarioPage } from './pages/tecnologia/DicionarioPage' 
import { ClientesPage } from './pages/clientes/ClientesPage'
import { EquipePage } from './pages/equipe/EquipePage'
import { AdminPage } from './pages/admin/AdminPage'
import { OrcamentosPage } from './pages/vendas/OrcamentosPage'
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage'
import { ChecklistPage } from './pages/checklists/ChecklistPage'
import { MetrologiaPage } from './pages/metrologia/MetrologiaPage' 
import { AdminGeralPage } from './pages/admin-geral/AdminGeralPage'
import { EstoquePage } from './pages/estoque/EstoquePage'
import { LandingPage } from './pages/landing/LandingPage'

// 🚀 AS DUAS ROTAS PÚBLICAS
import { OSPublicView } from './pages/public/OSPublicView' 
import { AberturaChamadoPublico } from './pages/public/AberturaChamadoPublico' 

import type { Usuario, Config, Cliente, Equipamento, Tecnico, OrdemServico } from './types' 

const getSubdomain = () => {
    const hostname = window.location.hostname;
    if (hostname === 'atlasum.com.br' || hostname === 'www.atlasum.com.br') return 'atlasum-sistema'; 
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') return parts[0];
    return 'atlasum-sistema'; 
};

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) {
  if (!message) return null;
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-blue-600' }
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${colors[type] || 'bg-blue-600'} text-white animate-bounce-in`}>
      <p className="font-bold text-sm">{message}</p>
      <button onClick={onClose}><X size={16} className="opacity-80 hover:opacity-100"/></button>
    </div>
  )
}

function Login({ onLoginSuccess, tenant }: { onLoginSuccess: (user: Usuario) => void, tenant: any }) {
  const [email, setEmail] = useState(''); 
  const [senha, setSenha] = useState(''); 
  const [loading, setLoading] = useState(false);
  const [horaLocal, setHoraLocal] = useState('');

  useEffect(() => {
      const hora = new Date().getHours();
      if(hora < 12) setHoraLocal('Bom dia');
      else if(hora < 18) setHoraLocal('Boa tarde');
      else setHoraLocal('Boa noite');
  }, []);

  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setLoading(true);
      try {
        if (email.trim() === 'admin@atlasum.com.br' && senha.trim() === '123456') { 
            setTimeout(() => onLoginSuccess({ id: 0, nome: 'CEO / Admin', email: email, cargo: 'admin' } as Usuario), 800); 
            return; 
        }
        const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).eq('senha', senha).eq('tenant_id', tenant.id).maybeSingle();
        if (error) throw error;
        if (data) setTimeout(() => onLoginSuccess(data), 800); 
        else { alert('Acesso Negado ou Usuário não pertence a esta empresa.'); setLoading(false); }
      } catch (err) { alert('Erro de conexão.'); setLoading(false); }
  }

  const primaryColor = tenant?.cor_primaria || '#0f172a';

  return (
    <div className="min-h-[100dvh] w-full flex bg-slate-50 font-sans selection:bg-blue-500 selection:text-white">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-16 bg-slate-900" style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #020617 100%)` }}>
         <div className="absolute top-[-20%] left-[-10%] w-[50rem] h-[50rem] bg-white/5 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

         <div className="relative z-10">
            <div className="flex items-center gap-3 text-white mb-20 animate-fadeIn">
               <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl">
                   <Activity size={24} strokeWidth={2.5} className="text-blue-300" />
               </div>
               <span className="font-black text-xl tracking-[0.25em] uppercase text-white/90">Atlasum</span>
            </div>
            
            <h1 className="text-[3.5rem] font-black text-white leading-[1.1] mb-6 tracking-tight animate-slideUp">
              Engenharia Clínica <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-100">sem atrito.</span>
            </h1>
            <p className="text-white/70 text-lg max-w-md font-medium leading-relaxed animate-slideUp" style={{ animationDelay: '0.1s' }}>
              O ecossistema definitivo para controle de ativos, manutenções e calibrações do seu parque tecnológico.
            </p>
         </div>

         <div className="relative z-10 flex flex-col gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 text-white/80 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm max-w-sm">
                <CheckCircle2 className="text-emerald-400 shrink-0" size={24}/>
                <div>
                    <h4 className="font-bold text-sm text-white">Rastreabilidade Total</h4>
                    <p className="text-xs opacity-70">Aprovado em normas RBC e ONA.</p>
                </div>
            </div>
         </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-[#f8fafc] overflow-y-auto h-[100dvh] custom-scrollbar">
         <div className="absolute top-0 left-0 w-full h-64 opacity-20 lg:hidden pointer-events-none" style={{ background: `linear-gradient(180deg, ${primaryColor} 0%, transparent 100%)` }}></div>

         <div className="w-full max-w-[420px] animate-slideUp relative z-10 my-auto py-8">
             <div className="text-center mb-8">
                 <div className="flex justify-center mb-6">
                     {tenant?.logo_url ? (
                         <div className="h-24 sm:h-28 w-auto max-w-[220px] flex items-center justify-center bg-white p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-transform hover:scale-105">
                            <img src={tenant.logo_url} alt={`Logo ${tenant.nome_fantasia}`} className="h-full w-full object-contain" />
                         </div>
                     ) : (
                         <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[2rem] flex items-center justify-center shadow-xl text-white font-black text-3xl sm:text-4xl shadow-blue-900/20" style={{ backgroundColor: primaryColor }}>
                             {tenant?.nome_fantasia ? tenant.nome_fantasia.charAt(0).toUpperCase() : 'A'}
                         </div>
                     )}
                 </div>
                 <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mb-2">{horaLocal}!</h2>
                 <p className="text-slate-500 font-medium text-sm">Acesso restrito ao ambiente da <br className="hidden sm:block"/><strong className="text-slate-700">{tenant?.nome_fantasia || 'unidade'}</strong>.</p>
             </div>

             <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100">
                 <form onSubmit={handleLogin} className="flex flex-col gap-5 sm:gap-6">
                    <div className="space-y-2 group">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 group-focus-within:text-blue-600 transition-colors">E-mail Corporativo</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
                            <input 
                              className="w-full h-14 pl-12 pr-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:font-medium placeholder:text-slate-400 text-sm sm:text-base" 
                              type="email" value={email} onChange={e => setEmail(e.target.value)} 
                              placeholder="nome@hospital.com.br" required 
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2 group">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest group-focus-within:text-blue-600 transition-colors">Senha de Segurança</label>
                            <a href="#" className="text-[10px] font-bold text-blue-500 hover:text-blue-700 transition-colors">Recuperar</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18}/>
                            <input 
                              className="w-full h-14 pl-12 pr-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold placeholder:text-slate-400 tracking-widest text-sm sm:text-base" 
                              type="password" value={senha} onChange={e => setSenha(e.target.value)} 
                              placeholder="••••••••" required 
                            />
                        </div>
                    </div>

                    <button disabled={loading} className="w-full h-14 mt-2 sm:mt-4 text-white font-black rounded-2xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 relative overflow-hidden group" style={{ backgroundColor: primaryColor }}>
                        {loading ? (
                            <Loader2 className="animate-spin" size={22} />
                        ) : (
                            <>
                                <span>Acessar Plataforma</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                 </form>
             </div>
             
             <div className="mt-8 sm:mt-10 text-center pb-8 sm:pb-0">
                <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                    <ShieldCheck size={14}/> Ambiente Seguro e Criptografado
                </p>
             </div>
         </div>
      </div>
    </div>
  )
}

function MainLayout({ user, tenant, onLogout }: { user: Usuario, tenant: any, onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.replace('/', '') || 'painel';

  const [loadingData, setLoadingData] = useState(true); 
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [themeColor, setThemeColor] = useState(tenant?.cor_primaria || '#1e3a8a'); 

  const config = { 
      id: tenant?.id, 
      nome_empresa: tenant?.nome_fantasia || 'Atlasum', 
      logo_url: tenant?.logo_url, 
      cor_primaria: tenant?.cor_primaria || '#1e3a8a', 
      cor_secundaria: '#f8fafc',
      os_tipos_restrito: tenant?.os_tipos_restrito || false,
      sla_critica_horas: tenant?.sla_critica_horas || 2,
      sla_alta_horas: tenant?.sla_alta_horas || 6,
      sla_media_horas: tenant?.sla_media_horas || 24,
      sla_baixa_horas: tenant?.sla_baixa_horas || 48
  };

  const [clientes, setClientes] = useState<Cliente[]>([]); 
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]); 
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]); 
  const [targetOsId, setTargetOsId] = useState<number | null>(null);

  const showToast = useCallback((msg: string, type: 'success'|'error'|'info' = 'success') => { 
    setToast({msg, type}); 
    setTimeout(() => setToast(null), 3000); 
  }, []);

  useEffect(() => {
    const inicializarVisual = async () => {
      const pref = await ThemeService.carregarConfiguracaoOficial();
      setThemeColor(pref.primary || tenant?.cor_primaria || '#1e3a8a');
      setDarkMode(pref.isDark);
      ThemeService.aplicarTemaNoDOM(pref.primary || tenant?.cor_primaria, pref.isDark);
    };
    if (tenant) inicializarVisual();
  }, [tenant]);

  useEffect(() => { 
    if(darkMode) document.documentElement.classList.add('dark'); 
    else document.documentElement.classList.remove('dark'); 
  }, [darkMode]);

  const fetchAll = useCallback(async () => {
    if (!tenant) return;
    try {
        const [resCli, resTec, resTcn, resUsr] = await Promise.all([
            supabase.from('clientes').select('*').eq('tenant_id', tenant.id),
            supabase.from('dict_tecnologias').select('*'), 
            supabase.from('equipe_tecnica').select('*').eq('tenant_id', tenant.id),
            supabase.from('usuarios').select('*').eq('tenant_id', tenant.id)
        ]);

        setClientes(resCli.data || []);
        const clientesData = resCli.data || [];
        const tecnologiasData = resTec.data || [];
        
        let tecnicosData = resTcn.data || [];
        const usuariosData = resUsr.data || [];
        if (tecnicosData.length === 0 && usuariosData.length > 0) {
            tecnicosData = usuariosData.map((u: any) => ({ id: u.id, nome: u.nome, especialidade: u.cargo }));
        }
        setTecnicos(tecnicosData);

        let equipamentosFinal: any[] = [];
        const { data: eqRaw } = await supabase.from('equipamentos').select('*').eq('tenant_id', tenant.id).order('id', {ascending: false});
        
        if (eqRaw) {
            equipamentosFinal = eqRaw.map(eq => {
                const tec = tecnologiasData.find((t: any) => String(t.id) === String(eq.modelo_dict_id) || String(t.id) === String(eq.tecnologia_id));
                const cli = clientesData.find((c: any) => String(c.id) === String(eq.cliente_id));
                return {
                    ...eq,
                    tecnologia: tec || null,
                    cliente: cli || null,
                    nome: eq.nome || tec?.nome || 'Equipamento'
                };
            });
        }
        setEquipamentos(equipamentosFinal);

        let ordensFinal: any[] = [];
        const { data: osRaw } = await supabase.from('ordens_servico').select('*').eq('tenant_id', tenant.id).order('id', {ascending: false});
        if (osRaw) {
            ordensFinal = osRaw.map(os => {
                const eqRel = equipamentosFinal.find(e => e.id === os.equipamento_id);
                return {
                    ...os,
                    equipamento: eqRel || null,
                    cliente: eqRel?.cliente || null
                };
            });
        }
        setOrdens(ordensFinal);

    } catch (e) { 
        console.error('Erro geral:', e);
        showToast('Erro de conexão com o banco de dados.', 'error');
    } finally {
        setLoadingData(false);
    }
  }, [showToast, tenant?.id]);

  useEffect(() => { fetchAll() }, [fetchAll]);
  
  const handleNavigate = (path: string) => navigate(`/${path}`);

  if (loadingData) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-6"><Loader2 className="animate-spin text-blue-500" size={48}/><p className="font-bold tracking-widest uppercase text-xs">Carregando Ambiente Empresarial...</p></div>;

  return (
    <div className="flex h-screen bg-theme-page font-sans overflow-hidden transition-colors text-theme-main">
      <Sidebar 
        view={currentView} 
        setView={handleNavigate} 
        config={config} 
        user={user}
        onLogout={onLogout} 
        themeColor={themeColor} setThemeColor={setThemeColor}
        isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
      />
      
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 w-full ${isSidebarCollapsed ? 'md:ml-24' : 'md:ml-72'} ml-0`}>
        
        <header className="fixed top-0 left-0 w-full h-16 bg-theme-card shadow-sm px-4 flex items-center justify-between md:hidden border-b border-theme z-40">
            <div className="flex items-center gap-3">
               {config.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="h-8 object-contain" />
               ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md" style={{ backgroundColor: themeColor }}>
                      {config.nome_empresa ? config.nome_empresa.charAt(0).toUpperCase() : 'A'}
                  </div>
               )}
               <h1 className="font-bold text-theme-main truncate w-40 text-sm">{config.nome_empresa || 'Atlasum'}</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-theme-page border border-theme text-theme-muted rounded-xl hover:text-primary-theme transition-colors active:scale-95">
                <Menu size={24}/>
            </button>
        </header>
        
        <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-10 relative">
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<Navigate to="/painel" replace />} />
                    <Route path="/painel" element={<DashboardPage equipamentos={equipamentos} ordens={ordens} />} />
                    <Route path="/equipamentos" element={<EquipamentosPage />} />
                    <Route path="/novo-chamado" element={<AberturaChamadoPage equipamentos={equipamentos} clientes={clientes} showToast={showToast} fetchAll={fetchAll} user={user} configEmpresa={config} />} />
                    <Route path="/ordens" element={<OrdemServicoPage equipamentos={equipamentos} clientes={clientes} tecnicos={tecnicos} ordens={ordens} fetchAll={fetchAll} showToast={showToast} targetOsId={targetOsId} />} />
                    <Route path="/central" element={<CentralChamados ordens={ordens} equipamentos={equipamentos} tecnicos={tecnicos} configEmpresa={config} fetchAll={fetchAll} showToast={showToast} />} />
                    <Route path="/estoque" element={<EstoquePage />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/tecnologias" element={<DicionarioPage />} /> 
                    <Route path="/equipe" element={<EquipePage />} />
                    <Route path="/cronograma" element={<CronogramaPage />} />
                    <Route path="/indicadores" element={<IndicadoresPage />} />
                    <Route path="/manuais" element={<BibliotecaPage />} />
                    <Route path="/financeiro" element={<FinanceiroPage />} />
                    <Route path="/orcamentos" element={<OrcamentosPage />} />
                    <Route path="/metrologia" element={<MetrologiaPage />} />
                    <Route path="/checklists" element={<ChecklistPage />} />
                    <Route path="/configuracoes" element={<AdminPage />} />
                    <Route path="/admin-geral" element={<AdminGeralPage />} />
                    <Route path="*" element={<div className="p-10 text-center text-theme-muted mt-20">Página não encontrada (404)</div>} />
                </Routes>
            </ErrorBoundary>
        </main>

        {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
        
        {/* 🚀 O BOTÃO DE SUPORTE FLUTUANTE QUE ADICIONAMOS */}
        <HelpWidget />
        
      </div>
    </div>
  )
}

export default function App() { 
    const [tenant, setTenant] = useState<any>(null);
    const [loadingTenant, setLoadingTenant] = useState(true);
    
    // 🚀 Carrega o usuário da memória local para manter a sessão (Login Persistente)
    const [user, setUser] = useState<Usuario | null>(() => {
        const savedUser = localStorage.getItem('@atlasum_user');
        if (savedUser) {
            try { return JSON.parse(savedUser); } catch (e) { return null; }
        }
        return null;
    }); 

    const isPublicViewOS = window.location.pathname.startsWith('/view/os');
    const isPublicAbertura = window.location.pathname.startsWith('/abrir-chamado');

    useEffect(() => {
        const initTenant = async () => {
            const slug = getSubdomain();
            let { data: tData } = await supabase.from('empresas_inquilinas').select('*').eq('slug_subdominio', slug).maybeSingle();
            
            let tenantIdBusca = tData ? tData.id : 1;
            
            let { data: configDaEmpresa } = await supabase.from('configuracoes_empresa').select('*').eq('tenant_id', tenantIdBusca).maybeSingle();
            if (!configDaEmpresa) {
                const { data: fallback } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
                configDaEmpresa = fallback;
            }

            if (tData) {
                const logoEncontrada = configDaEmpresa?.logo_url || configDaEmpresa?.logotipo_url || tData.logo_url;
                
                tData.logo_url = logoEncontrada ? `${logoEncontrada}?v=${new Date().getTime()}` : null;
                tData.nome_fantasia = configDaEmpresa?.nome_fantasia || configDaEmpresa?.nome_empresa || tData.nome_fantasia;
                
                tData.os_tipos_restrito = configDaEmpresa?.os_tipos_restritos || false;
                tData.sla_critica_horas = configDaEmpresa?.sla_critica_horas || 2;
                tData.sla_alta_horas = configDaEmpresa?.sla_alta_horas || 6;
                tData.sla_media_horas = configDaEmpresa?.sla_media_horas || 24;
                tData.sla_baixa_horas = configDaEmpresa?.sla_baixa_horas || 48;

                setTenant(tData);
                
                if(tData.status_assinatura === 'bloqueado') {
                    alert('Assinatura Bloqueada. Contate o suporte Atlasum.');
                }
            } else if (configDaEmpresa) {
                const logoEncontrada = configDaEmpresa.logo_url || configDaEmpresa.logotipo_url;
                setTenant({
                    id: 1,
                    nome_fantasia: configDaEmpresa.nome_fantasia || 'Atlasum',
                    logo_url: logoEncontrada ? `${logoEncontrada}?v=${new Date().getTime()}` : null,
                    cor_primaria: '#1e3a8a',
                    os_tipos_restrito: configDaEmpresa.os_tipos_restritos || false,
                    sla_critica_horas: configDaEmpresa.sla_critica_horas || 2,
                    sla_alta_horas: configDaEmpresa.sla_alta_horas || 6,
                    sla_media_horas: configDaEmpresa.sla_media_horas || 24,
                    sla_baixa_horas: configDaEmpresa.sla_baixa_horas || 48
                });
            }
            setLoadingTenant(false);
        };
        initTenant();
    }, []);

    if (isPublicViewOS) return <ErrorBoundary><OSPublicView /></ErrorBoundary>;
    if (isPublicAbertura) return <ErrorBoundary><AberturaChamadoPublico /></ErrorBoundary>;

    if (loadingTenant) {
        return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin text-blue-500" size={64}/></div>
    }

    if (!tenant) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 font-sans p-6 text-center">
                <div className="bg-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl border border-slate-700">
                    <AlertTriangle className="mx-auto text-amber-500 mb-6" size={64} />
                    <h1 className="text-2xl font-black text-white mb-2">Ambiente não encontrado</h1>
                    <p className="text-slate-400 text-sm">O subdomínio acessado não está registrado ou foi desativado na nossa base de dados.</p>
                </div>
            </div>
        );
    }

    if (tenant.status_assinatura === 'bloqueado' || tenant.status_assinatura === 'cancelado') {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900 font-sans p-6 text-center">
                <div className="bg-slate-800 p-10 rounded-3xl max-w-md w-full shadow-2xl border border-rose-900/50">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <X className="text-rose-500" size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">Acesso Suspenso</h1>
                    <p className="text-slate-400 text-sm">Este ambiente foi suspenso por pendências administrativas. Entre em contato com o suporte da Atlasum.</p>
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/" element={user ? <Navigate to="/painel" replace /> : <LandingPage />} />
                
                <Route path="/login" element={user ? <Navigate to="/painel" replace /> : <Login tenant={tenant} onLoginSuccess={(u) => {
                    localStorage.setItem('@atlasum_user', JSON.stringify(u));
                    setUser(u);
                }} />} />
                
                <Route path="/*" element={user ? <MainLayout user={user} tenant={tenant} onLogout={() => {
                    localStorage.removeItem('@atlasum_user');
                    setUser(null);
                }} /> : <Navigate to="/login" replace /> } />
            </Routes>
        </ErrorBoundary>
    )
}