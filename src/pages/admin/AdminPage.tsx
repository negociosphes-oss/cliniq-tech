import { useState } from 'react';
import { Settings, Users, ShieldCheck, Building, Bell, HardDrive, Key, ListChecks, Lock, CreditCard } from 'lucide-react';
import { ConfigGeral } from './components/ConfigGeral';
import { UsuariosList } from './components/UsuariosList';
import { AuditLogsList } from './components/AuditLogsList'; 
import { TiposOSList } from './components/TiposOSList'; 
import { PermissoesCargos } from './components/PermissoesCargos';
import { MeuPlano } from './components/MeuPlano';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'empresa' | 'tiposos' | 'usuarios' | 'permissoes' | 'auditoria' | 'notificacoes' | 'plano'>('empresa');

  return (
    <div className="min-h-screen p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      {/* HEADER DA PÁGINA */}
      <div className="mb-8 pl-2">
        <h2 className="text-3xl font-black text-theme-main tracking-tight flex items-center gap-3">
            <span className="p-3 bg-theme-card border border-theme rounded-2xl shadow-sm">
                <Settings size={24} strokeWidth={1.5} className="animate-spin-slow"/>
            </span>
            Painel de Controle
        </h2>
        <p className="text-theme-muted font-medium mt-2 ml-1">Gerencie as configurações globais, acessos e segurança da plataforma.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* MENU LATERAL DE CONFIGURAÇÕES */}
        <div className="w-full lg:w-72 shrink-0 space-y-8 sticky top-24">
            
            {/* Categoria: Geral */}
            <div>
                <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-3 px-4 opacity-70">Geral</h4>
                <div className="space-y-1">
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
            </div>

            {/* 🚀 NOVA Categoria: Assinatura & Uso */}
            <div>
                <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-3 px-4 opacity-70">Licenciamento</h4>
                <div className="space-y-1">
                    <MenuButton 
                        active={activeTab === 'plano'} 
                        onClick={() => setActiveTab('plano')} 
                        icon={<CreditCard size={18} strokeWidth={1.5}/>} 
                        title="Meu Plano SaaS" 
                        subtitle="Faturas & Limites de Uso"
                    />
                </div>
            </div>

            {/* Categoria: Acesso & Segurança */}
            <div>
                <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-3 px-4 opacity-70">Security</h4>
                <div className="space-y-1">
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

            {/* Categoria: Sistema (Disabled) */}
            <div>
                <h4 className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] mb-3 px-4 opacity-70">System</h4>
                <div className="space-y-1 opacity-50 pointer-events-none grayscale">
                    <MenuButton 
                        onClick={() => {}} 
                        icon={<HardDrive size={18} strokeWidth={1.5}/>} 
                        title="Backup & Data" 
                        subtitle="Exportação Segura"
                    />
                    <MenuButton 
                        onClick={() => {}} 
                        icon={<Key size={18} strokeWidth={1.5}/>} 
                        title="API Keys" 
                        subtitle="Integrações ERP"
                    />
                </div>
            </div>
        </div>

        {/* ÁREA DE CONTEÚDO DINÂMICO */}
        <div className="flex-1 w-full min-w-0">
            {activeTab === 'empresa' && <ConfigGeral />}
            {activeTab === 'tiposos' && <TiposOSList />}
            
            {/* 🚀 O NOVO MÓDULO RENDERIZADO */}
            {activeTab === 'plano' && <MeuPlano />}

            {activeTab === 'usuarios' && <UsuariosList />}
            {activeTab === 'permissoes' && <PermissoesCargos />}
            {activeTab === 'auditoria' && <AuditLogsList />}
            
            {activeTab === 'notificacoes' && (
                <div className="bg-theme-card p-12 rounded-[2.5rem] border border-theme text-center shadow-lg">
                    <div className="w-20 h-20 bg-theme-page rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <Bell size={40} className="text-theme-muted"/>
                    </div>
                    <h3 className="text-2xl font-black text-theme-main tracking-tight">Central de Alertas</h3>
                    <p className="text-theme-muted mt-2 max-w-md mx-auto font-medium">
                        Em breve, você poderá configurar regras para receber avisos sobre calibrações vencidas diretamente no seu WhatsApp.
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

const MenuButton = ({ active, onClick, icon, title, subtitle }: any) => (
    <button 
        onClick={onClick}
        className={`w-full text-left p-3 pl-4 rounded-2xl flex items-center gap-4 transition-all duration-300 group
            ${active 
                ? 'bg-primary-theme shadow-lg shadow-primary-theme/20 ring-1 ring-primary-theme/50' 
                : 'hover:bg-theme-card border border-transparent hover:border-theme hover:shadow-md'}`}
    >
        <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-white/20 text-white' : 'bg-theme-page text-theme-muted group-hover:bg-primary-theme group-hover:text-white'}`}>
            {icon}
        </div>
        <div>
            <p className={`text-sm font-bold transition-colors ${active ? 'text-white' : 'text-theme-main'}`}>{title}</p>
            <p className={`text-[11px] font-medium transition-colors ${active ? 'text-blue-100' : 'text-theme-muted'}`}>{subtitle}</p>
        </div>
    </button>
);