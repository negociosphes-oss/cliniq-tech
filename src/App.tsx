import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom' 
import { Menu, X, Loader2, AlertTriangle, ShieldCheck, Activity, Cpu } from 'lucide-react'
import { supabase } from './supabaseClient'

// --- SERVIÇOS ---
import { ThemeService } from './services/ThemeService'

// --- COMPONENTES ---
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './pages/ordem-servico/components/ErrorBoundary'

// --- PÁGINAS DO SISTEMA ---
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { IndicadoresPage } from './pages/indicadores/IndicadoresPage'
import { BibliotecaPage } from './pages/biblioteca/BibliotecaPage'
import { OSPublicView } from './pages/public/OSPublicView' 
import { EquipamentosPage } from './pages/equipamentos/EquipamentosPage'
import { OrdemServicoPage } from './pages/ordem-servico/OrdemServicoPage'
import { AberturaChamadoPage } from './pages/ordem-servico/AberturaChamadoPage'
import { CronogramaPage } from './pages/cronograma/CronogramaPage' 
import { TecnologiasPage } from './pages/tecnologia/TecnologiasPage'
import { ClientesPage } from './pages/clientes/ClientesPage'
import { EquipePage } from './pages/equipe/EquipePage'
import { AdminPage } from './pages/admin/AdminPage'
import { OrcamentosPage } from './pages/vendas/OrcamentosPage'
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage'
import { ChecklistPage } from './pages/checklists/ChecklistPage'
import { MetrologiaPage } from './pages/metrologia/MetrologiaPage' 
import { AdminGeralPage } from './pages/admin-geral/AdminGeralPage'

// 🚀 NOVA PÁGINA: VITRINE DE VENDAS
import { LandingPage } from './pages/landing/LandingPage'

import type { Usuario, Config, Cliente, Tecnologia, Equipamento, Tecnico, Manual, OrdemServico, LogAuditoria } from './types'

/// 🚀 FAREJADOR DE SUBDOMÍNIO (Ajustado para Domínio Próprio)
const getSubdomain = () => {
    const hostname = window.location.hostname;
    
    // 1. REGRA DE OURO: Se for o domínio oficial (com ou sem www), força o ID correto
    if (hostname === 'atlasum.com.br' || hostname === 'www.atlasum.com.br') {
        return 'atlasum-sistema'; // Esse é o nome que está gravado no seu banco de dados
    }

    // 2. Regra antiga para subdomínios (mantida por segurança)
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
        return parts[0];
    }
    
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

// 🚀 TELA DE LOGIN ENTERPRISE (SPLIT-SCREEN)
function Login({ onLoginSuccess, tenant }: { onLoginSuccess: (user: Usuario) => void, tenant: any }) {
  const [email, setEmail] = useState(''); 
  const [senha, setSenha] = useState(''); 
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => { 
      e.preventDefault(); 
      setLoading(true);
      try {
        if (email.trim() === 'admin@atlasum.com.br' && senha.trim() === '123456') { 
            setTimeout(() => onLoginSuccess({ id: 0, nome: 'CEO / Admin', email: email, cargo: 'admin' }), 800); 
            return; 
        }

        const { data, error } = await supabase.from('usuarios')
            .select('*')
            .eq('email', email)
            .eq('senha', senha)
            .eq('tenant_id', tenant.id) 
            .maybeSingle();

        if (error) throw error;
        if (data) setTimeout(() => onLoginSuccess(data), 800); 
        else { alert('Acesso Negado ou Usuário não pertence a esta empresa.'); setLoading(false); }
      } catch (err) { alert('Erro de conexão.'); setLoading(false); }
  }

  const primaryColor = tenant?.cor_primaria || '#1e3a8a';

  return (
    <div className="min-h-screen w-full flex bg-slate-50 font-sans">
      
      {/* LADO ESQUERDO: BRANDING */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-16" style={{ backgroundColor: primaryColor }}>
         <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-black/20 rounded-full blur-[120px]"></div>
         <div className="absolute top-[40%] right-[-5%] w-64 h-64 bg-blue-400/20 rounded-full blur-[80px]"></div>

         <div className="relative z-10">
            <div className="flex items-center gap-3 text-white mb-16">
               <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/10 shadow-lg">
                   <Activity size={24} strokeWidth={2.5} />
               </div>
               <span className="font-black text-xl tracking-[0.2em] uppercase">Atlasum</span>
            </div>
            
            <h1 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              A evolução da sua <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Engenharia Clínica.</span>
            </h1>
            <p className="text-white/80 text-lg max-w-md font-medium leading-relaxed">
              Plataforma all-in-one para gestão de ativos, ordens de serviço e metrologia com precisão de auditoria.
            </p>
         </div>

         <div className="relative z-10 flex gap-6 text-white/70">
            <div className="flex items-center gap-2"><ShieldCheck size={18}/> <span className="text-sm font-bold uppercase tracking-wider">Segurança RBC</span></div>
            <div className="flex items-center gap-2"><Cpu size={18}/> <span className="text-sm font-bold uppercase tracking-wider">Cloud SaaS</span></div>
         </div>
      </div>

      {/* LADO DIREITO: FORMULÁRIO DE LOGIN */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
         <div className="absolute top-0 right-0 w-full h-64 bg-gradient-to-b from-slate-100 to-transparent lg:hidden"></div>

         <div className="w-full max-w-md animate-fadeIn relative z-10">
             
             <div className="text-center mb-10">
                 <div className="flex justify-center mb-8">
                     {tenant.logo_url ? (
                         <div className="h-28 flex items-center justify-center p-2">
                            <img src={tenant.logo_url} alt="Logo" className="h-full w-auto object-contain drop-shadow-md" />
                         </div>
                     ) : (
                         <div className="h-24 w-24 rounded-[2rem] flex items-center justify-center shadow-xl text-white font-black text-5xl" style={{ backgroundColor: primaryColor }}>
                             {tenant.nome_fantasia ? tenant.nome_fantasia.charAt(0).toUpperCase() : 'A'}
                         </div>
                     )}
                 </div>
                 <h2 className="text-[32px] font-black text-slate-800 tracking-tight leading-none mb-3">Bem-vindo(a)</h2>
                 <p className="text-slate-500 font-medium">Acesse o ambiente de gestão exclusivo <br className="hidden sm:block"/> da <strong className="text-slate-800">{tenant.nome_fantasia || 'sua unidade'}</strong>.</p>
             </div>

             <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                    <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest ml-1">E-mail corporativo</label>
                    <input 
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 outline-none focus:border-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-slate-400" 
                      value={email} onChange={e => setEmail(e.target.value)} 
                      placeholder="voce@empresa.com" required 
                    />
                </div>
                
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end ml-1">
                        <label className="text-[11px] font-black uppercase text-slate-500 tracking-widest">Senha de acesso</label>
                        <a href="#" className="text-[11px] font-black text-blue-500 hover:text-blue-700 transition-colors uppercase tracking-widest">Esqueceu?</a>
                    </div>
                    <input 
                      className="w-full h-14 px-5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-800 outline-none focus:border-blue-500 transition-all font-bold placeholder:font-medium placeholder:text-slate-400 tracking-widest" 
                      type="password" value={senha} onChange={e => setSenha(e.target.value)} 
                      placeholder="••••••••" required 
                    />
                </div>

                <button disabled={loading} className="w-full h-14 mt-2 text-white font-black rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 group" style={{ backgroundColor: primaryColor }}>
                    {loading ? <Loader2 className="animate-spin" size={24} /> : 'Acessar Plataforma'}
                </button>
             </form>
             
             <div className="mt-16 text-center">
                <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">
                    Tecnologia provida por <br/>
                    <span className="text-slate-800 text-xs mt-1 inline-block">Atlas System Medical</span>
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
  const [themeColor, setThemeColor] = useState(tenant.cor_primaria || '#1e3a8a'); 

  const [config, setConfig] = useState<Config>({ 
      id: tenant.id, 
      nome_empresa: tenant.nome_fantasia, 
      logo_url: tenant.logo_url, 
      cor_primaria: tenant.cor_primaria || '#1e3a8a', 
      cor_secundaria: '#f8fafc' 
  });

  const [clientes, setClientes] = useState<Cliente[]>([]); 
  const [tecnologias, setTecnologias] = useState<Tecnologia[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]); 
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]); 
  const [manuais, setManuais] = useState<Manual[]>([]); 
  const [logs, setLogs] = useState<LogAuditoria[]>([]); 
  const [usuarios, setUsuarios] = useState<Usuario[]>([]); 

  const [targetOsId, setTargetOsId] = useState<number | null>(null);

  const showToast = useCallback((msg: string, type: 'success'|'error'|'info' = 'success') => { 
    setToast({msg, type}); 
    setTimeout(() => setToast(null), 3000); 
  }, []);

  useEffect(() => {
    const inicializarVisual = async () => {
      const pref = await ThemeService.carregarConfiguracaoOficial();
      setThemeColor(pref.primary || tenant.cor_primaria || '#1e3a8a');
      setDarkMode(pref.isDark);
      ThemeService.aplicarTemaNoDOM(pref.primary || tenant.cor_primaria, pref.isDark);
    };
    inicializarVisual();
  }, [tenant]);

  useEffect(() => { 
    if(darkMode) document.documentElement.classList.add('dark'); 
    else document.documentElement.classList.remove('dark'); 
  }, [darkMode]);

  const fetchAll = useCallback(async () => {
    try {
        const [resCli, resTec, resTcn, resMan, resLogs, resUsr] = await Promise.all([
            supabase.from('clientes').select('*').eq('tenant_id', tenant.id),
            supabase.from('tecnologias').select('*'),
            supabase.from('tecnicos').select('*').eq('tenant_id', tenant.id),
            supabase.from('manuais').select('*'),
            supabase.from('logs_auditoria').select('*').order('data', {ascending: false}).limit(50),
            supabase.from('usuarios').select('*').eq('tenant_id', tenant.id)
        ]);

        setClientes(resCli.data || []);
        setTecnologias(resTec.data || []);
        setManuais(resMan.data || []);
        setLogs(resLogs.data || []);
        
        const usuariosData = resUsr.data || [];
        setUsuarios(usuariosData);

        let tecnicosData = resTcn.data || [];
        if (tecnicosData.length === 0 && usuariosData.length > 0) {
            tecnicosData = usuariosData.map(u => ({ id: u.id, nome: u.nome, especialidade: u.cargo }));
        }
        setTecnicos(tecnicosData);

        const tecnologiasData = resTec.data || [];
        const clientesData = resCli.data || [];

        let equipamentosFinal: any[] = [];
        const { data: eqRaw } = await supabase.from('equipamentos').select('*').eq('tenant_id', tenant.id).order('id', {ascending: false});
        if (eqRaw) {
            equipamentosFinal = eqRaw.map(eq => ({
                ...eq,
                tecnologia: tecnologiasData.find(t => t.id === eq.tecnologia_id) || null,
                cliente: clientesData.find(c => c.id === eq.cliente_id) || null,
            }));
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
  }, [showToast, tenant.id]);

  useEffect(() => { fetchAll() }, [fetchAll]);

  const registrarLog = async (acao: string, cliente: string = 'N/A') => { 
      try { await supabase.from('logs_auditoria').insert([{ acao, usuario_nome: user.nome || 'Sistema', cliente_nome: cliente }]); fetchAll(); } 
      catch (e) { console.error("Log error", e) }
  }
  
  const handleNavigate = (path: string) => navigate(`/${path}`);
  const handleAbrirChamadoDoInventario = (eq: Equipamento) => { navigate('/novo-chamado', { state: { preSelectedEquipamento: eq } }); };
  const handleViewOS = (osId: number) => { setTargetOsId(osId); navigate('/ordens'); };

  if (loadingData) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-6"><Loader2 className="animate-spin text-blue-500" size={48}/><p className="font-bold tracking-widest uppercase text-xs">Carregando Ambiente Empresarial...</p></div>;

  return (
    <div className="flex h-screen bg-theme-page font-sans overflow-hidden transition-colors text-theme-main">
      <Sidebar 
        view={currentView} 
        setView={handleNavigate} 
        config={config} 
        user={user}
        onLogout={onLogout} 
        darkMode={darkMode} setDarkMode={setDarkMode} 
        isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        themeColor={themeColor} setThemeColor={setThemeColor}
        isMobileOpen={isMobileMenuOpen} 
        setIsMobileOpen={setIsMobileMenuOpen}
      />
      
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 w-full ${isSidebarCollapsed ? 'md:ml-24' : 'md:ml-72'} ml-0`}>
        <header className="bg-theme-card shadow-sm p-4 flex items-center justify-between md:hidden border-b border-theme z-40">
            <div className="flex items-center gap-3">
               {config.logo_url ? (
                  <img src={config.logo_url} alt="Logo" className="h-8 object-contain" />
               ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: themeColor }}>
                      {config.nome_empresa ? config.nome_empresa.charAt(0).toUpperCase() : 'A'}
                  </div>
               )}
               <h1 className="font-bold text-theme-main">{config.nome_empresa || 'Atlasum'}</h1>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-theme-page border border-theme text-theme-muted rounded-xl hover:text-primary-theme transition-colors active:scale-95">
                <Menu size={24}/>
            </button>
        </header>
        
        <main className="flex-1 overflow-y-auto p-0">
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<Navigate to="/painel" replace />} />
                    <Route path="/painel" element={<DashboardPage equipamentos={equipamentos} ordens={ordens} />} />
                    <Route path="/equipamentos" element={<EquipamentosPage allOrders={ordens} onOpenNewOS={handleAbrirChamadoDoInventario} onViewOS={handleViewOS} />} />
                    <Route path="/novo-chamado" element={<AberturaChamadoPage equipamentos={equipamentos} clientes={clientes} showToast={showToast} fetchAll={fetchAll} />} />
                    <Route path="/ordens" element={<OrdemServicoPage view="lista_atendimento" setView={() => {}} equipamentos={equipamentos} clientes={clientes} tecnicos={tecnicos} ordens={ordens} fetchAll={fetchAll} onRegisterLog={registrarLog} showToast={showToast} targetOsId={targetOsId} />} />
                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/tecnologias" element={<TecnologiasPage />} />
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
                    <Route path="*" element={<div className="p-10 text-center text-theme-muted">Página não encontrada (404)</div>} />
                </Routes>
            </ErrorBoundary>
        </main>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      </div>
    </div>
  )
}

export default function App() { 
    const [tenant, setTenant] = useState<any>(null);
    const [loadingTenant, setLoadingTenant] = useState(true);
    const [user, setUser] = useState<Usuario | null>(null); 

    const isPublicView = window.location.pathname.startsWith('/view/os');

    useEffect(() => {
        const initTenant = async () => {
            const slug = getSubdomain();
            
            let { data: tData, error } = await supabase.from('empresas_inquilinas').select('*').eq('slug_subdominio', slug).maybeSingle();

            if (tData && slug === 'admin' && !tData.logo_url) {
                 const { data: configAntiga } = await supabase.from('configuracoes_empresa').select('logo_url').eq('id', 1).maybeSingle();
                 if (configAntiga?.logo_url) {
                     tData.logo_url = configAntiga.logo_url;
                 }
            }

            if (tData) {
                setTenant(tData);
                if(tData.status_assinatura === 'bloqueado') {
                    alert('Assinatura Bloqueada. Contate o suporte Atlasum.');
                }
            }
            setLoadingTenant(false);
        };
        initTenant();
    }, []);

    if (isPublicView) return <ErrorBoundary><OSPublicView /></ErrorBoundary>;

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

    // 🚀 AQUI A MÁGICA ACONTECE: Roteamento Inteligente
    return (
        <ErrorBoundary>
            <Routes>
                {/* 1. Landing Page na raiz (se não estiver logado) */}
                <Route path="/" element={user ? <Navigate to="/painel" replace /> : <LandingPage />} />
                
                {/* 2. Tela de Login Exclusiva */}
                <Route path="/login" element={user ? <Navigate to="/painel" replace /> : <Login tenant={tenant} onLoginSuccess={(u) => setUser(u)} />} />
                
                {/* 3. Todo o resto do sistema (Rotas Privadas) */}
                <Route path="/*" element={user ? <MainLayout user={user} tenant={tenant} onLogout={() => setUser(null)} /> : <Navigate to="/login" replace /> } />
            </Routes>
        </ErrorBoundary>
    )
}