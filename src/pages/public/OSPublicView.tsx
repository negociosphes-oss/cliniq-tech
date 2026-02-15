import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Download, CheckCircle2, Calendar, Wrench, ShieldCheck, 
  Activity, FileText, Clock, Camera 
} from 'lucide-react';

export function OSPublicView() {
  const [os, setOs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lê o código gigante da URL
  const osUuid = window.location.pathname.split('/').filter(Boolean).pop();

  useEffect(() => {
    fetchPublicOS();
  }, [osUuid]);

  const fetchPublicOS = async () => {
    if (!osUuid) {
      setLoading(false);
      return;
    }

    // Puxando TODAS as tabelas e colunas necessárias (agora com apontamentos)
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        equipamentos (*, tecnologias!fk_tecnologia_oficial (*), clientes (*)),
        apontamentos (*)
      `)
      .eq('id_publico', osUuid)
      .single();

    if (error) {
      console.error("ERRO DO SUPABASE:", error);
    }

    if (data) setOs(data);
    setLoading(false);
  };

  if (loading) return (
    <div className="h-screen bg-[#F2F2F7] dark:bg-black flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl shadow-xl flex items-center justify-center text-white font-black text-2xl">A</div>
        <p className="text-blue-600 font-black tracking-widest text-[10px] uppercase">Atlasum Secure</p>
      </div>
    </div>
  );

  if (!os) return (
    <div className="h-screen flex items-center justify-center p-8 text-center bg-[#F2F2F7]">
       <div>
         <h2 className="text-2xl font-black text-slate-900">Documento não encontrado</h2>
         <p className="text-slate-500 mt-2">Este link pode ter expirado ou é inválido.</p>
       </div>
    </div>
  );

  // Tratamento inteligente para ler as fotos, independente de como o banco salvou
  let fotos = [];
  try {
    if (typeof os.anexos === 'string') {
        if (os.anexos.startsWith('[')) fotos = JSON.parse(os.anexos);
        else if (os.anexos.startsWith('http')) fotos = [os.anexos];
    } else if (Array.isArray(os.anexos)) {
        fotos = os.anexos;
    }
  } catch (e) {
     console.log("Sem fotos ou erro ao carregar fotos");
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans text-slate-900 dark:text-white pb-20">
      
      {/* NAV SUPERIOR - Oculto na hora de imprimir */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-black/5 p-4 flex justify-between items-center print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
          <span className="font-black tracking-tighter text-sm italic">ATLASUM <span className="text-blue-600">SECURE</span></span>
        </div>
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg shadow-blue-500/30 active:scale-90 transition-all flex items-center gap-2"
        >
          <Download size={14} /> SALVAR PDF
        </button>
      </nav>

      <main className="max-w-3xl mx-auto p-6 space-y-6">
        
        {/* HEADER */}
        <header className="text-center py-8 animate-fadeIn">
          <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-500 rounded-[2rem] mb-4">
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Relatório Técnico Concluído</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Ordem de Serviço #{os.id}</p>
        </header>

        {/* CARD PRINCIPAL COM TODOS OS DADOS */}
        <section className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 animate-fadeIn space-y-8">
          
          {/* Info Básica */}
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl"><Wrench size={24}/></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Equipamento</p>
              <h2 className="text-xl font-black">{os.equipamentos?.tecnologias?.nome || 'Equipamento não especificado'}</h2>
              <p className="text-sm font-bold text-slate-500">TAG: {os.equipamentos?.tag || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-black/5 dark:border-white/5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Data de Emissão</p>
              <div className="flex items-center gap-2 font-bold text-sm">
                 <Calendar size={14} className="text-blue-600"/>
                 {new Date(os.created_at).toLocaleDateString()}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Técnico Responsável</p>
              <div className="flex items-center gap-2 font-bold text-sm">
                 <ShieldCheck size={14} className="text-emerald-500"/>
                 {os.tecnico_nome || os.tecnico || 'Equipe Atlasum'}
              </div>
            </div>
          </div>

          {/* DETALHAMENTO TÉCNICO (O QUE FALTAVA!) */}
          <div className="pt-8 border-t border-black/5 dark:border-white/5 space-y-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText size={18}/> Descritivo da Intervenção</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                 {/* QUEIXA */}
                 <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Queixa / Relato do Problema</p>
                    <p className="text-sm font-bold">{os.descricao_problema || os.descricao || 'Não informado'}</p>
                 </div>

                 {/* FALHA */}
                 <div className="bg-rose-500/10 p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Falha Constatada</p>
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-200">{os.falha_constatada || 'Não informada'}</p>
                 </div>

                 {/* CAUSA RAIZ */}
                 <div className="bg-amber-500/10 p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2 flex items-center gap-1"><Activity size={12}/> Causa Raiz / Provável</p>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{os.causa_raiz || 'Não identificada'}</p>
                 </div>

                 {/* SOLUÇÃO */}
                 <div className="bg-emerald-500/10 p-5 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Solução Aplicada</p>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{os.solucao_aplicada || 'Manutenção realizada conforme protocolo.'}</p>
                 </div>
              </div>
          </div>

          {/* APONTAMENTOS / MÃO DE OBRA */}
          {os.apontamentos && os.apontamentos.length > 0 && (
            <div className="pt-8 border-t border-black/5 dark:border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Clock size={18}/> Mão de Obra e Deslocamento</h3>
                <div className="space-y-3">
                   {os.apontamentos.map((ap: any, i: number) => (
                      <div key={i} className="flex flex-wrap items-center justify-between bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                         <div>
                            <p className="font-black text-slate-700 dark:text-slate-300 text-sm">{ap.tecnico_nome || ap.tecnico || 'Técnico'}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">{ap.atividade || 'Atividade'}</p>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-blue-600 text-lg">{ap.duracao || ap.horas || 'N/A'}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase mt-1">Tempo Registrado</p>
                         </div>
                      </div>
                   ))}
                </div>
            </div>
          )}

          {/* FOTOS / EVIDÊNCIAS */}
          {fotos.length > 0 && (
             <div className="pt-8 border-t border-black/5 dark:border-white/5">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Camera size={18}/> Evidências Fotográficas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                   {fotos.map((url: string, i: number) => (
                      <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                         <img src={url} alt={`Evidência ${i+1}`} className="w-full h-full object-cover"/>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </section>

        {/* SELO DE AUTENTICIDADE */}
        <footer className="text-center pt-8 pb-12 opacity-40">
           <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
             <ShieldCheck size={12} /> Documento Original Atlasum
           </div>
           <p className="text-[9px] mt-2">Gerado digitalmente via Atlasum Secure System</p>
        </footer>

      </main>
    </div>
  );
}