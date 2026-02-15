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

  // 1. CORREÇÃO DAS IMAGENS: Monta o link usando a pasta exata 'os-imagens'
  const getImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    
    // NOME DA PASTA CORRIGIDO AQUI!
    const NOME_DO_BUCKET = 'os-imagens'; 
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/${NOME_DO_BUCKET}/${url}`;
  };

  useEffect(() => {
    fetchPublicOS();
  }, [osUuid]);

  const fetchPublicOS = async () => {
    if (!osUuid) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('ordens_servico')
      .select(`
        *,
        equipamentos (*, tecnologias!fk_tecnologia_oficial (*), clientes (*)),
        apontamentos (*)
      `)
      .eq('id_publico', osUuid)
      .single();

    if (error) console.error("ERRO DO SUPABASE:", error);
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

  // Lê o Array de Fotos com segurança
  let fotos: string[] = [];
  try {
    if (typeof os.anexos === 'string') {
        if (os.anexos.startsWith('[')) fotos = JSON.parse(os.anexos);
        else fotos = [os.anexos];
    } else if (Array.isArray(os.anexos)) {
        fotos = os.anexos;
    }
  } catch (e) {
     console.log("Sem fotos");
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black font-sans text-slate-900 dark:text-white">
      
      {/* ========================================================= */}
      {/* 1. VISÃO DA TELA (APPLE) - FICA OCULTA NA HORA DE IMPRIMIR */}
      {/* ========================================================= */}
      <div className="print:hidden pb-20">
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

        <main className="max-w-3xl mx-auto p-6 space-y-6">
          <header className="text-center py-8">
            <div className="inline-flex p-4 bg-emerald-500/10 text-emerald-500 rounded-[2rem] mb-4">
              <CheckCircle2 size={48} strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Relatório Técnico Concluído</h1>
            <p className="text-slate-500 font-bold mt-1">Ordem de Serviço #{os.id}</p>
          </header>

          <section className="bg-white/80 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-[2.5rem] p-8 shadow-2xl shadow-black/5 space-y-8">
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 text-blue-600 rounded-2xl"><Wrench size={24}/></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Equipamento</p>
                <h2 className="text-xl font-black">{os.equipamentos?.tecnologias?.nome || 'Não especificado'}</h2>
                <p className="text-sm font-bold text-slate-500">TAG: {os.equipamentos?.tag || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-black/5 dark:border-white/5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Data de Emissão</p>
                <div className="flex items-center gap-2 font-bold text-sm"><Calendar size={14} className="text-blue-600"/>{new Date(os.created_at).toLocaleDateString()}</div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Técnico Responsável</p>
                <div className="flex items-center gap-2 font-bold text-sm"><ShieldCheck size={14} className="text-emerald-500"/>{os.tecnico_nome || os.tecnico || 'Equipe Atlasum'}</div>
              </div>
            </div>

            <div className="pt-8 border-t border-black/5 dark:border-white/5 space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText size={18}/> Descritivo da Intervenção</h3>
                <div className="grid md:grid-cols-2 gap-4">
                   <div className="bg-slate-100 dark:bg-slate-800/50 p-5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Queixa / Relato</p>
                      <p className="text-sm font-bold">{os.descricao_problema || os.descricao || 'Não informado'}</p>
                   </div>
                   <div className="bg-rose-500/10 p-5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-2">Falha Constatada</p>
                      <p className="text-sm font-bold text-rose-900 dark:text-rose-200">{os.falha_constatada || 'Não informada'}</p>
                   </div>
                   <div className="bg-amber-500/10 p-5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Causa Raiz</p>
                      <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{os.causa_raiz || 'Não identificada'}</p>
                   </div>
                   <div className="bg-emerald-500/10 p-5 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Solução Aplicada</p>
                      <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">{os.solucao_aplicada || 'Conforme protocolo.'}</p>
                   </div>
                </div>
            </div>

            {/* Imagens Corrigidas na Tela */}
            {fotos.length > 0 && (
               <div className="pt-8 border-t border-black/5 dark:border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2"><Camera size={18}/> Evidências Fotográficas</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {fotos.map((url: string, i: number) => (
                        <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm">
                           <img src={getImageUrl(url)} alt={`Evidência ${i+1}`} className="w-full h-full object-cover"/>
                        </div>
                     ))}
                  </div>
               </div>
            )}
          </section>
        </main>
      </div>

      {/* ========================================================= */}
      {/* 2. VISÃO DO PDF OFICIAL (A4) - OCULTA NA TELA DO SISTEMA   */}
      {/* ========================================================= */}
      <div className="hidden print:block bg-white text-black font-sans p-8 w-full max-w-[210mm] mx-auto text-[11px]">
          
          {/* CABEÇALHO */}
          <div className="border-b-2 border-black pb-4 mb-4 flex justify-between items-end">
             <div><h1 className="text-3xl font-black tracking-widest uppercase">ATLASUM</h1></div>
             <div className="text-right">
                <h2 className="text-base font-bold uppercase">Relatório Técnico de Engenharia Clínica</h2>
                <p className="font-semibold mt-1">OS #{os.id} | Emissão: {new Date(os.created_at).toLocaleDateString()}</p>
             </div>
          </div>

          {/* DADOS UNIDADE */}
          <div className="mb-4">
             <div className="bg-slate-200 font-bold p-1 uppercase text-[10px] border border-black border-b-0">Unidade / Solicitante</div>
             <table className="w-full border-collapse border border-black text-[11px]">
                <tbody>
                   <tr>
                      <td className="border border-black p-1 font-bold w-[15%]">UNIDADE:</td>
                      <td className="border border-black p-1 w-[35%]">{os.equipamentos?.clientes?.nome || os.clientes?.nome || 'N/A'}</td>
                      <td className="border border-black p-1 font-bold w-[15%]">SETOR:</td>
                      <td className="border border-black p-1 w-[35%]">{os.equipamentos?.setor || 'N/A'}</td>
                   </tr>
                   <tr>
                      <td className="border border-black p-1 font-bold">SOLICITANTE:</td>
                      <td className="border border-black p-1">{os.solicitante_nome || 'N/A'}</td>
                      <td className="border border-black p-1 font-bold">CONTATO:</td>
                      <td className="border border-black p-1">{os.solicitante_tel || 'N/A'}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* EQUIPAMENTO */}
          <div className="mb-4">
             <table className="w-full border-collapse border border-black text-[11px]">
                <tbody>
                   <tr>
                      <td className="border border-black p-1 font-bold w-[20%]">EQUIPAMENTO:</td>
                      <td className="border border-black p-1">{os.equipamentos?.tecnologias?.nome || 'N/A'}</td>
                   </tr>
                   <tr>
                      <td className="border border-black p-1 font-bold">MODELO/SÉRIE:</td>
                      <td className="border border-black p-1">{os.equipamentos?.modelo || ''} {os.equipamentos?.numero_serie ? `| SN: ${os.equipamentos.numero_serie}` : ''}</td>
                   </tr>
                   <tr>
                      <td className="border border-black p-1 font-bold">TAG:</td>
                      <td className="border border-black p-1">{os.equipamentos?.tag || 'N/A'}</td>
                   </tr>
                   <tr>
                      <td className="border border-black p-1 font-bold">STATUS:</td>
                      <td className="border border-black p-1 uppercase font-bold">{os.status || 'CONCLUÍDA'}</td>
                   </tr>
                </tbody>
             </table>
          </div>

          {/* DESCRITIVO */}
          <div className="mb-4">
             <div className="bg-slate-200 font-bold p-1 uppercase text-[10px] border border-black border-b-0">1. Descritivo da Intervenção</div>
             <div className="border border-black p-2 space-y-3">
                <div><span className="font-bold text-[10px] uppercase">Queixa Principal / Relato do Problema:</span><br/>{os.descricao_problema || os.descricao || 'N/A'}</div>
                <div><span className="font-bold text-[10px] uppercase">Falha Constatada:</span><br/>{os.falha_constatada || 'N/A'}</div>
                <div><span className="font-bold text-[10px] uppercase">Causa Provável / Raiz:</span><br/>{os.causa_raiz || 'N/A'}</div>
                <div><span className="font-bold text-[10px] uppercase">Solução Técnica Aplicada:</span><br/>{os.solucao_aplicada || 'N/A'}</div>
             </div>
          </div>

          {/* MÃO DE OBRA */}
          {os.apontamentos && os.apontamentos.length > 0 && (
          <div className="mb-4">
             <div className="bg-slate-200 font-bold p-1 uppercase text-[10px] border border-black border-b-0">2. Registro de Mão de Obra e Deslocamento</div>
             <table className="w-full border-collapse border border-black text-[11px] text-center">
                <thead className="bg-slate-100 text-[10px]">
                   <tr>
                      <th className="border border-black p-1">DATA/HORA</th>
                      <th className="border border-black p-1">TÉCNICO</th>
                      <th className="border border-black p-1">ATIVIDADE</th>
                      <th className="border border-black p-1">DURAÇÃO</th>
                   </tr>
                </thead>
                <tbody>
                   {os.apontamentos.map((ap: any, i: number) => (
                      <tr key={i}>
                         <td className="border border-black p-1">{new Date(ap.created_at || ap.data).toLocaleString()}</td>
                         <td className="border border-black p-1">{ap.tecnico_nome || ap.tecnico}</td>
                         <td className="border border-black p-1">{ap.atividade}</td>
                         <td className="border border-black p-1">{ap.duracao || ap.horas}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
          )}

          {/* FOTOS NO PDF */}
          {fotos.length > 0 && (
            <div className="mb-4" style={{ pageBreakInside: 'avoid' }}>
               <div className="bg-slate-200 font-bold p-1 uppercase text-[10px] border border-black border-b-0">3. Evidências Fotográficas</div>
               <div className="border border-black p-2 grid grid-cols-3 gap-2">
                  {fotos.map((url: string, i: number) => (
                      <img key={i} src={getImageUrl(url)} className="w-full h-32 object-contain border border-slate-300" alt="Evidência" />
                  ))}
               </div>
            </div>
          )}

          {/* ASSINATURAS */}
          <div className="mt-16 flex justify-between gap-8 px-8" style={{ pageBreakInside: 'avoid' }}>
              <div className="flex-1 border-t border-black text-center pt-2">
                  <p className="font-bold uppercase text-[10px]">Técnico Responsável</p>
                  <p className="text-[10px]">{os.tecnico_nome || os.tecnico || 'Equipe Atlasum'}</p>
              </div>
              <div className="flex-1 border-t border-black text-center pt-2">
                  <p className="font-bold uppercase text-[10px]">Aceite do Cliente / Responsável</p>
                  <p className="text-[10px]">{os.solicitante_nome || 'Assinatura Eletrônica'}</p>
              </div>
          </div>

          <div className="mt-8 text-center text-[9px] text-gray-500">
             Documento Original Atlasum - Gerado digitalmente em {new Date().toLocaleString()}
          </div>
      </div>

    </div>
  );
}