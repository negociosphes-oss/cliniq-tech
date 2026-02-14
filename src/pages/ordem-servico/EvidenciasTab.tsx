import { useState, useRef, useEffect } from 'react';
import { Paperclip, Trash2, Image as ImageIcon, UploadCloud, Clock } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface EvidenciasTabProps {
  osId: number;
  currentAnexos?: string | null;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onUpdate?: () => void;
}

interface Evidencia {
  url: string;
  descricao: string;
  etapa: 'Pré-Intervenção' | 'Durante' | 'Pós-Intervenção' | 'Documento';
  data_upload: string;
}

export function EvidenciasTab({ osId, currentAnexos, showToast, onUpdate }: EvidenciasTabProps) {
  const [loading, setLoading] = useState(false);
  const [listaEvidencias, setListaEvidencias] = useState<Evidencia[]>([]);
  const [form, setForm] = useState({
    descricao: '',
    etapa: 'Durante' as Evidencia['etapa']
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentAnexos) {
      if (currentAnexos.startsWith('[')) {
        try {
          const parsed = JSON.parse(currentAnexos);
          setListaEvidencias(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.error("Erro ao ler evidências JSON", e);
          setListaEvidencias([]);
        }
      } else {
        const urls = currentAnexos.split(',').filter(u => u.trim() !== '');
        const legados: Evidencia[] = urls.map(url => ({
          url,
          descricao: 'Anexo Legado',
          etapa: 'Durante',
          data_upload: new Date().toISOString()
        }));
        setListaEvidencias(legados);
      }
    } else {
      setListaEvidencias([]);
    }
  }, [currentAnexos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !osId) return;
    
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      return showToast('O arquivo deve ter no máximo 5MB.', 'error');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${osId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `evidencias/${fileName}`;

    setLoading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('os-imagens')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('os-imagens')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) throw new Error('Não foi possível gerar a URL da imagem.');

      const novaEvidencia: Evidencia = {
        url: urlData.publicUrl,
        descricao: form.descricao || file.name,
        etapa: form.etapa,
        data_upload: new Date().toISOString()
      };

      const novaLista = [...listaEvidencias, novaEvidencia];
      
      const { error: dbError } = await supabase
        .from('ordens_servico')
        .update({ anexos: JSON.stringify(novaLista) })
        .eq('id', osId);

      if (dbError) throw dbError;

      showToast('Evidência anexada com sucesso!', 'success');
      setListaEvidencias(novaLista);
      setForm({ ...form, descricao: '' });
      
      if (onUpdate) onUpdate();

    } catch (err: any) {
      console.error(err);
      showToast(`Erro no upload: ${err.message}`, 'error');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Deseja realmente remover esta evidência? A imagem permanecerá no servidor, mas será desvinculada.')) return;

    setLoading(true);
    try {
      const novaLista = listaEvidencias.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from('ordens_servico')
        .update({ anexos: JSON.stringify(novaLista) })
        .eq('id', osId);

      if (error) throw error;

      setListaEvidencias(novaLista);
      showToast('Evidência removida.', 'info');
      if (onUpdate) onUpdate();

    } catch (err: any) {
      showToast(`Erro ao remover: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b pb-4 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Paperclip className="text-blue-600" size={20}/> 
          Galeria de Evidências
        </h3>
        <p className="text-sm text-slate-500">
          Anexe fotos do equipamento antes, durante e depois do serviço.
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500">Descrição da Imagem</label>
            <input 
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              placeholder="Ex: Conector oxidado..." 
              value={form.descricao} 
              onChange={e => setForm({...form, descricao: e.target.value})} 
              disabled={loading}
            />
          </div>

          <div className="w-full md:w-48 space-y-1">
            <label className="text-[11px] font-bold uppercase text-slate-500">Etapa</label>
            <select 
              className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:border-blue-500 transition"
              value={form.etapa} 
              onChange={e => setForm({...form, etapa: e.target.value as any})}
              disabled={loading}
            >
              <option>Pré-Intervenção</option>
              <option>Durante</option>
              <option>Pós-Intervenção</option>
              <option>Documento</option>
            </select>
          </div>

          <div className="w-full md:w-auto">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleUpload} 
            />
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={loading} 
              className="w-full md:w-auto h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <span className="animate-pulse">Enviando...</span> : <><UploadCloud size={18}/> Upload Foto</>}
            </button>
          </div>
        </div>
      </div>

      {listaEvidencias.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-3">
            <ImageIcon className="text-slate-300 dark:text-slate-600" size={32}/>
          </div>
          <p className="text-slate-400 font-medium text-sm">Nenhuma evidência anexada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listaEvidencias.map((ev, i) => (
            <div key={i} className="group relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square bg-slate-100 dark:bg-black relative overflow-hidden">
                <img 
                  src={ev.url} 
                  alt={ev.descricao}
                  className="w-full h-full object-cover transition duration-700 group-hover:scale-105" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=Erro+Imagem';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60"></div>
                
                <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-1 rounded shadow-sm text-white
                  ${ev.etapa === 'Pré-Intervenção' ? 'bg-orange-500' : 
                    ev.etapa === 'Durante' ? 'bg-blue-500' : 
                    ev.etapa === 'Pós-Intervenção' ? 'bg-green-500' : 'bg-slate-500'}`
                }>
                  {ev.etapa}
                </span>

                <button 
                  onClick={() => handleDelete(i)} 
                  className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-500 text-slate-600 hover:text-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                  title="Remover evidência"
                >
                  <Trash2 size={14}/>
                </button>
              </div>

              <div className="p-3">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate" title={ev.descricao}>
                  {ev.descricao || 'Sem descrição'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Clock size={10}/> {new Date(ev.data_upload).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}