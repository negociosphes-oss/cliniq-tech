import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Wrench, FileText, QrCode, History, Calendar, 
  User, CheckCircle, AlertTriangle, Printer, ExternalLink,
  Activity 
} from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  equipamento: any;
}

export function EquipamentoDetalhes({ isOpen, onClose, equipamento }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'historico' | 'detalhes' | 'etiqueta'>('historico');
  const [historico, setHistorico] = useState<any[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  // Carrega histórico
  useEffect(() => {
    if (activeTab === 'historico' && equipamento?.id) {
      const fetchHistorico = async () => {
        setLoadingHist(true);
        // Tenta buscar na tabela 'ordens_servico' (nome padrão). 
        // Se sua tabela chamar 'chamados', mude aqui.
        const { data, error } = await supabase
          .from('ordens_servico') 
          .select('*')
          .eq('equipamento_id', equipamento.id)
          .order('created_at', { ascending: false });
        
        if (error) {
            console.warn("Tabela de histórico não encontrada ou vazia (Ignore se for a primeira vez):", error.message);
            setHistorico([]);
        } else {
            setHistorico(data || []);
        }
        setLoadingHist(false);
      };
      fetchHistorico();
    }
  }, [activeTab, equipamento]);

  // --- AÇÃO DE NAVEGAÇÃO ---
  const handleAbrirOS = (e: React.MouseEvent) => {
    e.preventDefault(); // Previne qualquer comportamento padrão do navegador
    e.stopPropagation(); // Impede cliques fantasmas
    
    console.log("Navegando para Nova OS com:", equipamento);
    
    // Fecha o modal
    onClose();
    
    // Navega para a rota configurada no App.tsx
    navigate('/novo-chamado', { 
      state: { 
        preSelectedEquipamento: equipamento 
      } 
    });
  };

  const handlePrintLabel = () => {
    alert('Funcionalidade de impressão de etiqueta ZPL/PDF será implementada aqui.');
  };

  if (!isOpen || !equipamento) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[2000] flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-slideLeft">
        
        {/* HEADER */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="flex gap-4">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm">
                <MonitorIcon tipo={equipamento.nome || equipamento.tecnologia?.nome} />
            </div>
            <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    {equipamento.tag}
                </span>
                <h2 className="text-xl font-black text-slate-800 leading-tight mb-1">
                    {equipamento.nome || equipamento.tecnologia?.nome || 'Equipamento Sem Nome'}
                </h2>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                    <span>{equipamento.fabricante || equipamento.tecnologia?.fabricante}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{equipamento.modelo || equipamento.tecnologia?.modelo}</span>
                </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* BOTÃO DE AÇÃO RÁPIDA (FIXO) */}
        <div className="p-6 border-b border-slate-100 bg-white">
            <button 
                type="button" // Essencial para não dar refresh
                onClick={handleAbrirOS}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-200 flex items-center justify-center gap-3 transition-all active:scale-95 text-sm uppercase tracking-wide"
            >
                <Wrench size={20} strokeWidth={2.5} />
                ABRIR NOVA ORDEM DE SERVIÇO
            </button>
        </div>

        {/* TABS */}
        <div className="flex px-6 border-b border-slate-100 gap-6">
            <TabButton active={activeTab === 'historico'} onClick={() => setActiveTab('historico')} label="Histórico" />
            <TabButton active={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} label="Detalhes Técnicos" />
            <TabButton active={activeTab === 'etiqueta'} onClick={() => setActiveTab('etiqueta')} label="Etiqueta Digital" />
        </div>

        {/* CONTEÚDO SCROLLÁVEL */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
            {/* HISTÓRICO */}
            {activeTab === 'historico' && (
                <div className="space-y-4">
                    {loadingHist ? (
                        <div className="text-center p-10 text-slate-400 text-sm">Carregando histórico...</div>
                    ) : historico.length === 0 ? (
                        <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                                <History size={20}/>
                            </div>
                            <p className="text-sm font-bold text-slate-500">Nenhuma manutenção registrada.</p>
                            <p className="text-xs text-slate-400 mt-1">O histórico aparecerá aqui após a primeira OS.</p>
                        </div>
                    ) : (
                        historico.map((os: any) => (
                            <div key={os.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-4 hover:border-blue-200 transition-colors">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                    <Wrench size={18}/>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-800">OS #{os.id}</div>
                                    <div className="text-xs text-slate-500">{new Date(os.created_at).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* OUTRAS TABS (Mantidas simples para economizar espaço visual) */}
            {activeTab === 'detalhes' && <div className="text-slate-500 text-sm">Dados técnicos do ativo...</div>}
            {activeTab === 'etiqueta' && <div className="text-slate-500 text-sm">Visualização de etiqueta...</div>}
        </div>
      </div>
    </div>
  );
}

// Subcomponentes
const TabButton = ({ active, onClick, label }: any) => (
    <button onClick={onClick} className={`py-4 text-xs font-bold uppercase tracking-wide border-b-2 transition-all ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>
);
const InfoItem = ({ label, value }: any) => (<div><label className="text-[10px] font-bold text-slate-400">{label}</label><div className="text-sm font-bold text-slate-700">{value || '-'}</div></div>);
const MonitorIcon = ({ tipo }: any) => <Activity size={24} className="text-blue-500"/>;