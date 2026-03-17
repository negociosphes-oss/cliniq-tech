import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Megaphone, UserCheck, ChevronDown, UploadCloud, Image as ImageIcon, Loader2, CheckCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import type { Equipamento, Cliente } from '../../types';

interface Props {
  equipamentos: Equipamento[];
  clientes: Cliente[];
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  fetchAll: () => void;
  user?: any;
  configEmpresa?: any;
}

export function AberturaChamadoPage({ equipamentos, clientes, showToast, fetchAll, user, configEmpresa }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [fotoInicial, setFotoInicial] = useState<File | null>(null);
  const [tiposOsDinamicos, setTiposOsDinamicos] = useState<any[]>([]); // 🚀 MOTOR DINÂMICO
  
  const [osForm, setOsForm] = useState({
    cliente_id: '',
    equipamento_id: '',
    solicitante_nome: '',
    solicitante_email: '',
    solicitante_setor: '',
    solicitante_telefone: '',
    descricao: '',
    tipo: 'Corretiva',
    prioridade: 'Média'
  });

  const isRestricted = configEmpresa?.os_tipos_restritos && user?.cargo !== 'admin';

  // 🚀 BUSCA OS TIPOS DE O.S. EM TEMPO REAL
  useEffect(() => {
    const fetchTipos = async () => {
      const { data } = await supabase.from('tipos_ordem_servico').select('*').order('nome');
      if (data) setTiposOsDinamicos(data);
    };
    fetchTipos();
  }, []);

  useEffect(() => {
    const preSelected = location.state?.preSelectedEquipamento;
    if (preSelected) {
      setOsForm(prev => ({
        ...prev,
        cliente_id: String(preSelected.cliente_id),
        equipamento_id: String(preSelected.id),
        prioridade: preSelected.tecnologia?.prioridade || preSelected.tecnologias?.prioridade || 'Média'
      }));
    }
  }, [location.state]);

  useEffect(() => {
    if (osForm.equipamento_id) {
      const eq = equipamentos.find(e => e.id === Number(osForm.equipamento_id));
      if (eq) {
        const p = eq.tecnologia?.prioridade || eq.tecnologias?.prioridade || 'Média';
        setOsForm(prev => ({ ...prev, prioridade: p }));
      }
    }
  }, [osForm.equipamento_id, equipamentos]);

  const handleSave = async () => {
    if (!osForm.equipamento_id || !osForm.solicitante_nome || !osForm.solicitante_email || !osForm.solicitante_setor || !osForm.descricao) {
      return showToast('Preencha os campos obrigatórios (*)', 'error');
    }

    setLoading(true);
    try {
      let anexosJson = null;
      if (fotoInicial) {
        const fileName = `abertura_${Date.now()}_${fotoInicial.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const { error: upErr } = await supabase.storage.from('os-imagens').upload(`evidencias/${fileName}`, fotoInicial);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('os-imagens').getPublicUrl(`evidencias/${fileName}`);
          anexosJson = JSON.stringify([{ url: urlData.publicUrl, etapa: 'Abertura', data: new Date().toISOString() }]);
        }
      }

      const eqSelected = equipamentos.find(e => e.id === Number(osForm.equipamento_id));

      const payload = {
        tenant_id: eqSelected?.tenant_id || 1, 
        equipamento_id: Number(osForm.equipamento_id),
        solicitante_nome: osForm.solicitante_nome,
        solicitante_email: osForm.solicitante_email,
        solicitante_setor: osForm.solicitante_setor,
        solicitante_telefone: osForm.solicitante_telefone,
        descricao_problema: osForm.descricao,
        tipo: osForm.tipo,
        prioridade: osForm.prioridade,
        status: 'Aberta',
        anexos: anexosJson,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('ordens_servico').insert([payload]);
      if (error) throw error;
      
      await supabase.from('equipamentos').update({ status: 'Manutenção' }).eq('id', osForm.equipamento_id);
      showToast('Chamado registrado com sucesso!', 'success');
      fetchAll();
      navigate('/ordens');
    } catch (e: any) {
      console.error("Erro Supabase:", e);
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 animate-fadeIn pb-24">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/ordens')} className="p-3 bg-theme-card border border-theme rounded-xl hover:bg-theme-page text-theme-muted transition-all"><ChevronLeft/></button>
        <h2 className="text-3xl font-black text-theme-main flex items-center gap-2"><Megaphone className="text-orange-500"/> Novo Chamado</h2>
      </div>

      <div className="bg-theme-card p-8 rounded-[32px] border border-theme shadow-2xl space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-theme-muted tracking-widest pl-1">1. Localização</label>
            <select className="input-theme w-full h-14 rounded-2xl font-bold cursor-pointer" value={osForm.cliente_id} onChange={e => setOsForm({...osForm, cliente_id: e.target.value, equipamento_id: ''})}>
              <option value="">Selecione o Cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-theme-muted tracking-widest pl-1">2. Equipamento</label>
            <select className="input-theme w-full h-14 rounded-2xl font-bold cursor-pointer" disabled={!osForm.cliente_id} value={osForm.equipamento_id} onChange={e => setOsForm({...osForm, equipamento_id: e.target.value})}>
              <option value="">Selecione o Ativo...</option>
              {equipamentos.filter(e => e.cliente_id === Number(osForm.cliente_id)).map(e => {
                const nomeAtivo = e.nome || e.tecnologia?.nome || e.tecnologias?.nome || 'Equipamento';
                const modeloStr = e.modelo ? ` - ${e.modelo}` : '';
                const serieStr = e.n_serie ? ` - S/N: ${e.n_serie}` : '';
                return <option key={e.id} value={e.id}>{e.tag} - {nomeAtivo}{modeloStr}{serieStr}</option>
              })}
            </select>
          </div>
        </div>

        <div className="bg-theme-page/50 p-6 rounded-[24px] border border-theme shadow-inner">
          <h3 className="text-sm font-black text-theme-main mb-6 flex items-center gap-2 uppercase tracking-wider"><UserCheck size={20} className="text-primary-theme"/> Identificação do Solicitante</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1"><label className="text-[10px] font-black text-theme-muted pl-1">NOME COMPLETO *</label>
              <input className="input-theme w-full h-12 px-4 rounded-xl font-bold" placeholder="Seu Nome" value={osForm.solicitante_nome} onChange={e => setOsForm({...osForm, solicitante_nome: e.target.value})} />
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black text-theme-muted pl-1">E-MAIL INSTITUCIONAL *</label>
              <input className="input-theme w-full h-12 px-4 rounded-xl font-bold" placeholder="email@hospital.com" value={osForm.solicitante_email} onChange={e => setOsForm({...osForm, solicitante_email: e.target.value})} />
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black text-theme-muted pl-1">SETOR / ALA *</label>
              <input className="input-theme w-full h-12 px-4 rounded-xl font-bold" placeholder="Ex: UTI Adulto" value={osForm.solicitante_setor} onChange={e => setOsForm({...osForm, solicitante_setor: e.target.value})} />
            </div>
            <div className="space-y-1"><label className="text-[10px] font-black text-theme-muted pl-1">WHATSAPP (OPCIONAL)</label>
              <input className="input-theme w-full h-12 px-4 rounded-xl font-bold" placeholder="(00) 00000-0000" value={osForm.solicitante_telefone} onChange={e => setOsForm({...osForm, solicitante_telefone: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-theme-muted tracking-widest pl-1">Tipo de Serviço *</label>
            <div className="relative">
              {/* 🚀 DROPDOWN DINÂMICO AQUI */}
              <select 
                disabled={isRestricted}
                className={`input-theme w-full h-14 rounded-2xl font-black text-theme-main uppercase tracking-widest cursor-pointer appearance-none pl-4 pr-10 ${isRestricted ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`} 
                value={osForm.tipo} 
                onChange={e => setOsForm({...osForm, tipo: e.target.value})}
              >
                {isRestricted ? (
                    <option value="Corretiva">CORRETIVA</option>
                ) : (
                    tiposOsDinamicos.length > 0 ? (
                        tiposOsDinamicos.map(t => <option key={t.id} value={t.nome}>{t.nome.toUpperCase()}</option>)
                    ) : (
                        <option value="Corretiva">CORRETIVA</option>
                    )
                )}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none"/>
            </div>
            {isRestricted && <p className="text-[10px] text-orange-600 font-bold mt-1 ml-1">Usuários comuns só podem abrir O.S. Corretiva.</p>}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-theme-muted tracking-widest pl-1">Prioridade do Ativo (Auto)</label>
            <div className={`w-full h-14 px-4 rounded-2xl border flex items-center font-black uppercase tracking-widest transition-colors ${osForm.prioridade === 'Crítica' ? 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-100' : 'bg-theme-page text-theme-muted border-theme'}`}>
                {osForm.prioridade || 'Média'}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-theme-muted tracking-widest ml-1">Relato do Problema *</label>
          <textarea className="input-theme w-full p-5 rounded-[24px] font-medium h-40 resize-none shadow-inner" value={osForm.descricao} onChange={e => setOsForm({...osForm, descricao: e.target.value})} placeholder="Descreva detalhadamente o defeito ou motivo da solicitação..."></textarea>
        </div>

        <div className="border-2 border-dashed border-theme rounded-[32px] p-10 text-center hover:border-primary-theme transition-all cursor-pointer relative group bg-theme-page/30">
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files && setFotoInicial(e.target.files[0])} />
          {fotoInicial ? (
            <div className="flex flex-col items-center gap-3 text-emerald-600 font-black animate-fadeIn">
              <div className="p-4 bg-emerald-100 rounded-full"><ImageIcon size={32}/></div>
              <p>{fotoInicial.name}</p>
              <span className="text-[10px] text-theme-muted uppercase tracking-widest">Clique para trocar a imagem</span>
            </div>
          ) : (
            <div className="text-theme-muted group-hover:scale-105 transition-transform duration-300">
              <UploadCloud className="mx-auto mb-3 opacity-30 group-hover:text-primary-theme transition-all" size={56}/>
              <p className="font-bold text-sm text-theme-main">Anexar evidência fotográfica</p>
              <p className="text-[10px] uppercase tracking-widest mt-2 font-bold opacity-50">JPG, PNG ou PDF</p>
            </div>
          )}
        </div>

        <button onClick={handleSave} disabled={loading} className="w-full bg-primary-theme text-white text-xl font-black py-6 rounded-[24px] shadow-2xl shadow-primary-theme/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4">
          {loading ? <Loader2 className="animate-spin" size={28}/> : <CheckCircle size={28}/>} REGISTRAR CHAMADO TÉCNICO
        </button>
      </div>
    </div>
  );
}