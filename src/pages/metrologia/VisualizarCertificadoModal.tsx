import { useState, useEffect } from 'react';
import { X, Printer, Loader2, AlertCircle, Download } from 'lucide-react';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import { CertificadoService } from '../../services/CertificadoService';

// 🚀 FIM DA DUPLICIDADE: Importando a única "Fonte da Verdade" do PDF (O novo layout Nano Azul/Verde)
import { MetrologiaCertificadoPDF } from '../../documents/MetrologiaCertificadoPDF';

interface VisualizarCertificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  osId: number;
}

export function VisualizarCertificadoModal({ isOpen, onClose, osId }: VisualizarCertificadoModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && osId) loadData();
  }, [isOpen, osId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const payload = await CertificadoService.gerarPayload(osId);
      setData(payload);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados do certificado');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!data) return;
    
    // Usa o MESMO motor para o download
    const blob = await pdf(<MetrologiaCertificadoPDF data={data} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.numero}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white w-full max-w-5xl rounded-t-2xl flex justify-between items-center p-4 shadow-md z-10">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Printer size={20} className="text-blue-600"/> Laudo Técnico RBC
        </h2>
        <div className="flex gap-2 items-center">
             {!loading && !error && (
                <button 
                  onClick={handleDownload} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <Download size={16}/> Baixar PDF
                </button>
             )}
             <button 
               onClick={onClose} 
               className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-full transition-colors flex items-center justify-center"
             >
                 <X size={24} strokeWidth={3}/>
             </button>
        </div>
      </div>

      <div className="bg-slate-100 w-full max-w-5xl h-[85vh] rounded-b-2xl shadow-2xl overflow-hidden relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 bg-white">
              <Loader2 size={40} className="animate-spin text-blue-600 mb-4"/>
              <p className="font-medium animate-pulse">Compilando laudo técnico...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-white">
              <AlertCircle size={48} className="mb-4"/>
              <p className="font-bold">Erro: {error}</p>
          </div>
        ) : (
          <PDFViewer width="100%" height="100%" className="border-none" showToolbar={false}>
              {/* 🚀 O MODAL AGORA RENDERIZA O ARQUIVO MESTRE */}
              <MetrologiaCertificadoPDF data={data} />
          </PDFViewer>
        )}
      </div>
    </div>
  );
}