import { useState } from 'react';
import { Settings, Users, ShieldCheck, Building, Bell, HardDrive, Key, ListChecks, Lock, CreditCard } from 'lucide-react';
import { ConfigGeral } from './components/ConfigGeral';
import { UsuariosList } from './components/UsuariosList';
import { AuditLogsList } from './components/AuditLogsList'; 
import { TiposOSList } from './components/TiposOSList'; 
import { PermissoesCargos } from './components/PermissoesCargos';
import { MeuPlano } from './components/MeuPlano';
import { NotificacoesConfig } from './components/NotificacoesConfig'; 

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'empresa' | 'tiposos' | 'usuarios' | 'permissoes' | 'auditoria' | 'notificacoes' | 'plano'>('empresa');

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col animate-fadeIn">
      
      {/* 🚀 HEADER DA PÁGINA (Fixo no topo do Admin) */}
      <div className="bg-white border-b border-slate-200 px-4 md:px-8 py-6 md:py-8 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
            <span className="p-3 bg-primary-theme text-white rounded-2xl shadow-lg shadow-primary-theme/20 shrink-0">
                <Settings size={24} strokeWidth={1.5} className="animate-spin-slow"/>
            </span>
            <div>
                <h2 className="text-xl md:text-3xl font-black text-slate-800 tracking-tight">Painel de Controle</h2>
                <p className="text-slate-500 font-medium mt-1 text-[10px] md:text-sm">Gerencie as configurações globais, acessos e segurança da plataforma.</p>
            </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto w-full p-4 md:p-8 flex flex-col lg:flex-row gap-6 md:gap-8 items-start pb-32">
        
        {/* 🚀 MENU LATERAL RESPONSIVO (Carrossel Horizontal no Celular, Lateral no PC) */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-40 z-20">
            
            {/* O container usa flex horizontal no mobile e flex-col no desktop */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-3 lg:gap-8 pb-4 lg:pb-0 custom-scrollbar snap-x w-full">
                
                <div className="flex lg:flex-col gap-2 lg:gap-1 shrink-0 lg:w-full">
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

                <div className="flex lg:flex-col gap-2 lg:gap-1 shrink-0 lg:w-full">
                    <h4 className="hidden lg:block text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 px-4 opacity-70 lg:mt-4">Licenciamento</h4>
                    <MenuButton 
                        active={activeTab === 'plano'} 
                        onClick={() => setActiveTab('plano')} 
                        icon={<CreditCard size={18} strokeWidth={1.5}/>} 
                        title="Meu Plano SaaS" 
                        subtitle="Faturas & Limites"
                    />
                </div>

                <div className="flex lg:flex-col gap-2 lg:gap-1 shrink-0 lg:w-full pr-4 lg:pr-0">
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

        {/* 🚀 ÁREA DE CONTEÚDO DINÂMICO (Travada para não vazar a tela) */}
        <div className="flex-1 w-full min-w-0 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-4 md:p-8">
            {activeTab === 'empresa' && <ConfigGeral />}
            {activeTab === 'tiposos' && <TiposOSList />}
            {activeTab === 'plano' && <MeuPlano />}
            {activeTab === 'usuarios' && <UsuariosList />}
            {activeTab === 'permissoes' && <PermissoesCargos />}
            {activeTab === 'auditoria' && <AuditLogsList />}
            {activeTab === 'notificacoes' && <NotificacoesConfig />}
        </div>
      </div>
    </div>
  );
}

const MenuButton = ({ active, onClick, icon, title, subtitle }: any) => (
    <button 
        onClick={onClick}
        className={`snap-start w-max lg:w-full shrink-0 text-left p-3 lg:pl-4 rounded-2xl flex items-center gap-3 transition-all duration-300 group border
            ${active 
                ? 'bg-primary-theme border-primary-theme shadow-lg shadow-primary-theme/20 text-white scale-[1.02]' 
                : 'bg-white lg:bg-transparent border-slate-200 lg:border-transparent hover:bg-slate-100 hover:border-slate-300'}`}
    >
        <div className={`p-2.5 rounded-xl transition-colors ${active ? 'bg-white/20 text-white' : 'bg-slate-50 group-hover:bg-white text-slate-500'}`}>
            {icon}
        </div>
        <div className="pr-2 lg:pr-0 text-left">
            <p className={`text-sm font-bold whitespace-nowrap transition-colors ${active ? 'text-white' : 'text-slate-700'}`}>{title}</p>
            <p className={`text-[10px] font-medium whitespace-nowrap transition-colors hidden sm:block ${active ? 'text-blue-100' : 'text-slate-400'}`}>{subtitle}</p>
        </div>
    </button>
);