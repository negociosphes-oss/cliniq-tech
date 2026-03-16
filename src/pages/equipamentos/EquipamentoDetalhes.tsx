import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Wrench, FileText, QrCode, History, Activity, FileBarChart } from 'lucide-react';
import { supabase } from '../../supabaseClient';

import { HistoricoTab } from './tabs/HistoricoTab';
import { ProntuarioTab } from './tabs/ProntuarioTab';
import { RelatorioCustosTab } from './tabs/RelatorioCustosTab';
import { EtiquetasTab } from './tabs/EtiquetasTab';

interface Props { isOpen: boolean; onClose: () => void; equipamento: any; tenantId?: number | null; }

export function EquipamentoDetalhes({ isOpen, onClose, equipamento, tenantId }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'historico' | 'detalhes' | 'etiqueta' | 'relatorio'>('historico');
  
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);

  useEffect(() => {
    const loadConfig = async () => {
        if (tenantId && tenantId > 0) {
            const { data } = await supabase.from('empresas_inquilinas').select('*').eq('id', tenantId).maybeSingle();
            if(data) setConfigEmpresa(data);
        }
    };
    loadConfig();

    if (isOpen && equipamento?.id) {
      const fetchHistorico = async () => {
        setLoadingHist(true);
        // 🚀 VOLTAMOS PARA A BUSCA SEGURA E LIMPA PARA NÃO DAR ERRO DE RELACIONAMENTO (JOIN)
        const { data } = await supabase.from('ordens_servico').select('*').eq('equipamento_id', equipamento.id).order('created_at', { ascending: false });
        if (data) setHistorico(data);
        setLoadingHist(false);
      };
      fetchHistorico();
    }
  }, [isOpen, equipamento, tenantId]);

  if (!isOpen || !equipamento) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-end animate-fadeIn">
      <div className="w-full max-w-6xl bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                <Activity size={24} className="text-blue-500"/>
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{equipamento.tag}</span>
                <h2 className="text-xl font-black text-slate-800 leading-tight mb-1">{equipamento.nome || equipamento.tecnologia?.nome || 'Equipamento'}</h2>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>{equipamento.fabricante || equipamento.tecnologia?.fabricante}</span><span className="w-1 h-1 rounded-full bg-slate-300"></span><span>{equipamento.modelo || equipamento.tecnologia?.modelo}</span>
                </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => { onClose(); navigate('/novo-chamado', { state: { preSelectedEquipamento: equipamento } }); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md flex items-center gap-2 transition-all text-xs"><Wrench size={16}/> Nova O.S.</button>
             <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors"><X size={20}/></button>
          </div>
        </div>

        {/* MENUS (ABAS) */}
        <div className="flex px-6 border-b border-slate-100 gap-6 overflow-x-auto custom-scrollbar">
            <TabButton active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} label="Gestão de O.S." icon={<History size={16}/>}/>
            <TabButton active={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} label="Prontuário Técnico" icon={<FileText size={16}/>}/>
            <TabButton active={activeTab === 'relatorio'} onClick={() => setActiveTab('relatorio')} label="Dossiê e Custos" icon={<FileBarChart size={16}/>}/>
            <TabButton active={activeTab === 'etiqueta'} onClick={() => setActiveTab('etiqueta')} label="Fábrica de Etiquetas" icon={<QrCode size={16}/>}/>
        </div>

        {/* INJEÇÃO DAS ABAS */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30 custom-scrollbar">
            {activeTab === 'historico' && <HistoricoTab equipamento={equipamento} historico={historico} loading={loadingHist} />}
            <div className="p-8">
              {activeTab === 'detalhes' && <ProntuarioTab equipamento={equipamento} />}
              {activeTab === 'relatorio' && <RelatorioCustosTab equipamento={equipamento} historico={historico} configEmpresa={configEmpresa} />}
              {activeTab === 'etiqueta' && <EtiquetasTab equipamento={equipamento} configEmpresa={configEmpresa} />}
            </div>
        </div>

      </div>
    </div>
  );
}

const TabButton = ({ active, onClick, label, icon }: any) => (
    <button onClick={onClick} className={`py-4 px-2 text-[11px] font-black uppercase tracking-widest border-b-[3px] transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-200'}`}>
        {icon} {label}
    </button>
);