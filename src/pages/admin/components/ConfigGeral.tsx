import { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Phone, Mail, UploadCloud, Loader2, FileText, Trash2 } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export function ConfigGeral() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [form, setForm] = useState({
    id: 1, nome_fantasia: '', nome_empresa: '', cnpj: '', telefone: '', email: '', endereco_completo: '', logo_url: '', termos_orcamento: '' 
  });

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
      if (data) {
        setForm({
          id: data.id || 1, nome_fantasia: data.nome_fantasia || '', nome_empresa: data.nome_empresa || '', cnpj: data.cnpj || '',
          telefone: data.telefone || '', email: data.email || '', endereco_completo: data.endereco_completo || '', 
          logo_url: data.logo_url || '', termos_orcamento: data.termos_orcamento || ''
        });
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🚀 O MOTOR DE UPLOAD DA LOGOMARCA
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      if (!file.type.includes('image/')) {
          alert('Por favor, selecione um arquivo de imagem (PNG, JPG, SVG).');
          return;
      }

      setUploadingLogo(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `logo-${Date.now()}.${fileExt}`;
          const filePath = `identidade/${fileName}`;

          // Upload do arquivo para a caçamba 'app-assets'
          const { error: uploadError } = await supabase.storage.from('app-assets').upload(filePath, file);
          
          if (uploadError) throw uploadError;

          // Recupera a URL pública que todo mundo pode acessar
          const { data } = supabase.storage.from('app-assets').getPublicUrl(filePath);
          
          // Salva no formulário
          setForm(prev => ({ ...prev, logo_url: data.publicUrl }));
          
          // E já salva no banco de dados na mesma hora
          await supabase.from('configuracoes_empresa').upsert([{ ...form, logo_url: data.publicUrl }], { onConflict: 'id' });
          alert('Logo atualizada com sucesso!');

      } catch (error: any) {
          alert('Erro ao enviar logomarca: ' + error.message);
      } finally {
          setUploadingLogo(false);
      }
  };

  const handleRemoveLogo = async () => {
      if(!window.confirm("Deseja realmente apagar a logomarca do sistema?")) return;
      setForm(prev => ({ ...prev, logo_url: '' }));
      await supabase.from('configuracoes_empresa').upsert([{ ...form, logo_url: '' }], { onConflict: 'id' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('configuracoes_empresa').upsert([form], { onConflict: 'id' });
      if (error) throw error;
      alert('Configurações Globais salvas com sucesso! Atualize a página para ver os efeitos.');
    } catch (err: any) { alert('Erro ao salvar: ' + err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center py-20 text-blue-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Building2 className="text-blue-600" /> Identidade da Empresa</h2>
        <p className="text-sm text-slate-500 mt-1">Estes dados serão carimbados na tela de Login, Menu e Documentos (PDF).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🚀 O NOVO BLOCO DE UPLOAD DE LOGO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative w-40 h-40 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden group">
             {uploadingLogo ? (
                 <div className="flex flex-col items-center justify-center text-blue-500"><Loader2 className="animate-spin mb-2" size={32} /><span className="text-xs font-bold">Enviando...</span></div>
             ) : form.logo_url ? (
                 <>
                    <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleRemoveLogo} className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors shadow-lg" title="Apagar Logo"><Trash2 size={20}/></button>
                    </div>
                 </>
             ) : (
                 <div className="text-slate-300 flex flex-col items-center"><UploadCloud size={40} className="mb-2" /><span className="text-[10px] font-bold uppercase tracking-widest">Sem Logo</span></div>
             )}
          </div>
          <div className="w-full">
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors font-bold text-sm">
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                <UploadCloud size={18}/> {form.logo_url ? 'Trocar Imagem' : 'Enviar Imagem'}
            </label>
            <p className="text-[9px] text-slate-400 mt-3 font-medium">Recomendado: Fundo transparente (PNG), max 2MB.</p>
          </div>
        </div>

        {/* DADOS (RESTANTE INTACTO) */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block ml-1">Nome Fantasia</label><input type="text" name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors" /></div>
            <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block ml-1">Razão Social</label><input type="text" name="nome_empresa" value={form.nome_empresa} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block ml-1">CNPJ</label><input type="text" name="cnpj" value={form.cnpj} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors" /></div>
             <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block ml-1">Telefone / Whats</label><input type="text" name="telefone" value={form.telefone} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors" /></div>
             <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block ml-1">E-mail de Contato</label><input type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors" /></div>
          </div>
          <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block ml-1">Endereço Completo (Para Laudos e Etiquetas)</label><input type="text" name="endereco_completo" value={form.endereco_completo} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors" /></div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
         <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><FileText size={18} className="text-blue-600"/> Termos e Condições do Orçamento</h3>
         <p className="text-xs text-slate-500">Este texto será impresso automaticamente no rodapé de todas as Propostas Comerciais geradas pelo sistema. Você pode pular linhas e editar como quiser.</p>
         <textarea 
            name="termos_orcamento" 
            value={form.termos_orcamento} 
            onChange={handleChange} 
            placeholder="Ex: 1. VALIDADE: Proposta válida por 15 dias...&#10;2. GARANTIA: 90 dias contra defeitos de fábrica..."
            className="w-full h-48 bg-slate-50 border-2 border-slate-100 rounded-xl p-5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-colors resize-y custom-scrollbar"
         />
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 disabled:opacity-50 active:scale-95">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Salvar Configurações
        </button>
      </div>
    </div>
  );
}