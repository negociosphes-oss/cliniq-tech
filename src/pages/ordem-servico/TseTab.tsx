import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Download, Zap, Edit } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { TseFormModal } from '../metrologia/TseFormModal';
import { pdf } from '@react-pdf/renderer';
import { TseCertificadoPDF } from '../metrologia/TseCertificadoPDF';
import { TseCertificadoService } from '../../services/TseCertificadoService';

interface Props {
  osId: number;
  equipamentoId: number;
  tenantId: number;    
  onUpdate: () => void;
}

export function TseTab({ osId, equipamentoId, tenantId, onUpdate }: Props) {
  const [loading, setLoading] = useState(false);
  const [laudo, setLaudo] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGeneratingTse, setIsGeneratingTse] = useState(false);

  const fetchStatusTse = async () => {
    setLoading(true);
    try {
      // 🚀 A MÁGICA AQUI: Pega sempre o último laudo e ignora os repetidos!
      const { data: execucoes, error } = await supabase
        .from('metrologia_tse')
        .select('*')
        .eq('ordem_servico_id', osId)
        .order('id', { ascending: false })
        .limit(1);

      if (error) throw error;
      
      if (execucoes && execucoes.length > 0) {
        setLaudo(execucoes[0]);
      } else {
        setLaudo(null);
      }
    } catch (e) { 
      console.error("Erro ao buscar laudo na TseTab:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchStatusTse(); }, [osId]);

  const handleGenerateTsePdf = async () => {
    if (!laudo) return;
    setIsGeneratingTse(true);
    try {
      const payload = await TseCertificadoService.gerarPayload(osId);
      const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig} />).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar o PDF de Segurança Elétrica. Verifique o console.");
    } finally {
      setIsGeneratingTse(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-32 min-h-[80vh]">
      {!laudo ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Zap size={48} className="text-indigo-300 mb-4"/>
          <h3 className="text-xl font-black dark:text-white uppercase">Ensaio Elétrico Pendente</h3>
          <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto">Nenhum laudo de Segurança Elétrica (NBR IEC 62353) gerado para esta O.S.</p>
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl mt-6 hover:bg-indigo-700 transition-all flex items-center gap-2">
            Executar Ensaio de Segurança
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm animate-slideUp">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${laudo.resultado === 'APROVADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                <Zap size={32}/>
              </div>
              <div>
                <h4 className="text-lg font-black dark:text-white uppercase">LAUDO DE SEGURANÇA #{laudo.id}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resultado: {laudo.resultado}</p>
              </div>
              <div className="ml-4">
                {laudo.resultado === 'APROVADO' ? <CheckCircle className="text-emerald-500" size={32}/> : <AlertCircle className="text-rose-500" size={32}/>}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button onClick={handleGenerateTsePdf} disabled={isGeneratingTse} className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl transition-all hover:bg-indigo-700 disabled:opacity-50">
               <Download size={18}/> {isGeneratingTse ? 'Gerando Laudo...' : 'Visualizar Laudo TSE'}
            </button>
            <button onClick={() => setIsModalOpen(true)} className="border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 py-4 rounded-2xl font-black uppercase text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex justify-center items-center gap-2">
               <Edit size={18}/> Editar Ensaio
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
         <TseFormModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={() => { fetchStatusTse(); onUpdate(); }}
            tenantId={tenantId}
            osId={osId}
            defaultEquipamentoId={equipamentoId}
            editId={laudo ? laudo.id : null}
         />
      )}
    </div>
  );
}