import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, Megaphone, ClipboardList, Monitor, Package, 
  Cpu, Calendar, Scale, FileCheck, BookOpen, Briefcase, Calculator, 
  DollarSign, Users, Settings, Globe, LogOut, ChevronLeft, ChevronRight 
} from 'lucide-react';
import type { Config, Usuario } from '../types';
import { ATLAS_THEMES } from '../constants/themes'; 
import { ThemeService } from '../services/ThemeService';

interface SidebarProps {
  view: string;
  setView: (path: string) => void;
  onLogout: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  config: Config;
  user?: Usuario | null; 
  isMobileOpen?: boolean;
  setIsMobileOpen?: (isOpen: boolean) => void;
}

export function Sidebar({ 
  view, setView, onLogout, isCollapsed, toggleSidebar, 
  themeColor, setThemeColor, config, user, isMobileOpen, setIsMobileOpen 
}: SidebarProps) {
  const [empresaConfig, setEmpresaConfig] = useState<any>(null);
  const [permissoesDinamicas, setPermissoesDinamicas] = useState<any[]>([]);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracoes_empresa').select('nome_empresa, logo_url').eq('id', 1).maybeSingle();
      if (data) setEmpresaConfig(data);
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const carregarPermissoes = async () => {
        if (!user || !config?.id) return;
        
        // Pega o nível de acesso real do banco (Master, Gestor, Tecnico, etc)
        const role = user.nivel_acesso || 'usuario';
        
        if (role === 'master') return; // Master não precisa carregar matriz, ele vê tudo da empresa dele.

        const { data, error } = await supabase
            .from('tenant_permissoes')
            .select('modulo_id, permitido')
            .eq('tenant_id', config.id)
            .eq('nivel_acesso', role);
        
        if (!error && data) setPermissoesDinamicas(data);
    };
    carregarPermissoes();
  }, [user, config?.id]);

  const companyName = empresaConfig?.nome_empresa || config?.nome_empresa || 'Atlasum';
  const logoUrl = empresaConfig?.logo_url || config?.logo_url || null;

  const handleThemeChange = (theme: any) => {
      setThemeColor(theme.primary);
      ThemeService.salvarNovoTema(theme.id, theme.primary);
      ThemeService.aplicarTemaNoDOM(theme.primary, false); // Força Light Mode
  };

  const menuItems = [
    { section: 'Métricas & Gestão', id: 'painel', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'indicadores', label: 'Indicadores (BI)', icon: PieChart },

    { section: 'Operação em Campo', id: 'novo-chamado', label: 'Novo Chamado', icon: Megaphone },
    { id: 'ordens', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'equipamentos', label: 'Ativos & Inventário', icon: Monitor },

    { section: 'Engenharia Clínica', id: 'cronograma', label: 'Plano Diretor', icon: Calendar },
    { id: 'metrologia', label: 'Metrologia LIMS', icon: Scale },
    { id: 'checklists', label: 'Checklists Técnicos', icon: FileCheck },
    { id: 'manuais', label: 'Biblioteca Digital', icon: BookOpen },

    { section: 'Administrativo', id: 'estoque', label: 'Gestão de Estoque', icon: Package },
    { id: 'tecnologias', label: 'Padrões & Modelos', icon: Cpu },
    { id: 'clientes', label: 'Clientes & CRM', icon: Briefcase },
    { id: 'orcamentos', label: 'Vendas & Propostas', icon: Calculator },
    { id: 'financeiro', label: 'Fluxo de Caixa', icon: DollarSign },
    { id: 'equipe', label: 'Equipe Técnica', icon: Users },

    { section: 'Sistema', id: 'configuracoes', label: 'Configurações', icon: Settings },
    { id: 'admin-geral', label: 'Admin Geral (SaaS)', icon: Globe },
  ];

  // 🚀 O NOVO CÃO DE GUARDA DE PERMISSÕES
  const temAcesso = (moduloId: string) => {
      const role = user?.nivel_acesso || 'usuario'; // Se estiver vazio, bloqueia como usuário comum.

      // 1. BLINDAGEM MÁXIMA: Admin Geral (SaaS)
      if (moduloId === 'admin-geral') {
          const host = window.location.hostname;
          // Só libera se o subdomínio for exatamente o da Atlasum (dona do sistema)
          const isAtlasumRoot = host.includes('atlasum-sistema') || host.includes('admin') || host === 'localhost';
          
          // Se for o painel de um cliente (ex: tecmedeng), BLOQUEIA IMEDIATAMENTE.
          if (host.includes('tecmedeng') || (!host.includes('atlasum-sistema') && host !== 'localhost')) {
              return false; 
          }
          
          return role === 'master' && isAtlasumRoot;
      }

      // 2. Se for o "Dono/Master" da clínica atual, ele vê o resto do sistema dele.
      if (role === 'master') return true;

      // 3. Permissões Dinâmicas (O que você marcou na Matriz de Acesso)
      const permDb = permissoesDinamicas.find(p => p.modulo_id === moduloId);
      if (permDb) return permDb.permitido;

      // 4. Regras Rígidas Padrão (Se a matriz não estiver configurada)
      const regrasPadrao: Record<string, string[]> = {
          'painel': ['administrativo', 'gestor', 'tecnico', 'usuario', 'cliente'],
          'novo-chamado': ['administrativo', 'gestor', 'tecnico', 'usuario', 'cliente'],
          'ordens': ['administrativo', 'gestor', 'tecnico', 'cliente'],
          'equipamentos': ['administrativo', 'gestor', 'tecnico', 'cliente'],
          'manuais': ['administrativo', 'gestor', 'tecnico', 'cliente'],
          'indicadores': ['administrativo', 'gestor'],
          'cronograma': ['administrativo', 'gestor', 'tecnico'],
          'metrologia': ['gestor', 'tecnico'],
          'checklists': ['gestor', 'tecnico'],
          'estoque': ['administrativo', 'gestor'], // Técnico não vê estoque por padrão
          'tecnologias': ['gestor'],
          'clientes': ['administrativo', 'gestor'],
          'orcamentos': ['administrativo', 'gestor'],
          'financeiro': ['administrativo'],
          'equipe': ['administrativo', 'gestor'],
          'configuracoes': [] // APENAS Master pode ver as configurações
      };
      
      return regrasPadrao[moduloId]?.includes(role) || false;
  };

  const visibleMenu = menuItems.filter(item => temAcesso(item.id));

  const handleMenuClick = (id: string) => {
      setView(id);
      if (window.innerWidth < 768 && setIsMobileOpen) setIsMobileOpen(false);
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] md:hidden transition-opacity"
          onClick={() => setIsMobileOpen?.(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[70] flex flex-col transition-all duration-500 bg-theme-card border-r border-theme shadow-2xl md:shadow-none ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 ${isCollapsed ? 'md:w-24 w-72' : 'w-72'}`}>
          <div className="h-24 flex items-center justify-between px-6 shrink-0 relative overflow-hidden">
              {(!isCollapsed || window.innerWidth < 768) ? (
                <div className="flex items-center gap-3 animate-fadeIn">
                    {logoUrl ? (
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-xl flex items-center justify-center p-2 shrink-0 border border-slate-100/50">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg bg-primary-theme">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex flex-col justify-center">
                      <h1 className="text-[16px] font-black text-theme-main tracking-tighter leading-tight truncate w-36">{companyName}</h1>
                      <span className="text-[9px] font-black text-primary-theme uppercase tracking-[0.2em] opacity-80">Eng. Clínica</span>
                    </div>
                </div>
              ) : (
                  <div className="mx-auto flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer hidden md:flex" onClick={toggleSidebar}>
                      <div className="w-6 h-1 bg-theme-muted rounded-full" />
                      <div className="w-4 h-1 bg-theme-muted rounded-full" />
                  </div>
              )}
          </div>

          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar space-y-1">
              {visibleMenu.map((item, index) => {
                  const active = view === item.id;
                  const showSection = item.section && (!isCollapsed || window.innerWidth < 768) && (index === 0 || visibleMenu[index-1].section !== item.section);

                  return (
                      <div key={item.id} className="px-3">
                          {showSection && (
                              <div className="px-4 pt-6 pb-2">
                                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-muted opacity-60">{item.section}</p>
                              </div>
                          )}
                          <button 
                              onClick={() => handleMenuClick(item.id)}
                              className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 active:scale-95
                                  ${active 
                                  ? 'bg-primary-theme shadow-lg shadow-primary-theme/25' 
                                  : 'hover:bg-theme-card hover:shadow-md border border-transparent hover:border-theme'}`}
                          >
                              <item.icon 
                                  size={18} 
                                  strokeWidth={1.5} 
                                  className={`transition-all duration-300 ${active ? 'text-white' : 'text-theme-muted group-hover:text-primary-theme'}`}
                              />
                              {(!isCollapsed || window.innerWidth < 768) && (
                                  <span className={`text-[13px] font-bold tracking-tight transition-all ${active ? 'text-white' : 'text-theme-main'}`}>
                                      {item.label}
                                  </span>
                              )}
                              {(isCollapsed && window.innerWidth >= 768) && (
                                  <div className="absolute left-full ml-4 px-3 py-2 bg-theme-card backdrop-blur-xl border border-theme text-theme-main text-[11px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-2xl">
                                      {item.label}
                                  </div>
                              )}
                          </button>
                      </div>
                  );
              })}
          </nav>

          <button onClick={toggleSidebar} className="hidden md:flex absolute -right-3 top-12 w-7 h-7 bg-theme-card border border-theme rounded-full items-center justify-center text-theme-muted hover:text-primary-theme shadow-xl z-50 transition-all active:scale-75">
              {isCollapsed ? <ChevronRight size={14} strokeWidth={3}/> : <ChevronLeft size={14} strokeWidth={3}/>}
          </button>

          <div className="p-4 mt-auto border-t border-theme">
              {(!isCollapsed || window.innerWidth < 768) && (
                <div className="mb-4 animate-fadeIn">
                  <div className="flex justify-center items-center bg-theme-page/50 backdrop-blur-md p-2 rounded-2xl border border-theme shadow-inner">
                    <div className="flex gap-2 px-1">
                      {ATLAS_THEMES.map((theme) => (
                        <button key={theme.id} onClick={() => handleThemeChange(theme)} className={`w-5 h-5 rounded-full transition-all duration-500 hover:scale-125 ${themeColor === theme.primary ? 'ring-2 ring-primary-theme ring-offset-2 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`} style={{ backgroundColor: theme.primary }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1 mb-4 px-2 py-3 bg-theme-page/30 border border-theme rounded-2xl hidden md:flex">
                  <span className="text-[9px] font-black uppercase text-theme-muted tracking-wider text-center">{user?.nivel_acesso || 'Usuário'}</span>
                  <span className="text-xs font-bold text-theme-main text-center truncate">{user?.nome || 'Logado'}</span>
              </div>
              <button onClick={onLogout} className="group flex items-center justify-center md:justify-start gap-3 w-full px-4 py-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all duration-300 active:scale-95">
                  <LogOut size={18} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
                  {(!isCollapsed || window.innerWidth < 768) && <span className="text-[11px] font-black uppercase tracking-widest">Sair da Conta</span>}
              </button>
          </div>
      </aside>
    </>
  ) 
}

function PieChart(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size||24} height={props.size||24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={props.strokeWidth||2} strokeLinecap="round" strokeLinejoin="round" className={props.className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
  );
}