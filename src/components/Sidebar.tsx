import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, Megaphone, ClipboardList, Monitor, Package, 
  Cpu, Calendar, Scale, FileCheck, BookOpen, Briefcase, Calculator, 
  DollarSign, Users, Settings, Globe, LogOut, ChevronLeft, ChevronRight, Zap 
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

  // 🚀 SILENCIADOR DO TYPESCRIPT APLICADO AQUI: (user as any)
  const userRole = (user as any)?.nivel_acesso 
    || (user?.email === 'admin@atlasum.com.br' || user?.nome === 'CEO / Admin' ? 'master' : 'usuario');
  const normalizedRole = userRole.toLowerCase();

  useEffect(() => {
    const fetchConfig = async () => {
      if(config?.id) {
          const { data } = await supabase.from('empresas_inquilinas').select('nome_fantasia, logo_url').eq('id', config.id).maybeSingle();
          if (data) setEmpresaConfig(data);
      }
    };
    fetchConfig();
  }, [config?.id]);

  useEffect(() => {
    const carregarPermissoes = async () => {
        if (!user || !config?.id || normalizedRole === 'master') return;

        const { data, error } = await supabase
            .from('tenant_permissoes')
            .select('modulo_id, permitido')
            .eq('tenant_id', config.id)
            .eq('nivel_acesso', normalizedRole);
        
        if (!error && data) setPermissoesDinamicas(data);
    };
    carregarPermissoes();
  }, [user, config?.id, normalizedRole]);

  const companyName = empresaConfig?.nome_fantasia || config?.nome_empresa || 'Atlasum';
  const logoUrl = empresaConfig?.logo_url || config?.logo_url || null;

  const handleThemeChange = (theme: any) => {
      setThemeColor(theme.primary);
      ThemeService.salvarNovoTema(theme.id, theme.primary);
      ThemeService.aplicarTemaNoDOM(theme.primary, false);
  };

  const menuItems = [
    { section: 'Métricas & Gestão', id: 'painel', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'indicadores', label: 'Indicadores (BI)', icon: PieChart },
    { section: 'Operação em Campo', id: 'novo-chamado', label: 'Novo Chamado', icon: Megaphone },
    { id: 'central', label: 'Central (Triagem)', icon: Zap }, // 🚀 NOVO BOTÃO CENTRAL AQUI
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

  const temAcesso = (moduloId: string) => {
      if (moduloId === 'admin-geral') {
          // Força a liberação absoluta se for o e-mail do dono da plataforma
          if (user?.email === 'admin@atlasum.com.br') return true;
          return config?.id === 1 && normalizedRole === 'master';
      }

      if (moduloId === 'configuracoes') return normalizedRole === 'master';
      if (normalizedRole === 'master') return true;

      const permDb = permissoesDinamicas.find(p => p.modulo_id === moduloId);
      if (permDb) return permDb.permitido;

      const regrasPadrao: Record<string, string[]> = {
          'painel': ['administrativo', 'gestor', 'tecnico', 'usuario', 'cliente'],
          'novo-chamado': ['administrativo', 'gestor', 'tecnico', 'usuario', 'cliente'],
          'central': ['administrativo', 'gestor'], // 🚀 REGRAS DE PERMISSÃO DA CENTRAL
          'ordens': ['administrativo', 'gestor', 'tecnico', 'cliente'],
          'equipamentos': ['administrativo', 'gestor', 'tecnico', 'cliente'],
          'manuais': ['administrativo', 'gestor', 'tecnico', 'cliente'],
          'indicadores': ['administrativo', 'gestor'],
          'cronograma': ['administrativo', 'gestor', 'tecnico'],
          'metrologia': ['gestor', 'tecnico'],
          'checklists': ['gestor', 'tecnico'],
          'estoque': ['administrativo', 'gestor'],
          'tecnologias': ['gestor'],
          'clientes': ['administrativo', 'gestor'],
          'orcamentos': ['administrativo', 'gestor'],
          'financeiro': ['administrativo'],
          'equipe': ['administrativo', 'gestor']
      };
      return regrasPadrao[moduloId]?.includes(normalizedRole) || false;
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
                        <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center p-2 shrink-0 border border-slate-200">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                    ) : (
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg bg-primary-theme">
                          {companyName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div className="flex flex-col justify-center">
                      <h1 className="text-[15px] font-black text-theme-main tracking-tight leading-tight truncate w-36">{companyName}</h1>
                      <span className="text-[9px] font-black text-primary-theme uppercase tracking-widest opacity-80 mt-0.5">Eng. Clínica</span>
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
                                  ? 'bg-primary-theme shadow-md shadow-primary-theme/20 ring-1 ring-primary-theme/30' 
                                  : 'hover:bg-theme-card hover:shadow-sm border border-transparent hover:border-theme'}`}
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

          <button onClick={toggleSidebar} className="hidden md:flex absolute -right-3 top-12 w-7 h-7 bg-theme-card border border-theme rounded-full items-center justify-center text-theme-muted hover:text-primary-theme shadow-lg z-50 transition-all active:scale-75">
              {isCollapsed ? <ChevronRight size={14} strokeWidth={3}/> : <ChevronLeft size={14} strokeWidth={3}/>}
          </button>

          <div className="p-4 mt-auto border-t border-theme bg-slate-50/50">
              {(!isCollapsed || window.innerWidth < 768) && (
                <div className="mb-4 animate-fadeIn">
                  <div className="flex justify-center items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex gap-2 px-1">
                      {ATLAS_THEMES.map((theme) => (
                        <button key={theme.id} onClick={() => handleThemeChange(theme)} className={`w-5 h-5 rounded-full transition-all duration-500 hover:scale-110 ${themeColor === theme.primary ? 'ring-2 ring-primary-theme ring-offset-2 scale-110 shadow-md' : 'opacity-50 hover:opacity-100'}`} style={{ backgroundColor: theme.primary }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-1 mb-4 px-2 py-3 bg-white border border-slate-200 rounded-2xl hidden md:flex shadow-sm">
                  <span className="text-[9px] font-black uppercase text-blue-600 tracking-wider text-center bg-blue-50 py-0.5 rounded-md mx-2">
                      {config?.id === 1 && normalizedRole === 'master' ? 'SUPER ADMIN' : normalizedRole}
                  </span>
                  <span className="text-xs font-bold text-slate-800 text-center truncate">{user?.nome || 'Sua Conta'}</span>
              </div>
              <button onClick={onLogout} className="group flex items-center justify-center md:justify-start gap-3 w-full px-4 py-3.5 bg-white text-rose-500 hover:bg-rose-50 border border-slate-200 rounded-xl transition-all duration-300 active:scale-95 shadow-sm">
                  <LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                  {(!isCollapsed || window.innerWidth < 768) && <span className="text-xs font-black uppercase tracking-widest">Sair da Conta</span>}
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