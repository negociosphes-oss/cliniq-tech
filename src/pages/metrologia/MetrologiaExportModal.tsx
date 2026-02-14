import { useState, useRef } from 'react'
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import type { MetrologiaItem } from '../../types'

interface UploadCertificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: MetrologiaItem | null; // Pode vir incompleto da lista, mas precisa ter ID e PLANO_ID
}

export function UploadCertificadoModal({ isOpen, onClose, onSuccess, item }: UploadCertificadoModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !item) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) validateAndSetFile(e.target.files[0]);
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') return alert('Apenas arquivos PDF são permitidos.');
    if (selectedFile.size > 5 * 1024 * 1024) return alert('O arquivo deve ter no máximo 5MB.');
    setFile(selectedFile);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !item) return;
    setLoading(true);

    try {
      // 1. Caminho: plano_ID/item_ID_timestamp.pdf
      const fileExt = file.name.split('.').pop();
      const fileName = `${item.id}_${Date.now()}.${fileExt}`;
      const filePath = `plano_${item.plano_id}/${fileName}`;

      // 2. Upload
      const { error: uploadError } = await supabase.storage.from('metrologia-docs').upload(filePath, file);
      if (uploadError) throw uploadError;

      // 3. URL Pública
      const { data: { publicUrl } } = supabase.storage.from('metrologia-docs').getPublicUrl(filePath);

      // 4. Salvar no Banco
      const { error: dbError } = await supabase.from('metrologia_certificados').insert({
          metrologia_item_id: item.id,
          titulo: file.name,
          arquivo_url: publicUrl,
          tipo_arquivo: 'application/pdf',
          tamanho_bytes: file.size
        });
      if (dbError) throw dbError;

      // 5. Atualizar Status se necessário
      if (item.status === 'Pendente') {
         await supabase.from('metrologia_itens').update({ status: 'Vigente' }).eq('id', item.id);
      }

      alert('Certificado anexado com sucesso!');
      onSuccess(); onClose();

    } catch (error: any) {
      console.error(error); alert('Falha no upload: ' + error.message);
    } finally {
      setLoading(false); setFile(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2"><UploadCloud className="text-blue-600"/> Anexar Certificado</h2>
           <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        <div className="p-6 space-y-4">
           <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
           >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              {file ? (
                 <div className="text-blue-600 animate-bounce-in"><FileText size={40} className="mx-auto mb-2"/><p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p></div>
              ) : (
                 <div className="text-slate-400"><UploadCloud size={40} className="mx-auto mb-2 opacity-50"/><p className="font-bold text-sm">Clique ou arraste PDF</p></div>
              )}
           </div>
           <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded border border-yellow-100 flex gap-2"><AlertCircle size={14}/> <p>Evidência auditável. Apenas PDF.</p></div>
        </div>
        <div className="p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancelar</button>
           <button onClick={handleUpload} disabled={!file || loading} className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} Confirmar
           </button>
        </div>
      </div>
    </div>
  )
}