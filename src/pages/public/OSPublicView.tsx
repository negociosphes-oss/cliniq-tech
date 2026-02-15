import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom'; // 1. ADICIONADO: Importador de URL do React
import { supabase } from '../../supabaseClient';
import { 
  FileText, Download, CheckCircle2, MapPin, 
  Calendar, Wrench, ShieldCheck, Printer 
} from 'lucide-react';

export function OSPublicView() {
  const [os, setOs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 2. CORRIGIDO: Pega o ID da URL do jeito certo
 const osUuid = window.location.pathname.split('/').filter(Boolean).pop();

  useEffect(() => {
    fetchPublicOS();
  }, [osUuid]);

  const fetchPublicOS = async () => {
    if (!osUuid) {
      setLoading(false);
      return;
    }
    
    console.log("Procurando o ID:", osUuid); // Vai mostrar o ID na sua tela preta

    // Busca a OS pelo UUID público
    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        equipamentos (*, tecnologias (*), clientes (*))
      `)
      .eq('id_publico', osUuid)
      .single();

    if (error) {
      console.error("ERRO DO SUPABASE:", error); // Vai "gritar" em vermelho o que deu errado!
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

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans text-slate-900 dark:text-white pb-20">
      
      {/* NAV SUPERIOR - ESTILO APPLE */}
      <nav className="sticky top-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-black/5 p-4 flex justify-between items-center">
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

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        
        {/* HEADER DO STATUS */}
        <header className="text-center py-8 animate-fadeIn">
          <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-500 rounded-[2rem] mb-4">
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Atendimento Concluído</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Ordem de Serviço #{os.id}</p>
        </header>

        {/* CARD PRINCIPAL - GLASSMORPHISM */}
        <section className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 animate-fadeIn">
          <div className="space-y-8">
            
            {/* Equipamento */}
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Data</p>
                <div className="flex items-center gap-2 font-bold text-sm">
                   <Calendar size={14} className="text-blue-600"/>
                   {new Date(os.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Técnico Responsável</p>
                <div className="flex items-center gap-2 font-bold text-sm">
                   <ShieldCheck size={14} className="text-emerald-500"/>
                   {os.tecnico_nome || 'Equipe Atlasum'}
                </div>
              </div>
            </div>

            {/* Relato Técnico */}
            <div className="pt-6 border-t border-black/5 dark:border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Resumo da Execução</p>
                <div className="bg-[#F2F2F7] dark:bg-black/20 p-5 rounded-2xl text-sm font-medium leading-relaxed italic text-slate-700 dark:text-slate-300">
                  "{os.solucao_aplicada || 'Manutenção realizada conforme protocolo técnico padrão.'}"
                </div>
            </div>
          </div>
        </section>

        {/* SELO DE AUTENTICIDADE */}
        <footer className="text-center pt-8 opacity-40">
           <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.3em]">
             <ShieldCheck size={12} /> Documento Original Atlasum
           </div>
           <p className="text-[9px] mt-2">Gerado em {new Date().toLocaleString()}</p>
        </footer>

      </main>
    </div>
  );
}