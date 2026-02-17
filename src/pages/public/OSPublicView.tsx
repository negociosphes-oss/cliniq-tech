import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Download, CheckCircle2, Calendar, Wrench, ShieldCheck, 
  Activity, FileText, Clock, Camera, MapPin, User, Building2
} from 'lucide-react';

export function OSPublicView() {
  const [os, setOs] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const osUuid = window.location.pathname.split('/').filter(Boolean).pop();

  const getImageUrl = (path: any, folder: 'evidências' | 'configuração' = 'evidências') => {
    if (!path || typeof path !== 'string' || path.trim() === '') return null;
    if (path.startsWith('http')) return path;
    const BUCKET = 'os-imagens';
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/${BUCKET}/${folder}/${path}`;
  };

  useEffect(() => {
    fetchData();
  }, [osUuid]);

  const fetchData = async () => {
    if (!osUuid) return setLoading(false);

    try {
      // MAGIA AQUI: Apontando para a tabela correta 'configuracoes_empresa'
      const { data: config } = await supabase
        .from('configuracoes_empresa')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (config) setSystemConfig(config);

      const { data: osData } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          equipamentos:equipamento_id (
            *,
            clientes:cliente_id (*)
          )
        `)
        .eq('id_publico', osUuid)
        .maybeSingle();

      if (osData) setOs(osData);

    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Autenticando Documento</span>
      </div>
    </div>
  );

  if (!os) return (
    <div className="h-screen flex items-center justify-center font-black text-slate-400 uppercase tracking-widest p-8 text-center">
       Ordem de Serviço não encontrada ou link expirado.
    </div>
  );

  // LENDO A COLUNA CORRETA: nome_fantasia
  const empresaNome = systemConfig?.nome_fantasia || 'ATLAS SYSTEM MEDICAL';
  const empresaCnpj = systemConfig?.cnpj || '07.385.954/0001-98';
  const clienteNome = os.equipamentos?.clientes?.nome_fantasia || os.equipamentos?.clientes?.nome || os.cliente_nome || 'Unidade Hospitalar';

  let fotos: string[] = [];
  try {
    if (Array.isArray(os.anexos)) fotos = os.anexos;
    else if (typeof os.anexos === 'string' && os.anexos.startsWith('[')) fotos = JSON.parse(os.anexos);
    else if (os.anexos) fotos = [os.anexos];
  } catch (e) { console.log("Erro processamento fotos"); }

  const fotosValidas = fotos.filter(f => f && typeof f === 'string' && f.trim() !== '');

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 p-4 flex justify-between items-center px-10 print:hidden">
        <div className="flex items-center gap-3">
           {systemConfig?.logotipo_url && getImageUrl(systemConfig.logotipo_url, 'configuração') ? (
             <img src={getImageUrl(systemConfig.logotipo_url, 'configuração')!} className="h-7 w-auto" alt="Logo" />
           ) : (
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
           )}
           <span className="font-black text-[10px] uppercase tracking-tighter italic">{empresaNome}</span>
        </div>
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded-full text-[10px] font-black shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2">
          <Download size={14} /> SALVAR PDF
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-6 py-12 space-y-6 print:p-0">
        <div className="print:hidden space-y-6">
           <header className="text-center pb-6">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-6">
                 <CheckCircle2 size={40} />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Atendimento Finalizado</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase mt-1">OS #{os.id} | {new Date(os.created_at).toLocaleDateString()}</p>
           </header>

           <section className="bg-white border border-white/20 rounded-[3rem] p-10 shadow-2xl space-y-10">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Wrench size={28}/></div>
                <div>
                   <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Equipamento</p>
                   <h2 className="text-xl font-black">{os.equipamento_nome || 'Equipamento'}</h2>
                   <p className="text-xs font-bold text-blue-600 uppercase">TAG: {os.equipamentos?.tag || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                 <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><Building2 size={12}/> Unidade</p>
                    <p className="font-bold text-sm uppercase">{clienteNome}</p>
                 </div>
                 <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-2 flex items-center gap-1"><ShieldCheck size={12}/> Executor</p>
                    <p className="font-bold text-sm uppercase">{os.tecnico_nome || 'Engenharia Clínica'}</p>
                 </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-1"><FileText size={14}/> Relato Técnico</p>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-slate-700 italic font-medium">
                     "{os.solucao_aplicada || 'Manutenção realizada.'}"
                  </div>
              </div>

              {fotosValidas.length > 0 && (
                 <div className="pt-8 border-t border-slate-100">
                    <p className="text-[9px] font-black uppercase text-slate-400 mb-5 flex items-center gap-1"><Camera size={14}/> Fotos do Atendimento</p>
                    <div className="grid grid-cols-2 gap-4">
                       {fotosValidas.map((url, i) => {
                          const imgSrc = getImageUrl(url);
                          return imgSrc ? (
                            <div key={i} className="aspect-video rounded-3xl overflow-hidden shadow-md bg-slate-100">
                               <img src={imgSrc} className="w-full h-full object-cover" alt="Evidência" />
                            </div>
                          ) : null;
                       })}
                    </div>
                 </div>
              )}
           </section>
        </div>

        {/* LAYOUT DE IMPRESSÃO A4 */}
        <div className="hidden print:block bg-white text-black p-[15mm] w-full max-w-[210mm] mx-auto text-[10px] leading-tight border border-black/10">
            <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  {systemConfig?.logotipo_url && getImageUrl(systemConfig.logotipo_url, 'configuração') && (
                     <img src={getImageUrl(systemConfig.logotipo_url, 'configuração')!} className="h-14 w-auto" alt="" />
                  )}
                  <div>
                     <h1 className="text-2xl font-black uppercase tracking-tighter">{empresaNome}</h1>
                     <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">CNPJ: {empresaCnpj}</p>
                  </div>
               </div>
               <div className="text-right">
                  <span className="bg-black text-white px-3 py-1 font-black uppercase text-[9px] mb-2 inline-block">Relatório Técnico</span>
                  <p className="font-black text-base uppercase">OS #{os.id}</p>
                  <p className="font-bold text-slate-600 text-[9px]">{new Date().toLocaleDateString('pt-BR')}</p>
               </div>
            </div>

            <div className="space-y-4">
               <div className="border border-black">
                  <div className="bg-slate-200 border-b border-black p-1 font-black uppercase text-[8px]">1. Identificação da Unidade e Atendimento</div>
                  <table className="w-full">
                     <tbody>
                        <tr>
                           <td className="border-r border-b border-black p-2 font-bold bg-slate-50 w-[20%] uppercase">Unidade:</td>
                           <td className="border-r border-b border-black p-2 w-[30%] uppercase font-semibold">{clienteNome}</td>
                           <td className="border-r border-b border-black p-2 font-bold bg-slate-50 w-[20%] uppercase">Setor:</td>
                           <td className="border-b border-black p-2 w-[30%] uppercase font-semibold">{os.equipamentos?.setor || 'UTI'}</td>
                        </tr>
                        <tr>
                           <td className="border-r border-black p-2 font-bold bg-slate-50 uppercase">Equipamento:</td>
                           <td className="border-r border-black p-2 uppercase font-black">{os.equipamento_nome || 'N/A'}</td>
                           <td className="border-r border-black p-2 font-bold bg-slate-50 uppercase">Tag / Modelo:</td>
                           <td className="p-2 font-black uppercase">{os.equipamentos?.tag} | {os.equipamentos?.modelo}</td>
                        </tr>
                     </tbody>
                  </table>
               </div>

               <div className="border border-black min-h-[120px]">
                  <div className="bg-slate-200 border-b border-black p-1 font-black uppercase text-[8px]">2. Descritivo Técnico e Solução</div>
                  <div className="p-3 text-[11px] leading-relaxed font-medium italic">
                    {os.solucao_aplicada || 'N/A'}
                  </div>
               </div>

               {fotosValidas.length > 0 && (
                  <div className="border border-black" style={{ pageBreakInside: 'avoid' }}>
                     <div className="bg-slate-200 border-b border-black p-1 font-black uppercase text-[8px]">3. Evidências Fotográficas</div>
                     <div className="p-2 grid grid-cols-2 gap-4">
                        {fotosValidas.map((url, i) => {
                           const imgSrc = getImageUrl(url);
                           return imgSrc ? (
                             <div key={i} className="border border-slate-200 p-1 flex items-center justify-center bg-slate-50">
                                <img src={imgSrc} className="w-full h-44 object-contain" alt="" />
                             </div>
                           ) : null;
                        })}
                     </div>
                  </div>
               )}
            </div>

            <div className="mt-20 flex justify-around gap-12" style={{ pageBreakInside: 'avoid' }}>
                <div className="flex-1 border-t-2 border-black text-center pt-3">
                    <p className="font-black text-[8px] uppercase tracking-tighter">Responsável Técnico</p>
                    <p className="font-bold text-[10px] uppercase mt-1">{os.tecnico_nome || 'Engenharia Clínica'}</p>
                </div>
                <div className="flex-1 border-t-2 border-black text-center pt-3">
                    <p className="font-black text-[8px] uppercase tracking-tighter">Aceite do Cliente</p>
                    <p className="font-bold text-[10px] uppercase mt-1">{os.solicitante_nome || 'Responsável'}</p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}