import { useState, useEffect } from 'react';
import { Save, Building2, UploadCloud, Loader2, FileText, Trash2, Clock } from 'lucide-react';
import { supabase } from '../../../supabaseClient';

export function ConfigGeral() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [form, setForm] = useState({
    id: 1, nome_fantasia: '', nome_empresa: '', cnpj: '', telefone: '', email: '', endereco_completo: '', 
    logo_url: '', termos_orcamento: '', os_tipos_restrito: false,
    sla_critica_horas: 2, sla_alta_horas: 6, sla_media_horas: 24, sla_baixa_horas: 48 // 🚀 NOVOS CAMPOS SLA
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
          logo_url: data.logo_url || '', termos_orcamento: data.termos_orcamento || '',
          os_tipos_restrito: data.os_tipos_restritos || false,
          sla_critica_horas: data.sla_critica_horas || 2,
          sla_alta_horas: data.sla_alta_horas || 6,
          sla_media_horas: data.sla_media_horas || 24,
          sla_baixa_horas: data.sla_baixa_horas || 48
        });
      }
    } catch (err) {} finally { setLoading(false); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.includes('image/')) return alert('Selecione uma imagem.');

      setUploadingLogo(true);
      try {
          const fileExt = file.name.split('.').pop();
          const fileName = `logo-${Date.now()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('app-assets').upload(`identidade/${fileName}`, file);
          if (uploadError) throw uploadError;

          const { data } = supabase.storage.from('app-assets').getPublicUrl(`identidade/${fileName}`);
          setForm(prev => ({ ...prev, logo_url: data.publicUrl }));
          await supabase.from('configuracoes_empresa').upsert([{ ...form, logo_url: data.publicUrl, os_tipos_restritos: form.os_tipos_restrito }], { onConflict: 'id' });
          alert('Logo atualizada com sucesso!');
      } catch (error: any) { alert('Erro: ' + error.message); } finally { setUploadingLogo(false); }
  };

  const handleRemoveLogo = async () => {
      if(!window.confirm("Deseja apagar a logomarca?")) return;
      setForm(prev => ({ ...prev, logo_url: '' }));
      await supabase.from('configuracoes_empresa').upsert([{ ...form, logo_url: '', os_tipos_restritos: form.os_tipos_restrito }], { onConflict: 'id' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        os_tipos_restritos: form.os_tipos_restrito
      };
      delete (payload as any).os_tipos_restrito;

      const { error } = await supabase.from('configuracoes_empresa').upsert([payload], { onConflict: 'id' });
      if (error) throw error;
      alert('Configurações salvas com sucesso!');
    } catch (err: any) { alert('Erro: ' + err.message); } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20 text-blue-500"><Loader2 className="animate-spin" size={40} /></div>;

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl pb-10">
      <div>
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Building2 className="text-blue-600" /> Identidade da Empresa</h2>
        <p className="text-sm text-slate-500 mt-1">Configurações globais e regras de negócio da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LOGO */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-5">
          <div className="relative w-40 h-40 rounded-3xl border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden group">
             {uploadingLogo ? ( <Loader2 className="animate-spin text-blue-500" size={32} /> ) : form.logo_url ? (
                 <>
                    <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-4" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleRemoveLogo} className="p-3 bg-rose-500 text-white rounded-full hover:bg-rose-600"><Trash2 size={20}/></button>
                    </div>
                 </>
             ) : ( <UploadCloud size={40} className="text-slate-300" /> )}
          </div>
          <div className="w-full">
            <label className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 font-bold text-sm">
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploadingLogo} />
                <UploadCloud size={18}/> {form.logo_url ? 'Trocar Imagem' : 'Enviar Imagem'}
            </label>
          </div>
        </div>

        {/* DADOS GERAIS */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block">Nome Fantasia</label><input type="text" name="nome_fantasia" value={form.nome_fantasia} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500" /></div>
            <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block">Razão Social</label><input type="text" name="nome_empresa" value={form.nome_empresa} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block">CNPJ</label><input type="text" name="cnpj" value={form.cnpj} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500" /></div>
             <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block">Telefone</label><input type="text" name="telefone" value={form.telefone} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500" /></div>
             <div><label className="text-[11px] font-black uppercase text-slate-500 mb-2 block">E-mail</label><input type="email" name="email" value={form.email} onChange={handleChange} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 h-12 text-sm font-bold text-slate-800 outline-none focus:border-blue-500" /></div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
                <h4 className="font-bold text-slate-800 text-sm">Restringir Abertura de O.S. Interna</h4>
                <p className="text-xs text-slate-500 font-medium">Usuários logados só poderão abrir O.S. Corretiva.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={form.os_tipos_restrito} onChange={(e) => setForm({...form, os_tipos_restrito: e.target.checked})} />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* 🚀 NOVO BLOCO: CONFIGURAÇÃO DE SLA */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
         <div>
             <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest"><Clock size={18} className="text-rose-500"/> Acordos de Nível de Serviço (SLA)</h3>
             <p className="text-xs text-slate-500 mt-1">Defina o tempo máximo de resposta (em horas) para a equipe iniciar o atendimento de um chamado aberto, baseado na prioridade do equipamento.</p>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-red-50 p-4 rounded-2xl border border-red-100">
                 <label className="text-[10px] font-black uppercase text-red-600 mb-1 block">SLA Crítica (Horas)</label>
                 <input type="number" name="sla_critica_horas" value={form.sla_critica_horas} onChange={handleChange} className="w-full bg-white border border-red-200 rounded-xl px-4 h-10 font-black text-red-700 outline-none" min="1" />
             </div>
             <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                 <label className="text-[10px] font-black uppercase text-orange-600 mb-1 block">SLA Alta (Horas)</label>
                 <input type="number" name="sla_alta_horas" value={form.sla_alta_horas} onChange={handleChange} className="w-full bg-white border border-orange-200 rounded-xl px-4 h-10 font-black text-orange-700 outline-none" min="1" />
             </div>
             <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                 <label className="text-[10px] font-black uppercase text-blue-600 mb-1 block">SLA Média (Horas)</label>
                 <input type="number" name="sla_media_horas" value={form.sla_media_horas} onChange={handleChange} className="w-full bg-white border border-blue-200 rounded-xl px-4 h-10 font-black text-blue-700 outline-none" min="1" />
             </div>
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                 <label className="text-[10px] font-black uppercase text-slate-600 mb-1 block">SLA Baixa (Horas)</label>
                 <input type="number" name="sla_baixa_horas" value={form.sla_baixa_horas} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-xl px-4 h-10 font-black text-slate-700 outline-none" min="1" />
             </div>
         </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-200">
        <button onClick={handleSave} disabled={saving} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-3 active:scale-95">
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Salvar Configurações Globais
        </button>
      </div>
    </div>
  ); 
}