import { useState } from 'react';
import { LayoutDashboard, Scale, FlaskConical } from 'lucide-react';
import { MetrologiaDashboard } from './MetrologiaDashboard';
import { PadroesList } from './padroes/PadroesList';
import { ProcedimentosList } from './procedimentos/ProcedimentosList';

export function MetrologiaPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'padroes' | 'procedimentos'>('dashboard');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden animate-fadeIn">
      
      {/* HEADER CORPORATIVO */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 shadow-sm z-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                <Scale size={24} />
            </span>
            Metrologia <span className="text-indigo-600 font-light ml-1">| RBC</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2 ml-1">
            Gestão de Rastreabilidade, Analisadores e Procedimentos (POP)
          </p>
        </div>

        {/* NAVEGAÇÃO EM ABAS SÓLIDAS */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}
          >
            <LayoutDashboard size={16}/> Visão Geral
          </button>
          <button 
            onClick={() => setActiveTab('padroes')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'padroes' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}
          >
            <Scale size={16}/> Padrões RBC
          </button>
          <button 
            onClick={() => setActiveTab('procedimentos')}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'procedimentos' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent'}`}
          >
            <FlaskConical size={16}/> Procedimentos
          </button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto">
            {activeTab === 'dashboard' && <MetrologiaDashboard onChangeTab={setActiveTab} />}
            {activeTab === 'padroes' && <PadroesList />}
            {activeTab === 'procedimentos' && <ProcedimentosList />}
        </div>
      </div>
    </div>
  );
}