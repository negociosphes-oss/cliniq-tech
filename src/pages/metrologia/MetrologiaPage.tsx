import { useState, useEffect } from 'react';
import { LayoutDashboard, Scale, FlaskConical, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

import { MetrologiaDashboard } from './MetrologiaDashboard';
import { PadroesList } from './padroes/PadroesList';
import { ProcedimentosList } from './procedimentos/ProcedimentosList';
import { TseNormasList } from './TseNormasList'; // INJETAMOS AQUI

const getSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
      return parts[0];
  }
  return 'admin'; 
};

export function MetrologiaPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'padroes' | 'procedimentos' | 'normas_tse'>('dashboard');
  const [tenantId, setTenantId] = useState<number | null>(null);

  useEffect(() => {
    const initTenant = async () => {
      try {
        const slug = getSubdomain();
        let { data } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
        if (!data) {
            const { data: fallbackData } = await supabase.from('empresas_inquilinas').select('id').order('id', { ascending: true }).limit(1).maybeSingle();
            data = fallbackData;
        }
        if (data) setTenantId(data.id);
        else setTenantId(-1);
      } catch (err) {
        setTenantId(-1);
      }
    };
    initTenant();
  }, []);

  if (!tenantId) return <div className="p-8 text-center flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={32}/></div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-hidden animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-6 flex flex-col xl:flex-row justify-between items-start xl:items-center shrink-0 shadow-sm z-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none"><Scale size={24} /></span>
            LIMS Metrologia <span className="text-indigo-600 font-light ml-1">| RBC</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-2 ml-1">Gestão de Rastreabilidade, Analisadores e Procedimentos (POP)</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><LayoutDashboard size={16}/> Visão Geral</button>
          <button onClick={() => setActiveTab('padroes')} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'padroes' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Scale size={16}/> Padrões RBC</button>
          <button onClick={() => setActiveTab('procedimentos')} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'procedimentos' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><FlaskConical size={16}/> Procedimentos</button>
          <button onClick={() => setActiveTab('normas_tse')} className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'normas_tse' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><ShieldCheck size={16}/> Normas TSE</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto pb-24">
            {activeTab === 'dashboard' && <MetrologiaDashboard onChangeTab={setActiveTab} />}
            {activeTab === 'padroes' && <PadroesList />}
            {activeTab === 'procedimentos' && <ProcedimentosList />}
            {activeTab === 'normas_tse' && <TseNormasList tenantId={tenantId} />}
        </div>
      </div>
    </div>
  );
}