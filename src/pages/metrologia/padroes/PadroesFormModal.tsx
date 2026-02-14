import { useState, useEffect } from 'react';
import { X, Save, UploadCloud, Loader2, Calendar, Activity } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  padraoId?: number | null;
}

export function PadroesFormModal({ isOpen, onClose, onSuccess, padraoId }: Props) {
  const [loading, setLoading] = useState(false);
  
  const [nome, setNome] = useState('');
  const [fabricante, setFabricante] = useState('');
  const [modelo, setModelo] = useState('');
  const [nSerie, setNSerie] = useState('');
  const [nCertificado, setNCertificado] = useState('');
  const [orgao, setOrgao] = useState('');
  const [dataCal, setDataCal] = useState('');
  const [dataVenc, setDataVenc] = useState('');
  const [incerteza, setIncerteza] = useState('');
  const [intervalo, setIntervalo] = useState('12');
  const [arquivo, setArquivo] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (padraoId) {
          carregarPadrao(padraoId);
      } else {
          limparForm();
      }
    }
  }, [isOpen, padraoId]);

  const limparForm = () => {
    setNome(''); setFabricante(''); setModelo(''); setNSerie('');
    setNCertificado(''); setOrgao(''); setDataCal(''); setDataVenc(''); 
    setIncerteza(''); setArquivo(null);
  };

  const carregarPadrao = async (id: number) => {
    try {
      const { data, error } = await supabase.from('padroes').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setNome(data.nome || '');
        setFabricante(data.fabricante || '');
        setModelo(data.modelo || '');
        setNSerie(data.n_serie || '');
        setNCertificado(data.n_certificado || '');
        setOrgao(data.orgao_calibrador || '');
        setDataCal(data.data_calibracao || '');
        setDataVenc(data.data_vencimento || '');
        setIncerteza(data.incerteza_padrao || '');
        setIntervalo(data.intervalo_meses?.toString() || '12');
      }
    } catch (e) {
      console.error('Erro ao carregar:', e);
    }
  };

  const calcularVencimento = (data: string) => {
    setDataCal(data);
    if (data && intervalo) {
      const d = new Date(data);
      d.setMonth(d.getMonth() + Number(intervalo));
      try {
        setDataVenc(d.toISOString().split('T')[0]);
      } catch (e) { console.error("Data inválida"); }
    }
  };

  const handleSave = async () => {
    if (!nome || !nSerie) return alert("Preencha Nome e Nº Série.");
    
    setLoading(true);
    try {
      let urlArquivo = null;

      if (arquivo) {
        const nomeLimpo = arquivo.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const nomeArquivo = `cert_padrao_${Date.now()}_${nomeLimpo}`;
        const { error: uploadError } = await supabase.storage.from('metrologia-docs').upload(nomeArquivo, arquivo);
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from('metrologia-docs').getPublicUrl(nomeArquivo);
        urlArquivo = publicUrl.publicUrl;
      }

      const payload: any = {
        nome, fabricante, modelo, n_serie: nSerie, 
        n_certificado: nCertificado, orgao_calibrador: orgao,
        data_calibracao: dataCal || null, data_vencimento: dataVenc || null,
        incerteza_padrao: incerteza, intervalo_meses: Number(intervalo),
        status: 'Ativo', ativo: true
      };

      if (urlArquivo) payload.certificado_url = urlArquivo;

      if (padraoId) {
        await supabase.from('padroes').update(payload).eq('id', padraoId);
      } else {
        await supabase.from('padroes').insert(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg"><Activity className="text-indigo-600" size={20}/></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{padraoId ? 'Editar Instrumento' : 'Novo Padrão RBC'}</h2>
              <p className="text-xs text-slate-500">Cadastro de Rastreabilidade Metrológica</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-400"/></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-form">Nome do Instrumento <span className="text-red-500">*</span></label>
              <input value={nome} onChange={e => setNome(e.target.value)} className="input-form w-full border p-2.5 rounded-lg border-slate-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div><label className="label-form">Fabricante</label><input value={fabricante} onChange={e => setFabricante(e.target.value)} className="input-form w-full border p-2.5 rounded-lg" /></div>
            <div><label className="label-form">Modelo</label><input value={modelo} onChange={e => setModelo(e.target.value)} className="input-form w-full border p-2.5 rounded-lg" /></div>
            <div><label className="label-form text-indigo-700">Nº de Série <span className="text-red-500">*</span></label><input value={nSerie} onChange={e => setNSerie(e.target.value)} className="input-form w-full border p-2.5 rounded-lg border-indigo-200 bg-indigo-50/50" /></div>
            <div><label className="label-form">Nº Certificado RBC</label><input value={nCertificado} onChange={e => setNCertificado(e.target.value)} className="input-form w-full border p-2.5 rounded-lg" /></div>
            <div className="md:col-span-2"><label className="label-form">Laboratório / Órgão Calibrador</label><input value={orgao} onChange={e => setOrgao(e.target.value)} className="input-form w-full border p-2.5 rounded-lg" /></div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label-form flex items-center gap-1"><Calendar size={14}/> Calibração</label><input type="date" value={dataCal} onChange={e => calcularVencimento(e.target.value)} className="input-form w-full border p-2 rounded-lg" /></div>
            <div><label className="label-form">Intervalo (Meses)</label><input type="number" value={intervalo} onChange={e => setIntervalo(e.target.value)} className="input-form w-full border p-2 rounded-lg" /></div>
            <div><label className="label-form flex items-center gap-1 text-red-600"><Calendar size={14}/> Vencimento</label><input type="date" value={dataVenc} onChange={e => setDataVenc(e.target.value)} className="input-form w-full border p-2 rounded-lg font-bold" /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
              <label className="label-form text-indigo-700 font-bold">Incerteza Padrão</label>
              <input value={incerteza} onChange={e => setIncerteza(e.target.value)} className="input-form w-full border p-2.5 rounded-lg bg-indigo-50 border-indigo-200" placeholder="Ex: ± 0,2 °C (k=2)" />
            </div>
            <div className="md:col-span-2 border-t pt-4 border-dashed border-slate-300">
              <label className="label-form flex items-center gap-2 mb-2"><UploadCloud size={16}/> Certificado Digital (PDF)</label>
              <input type="file" accept=".pdf" onChange={e => setArquivo(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200 transition-colors"/>
            </div>
          </div>
        </div>

        <div className="p-5 border-t bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button onClick={handleSave} disabled={loading} className="bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg disabled:opacity-70">
            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar
          </button>
        </div>
      </div>
    </div>
  );
}