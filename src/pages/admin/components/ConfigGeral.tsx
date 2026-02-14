import { useState, useEffect } from 'react';
import { Save, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export function ConfigGeral() {
  const [config, setConfig] = useState({ 
      nome_empresa: '', cnpj: '', telefone: '', email: '', endereco_completo: '', logo_url: '' 
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    const { data } = await supabase.from('configuracoes_empresa').select('*').eq('id', 1).maybeSingle();
    if (data) setConfig(data);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
        const { error } = await supabase.from('configuracoes_empresa').upsert({ id: 1, ...config });
        if (error) throw error;
        alert('Configurações salvas com sucesso!');
    } catch (e: any) { alert('Erro ao salvar: ' + e.message); } 
    finally { setLoading(false); }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
        const fileName = `logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        await supabase.storage.from('app-assets').upload(fileName, file);
        const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
        setConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
    } catch (err: any) { alert('Erro no upload: ' + err.message); } 
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
        
        {/* BLOCO 1: Identidade Visual */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            {/* Lado Esquerdo: Explicação */}
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="font-bold text-slate-800 text-base">Identidade Visual</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Estas informações representam a sua marca. O logotipo e o nome da empresa serão exibidos no cabeçalho de todos os PDFs gerados pelo sistema (Laudos, OS e Checklists).
                </p>
            </div>
            
            {/* Lado Direito: Inputs */}
            <div className="w-full md:w-2/3 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="shrink-0">
                        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Logotipo</label>
                        <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-indigo-400 transition-colors">
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            {uploading ? <Loader2 className="animate-spin text-indigo-500" size={24}/> 
                            : config.logo_url ? (
                                <img src={config.logo_url} className="w-full h-full object-contain p-1" alt="Logo"/>
                            ) : (
                                <Upload size={24} className="text-slate-300 group-hover:text-indigo-400 transition-colors"/>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full space-y-4">
                        <Field label="Nome da Empresa (Razão Social / Fantasia)" value={config.nome_empresa} onChange={(e:any) => setConfig({...config, nome_empresa: e.target.value})} />
                        <Field label="CNPJ" value={config.cnpj} onChange={(e:any) => setConfig({...config, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                    </div>
                </div>
            </div>
        </div>

        {/* BLOCO 2: Contato e Localização */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="font-bold text-slate-800 text-base">Contato & Endereço</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Informações de contato oficiais. Elas aparecem nos rodapés e cabeçalhos de comunicação com o cliente.
                </p>
            </div>
            
            <div className="w-full md:w-2/3 p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="E-mail Público / Corporativo" type="email" value={config.email} onChange={(e:any) => setConfig({...config, email: e.target.value})} />
                    <Field label="Telefone / WhatsApp" value={config.telefone} onChange={(e:any) => setConfig({...config, telefone: e.target.value})} />
                </div>
                <Field label="Endereço Completo" value={config.endereco_completo} onChange={(e:any) => setConfig({...config, endereco_completo: e.target.value})} placeholder="Rua, Número, Bairro, Cidade - UF" />
            </div>
        </div>

        {/* AÇÕES */}
        <div className="flex justify-end pt-4">
            <button onClick={handleSave} disabled={loading || uploading} className="btn-primary bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                Salvar Configurações
            </button>
        </div>

    </div>
  );
}

// Input Minimalista Profissional
const Field = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{label}</label>
        <input className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm" {...props} />
    </div>
);