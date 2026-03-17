import { useState } from 'react';
import { CheckCircle, FileText, PenTool, ShieldCheck, Activity, Key, Search, Clock, Mail, Printer, Loader2, MessageCircle, Copy } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface FechamentoTabProps {
  osForm: any;
  setOsForm: (val: any) => void;
  apontamentos: any[];
  onFinalize: () => void;
  status: string;
  onPrint: () => void; 
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function FechamentoTab({ osForm, setOsForm, apontamentos, onFinalize, status, onPrint, showToast }: FechamentoTabProps) {
  const [loading, setLoading] = useState(false);
  const isReadOnly = status === 'Concluída' || status === 'Finalizada';

  const temApontamento = apontamentos.length > 0;
  const temDiagnostico = !!osForm.falha_constatada && osForm.falha_constatada.trim().length > 5;
  const temSolucao = !!osForm.solucao_aplicada && osForm.solucao_aplicada.trim().length > 5;
  const relatorioOk = temDiagnostico && temSolucao;
  const podeFinalizar = temApontamento && relatorioOk;

  const handleFinalizarCustom = async () => {
      setLoading(true);
      try {
          const { error } = await supabase.from('ordens_servico').update({
              falha_constatada: osForm.falha_constatada,
              causa_raiz: osForm.causa_raiz,
              solucao_aplicada: osForm.solucao_aplicada,
              status: 'Concluída',
              data_fechamento: new Date().toISOString()
          }).eq('id', osForm.id);

          if (error) throw error;
          if (showToast) showToast('O.S. Finalizada com sucesso!', 'success');
          onFinalize(); 
      } catch (e) {
          if (showToast) showToast('Erro ao salvar no banco de dados.', 'error');
      } finally {
          setLoading(false);
      }
  };

  const getLinkPublico = () => `${window.location.origin}/view/os/${osForm.id_publico || osForm.id}`;
  const getEquipamentoNome = () => osForm.equipamento?.nome || osForm.equipamento?.tecnologia?.nome || osForm.equipamento_nome || 'Equipamento';

  const getMensagemBase = () => {
     const link = getLinkPublico();
     const equipamento = getEquipamentoNome();
     return `Olá ${osForm.solicitante_nome || 'Cliente'},\n\nA Ordem de Serviço #${osForm.id} referente ao equipamento ${equipamento} (TAG: ${osForm.equipamento?.tag || 'N/A'}) foi concluída com sucesso.\n\nPara acessar o relatório técnico e laudos atrelados, clique no link seguro abaixo:\n\n🔗 ${link}\n\nAtenciosamente,\nEquipe Técnica`;
  };

  const handleShareWhatsApp = () => {
      const texto = getMensagemBase();
      const telefoneBruto = osForm.solicitante_telefone || osForm.cliente?.telefone || '';
      const telefone = telefoneBruto.replace(/\D/g, ''); 
      const url = telefone ? `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
      window.open(url, '_blank');
  };

  // 🚀 NOVO: ABRE DIRETO NO GMAIL WEB
  const handleShareGmail = () => {
     const email = osForm.solicitante_email || osForm.cliente?.email_contato || osForm.cliente?.email || '';
     const assunto = `Ordem de Serviço #${osForm.id} Concluída - Relatório Técnico`;
     const corpo = getMensagemBase();
     
     const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
     window.open(gmailUrl, '_blank');
  };

  // 🚀 NOVO: COPIA TUDO PRO CTRL+V
  const handleCopyText = () => {
      navigator.clipboard.writeText(getMensagemBase());
      if (showToast) showToast('Texto copiado! Só colar no e-mail ou onde desejar.', 'success');
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-8">
      
      <div className="text-center mb-8">
         <h2 className="text-3xl font-black text-theme-main">Relatório Técnico Final</h2>
         <p className="text-theme-muted mt-2 font-medium">Documente a intervenção realizada antes de gerar o laudo e selar o certificado.</p>
      </div>

      <div className="space-y-6">
         <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <label className="text-xs font-black uppercase text-blue-600 flex items-center gap-2 mb-3">
               <Search size={16}/> Diagnóstico Técnico (O que falhou?) *
            </label>
            <textarea 
               disabled={isReadOnly}
               className={`input-theme w-full p-4 rounded-xl font-medium text-sm h-28 resize-none focus:ring-2 focus:ring-blue-500/20 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
               placeholder="Descreva tecnicamente a falha encontrada."
               value={osForm.falha_constatada || ''}
               onChange={e => setOsForm({...osForm, falha_constatada: e.target.value})}
            />
         </div>

         <div className="grid md:grid-cols-2 gap-6">
             <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <label className="text-xs font-black uppercase text-amber-600 flex items-center gap-2 mb-3">
                   <Activity size={16}/> Causa Raiz (Por que falhou?)
                </label>
                <textarea 
                   disabled={isReadOnly}
                   className={`input-theme w-full p-4 rounded-xl font-medium text-sm h-36 resize-none focus:ring-2 focus:ring-amber-500/20 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                   placeholder="Identifique a origem do problema."
                   value={osForm.causa_raiz || ''}
                   onChange={e => setOsForm({...osForm, causa_raiz: e.target.value})}
                />
             </div>

             <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <label className="text-xs font-black uppercase text-emerald-600 flex items-center gap-2 mb-3">
                   <ShieldCheck size={16}/> Solução Aplicada (Intervenção) *
                </label>
                <textarea 
                   disabled={isReadOnly}
                   className={`input-theme w-full p-4 rounded-xl font-medium text-sm h-36 resize-none focus:ring-2 focus:ring-emerald-500/20 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                   placeholder="Descreva detalhadamente o serviço realizado."
                   value={osForm.solucao_aplicada || ''}
                   onChange={e => setOsForm({...osForm, solucao_aplicada: e.target.value})}
                />
             </div>
         </div>
      </div>

      {isReadOnly ? (
         <div className="mt-8 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50 p-8 rounded-[32px] text-center shadow-sm animate-fadeIn">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4"/>
            <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Atendimento Encerrado</h3>
            <p className="text-emerald-700 dark:text-emerald-500 font-medium mt-2 mb-8">Esta Ordem de Serviço foi concluída. Compartilhe o laudo final com o cliente:</p>
            
            <div className="flex flex-wrap justify-center gap-3">
               <button onClick={handleShareWhatsApp} className="px-5 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <MessageCircle size={18}/> WHATSAPP
               </button>
               
               {/* 🚀 BOTÃO NOVO DO GMAIL */}
               <button onClick={handleShareGmail} className="px-5 py-3 bg-[#EA4335] hover:bg-[#d6382b] text-white rounded-xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <Mail size={18}/> GMAIL (WEB)
               </button>

               {/* 🚀 BOTÃO PLANO B (COPIAR) */}
               <button onClick={handleCopyText} className="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <Copy size={18}/> COPIAR TEXTO
               </button>
               
               <button onClick={onPrint} className="px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <Printer size={18}/> IMPRIMIR FÍSICO
               </button>
            </div>
         </div>
      ) : (
         <>
            {/* O Resto das validações para encerrar a OS continua igualzinho... */}
            <div className="flex flex-col items-center justify-center pt-4 mt-8">
               {podeFinalizar ? (
                  <button 
                     onClick={handleFinalizarCustom} 
                     disabled={loading}
                     className="bg-primary-theme text-white text-lg font-black uppercase tracking-widest py-6 px-12 rounded-[24px] shadow-2xl shadow-primary-theme/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                     {loading ? <Loader2 size={24} className="animate-spin"/> : <CheckCircle size={24}/>} 
                     ENCERRAR E SELAR ORDEM DE SERVIÇO
                  </button>
               ) : (
                  <div className="text-center p-6 bg-theme-card rounded-3xl border border-rose-200 w-full max-w-md flex flex-col items-center">
                     <Key size={32} className="text-rose-500 mb-3 opacity-80"/>
                     <p className="font-black text-rose-600 uppercase tracking-widest text-sm">Encerramento Bloqueado</p>
                     <p className="text-xs text-theme-muted font-medium mt-2">Você deve preencher o <strong>Diagnóstico</strong> e a <strong>Solução</strong> para liberar o encerramento.</p>
                  </div>
               )}
            </div>
         </>
      )}
    </div>
  );
}