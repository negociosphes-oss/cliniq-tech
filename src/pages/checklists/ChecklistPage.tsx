import { useState, useEffect } from 'react';
import { ClipboardList, GitBranch, ListChecks, Loader2 } from 'lucide-react';
import { ChecklistManager } from './ChecklistManager';
import { ChecklistRules } from './ChecklistRules';
import { supabase } from '../../supabaseClient';

// 🚀 FAREJADOR DE SUBDOMÍNIO
const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
      return parts[0];
  }
  return 'admin'; 
};

export function ChecklistPage() {
  const [activeTab, setActiveTab] = useState<'modelos' | 'regras'>('modelos');
  const [tenantId, setTenantId] = useState<number | null>(null);

  useEffect(() => {
    const initTenant = async () => {
      try {
        const slug = getSubdomain();
        let { data } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
        if (data) setTenantId(data.id);
        else setTenantId(-1);
      } catch (err) {
        setTenantId(-1);
      }
    };
    initTenant();
  }, []);

  if (!tenantId) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary-theme" size={32}/></div>;

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-theme-main flex items-center gap-3">
          <span className="p-3 bg-primary-theme text-white rounded-xl shadow-lg shadow-primary-theme/20">
            <ListChecks size={24}/>
          </span>
          Gestão de Checklists Inteligentes
        </h2>
        <p className="text-theme-muted font-medium mt-2">
          Configure modelos de inspeção e defina regras de automação.
        </p>
      </div>

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex gap-6 mb-6 border-b border-theme">
        <button 
          onClick={() => setActiveTab('modelos')}
          className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all border-b-4 
            ${activeTab === 'modelos' 
              ? 'border-primary-theme text-primary-theme' 
              : 'border-transparent text-theme-muted hover:text-theme-main'}`}
        >
          <ClipboardList size={20}/> Biblioteca de Modelos
        </button>
        
        <button 
          onClick={() => setActiveTab('regras')}
          className={`pb-4 px-2 flex items-center gap-2 font-bold transition-all border-b-4 
            ${activeTab === 'regras' 
              ? 'border-primary-theme text-primary-theme' 
              : 'border-transparent text-theme-muted hover:text-theme-main'}`}
        >
          <GitBranch size={20}/> Motor de Regras (Automação)
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO (PASSANDO O TENANT_ID PARA BLINDAR AS LISTAS) */}
      <div className="bg-theme-card rounded-3xl shadow-sm border border-theme min-h-[600px] p-6 relative">
        {activeTab === 'modelos' ? <ChecklistManager tenantId={tenantId} /> : <ChecklistRules tenantId={tenantId} />}
      </div>
      
    </div>
  );
}