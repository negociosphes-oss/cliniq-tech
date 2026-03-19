import { useState, useEffect } from 'react';
import { FileText, Scale, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { MetrologiaFormModal } from '../metrologia/MetrologiaFormModal';
import { VisualizarCertificadoModal } from '../metrologia/VisualizarCertificadoModal';

interface Props { osId: number; equipamentoId: number; onUpdate: () => void; }

export function MetrologiaTab({ osId, equipamentoId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [laudo, setLaudo] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);

  const fetchStatusMetrologia = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('os_metrologia_execucoes').select('*').eq('ordem_servico_id', osId).maybeSingle();
      setLaudo(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStatusMetrologia(); }, [osId]);

  return (
    <div className="space-y-6 animate-fadeIn pb-32 min-h-[80vh] w-full overflow-hidden">
      {!laudo ? (
        <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 mx-2 md:mx-0">
          <Scale size={48} className="text-slate-300 mb-4"/>
          <h3 className="text-lg md:text-xl font-black dark:text-white uppercase">Certificação Pendente</h3>
          <p className="text-slate-400 text-xs md:text-sm mt-2 max-w-sm mx-auto">Nenhum protocolo metrológico foi executado para esta ordem de serviço ainda.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black shadow-xl mt-6 hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm md:text-base active:scale-95 w-full sm:w-auto justify-center">
             Iniciar Protocolo
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm mx-2 md:mx-0">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-4 w-full">
              <div className={`p-4 rounded-2xl shrink-0 ${laudo.resultado_global === 'Aprovado' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <FileText size={32}/>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base md:text-lg font-black dark:text-white uppercase truncate">CERTIFICADO #{laudo.id}</h4>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Resultado: <span className={laudo.resultado_global === 'Aprovado' ? 'text-emerald-500' : 'text-rose-500'}>{laudo.resultado_global}</span></p>
              </div>
              <div className="shrink-0 hidden sm:block">
                {laudo.resultado_global === 'Aprovado' ? <CheckCircle className="text-emerald-500" size={32}/> : <AlertCircle className="text-rose-500" size={32}/>}
              </div>
            </div>
          </div>
          
          {/* 🚀 RESPONSIVIDADE DOS BOTÕES: Empilham no celular, ficam lado a lado no PC */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full">
            <button onClick={() => setIsCertOpen(true)} className="w-full flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-3.5 md:py-4 px-4 rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
               <Download size={18}/> Visualizar Certificado
            </button>
            <button onClick={() => setIsModalOpen(true)} className="w-full flex-1 border-2 border-slate-200 text-slate-500 py-3.5 md:py-4 px-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all active:scale-95">
               Refazer Calibração
            </button>
          </div>

        </div>
      )}

      {isModalOpen && <MetrologiaFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { fetchStatusMetrologia(); onUpdate(); }} equipamentoId={equipamentoId} osId={osId} />}
      {isCertOpen && <VisualizarCertificadoModal isOpen={isCertOpen} onClose={() => setIsCertOpen(false)} osId={osId} />}
    </div>
  );
}