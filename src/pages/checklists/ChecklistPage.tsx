import { useState } from 'react';
import { ClipboardList, GitBranch, ListChecks } from 'lucide-react';
import { ChecklistManager } from './ChecklistManager';
import { ChecklistRules } from './ChecklistRules';

export function ChecklistPage() {
  const [activeTab, setActiveTab] = useState<'modelos' | 'regras'>('modelos');

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

      {/* ÁREA DE CONTEÚDO */}
      <div className="bg-theme-card rounded-3xl shadow-sm border border-theme min-h-[600px] p-6 relative">
        {activeTab === 'modelos' ? <ChecklistManager /> : <ChecklistRules />}
      </div>
      
    </div>
  );
}