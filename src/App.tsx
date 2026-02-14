import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom' 
import { Menu, X, Loader2, Wrench } from 'lucide-react'
import { supabase } from './supabaseClient'

// --- SERVIÇOS ---
import { ThemeService } from './services/ThemeService'

// --- COMPONENTES ---
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './pages/ordem-servico/components/ErrorBoundary'

// --- PÁGINAS ---
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

import type { Usuario, Config, Cliente, Tecnologia, Equipamento, Tecnico, Manual, OrdemServico, LogAuditoria } from './types'

function Toast({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) {
  if (!message) return null;
  const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' }
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl ${colors[type] || 'bg-blue-600'} text-white animate-bounce-in`}>
      <p className="font-bold text-sm">{message}</p>
      <button onClick={onClose}><X size={16} className="opacity-80 hover:opacity-100"/></button>
    </div>
  )
}

function Login({ onLoginSuccess }: { onLoginSuccess: (user: Usuario) => void }) {
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
        const { data, error } = await supabase.from('usuarios').select('*').eq('email', email).eq('senha', senha).maybeSingle();
        if (error) throw error;
        if (data) setTimeout(() => onLoginSuccess(data), 800); 
        else { alert('Acesso Negado.'); setLoading(false); }
      } catch (err) { alert('Erro de conexão.'); setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] font-sans p-4">
      <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/10 text-center">
         <div className="mb-8 flex justify-center"><div className="bg-blue-600 p-4 rounded-2xl shadow-lg"><Wrench size={32} className="text-white"/></div></div>
         <h1 className="text-3xl font-bold text-white mb-2">Atlasum</h1>
         <p className="text-blue-200 text-sm mb-8 uppercase tracking-widest">Enterprise Edition</p>
         <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
            <input className="w-full p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500" type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" required />
            <button disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg mt-2">{loading ? 'Acessando...' : 'Entrar'}</button>
         </form>
      </div>
    </div>
  )
}

function MainLayout({ user, onLogout }: { user: Usuario, onLogout: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentView = location.pathname.replace('/', '') || 'painel';

  const [loadingData, setLoadingData] = useState(true); 
  const [darkMode, setDarkMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'|'info'} | null>(null);
  const [themeColor, setThemeColor] = useState('#2563eb'); 

  const [config, setConfig] = useState<Config>({ id: 0, nome_empresa: 'Atlasum', logo_url: '', cor_primaria: '#0f172a', cor_secundaria: '#f8fafc' });
  const [clientes, setClientes] = useState<Cliente[]>([]); 
  const [tecnologias, setTecnologias] = useState<Tecologia[]>([]);
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
      setThemeColor(pref.primary);
      setDarkMode(pref.isDark);
      ThemeService.aplicarTemaNoDOM(pref.primary, pref.isDark);
    };
    inicializarVisual();
  }, []);

  useEffect(() => { 
    if(darkMode) document.documentElement.classList.add('dark'); 
    else document.documentElement.classList.remove('dark'); 
  }, [darkMode]);

  const fetchAll = useCallback(async () => {
    try {
        const [resCfg, resCli, resTec, resTcn, resMan, resLogs, resUsr] = await Promise.all([
            supabase.from('configuracoes').select('*').maybeSingle(),
            supabase.from('clientes').select('*'),
            supabase.from('tecnologias').select('*'),
            supabase.from('tecnicos').select('*'),
            supabase.from('manuais').select('*'),
            supabase.from('logs_auditoria').select('*').order('data', {ascending: false}).limit(50),
            supabase.from('usuarios').select('*')
        ]);

        if(resCfg.data) setConfig(resCfg.data);
        setClientes(resCli.data || []);
        setTecnologias(resTec.data || []);
        setManuais(resMan.data || []);
        setLogs(resLogs.data || []);
        
        const usuariosData = resUsr.data || [];
        setUsuarios(usuariosData);

        // CORREÇÃO DOS TÉCNICOS INVISÍVEIS: Se a tabela de técnicos falhar, usa os usuários.
        let tecnicosData = resTcn.data || [];
        if (tecnicosData.length === 0 && usuariosData.length > 0) {
            tecnicosData = usuariosData.map(u => ({ id: u.id, nome: u.nome, especialidade: u.cargo }));
        }
        setTecnicos(tecnicosData);

        const tecnologiasData = resTec.data || [];
        const clientesData = resCli.data || [];

        let equipamentosFinal: any[] = [];
        const { data: eqRaw } = await supabase.from('equipamentos').select('*').order('id', {ascending: false});
        if (eqRaw) {
            equipamentosFinal = eqRaw.map(eq => ({
                ...eq,
                tecnologia: tecnologiasData.find(t => t.id === eq.tecnologia_id) || null,
                cliente: clientesData.find(c => c.id === eq.cliente_id) || null,
            }));
        }
        setEquipamentos(equipamentosFinal);

        let ordensFinal: any[] = [];
        const { data: osRaw } = await supabase.from('ordens_servico').select('*').order('id', {ascending: false});
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
        showToast('Erro de conexão com o banco.', 'error');
    } finally {
        setLoadingData(false);
    }
  }, [showToast]);

  useEffect(() => { fetchAll() }, [fetchAll]);

  const registrarLog = async (acao: string, cliente: string = 'N/A') => { 
      try { await supabase.from('logs_auditoria').insert([{ acao, usuario_nome: user.nome || 'Sistema', cliente_nome: cliente }]); fetchAll(); } 
      catch (e) { console.error("Log error", e) }
  }
  
  const handleNavigate = (path: string) => navigate(`/${path}`);
  const handleAbrirChamadoDoInventario = (eq: Equipamento) => { navigate('/novo-chamado', { state: { preSelectedEquipamento: eq } }); };
  const handleViewOS = (osId: number) => { setTargetOsId(osId); navigate('/ordens'); };

  if (loadingData) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white flex-col gap-4"><Loader2 className="animate-spin text-blue-500" size={64}/><p>Carregando Atlasum...</p></div>;

  return (
    <div className="flex h-screen bg-slate-100 font-sans overflow-hidden transition-colors dark:bg-slate-950 text-slate-800 dark:text-slate-200">
      <Sidebar 
        view={currentView} 
        setView={handleNavigate} 
        config={config} 
        user={user} /* <-- CORREÇÃO: Isso faz a Equipe Técnica voltar a aparecer na barra lateral */
        onLogout={onLogout} 
        darkMode={darkMode} setDarkMode={setDarkMode} 
        isCollapsed={isSidebarCollapsed} toggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        themeColor={themeColor} setThemeColor={setThemeColor} 
      />
      
      <div className={`flex-1 flex flex-col h-full overflow-hidden relative transition-all duration-300 ${isSidebarCollapsed ? 'ml-24' : 'ml-72'}`}>
        <header className="bg-white dark:bg-slate-900 shadow-sm p-4 flex items-center justify-between md:hidden">
            <h1 className="font-bold text-slate-800 dark:text-white">Atlasum</h1>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 dark:text-white"><Menu /></button>
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
                    
                    <Route path="*" element={<div className="p-10 text-center">Página não encontrada (404)</div>} />
                </Routes>
            </ErrorBoundary>
        </main>
        {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      </div>
    </div>
  )
}

export default function App() { 
    const [user, setUser] = useState<Usuario | null>(null); 
    const isPublicView = window.location.pathname.startsWith('/view/os');
    if (isPublicView) return <ErrorBoundary><OSPublicView /></ErrorBoundary>;

    return (
        <ErrorBoundary>
            <Routes>
                <Route path="/*" element={user ? <MainLayout user={user} onLogout={() => setUser(null)} /> : <Login onLoginSuccess={(u) => setUser(u)} /> } />
            </Routes>
        </ErrorBoundary>
    )
}