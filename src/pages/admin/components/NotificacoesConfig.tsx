import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { Bell, MessageSquare, AlertTriangle, CalendarClock, Save, Loader2 } from 'lucide-react';

export function NotificacoesConfig() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tenantId, setTenantId] = useState<number>(1);
  const [configId, setConfigId] = useState<number | null>(null);

  const [form, setForm] = useState({
    alertas_ativos: false,
    whatsapp_notificacoes: '',
    alerta_os_critica: false,
    alerta_calibracao: false,
  });

  useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const carregarConfiguracoes = async () => {
    try {
      const hostname = window.location.hostname;
      let slug = hostname.split('.')[0];
      if (slug === 'localhost' || slug === 'app' || slug === 'www') slug = 'atlasum';

      const { data: tenant } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
      const tId = tenant ? tenant.id : 1;
      setTenantId(tId);

      const { data: config } = await supabase.from('configuracoes_empresa').select('*').eq('tenant_id', tId).maybeSingle();
      if (config) {
        setConfigId(config.id);
        setForm({
          alertas_ativos: config.alertas_ativos || false,
          whatsapp_notificacoes: config.whatsapp_notificacoes || '',
          alerta_os_critica: config.alerta_os_critica || false,
          alerta_calibracao: config.alerta_calibracao || false,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (configId) {
        await supabase.from('configuracoes_empresa').update(form).eq('id', configId);
      } else {
        await supabase.from('configuracoes_empresa').insert([{ tenant_id: tenantId, ...form }]);
      }
      alert("Preferências de notificação salvas com sucesso!");
    } catch (err) {
      alert("Erro ao salvar as configurações.");
    } finally {
      setSaving(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <div onClick={onChange} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
    </div>
  );

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" size={32}/></div>;

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-fadeIn">
      
      <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl"><MessageSquare size={28}/></div>
        <div>
          <h3 className="text-2xl font-black text-slate-800">Alertas via WhatsApp</h3>
          <p className="text-slate-500 font-medium text-sm mt-1">Configure os gatilhos para receber avisos automáticos da operação.</p>
        </div>
      </div>

      <div className="space-y-8 max-w-2xl">
        
        {/* Ativação Mestra */}
        <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div>
            <h4 className="font-bold text-slate-800 text-lg">Ativar Robô de Notificações</h4>
            <p className="text-slate-500 text-sm">Liga ou desliga todos os disparos para a sua conta.</p>
          </div>
          <Toggle checked={form.alertas_ativos} onChange={() => setForm({ ...form, alertas_ativos: !form.alertas_ativos })} />
        </div>

        {/* Formulário (Só aparece se o robô estiver ativo) */}
        <div className={`transition-all duration-300 ${form.alertas_ativos ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
            
            <div className="mb-6">
                <label className="text-xs font-black uppercase text-slate-500 tracking-widest mb-2 block">Número do Gestor (WhatsApp)</label>
                <input 
                    type="text" 
                    className="w-full h-12 px-4 border border-slate-200 rounded-xl font-bold text-slate-700 focus:border-emerald-500 outline-none"
                    placeholder="Ex: 5511999999999"
                    value={form.whatsapp_notificacoes}
                    onChange={(e) => setForm({ ...form, whatsapp_notificacoes: e.target.value })}
                />
                <p className="text-xs text-slate-400 mt-2">Inclua o DDI (55) e o DDD. Apenas números.</p>
            </div>

            <h4 className="text-xs font-black uppercase text-slate-500 tracking-widest mb-4 border-b border-slate-100 pb-2">Gatilhos de Disparo</h4>
            
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-4">
                        <AlertTriangle className="text-rose-500" size={24}/>
                        <div>
                            <h5 className="font-bold text-slate-700">Nova O.S. Crítica / Alta</h5>
                            <p className="text-xs text-slate-500">Avisa sempre que um chamado urgente for aberto.</p>
                        </div>
                    </div>
                    <Toggle checked={form.alerta_os_critica} onChange={() => setForm({ ...form, alerta_os_critica: !form.alerta_os_critica })} />
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-4">
                        <CalendarClock className="text-amber-500" size={24}/>
                        <div>
                            <h5 className="font-bold text-slate-700">Calibrações Vencendo</h5>
                            <p className="text-xs text-slate-500">Avisa 15 dias antes de um equipamento vencer o laudo.</p>
                        </div>
                    </div>
                    <Toggle checked={form.alerta_calibracao} onChange={() => setForm({ ...form, alerta_calibracao: !form.alerta_calibracao })} />
                </div>
            </div>

        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            >
                {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                SALVAR NOTIFICAÇÕES
            </button>
        </div>

      </div>
    </div>
  );
}