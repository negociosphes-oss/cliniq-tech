import { useState, useEffect } from 'react';
import { Save, Upload, Loader2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

// 🚀 FAREJADOR DE SUBDOMÍNIO (Descobre de qual cliente é esta configuração)
const getSubdomain = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') {
        return parts[0];
    }
    return 'admin'; 
};

export function ConfigGeral() {
  const [config, setConfig] = useState({ 
      nome_fantasia: '', 
      nome_empresa: '', // 🚀 NOVO: Razão Social exclusiva para o PDF
      cnpj: '', 
      telefone: '', 
      email: '', 
      endereco_completo: '', 
      logo_url: '' 
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    const slug = getSubdomain();
    
    // 🚀 Busca dados mesclando as duas tabelas para não perder nenhuma informação
    const { data: tenantData } = await supabase.from('empresas_inquilinas').select('*').eq('slug_subdominio', slug).maybeSingle();
    const { data: confData } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
    
    // Junta as duas. A configuracoes_empresa tem prioridade por ter a Razão Social
    const finalData = { ...tenantData, ...confData };
    
    if (finalData) {
        setConfig({
            nome_fantasia: finalData.nome_fantasia || '', 
            nome_empresa: finalData.nome_empresa || finalData.nome_fantasia || '', // Puxa a Razão Social
            cnpj: finalData.cnpj || '',
            telefone: finalData.telefone || '',
            email: finalData.email || '',
            endereco_completo: finalData.endereco_completo || '',
            logo_url: finalData.logo_url || ''
        });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const slug = getSubdomain();

    try {
        // 🚀 AÇÃO 1: Atualiza a tabela do Inquilino (Garante que a Logo do Menu e do Login atualizem)
        await supabase.from('empresas_inquilinas').update({ 
            nome_fantasia: config.nome_fantasia, 
            cnpj: config.cnpj,
            telefone: config.telefone,
            email: config.email,
            endereco_completo: config.endereco_completo,
            logo_url: config.logo_url
        }).eq('slug_subdominio', slug);

        // 🚀 AÇÃO 2: Salva na configuracoes_empresa (A Tabela OFICIAL que o motor do PDF usa)
        const { error } = await supabase.from('configuracoes_empresa').upsert({
            id: 1, // Fixa no ID 1 para ser a empresa mestre
            nome_fantasia: config.nome_fantasia, 
            nome_empresa: config.nome_empresa, // Dispara a Razão Social pro PDF
            cnpj: config.cnpj,
            telefone: config.telefone,
            email: config.email,
            endereco_completo: config.endereco_completo,
            logo_url: config.logo_url
        });

        if (error) throw error;
        
        alert('Identidade Visual do ambiente atualizada com sucesso!');
        // Força um recarregamento leve para a Logo aparecer no menu lateral imediatamente
        window.location.reload();
    } catch (e: any) { 
        alert('Erro ao salvar: ' + e.message); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleFileUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
        // Salva a logo na pasta global de assets
        const fileName = `logos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        
        const { error: uploadError } = await supabase.storage.from('app-assets').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('app-assets').getPublicUrl(fileName);
        
        setConfig(prev => ({ ...prev, logo_url: data.publicUrl }));
        
    } catch (err: any) { 
        alert('Erro no upload: ' + err.message); 
    } finally { 
        setUploading(false); 
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-10">
        
        {/* BLOCO 1: Identidade Visual */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="font-bold text-slate-800 text-base">Identidade Visual da Empresa</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Estas informações representam a marca deste ambiente. O logotipo e o nome da empresa serão exibidos na tela de Login e no cabeçalho de todos os PDFs gerados.
                </p>
            </div>
            
            <div className="w-full md:w-2/3 p-6 space-y-5">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                    <div className="shrink-0">
                        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block mb-2">Logotipo Oficial</label>
                        <div className="w-24 h-24 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:border-blue-500 transition-colors">
                            <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" title="Clique para alterar a logo" />
                            {uploading ? <Loader2 className="animate-spin text-blue-500" size={24}/> 
                            : config.logo_url ? (
                                <img src={config.logo_url} className="w-full h-full object-contain p-2" alt="Logo"/>
                            ) : (
                                <Upload size={24} className="text-slate-300 group-hover:text-blue-500 transition-colors"/>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex-1 w-full space-y-4">
                        {/* 🚀 O CAMPO DE RAZÃO SOCIAL QUE FALTAVA PARA O PDF */}
                        <Field label="Nome da Empresa (Razão Social Oficial)" value={config.nome_empresa} onChange={(e:any) => setConfig({...config, nome_empresa: e.target.value})} placeholder="Ex: Atlas System LTDA" />
                        <Field label="Nome Fantasia" value={config.nome_fantasia} onChange={(e:any) => setConfig({...config, nome_fantasia: e.target.value})} />
                        <Field label="CNPJ" value={config.cnpj} onChange={(e:any) => setConfig({...config, cnpj: e.target.value})} placeholder="00.000.000/0000-00" />
                    </div>
                </div>
            </div>
        </div>

        {/* BLOCO 2: Contato e Localização */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-200">
                <h3 className="font-bold text-slate-800 text-base">Contato Institucional</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Informações de contato oficiais que aparecerão nos cabeçalhos dos laudos e comunicações.
                </p>
            </div>
            
            <div className="w-full md:w-2/3 p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="E-mail Público Corporativo" type="email" value={config.email} onChange={(e:any) => setConfig({...config, email: e.target.value})} />
                    <Field label="Telefone / WhatsApp" value={config.telefone} onChange={(e:any) => setConfig({...config, telefone: e.target.value})} />
                </div>
                <Field label="Endereço Completo" value={config.endereco_completo} onChange={(e:any) => setConfig({...config, endereco_completo: e.target.value})} placeholder="Ex: Rua das Flores, 123, Bairro Saúde - São Paulo/SP" />
            </div>
        </div>

        {/* AÇÕES */}
        <div className="flex justify-end pt-4">
            <button onClick={handleSave} disabled={loading || uploading} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} 
                Salvar Configurações do Ambiente
            </button>
        </div>

    </div>
  );
}

// Componente de Input Minimalista mantido!
const Field = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">{label}</label>
        <input className="w-full h-10 bg-white border border-slate-300 rounded-lg px-3 text-sm font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm" {...props} />
    </div>
);