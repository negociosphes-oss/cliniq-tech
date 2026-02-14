import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  LayoutDashboard, Wrench, Monitor, LogOut, Megaphone, 
  ClipboardList, Calendar, Scale, BookOpen, Settings, 
  Sun, Moon, ChevronLeft, ChevronRight, FileCheck,
  Calculator, PieChart, Briefcase, DollarSign, Cpu, Users
} from 'lucide-react';
import type { Config, Usuario } from '../types';
import { ATLAS_THEMES } from '../constants/themes'; 
import { ThemeService } from '../services/ThemeService';

interface SidebarProps {
  view: string;
  setView: (path: string) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (mode: boolean) => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  config: Config;
  user?: Usuario | null; // Recebe o usuário para validar permissões
}

export function Sidebar({ view, setView, onLogout, darkMode, setDarkMode, isCollapsed, toggleSidebar, themeColor, setThemeColor, config, user }: SidebarProps) {
  const [empresaConfig, setEmpresaConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracoes_empresa').select('nome_empresa, logo_url').eq('id', 1).maybeSingle();
      if (data) setEmpresaConfig(data);
    };
    fetchConfig();
  }, []);

  const companyName = empresaConfig?.nome_empresa || config?.nome_empresa || 'Atlasum';
  const logoUrl = empresaConfig?.logo_url || config?.logo_url || null;

  const handleThemeChange = (theme: any) => {
      setThemeColor(theme.primary);
      ThemeService.salvarNovoTema(theme.id, theme.primary);
  };

  const handleDarkToggle = () => {
      const novoModo = !darkMode;
      setDarkMode(novoModo);
      ThemeService.aplicarTemaNoDOM(themeColor, novoModo);
  };

  // --- MENU DE NAVEGAÇÃO (COM EQUIPE TÉCNICA RESTAURADA) ---
  const menuItems = [
    { section: 'Visão Geral', id: 'painel', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'indicadores', label: 'BI & Analytics', icon: PieChart },

    { section: 'Operacional', id: 'novo-chamado', label: 'Novo Chamado', icon: Megaphone },
    { id: 'ordens', label: 'Ordens de Serviço', icon: ClipboardList },
    { id: 'equipamentos', label: 'Ativos & Inventário', icon: Monitor },
    { id: 'tecnologias', label: 'Padrões & Modelos', icon: Cpu },

    { section: 'Engenharia', id: 'cronograma', label: 'Plano Diretor', icon: Calendar },
    { id: 'metrologia', label: 'LIMS Metrologia', icon: Scale },
    { id: 'checklists', label: 'Smart Checklists', icon: FileCheck },
    { id: 'manuais', label: 'Cloud Library', icon: BookOpen },

    { section: 'Negócios', id: 'clientes', label: 'Clientes & CRM', icon: Briefcase },
    { id: 'orcamentos', label: 'Vendas & Propostas', icon: Calculator },
    { id: 'financeiro', label: 'Fluxo de Caixa', icon: DollarSign },

    { section: 'Sistema', id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  // Injeta o menu Equipe Técnica se o usuário for Admin ou CEO
  if (user && (user.cargo?.toLowerCase().includes('admin') || user.cargo?.toLowerCase().includes('ceo') || user.nome === 'CEO / Admin')) {
      menuItems.splice(10, 0, { section: 'Equipe', id: 'equipe', label: 'Equipe Técnica', icon: Users } as any);
  }

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
        ${isCollapsed ? 'w-24' : 'w-72'}
        bg-theme-card border-r border-theme shadow-2xl
      `}
    >
        <div className="h-24 flex items-center justify-between px-6 shrink-0 relative overflow-hidden">
            {!isCollapsed ? (
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
                    <h1 className="text-[16px] font-black text-theme-main tracking-tighter leading-tight">{companyName}</h1>
                    <span className="text-[9px] font-black text-primary-theme uppercase tracking-[0.2em] opacity-80">Enterprise</span>
                  </div>
              </div>
            ) : (
                <div className="mx-auto flex flex-col items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" onClick={toggleSidebar}>
                    <div className="w-6 h-1 bg-theme-muted rounded-full" />
                    <div className="w-4 h-1 bg-theme-muted rounded-full" />
                </div>
            )}
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar space-y-1">
            {menuItems.map((item, index) => {
                const active = view === item.id;
                const showSection = item.section && !isCollapsed && (index === 0 || menuItems[index-1].section !== item.section);

                return (
                    <div key={item.id} className="px-3">
                        {showSection && (
                            <div className="px-4 pt-6 pb-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-theme-muted opacity-60">{item.section}</p>
                            </div>
                        )}
                        <button 
                            onClick={() => setView(item.id)}
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
                            {!isCollapsed && (
                                <span className={`text-[13px] font-bold tracking-tight transition-all ${active ? 'text-white' : 'text-theme-main'}`}>
                                    {item.label}
                                </span>
                            )}
                            {isCollapsed && (
                                <div className="absolute left-full ml-4 px-3 py-2 bg-theme-card backdrop-blur-xl border border-theme text-theme-main text-[11px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 whitespace-nowrap shadow-2xl">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    </div>
                );
            })}
        </nav>

        <button 
            onClick={toggleSidebar} 
            className="absolute -right-3 top-12 w-7 h-7 bg-theme-card border border-theme rounded-full flex items-center justify-center text-theme-muted hover:text-primary-theme shadow-xl z-50 transition-all active:scale-75"
        >
            {isCollapsed ? <ChevronRight size={14} strokeWidth={3}/> : <ChevronLeft size={14} strokeWidth={3}/>}
        </button>

        <div className="p-4 mt-auto">
            {!isCollapsed && (
              <div className="mb-4 animate-fadeIn">
                <div className="flex justify-between items-center bg-theme-page/50 backdrop-blur-md p-2 rounded-2xl border border-theme shadow-inner">
                  <div className="flex gap-1.5 px-1">
                    {ATLAS_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeChange(theme)}
                        className={`w-5 h-5 rounded-full transition-all duration-500 hover:scale-125 
                          ${themeColor === theme.primary ? 'ring-2 ring-primary-theme ring-offset-2 scale-110 shadow-lg' : 'opacity-40 hover:opacity-100'}`}
                        style={{ backgroundColor: theme.primary }}
                      />
                    ))}
                  </div>
                  <div className="w-[1px] h-4 bg-theme-muted opacity-20 mx-1" />
                  <button onClick={handleDarkToggle} className="p-2 text-theme-muted hover:text-primary-theme transition-all active:scale-75">
                    {darkMode ? <Sun size={18} strokeWidth={1.5}/> : <Moon size={18} strokeWidth={1.5}/>}
                  </button>
                </div>
              </div>
            )}
            <button onClick={onLogout} className="group flex items-center gap-3 w-full px-4 py-4 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all duration-300 active:scale-95">
                <LogOut size={18} strokeWidth={2} className="group-hover:-translate-x-1 transition-transform" />
                {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">Sair da Conta</span>}
            </button>
        </div>
    </aside>
  ) 
}