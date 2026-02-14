import { useState, useRef } from 'react'
import { X, UploadCloud, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

interface UploadCertificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  // Agora recebe um PADRÃO (tabela padroes), não um item de plano
  item: any; 
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
      // 1. Sanitização do Nome
      const nomeLimpo = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `cert_padrao_${item.id}_${Date.now()}_${nomeLimpo}`;
      
      // 2. Caminho Simplificado (Sem ID de plano)
      const filePath = `certificados/${fileName}`;

      // 3. Upload
      const { error: uploadError } = await supabase.storage
        .from('metrologia-docs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 4. URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('metrologia-docs')
        .getPublicUrl(filePath);

      // 5. Atualiza o PADRÃO diretamente
      const { error: dbError } = await supabase
        .from('padroes')
        .update({ 
            certificado_url: publicUrl,
            // Atualiza status se estava vencido? Opcional.
        })
        .eq('id', item.id);

      if (dbError) throw dbError;

      alert('Certificado atualizado com sucesso!');
      onSuccess(); 
      onClose();

    } catch (error: any) {
      console.error(error); 
      alert('Falha no upload: ' + error.message);
    } finally {
      setLoading(false); 
      setFile(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        <div className="p-5 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
             <UploadCloud className="text-indigo-600"/> Atualizar Certificado RBC
           </h2>
           <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <div className="p-6 space-y-4">
           <p className="text-sm text-slate-500 font-medium">Instrumento: <span className="text-slate-800 dark:text-white font-bold">{item.nome}</span></p>
           <p className="text-xs text-slate-400">Série: {item.n_serie}</p>
           
           <div 
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}
           >
              <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
              {file ? (
                 <div className="text-indigo-600 animate-bounce-in">
                    <FileText size={40} className="mx-auto mb-2"/>
                    <p className="font-bold text-sm truncate max-w-[200px]">{file.name}</p>
                 </div>
              ) : (
                 <div className="text-slate-400">
                    <UploadCloud size={40} className="mx-auto mb-2 opacity-50"/>
                    <p className="font-bold text-sm">Clique ou arraste PDF</p>
                 </div>
              )}
           </div>
           
           <div className="bg-amber-50 text-amber-800 text-xs p-3 rounded border border-amber-100 flex gap-2">
             <AlertCircle size={14} className="shrink-0"/> 
             <p>Este arquivo substituirá o certificado atual.</p>
           </div>
        </div>

        <div className="p-5 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-lg">Cancelar</button>
           <button onClick={handleUpload} disabled={!file || loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 disabled:opacity-50 transition-all">
              {loading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16}/>} 
              Enviar Arquivo
           </button>
        </div>

      </div>
    </div>
  )
}