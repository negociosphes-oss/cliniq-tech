import { useState, useEffect } from 'react';
import { FileText, Scale, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { MetrologiaFormModal } from '../metrologia/MetrologiaFormModal';
import { VisualizarCertificadoModal } from '../metrologia/VisualizarCertificadoModal'; // <-- Verifique se este caminho está correto no seu projeto

interface Props {
  osId: number;
  equipamentoId: number;
  onUpdate: () => void;
}

export function MetrologiaTab({ osId, equipamentoId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [laudo, setLaudo] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCertOpen, setIsCertOpen] = useState(false);

  const fetchStatusMetrologia = async () => {
    setLoading(true);
    try {
      const { data: execucao } = await supabase
        .from('os_metrologia_execucoes')
        .select('*')
        .eq('ordem_servico_id', osId)
        .maybeSingle();

      setLaudo(execucao);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchStatusMetrologia(); }, [osId]);

  return (
    // CORREÇÃO: Adicionado 'pb-32 min-h-screen' para criar um respiro enorme na parte inferior,
    // impedindo que o formulário interno 'MetrologiaFormModal' seja cortado ao se expandir.
    <div className="space-y-6 animate-fadeIn pb-32 min-h-[80vh]">
      {!laudo ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200">
          <Scale size={48} className="text-slate-300 mb-4"/>
          <h3 className="text-xl font-black dark:text-white uppercase">Certificação Pendente</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Nenhum protocolo metrológico foi executado para esta ordem de serviço ainda.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl mt-6 hover:bg-indigo-700 transition-all">
            Iniciar Protocolo Profissional
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${laudo.resultado_global === 'Aprovado' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <FileText size={32}/>
              </div>
              <div>
                <h4 className="text-lg font-black dark:text-white uppercase">Certificado #MET-{laudo.id}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resultado: {laudo.resultado_global}</p>
              </div>
            </div>
            {laudo.resultado_global === 'Aprovado' ? <CheckCircle className="text-emerald-500" size={32}/> : <AlertCircle className="text-rose-500" size={32}/>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setIsCertOpen(true)} className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl transition-all active:scale-95">
              <Download size={18}/> Visualizar Certificado RBC
            </button>
            <button onClick={() => setIsModalOpen(true)} className="border-2 border-slate-200 text-slate-400 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-50 transition-all">Refazer Calibração</button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <MetrologiaFormModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSuccess={() => { fetchStatusMetrologia(); onUpdate(); }} 
            equipamentoId={equipamentoId}
            osId={osId}
        />
      )}
      
      {isCertOpen && (
        <VisualizarCertificadoModal isOpen={isCertOpen} onClose={() => setIsCertOpen(false)} osId={osId} />
      )}
    </div>
  );
}