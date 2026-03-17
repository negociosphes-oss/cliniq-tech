import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Megaphone, UploadCloud, Image as ImageIcon, Loader2, CheckCircle, Activity } from 'lucide-react';
import { supabase } from '../../supabaseClient';

// 🚀 O "export" AQUI É O QUE O APP.TSX ESTAVA PROCURANDO E NÃO ACHOU!
export function AberturaChamadoPublico() {
  const { id } = useParams(); 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [equipamento, setEquipamento] = useState<any>(null);
  const [fotoInicial, setFotoInicial] = useState<File | null>(null);
  const [enviado, setEnviado] = useState(false);
  
  const [osForm, setOsForm] = useState({
    solicitante_nome: '',
    solicitante_email: '',
    solicitante_setor: '',
    solicitante_telefone: '',
    descricao: ''
  });

  useEffect(() => {
    const loadEquip = async () => {
      try {
        const { data } = await supabase.from('equipamentos').select('*, tecnologia:dict_tecnologias(nome), cliente:clientes(nome_fantasia)').eq('id', id).maybeSingle();
        if (data) setEquipamento(data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (id) loadEquip();
  }, [id]);

  const handleSave = async () => {
    if (!osForm.solicitante_nome || !osForm.solicitante_setor || !osForm.descricao) {
      return alert('Preencha seu Nome, Setor e o Relato do Problema.');
    }

    setSaving(true);
    try {
      let anexosJson = null;
      if (fotoInicial) {
        const fileName = `abertura_publica_${Date.now()}_${fotoInicial.name.replace(/[^a-z0-9.]/gi, '_')}`;
        const { error: upErr } = await supabase.storage.from('os-imagens').upload(`evidencias/${fileName}`, fotoInicial);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('os-imagens').getPublicUrl(`evidencias/${fileName}`);
          anexosJson = JSON.stringify([{ url: urlData.publicUrl, etapa: 'Abertura Externa', data: new Date().toISOString() }]);
        }
      }

      const payload = {
        tenant_id: equipamento?.tenant_id || 1,
        equipamento_id: equipamento.id,
        solicitante_nome: osForm.solicitante_nome,
        solicitante_email: osForm.solicitante_email,
        solicitante_setor: osForm.solicitante_setor,
        solicitante_telefone: osForm.solicitante_telefone,
        descricao_problema: osForm.descricao,
        tipo: 'Corretiva', 
        prioridade: equipamento?.tecnologia?.prioridade || 'Média',
        status: 'Aberta',
        anexos: anexosJson,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('ordens_servico').insert([payload]);
      if (error) throw error;
      
      await supabase.from('equipamentos').update({ status: 'Manutenção' }).eq('id', equipamento.id);
      
      setEnviado(true);
    } catch (e: any) {
      alert('Erro ao registrar chamado: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;

  if (!equipamento) return <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center"><Megaphone size={64} className="text-slate-300 mb-4"/><h2 className="text-2xl font-black text-slate-800">Equipamento Inválido</h2><p className="text-slate-500 mt-2">O QR Code escaneado não consta no sistema.</p></div>;

  if (enviado) return (
    <div className="h-screen flex flex-col items-center justify-center bg-emerald-50 p-6 text-center animate-fadeIn">
        <CheckCircle size={80} className="text-emerald-500 mb-6" />
        <h2 className="text-3xl font-black text-emerald-800 mb-2">Chamado Recebido!</h2>
        <p className="text-emerald-600 font-medium">A equipe de Engenharia Clínica foi notificada e o atendimento será iniciado em breve.</p>
        <p className="text-emerald-600/50 text-xs mt-10">Você já pode fechar esta tela.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans py-12 px-4 flex justify-center">
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-inner">
                <Activity size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-800">Abertura de Chamado</h1>
            <p className="text-slate-500 text-sm mt-1">Solicite manutenção para este equipamento.</p>
        </div>

        <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-xl border border-slate-100 space-y-6">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Equipamento Selecionado</span>
                <span className="font-bold text-slate-800">{equipamento.tecnologia?.nome || 'Equipamento Médico'}</span>
                <span className="text-xs text-slate-500 mt-1">TAG: <strong className="text-blue-600">{equipamento.tag}</strong> | S/N: {equipamento.n_serie || '-'}</span>
                <span className="text-[10px] text-slate-400 mt-2">{equipamento.cliente?.nome_fantasia}</span>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 pl-1">Seu Nome *</label>
                  <input className="w-full h-12 px-4 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500" placeholder="Nome Completo" value={osForm.solicitante_nome} onChange={e => setOsForm({...osForm, solicitante_nome: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 pl-1">Setor *</label>
                    <input className="w-full h-12 px-4 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500" placeholder="Ex: UTI" value={osForm.solicitante_setor} onChange={e => setOsForm({...osForm, solicitante_setor: e.target.value})} />
                    </div>
                    <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 pl-1">Telefone / Ramal</label>
                    <input className="w-full h-12 px-4 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500" placeholder="(Opcional)" value={osForm.solicitante_telefone} onChange={e => setOsForm({...osForm, solicitante_telefone: e.target.value})} />
                    </div>
                </div>

                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400 pl-1">Descrição do Problema *</label>
                  <textarea className="w-full h-32 p-4 border border-slate-200 rounded-xl font-medium outline-none focus:border-blue-500 resize-none" placeholder="Descreva o defeito ou o que aconteceu..." value={osForm.descricao} onChange={e => setOsForm({...osForm, descricao: e.target.value})}></textarea>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center relative group bg-slate-50 hover:border-blue-400 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={e => e.target.files && setFotoInicial(e.target.files[0])} />
                  {fotoInicial ? (
                    <div className="text-emerald-600 font-bold text-sm flex flex-col items-center">
                      <ImageIcon size={24} className="mb-2" />
                      <p className="truncate w-full max-w-[200px]">{fotoInicial.name}</p>
                    </div>
                  ) : (
                    <div className="text-slate-400 group-hover:text-blue-500 flex flex-col items-center">
                      <UploadCloud size={32} className="mb-2" />
                      <span className="font-bold text-sm">Anexar Foto (Opcional)</span>
                    </div>
                  )}
                </div>

                <button onClick={handleSave} disabled={saving} className="w-full h-14 bg-blue-600 text-white font-black rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                  {saving ? <Loader2 className="animate-spin" size={24}/> : <Megaphone size={20}/>} {saving ? 'ENVIANDO...' : 'REGISTRAR CHAMADO'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}