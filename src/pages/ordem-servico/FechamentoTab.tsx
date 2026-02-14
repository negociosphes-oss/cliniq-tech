import { CheckCircle, FileText, PenTool, ShieldCheck, Activity, Key, Search, Clock, Mail, Printer } from 'lucide-react';

interface FechamentoTabProps {
  osForm: any;
  setOsForm: (val: any) => void;
  apontamentos: any[];
  onFinalize: () => void;
  status: string;
  onPrint: () => void; // <-- Nova propriedade para disparar o PDF
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function FechamentoTab({ osForm, setOsForm, apontamentos, onFinalize, status, onPrint, showToast }: FechamentoTabProps) {
  const isReadOnly = status === 'Concluída';

  const temApontamento = apontamentos.length > 0;
  const temDiagnostico = !!osForm.falha_constatada && osForm.falha_constatada.trim().length > 5;
  const temSolucao = !!osForm.solucao_aplicada && osForm.solucao_aplicada.trim().length > 5;
  const relatorioOk = temDiagnostico && temSolucao;
  
  const podeFinalizar = temApontamento && relatorioOk;

  // FUNÇÃO DE E-MAIL OPCIONAL
  const handleSendEmail = () => {
     const email = osForm.solicitante_email || '';
     if (!email && showToast) {
         showToast('Atenção: E-mail do cliente não está preenchido na Visão Geral. Preencha no seu gerenciador de e-mail.', 'info');
     }
     const linkPrivado = `${window.location.origin}/view/os/${osForm.id}`;
     const assunto = encodeURIComponent(`Ordem de Serviço #${osForm.id} Concluída - Relatório Técnico`);
     const corpo = encodeURIComponent(`Olá ${osForm.solicitante_nome || 'Cliente'},\n\nInformamos que a sua Ordem de Serviço #${osForm.id} referente ao equipamento TAG: ${osForm.equipamento?.tag || ''} foi concluída com sucesso.\n\nPara visualizar o relatório técnico digital completo e baixar o seu certificado, acesse o link seguro abaixo:\n\n🔗 Acessar Relatório: ${linkPrivado}\n\nAtenciosamente,\nEquipe Técnica Atlasum`);
     
     // Abre o Outlook/Gmail do usuário
     window.open(`mailto:${email}?subject=${assunto}&body=${corpo}`);
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto space-y-8">
      
      <div className="text-center mb-8">
         <h2 className="text-3xl font-black text-theme-main">Relatório Técnico Final</h2>
         <p className="text-theme-muted mt-2 font-medium">Documente a intervenção realizada antes de gerar o laudo e selar o certificado.</p>
      </div>

      <div className="space-y-6">
         {/* DIAGNÓSTICO */}
         <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <label className="text-xs font-black uppercase text-blue-600 flex items-center gap-2 mb-3">
               <Search size={16}/> Diagnóstico Técnico (O que falhou?) *
            </label>
            <textarea 
               disabled={isReadOnly}
               className={`input-theme w-full p-4 rounded-xl font-medium text-sm h-28 resize-none focus:ring-2 focus:ring-blue-500/20 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
               placeholder="Descreva tecnicamente a falha encontrada. Ex: Falha no bloco de válvulas confirmada nos testes de vazamento."
               value={osForm.falha_constatada || ''}
               onChange={e => setOsForm({...osForm, falha_constatada: e.target.value})}
            />
         </div>

         <div className="grid md:grid-cols-2 gap-6">
             {/* CAUSA RAIZ */}
             <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <label className="text-xs font-black uppercase text-amber-600 flex items-center gap-2 mb-3">
                   <Activity size={16}/> Causa Raiz (Por que falhou?)
                </label>
                <textarea 
                   disabled={isReadOnly}
                   className={`input-theme w-full p-4 rounded-xl font-medium text-sm h-36 resize-none focus:ring-2 focus:ring-amber-500/20 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                   placeholder="Identifique a origem do problema. Ex: Desgaste natural, oscilação de rede, mau uso operacional..."
                   value={osForm.causa_raiz || ''}
                   onChange={e => setOsForm({...osForm, causa_raiz: e.target.value})}
                />
             </div>

             {/* SOLUÇÃO */}
             <div className="bg-theme-card border border-theme p-6 rounded-3xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <label className="text-xs font-black uppercase text-emerald-600 flex items-center gap-2 mb-3">
                   <ShieldCheck size={16}/> Solução Aplicada (Intervenção) *
                </label>
                <textarea 
                   disabled={isReadOnly}
                   className={`input-theme w-full p-4 rounded-xl font-medium text-sm h-36 resize-none focus:ring-2 focus:ring-emerald-500/20 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                   placeholder="Descreva detalhadamente o serviço realizado. O que foi trocado? O que foi ajustado?"
                   value={osForm.solucao_aplicada || ''}
                   onChange={e => setOsForm({...osForm, solucao_aplicada: e.target.value})}
                />
             </div>
         </div>
      </div>

      {/* TELA DE SUCESSO (MOSTRADA QUANDO A OS É ENCERRADA) */}
      {isReadOnly ? (
         <div className="mt-8 bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/50 p-8 rounded-[32px] text-center shadow-sm animate-fadeIn">
            <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4"/>
            <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Atendimento Encerrado</h3>
            <p className="text-emerald-700 dark:text-emerald-500 font-medium mt-2 mb-8">Esta Ordem de Serviço foi concluída e selada com sucesso. Escolha uma ação abaixo:</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button onClick={handleSendEmail} className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95">
                  <Mail size={20}/> ENVIAR POR E-MAIL
               </button>
               <button onClick={onPrint} className="px-8 py-4 bg-slate-800 hover:bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white rounded-xl font-black shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95">
                  <Printer size={20}/> BAIXAR PDF / IMPRIMIR
               </button>
            </div>
         </div>
      ) : (
         <>
            {/* PAINEL DE VALIDAÇÃO (MOSTRADO ANTES DE ENCERRAR) */}
            <div className="bg-theme-page/50 border border-theme p-8 rounded-[32px] mt-8 shadow-inner">
              <h3 className="text-xs font-black uppercase text-theme-muted tracking-widest mb-6">Auditoria Interna de Qualidade</h3>
              <div className="grid md:grid-cols-3 gap-4">
                 
                 <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${temApontamento ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20' : 'bg-theme-card border-theme text-theme-muted'}`}>
                    <Clock size={20} className={temApontamento ? 'text-emerald-500' : 'opacity-40'}/>
                    <div>
                       <p className="text-xs font-black uppercase mb-1">Mão de Obra</p>
                       <p className="text-[10px] leading-tight font-medium">{temApontamento ? 'Horas e insumos registrados.' : 'Nenhum apontamento feito.'}</p>
                    </div>
                 </div>

                 <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${relatorioOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20' : 'bg-theme-card border-theme text-theme-muted'}`}>
                    <FileText size={20} className={relatorioOk ? 'text-emerald-500' : 'opacity-40'}/>
                    <div>
                       <p className="text-xs font-black uppercase mb-1">Relatório Técnico</p>
                       <p className="text-[10px] leading-tight font-medium">{relatorioOk ? 'Diagnóstico e solução preenchidos.' : 'Preencha os campos obrigatórios (*).'}</p>
                    </div>
                 </div>

                 <div className="p-4 rounded-2xl border bg-theme-card border-theme text-theme-muted flex items-start gap-3">
                    <PenTool size={20} className="opacity-40"/>
                    <div>
                       <p className="text-xs font-black uppercase mb-1">Assinaturas e Aceite</p>
                       <p className="text-[10px] leading-tight font-medium">Será validado automaticamente ao clicar em Encerrar.</p>
                    </div>
                 </div>

              </div>
            </div>

            {/* BOTÃO MESTRE */}
            <div className="flex flex-col items-center justify-center pt-4">
               {podeFinalizar ? (
                  <button 
                     onClick={onFinalize} 
                     className="bg-primary-theme text-white text-lg font-black uppercase tracking-widest py-6 px-12 rounded-[24px] shadow-2xl shadow-primary-theme/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3"
                  >
                     <CheckCircle size={24}/> ENCERRAR E SELAR ORDEM DE SERVIÇO
                  </button>
               ) : (
                  <div className="text-center p-6 bg-theme-card rounded-3xl border border-rose-200 dark:border-rose-900/30 w-full max-w-md flex flex-col items-center shadow-sm">
                     <Key size={32} className="text-rose-500 mb-3 opacity-80"/>
                     <p className="font-black text-rose-600 uppercase tracking-widest text-sm">Encerramento Bloqueado</p>
                     <p className="text-xs text-theme-muted font-medium mt-2">Você deve preencher o <strong>Diagnóstico</strong>, a <strong>Solução</strong> e registrar a <strong>Mão de Obra</strong> para liberar o encerramento.</p>
                  </div>
               )}
            </div>
         </>
      )}
    </div>
  );
}