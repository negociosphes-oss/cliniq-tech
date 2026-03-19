import { useState } from 'react';
import { Settings, Users, ShieldCheck, Building, Bell, HardDrive, Key, ListChecks, Lock, CreditCard } from 'lucide-react';
import { ConfigGeral } from './components/ConfigGeral';
import { UsuariosList } from './components/UsuariosList';
import { AuditLogsList } from './components/AuditLogsList'; 
import { TiposOSList } from './components/TiposOSList'; 
import { PermissoesCargos } from './components/PermissoesCargos';
import { MeuPlano } from './components/MeuPlano';
import { NotificacoesConfig } from './components/NotificacoesConfig'; // 🚀 AJUSTE 1: IMPORT ADICIONADO

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'empresa' | 'tiposos' | 'usuarios' | 'permissoes' | 'auditoria' | 'notificacoes' | 'plano'>('empresa');

  return (
    <div className="min-h-screen p-4 md:p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24 overflow-x-hidden">
      
      {/* HEADER DA PÁGINA */}
      <div className="mb-6 md:mb-8 pl-2">
        <h2 className="text-2xl md:text-3xl font-black text-theme-main tracking-tight flex items-center gap-3">
            <span className="p-3 bg-theme-card border border-theme rounded-2xl shadow-sm shrink-0">
                <Settings size={24} strokeWidth={1.5} className="animate-spin-slow"/>
            </span>
            Painel de Controle
        </h2>
        <p className="text-theme-muted font-medium mt-2 ml-1 text-sm md:text-base">Gerencie as configurações globais, acessos e segurança da plataforma.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8 items-start w-full">
        
        {/* MENU LATERAL RESPONSIVO */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-24">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-3 lg:gap-8 pb-4 lg:pb-0 custom-scrollbar w-full">
                
                <div className="flex lg:flex-col gap-3 lg:gap-1 shrink-0 lg:w-full">
                    <h4 className="hidden lg:block text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 px-4 opacity-70 mt-2">Geral</h4>
                    <MenuButton 
                        active={activeTab === 'empresa'} 
                        onClick={() => setActiveTab('empresa')} 
                        icon={<Building size={18} strokeWidth={1.5}/>} 
                        title="Identidade" 
                        subtitle="Logotipo & Dados"
                    />
                    <MenuButton 
                        active={activeTab === 'tiposos'} 
                        onClick={() => setActiveTab('tiposos')} 
                        icon={<ListChecks size={18} strokeWidth={1.5}/>} 
                        title="Tipos de O.S." 
                        subtitle="Regras & Metrologia"
                    />
                    <MenuButton 
                        active={activeTab === 'notificacoes'} 
                        onClick={() => setActiveTab('notificacoes')} 
                        icon={<Bell size={18} strokeWidth={1.5}/>} 
                        title="Notificações" 
                        subtitle="Alertas Automáticos"
                    />
                </div>

                <div className="flex lg:flex-col gap-3 lg:gap-1 shrink-0 lg:w-full">
                    <h4 className="hidden lg:block text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 px-4 opacity-70 lg:mt-4">Licenciamento</h4>
                    <MenuButton 
                        active={activeTab === 'plano'} 
                        onClick={() => setActiveTab('plano')} 
                        icon={<CreditCard size={18} strokeWidth={1.5}/>} 
                        title="Meu Plano SaaS" 
                        subtitle="Faturas & Limites"
                    />
                </div>

                <div className="flex lg:flex-col gap-3 lg:gap-1 shrink-0 lg:w-full pr-4 lg:pr-0">
                    <h4 className="hidden lg:block text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 px-4 opacity-70 lg:mt-4">Security</h4>
                    <MenuButton 
                        active={activeTab === 'usuarios'} 
                        onClick={() => setActiveTab('usuarios')} 
                        icon={<Users size={18} strokeWidth={1.5}/>} 
                        title="Time & Acessos" 
                        subtitle="Gestão de Usuários"
                    />
                    <MenuButton 
                        active={activeTab === 'permissoes'} 
                        onClick={() => setActiveTab('permissoes')} 
                        icon={<Lock size={18} strokeWidth={1.5}/>} 
                        title="Matriz de Acessos" 
                        subtitle="Permissões por Cargo"
                    />
                    <MenuButton 
                        active={activeTab === 'auditoria'} 
                        onClick={() => setActiveTab('auditoria')} 
                        icon={<ShieldCheck size={18} strokeWidth={1.5}/>} 
                        title="Auditoria (Logs)" 
                        subtitle="Rastreabilidade Total"
                    />
                </div>
            </div>
        </div>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <div className="flex-1 w-full min-w-0 overflow-x-hidden">
            {activeTab === 'empresa' && <ConfigGeral />}
            {activeTab === 'tiposos' && <TiposOSList />}
            {activeTab === 'plano' && <MeuPlano />}
            {activeTab === 'usuarios' && <UsuariosList />}
            {activeTab === 'permissoes' && <PermissoesCargos />}
            {activeTab === 'auditoria' && <AuditLogsList />}
            
            {/* 🚀 AJUSTE 2: COMPONENTE REAL EM VEZ DO TEXTO "EM BREVE" */}
            {activeTab === 'notificacoes' && <NotificacoesConfig />}
        </div>
      </div>
    </div>
  );
}

const MenuButton = ({ active, onClick, icon, title, subtitle }: any) => (
    <button 
        onClick={onClick}
        className={`w-max lg:w-full shrink-0 text-left p-3 lg:pl-4 rounded-2xl flex items-center gap-3 transition-all duration-300 group border
            ${active 
                ? 'bg-primary-theme border-primary-theme shadow-lg shadow-primary-theme/20 text-white' 
                : 'bg-white lg:bg-transparent border-slate-200 lg:border-transparent hover:bg-theme-card hover:border-theme hover:shadow-md'}`}
    >
        <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/20 text-white' : 'bg-slate-100 lg:bg-theme-page text-theme-muted group-hover:bg-primary-theme group-hover:text-white'}`}>
            {icon}
        </div>
        <div className="pr-2 lg:pr-0">
            <p className={`text-sm font-bold whitespace-nowrap transition-colors ${active ? 'text-white' : 'text-theme-main'}`}>{title}</p>
            <p className={`text-[10px] font-medium whitespace-nowrap transition-colors hidden sm:block ${active ? 'text-blue-100' : 'text-theme-muted'}`}>{subtitle}</p>
        </div>
    </button>
);