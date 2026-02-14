import { useState } from 'react';
import { FileText, Loader2, CheckCircle } from 'lucide-react'; // Removi AlertCircle se não usar
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver'; 

// 👇 A CORREÇÃO ESTÁ AQUI: Usar apenas 3 conjuntos de "../"
import { supabase } from '../../../supabaseClient';
import { CertificadoService } from '../../../services/CertificadoService';
import { MetrologiaCertificadoPDF } from '../../../documents/MetrologiaCertificadoPDF';

// ... o resto do código continua igual ...

interface Props {
  osId: number;
  statusOs: string; 
  statusExecucao: string; // 'CONCLUIDO' | 'EM_ANDAMENTO'
}

export function MetrologiaCertificadoButton({ osId, statusOs, statusExecucao }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Regra: Só libera certificado se a execução técnica (LIMS) estiver concluída
  const isReady = statusExecucao === 'CONCLUIDO';

  const handleGenerate = async () => {
    if (!isReady) return alert('Finalize a execução metrológica antes de emitir o certificado.');
    
    try {
      setLoading(true);
      setSuccess(false);

      // 1. Busca os dados oficiais (Snapshot do banco)
      const payload = await CertificadoService.gerarPayload(osId);

      // 2. Gera o PDF em memória (Blob)
      const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();

      // 3. Define nome do arquivo: CERT-{Numero}_{Timestamp}.pdf
      const fileName = `CERT-${payload.numero_certificado}_${Date.now()}.pdf`;

      // 4. UPLOAD PARA STORAGE (CRÍTICO PARA RASTREABILIDADE)
      // O bucket 'certificados' deve existir no Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificados')
        .upload(fileName, blob, {
           contentType: 'application/pdf',
           upsert: true
        });

      if (uploadError) {
         console.error('Erro de Upload:', uploadError);
         // Não bloqueamos o download do usuário, mas avisamos no console
         alert('Atenção: O arquivo será baixado, mas houve falha ao salvar cópia no servidor. Contate o suporte.');
      } else {
         // Opcional: Salvar a referência (URL) na tabela de execução
         // await supabase.from('os_metrologia_execucoes').update({ certificado_url: fileName }).eq('ordem_servico_id', osId);
      }

      // 5. Download para o usuário
      saveAs(blob, fileName);
      setSuccess(true);
      
      // Reset visual após 3 segundos
      setTimeout(() => setSuccess(false), 3000);

    } catch (error: any) {
      console.error(error);
      alert('Erro crítico ao gerar certificado: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) return null; 

  return (
    <button 
      onClick={handleGenerate} 
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold shadow-sm transition-all border
        ${success 
           ? 'bg-green-600 text-white border-green-700' 
           : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-800'
        }`}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" /> Gerando e Arquivando...
        </>
      ) : success ? (
        <>
          <CheckCircle size={16} /> Sucesso!
        </>
      ) : (
        <>
          <FileText size={16} /> Baixar Certificado Oficial
        </>
      )}
    </button>
  );
}