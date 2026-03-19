import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Download, CheckCircle2, Wrench, ShieldCheck, 
  FileText, Camera, Building2, AlertTriangle
} from 'lucide-react';

export function OSPublicView() {
  const [os, setOs] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const osUuid = window.location.pathname.split('/').filter(Boolean).pop();

  const getImageUrl = (path: any, folder: 'evidências' | 'configuração' | 'logos' = 'evidências') => {
    if (!path || typeof path !== 'string' || path.trim() === '') return null;
    if (path.startsWith('http')) return path; 
    const BUCKET = folder === 'logos' || folder === 'configuração' ? 'app-assets' : 'os-imagens';
    return `https://dnimxqxgtvltgvrrabur.supabase.co/storage/v1/object/public/${BUCKET}/${folder}/${path}`;
  };

  useEffect(() => {
    fetchData();
  }, [osUuid]);

  const fetchData = async () => {
    if (!osUuid) return setLoading(false);

    try {
      // 🚀 PASSO 1: Busca a O.S. e o Equipamento base (Sem Joins complexos que causam erro 400)
      const { data: osData, error: osError } = await supabase
        .from('ordens_servico')
        .select('*, equipamentos:equipamento_id (*)')
        .eq('id_publico', osUuid)
        .maybeSingle();

      if (osError) {
          console.error("Erro do Supabase ao buscar O.S.:", osError);
          throw osError;
      }

      if (osData) {
        // 🚀 PASSO 2: Busca o Cliente e a Tecnologia separadamente (100% à prova de falhas)
        const clienteId = osData.cliente_id || osData.equipamentos?.cliente_id;
        const tecId = osData.equipamentos?.tecnologia_id;

        let clienteInfo = null;
        let tecInfo = null;

        if (clienteId) {
           const { data: cli } = await supabase.from('clientes').select('*').eq('id', clienteId).maybeSingle();
           clienteInfo = cli;
        }

        if (tecId) {
           const { data: tec } = await supabase.from('tecnologias').select('*').eq('id', tecId).maybeSingle();
           tecInfo = tec;
        }

        // Monta o objeto perfeito para a tela ler sem quebrar
        if (osData.equipamentos) {
           osData.equipamentos.clientes = clienteInfo;
           osData.equipamentos.tecnologias = tecInfo;
        } else {
           osData.equipamentos = { clientes: clienteInfo, tecnologias: tecInfo };
        }

        setOs(osData);

        // 🚀 PASSO 3: Busca a Empresa (Matriz/Inquilino)
        const tenantId = osData.tenant_id || 1;
        const { data: config } = await supabase
          .from('empresas_inquilinas')
          .select('*')
          .eq('id', tenantId)
          .maybeSingle();

        if (config) setSystemConfig(config);

        // Se veio para impressão automática
        if (window.location.search.includes('print=true')) {
            setTimeout(() => window.print(), 800);
        }
      }

    } catch (err) {
      console.error("Erro ao carregar dados da OS Pública:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Construindo Documento</span>
      </div>
    </div>
  );

  if (!os) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50 font-sans text-slate-400 p-8 text-center">
       <AlertTriangle size={64} className="mb-4 opacity-50" />
       <h2 className="text-xl font-black uppercase tracking-widest text-slate-600">Documento Indisponível</h2>
       <p className="mt-2 font-medium">A Ordem de Serviço não foi encontrada ou o link de acesso expirou.</p>
    </div>
  );

  const empresaNome = systemConfig?.nome_fantasia || systemConfig?.razao_social || 'ATLAS SYSTEM MEDICAL';
  const empresaCnpj = systemConfig?.cnpj || 'Não informado';
  const clienteNome = os.equipamentos?.clientes?.nome_fantasia || os.equipamentos?.clientes?.razao_social || os.cliente_nome || 'Unidade Hospitalar';
  const clienteDoc = os.equipamentos?.clientes?.cnpj_cpf || 'Não informado';
  
  // NOME DO EQUIPAMENTO COMPLETO (Com Marca e Modelo)
  const tec = os.equipamentos?.tecnologias;
  const nomeBase = tec?.nome || os.equipamentos?.nome || os.equipamento_nome || 'Equipamento Médico';
  const nomeEquipamento = tec?.fabricante && tec?.modelo ? `${nomeBase} (${tec.fabricante} - ${tec.modelo})` : nomeBase;

  const rawLogoUrl = systemConfig?.logo_url || systemConfig?.logotipo_url;
  const finalLogoUrl = rawLogoUrl ? `${getImageUrl(rawLogoUrl, 'logos')}?v=${new Date().getTime()}` : null;

  let fotos: string[] = [];
  try {
    if (Array.isArray(os.anexos)) fotos = os.anexos;
    else if (typeof os.anexos === 'string' && os.anexos.startsWith('[')) fotos = JSON.parse(os.anexos);
    else if (os.anexos) fotos = [os.anexos];
  } catch (e) { console.log("Erro processamento fotos"); }

  const fotosValidas = fotos.filter(f => f && typeof f === 'string' && f.trim() !== '');

  return (
    <div className="min-h-screen bg-[#F2F2F7] font-sans text-slate-900">
      
      {/* BARRA SUPERIOR - MODO WEB */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/5 p-4 flex justify-between items-center px-6 md:px-10 print:hidden shadow-sm">
        <div className="flex items-center gap-3">
           {finalLogoUrl ? (
             <img src={finalLogoUrl} className="h-8 w-auto object-contain" alt="Logo Empresa" />
           ) : (
             <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center text-white font-black text-xs">A</div>
           )}
           <span className="font-black text-[10px] uppercase tracking-tighter italic text-slate-600 hidden sm:block">{empresaNome}</span>
        </div>
        <button onClick={() => window.print()} className="bg-blue-700 text-white px-6 py-2.5 rounded-full text-xs font-black shadow-lg hover:bg-blue-800 transition-all flex items-center gap-2 active:scale-95">
          <Download size={16} /> <span className="hidden sm:inline">BAIXAR PDF</span>
        </button>
      </nav>

      {/* CONTEÚDO - MODO WEB */}
      <main className="max-w-3xl mx-auto p-4 md:p-6 py-8 md:py-12 space-y-6 print:p-0 print:m-0 print:max-w-none">
        
        <div className="print:hidden space-y-8 animate-fadeIn">
           <header className="text-center pb-6">
              <div className={`w-20 h-20 text-white rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl mb-6 ${os.status === 'Concluída' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                 {os.status === 'Concluída' ? <CheckCircle2 size={40} /> : <Wrench size={40} />}
              </div>
              <h1 className="text-3xl font-black tracking-tight">{os.status === 'Concluída' ? 'Atendimento Finalizado' : 'Em Atendimento'}</h1>
              <p className="text-slate-400 font-bold text-xs uppercase mt-2 tracking-widest">OS #{os.id} | {new Date(os.created_at).toLocaleDateString('pt-BR')}</p>
           </header>

           <section className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-10 shadow-xl space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-700 rounded-2xl flex items-center justify-center shrink-0"><Wrench size={28}/></div>
                <div>
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Equipamento</p>
                   <h2 className="text-xl font-black text-slate-800">{nomeEquipamento}</h2>
                   <p className="text-xs font-bold text-blue-700 mt-1">TAG: {os.equipamentos?.tag || 'N/A'} {os.equipamentos?.numero_serie ? `| S/N: ${os.equipamentos.numero_serie}` : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1"><Building2 size={14}/> Cliente / Unidade</p>
                    <p className="font-bold text-sm text-slate-800 uppercase">{clienteNome}</p>
                    <p className="text-xs text-slate-500 mt-1">Setor: {os.solicitante_setor || os.equipamentos?.setor || 'Não informado'}</p>
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1 flex items-center gap-1"><ShieldCheck size={14}/> Técnico Responsável</p>
                    <p className="font-bold text-sm text-slate-800 uppercase">{os.tecnico_nome || 'Engenharia Clínica'}</p>
                    <p className="text-xs text-slate-500 mt-1">Tipo: {os.tipo || 'Corretiva'}</p>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-1"><FileText size={14}/> Defeito Relatado</p>
                 <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-slate-700 font-medium text-sm">
                     "{os.defeito_relatado || os.descricao_problema || 'Manutenção programada.'}"
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                 <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest flex items-center gap-1"><CheckCircle2 size={14}/> Laudo / Solução Aplicada</p>
                 <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 text-slate-800 font-medium text-sm whitespace-pre-wrap">
                     {os.solucao_aplicada || os.laudo_tecnico || 'Atendimento em andamento. Laudo não emitido.'}
                 </div>
              </div>

              {fotosValidas.length > 0 && (
                 <div className="pt-6 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-4 flex items-center gap-1"><Camera size={14}/> Fotos / Evidências</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {fotosValidas.map((url, i) => {
                          const imgSrc = getImageUrl(url);
                          return imgSrc ? (
                            <a href={imgSrc} target="_blank" rel="noreferrer" key={i} className="aspect-square rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:opacity-80 transition-opacity">
                               <img src={imgSrc} className="w-full h-full object-cover" alt="Evidência" />
                            </a>
                          ) : null;
                       })}
                    </div>
                 </div>
              )}
           </section>
        </div>

        {/* ========================================================= */}
        {/* 🚀 LAYOUT DE IMPRESSÃO "PDF AZUL" PADRÃO ENTERPRISE */}
        {/* ========================================================= */}
        <div className="hidden print:block bg-white text-slate-900 w-full max-w-[210mm] mx-auto text-[11px] leading-tight">
            
            {/* CABEÇALHO DA O.S. */}
            <div className="border-b-4 border-blue-900 pb-4 mb-6 flex justify-between items-end">
                <div className="w-1/2">
                   {finalLogoUrl ? (
                      <img src={finalLogoUrl} className="max-h-16 max-w-[220px] object-contain" alt="Logo" />
                   ) : (
                      <h1 className="text-2xl font-black uppercase text-blue-900 m-0">{empresaNome}</h1>
                   )}
                </div>
                <div className="w-1/2 text-right">
                   <h1 className="m-0 text-[22px] font-black text-slate-800 uppercase tracking-tight">Ordem de Serviço</h1>
                   <p className="m-0 mt-1 text-lg font-black text-rose-600 tracking-widest">Nº {String(os.id).padStart(5, '0')}</p>
                   <p className="m-0 mt-1 text-[10px] font-bold text-slate-500">Status: <span className="uppercase text-slate-800">{os.status || 'Aberta'}</span></p>
                </div>
            </div>

            {/* BLOCO 1: CLIENTE E DATAS */}
            <div className="mb-5">
                <div className="bg-slate-100 border-l-4 border-blue-900 text-blue-900 font-black uppercase text-[10px] p-1.5 mb-1">1. DADOS DO CLIENTE E ATENDIMENTO</div>
                <table className="w-full border-collapse text-[10px]">
                    <tbody>
                        <tr>
                            <td className="border border-slate-300 p-2 w-[15%] bg-slate-50 font-bold uppercase">Cliente:</td>
                            <td className="border border-slate-300 p-2 w-[55%] font-semibold uppercase">{clienteNome}</td>
                            <td className="border border-slate-300 p-2 w-[15%] bg-slate-50 font-bold uppercase">CNPJ:</td>
                            <td className="border border-slate-300 p-2 w-[15%] font-semibold">{clienteDoc}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Solicitante:</td>
                            <td className="border border-slate-300 p-2 font-semibold uppercase">{os.solicitante_nome || '-'}</td>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Setor/Ala:</td>
                            <td className="border border-slate-300 p-2 font-semibold uppercase">{os.solicitante_setor || os.equipamentos?.setor || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Abertura:</td>
                            <td className="border border-slate-300 p-2 font-semibold">{new Date(os.created_at).toLocaleDateString('pt-BR')} as {new Date(os.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Fechamento:</td>
                            <td className="border border-slate-300 p-2 font-semibold">{os.data_fechamento ? new Date(os.data_fechamento).toLocaleDateString('pt-BR') : '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* BLOCO 2: EQUIPAMENTO */}
            <div className="mb-5">
                <div className="bg-slate-100 border-l-4 border-blue-900 text-blue-900 font-black uppercase text-[10px] p-1.5 mb-1">2. DADOS DO EQUIPAMENTO</div>
                <table className="w-full border-collapse text-[10px]">
                    <tbody>
                        <tr>
                            <td className="border border-slate-300 p-2 w-[15%] bg-slate-50 font-bold uppercase">Equipamento:</td>
                            <td className="border border-slate-300 p-2 w-[35%] font-bold uppercase text-blue-900">{nomeEquipamento}</td>
                            <td className="border border-slate-300 p-2 w-[15%] bg-slate-50 font-bold uppercase">Fabricante:</td>
                            <td className="border border-slate-300 p-2 w-[35%] font-semibold uppercase">{tec?.fabricante || os.equipamentos?.fabricante || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Modelo:</td>
                            <td className="border border-slate-300 p-2 font-semibold uppercase">{tec?.modelo || os.equipamentos?.modelo || '-'}</td>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Série (S/N):</td>
                            <td className="border border-slate-300 p-2 font-semibold">{os.equipamentos?.numero_serie || os.equipamentos?.n_serie || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">TAG/Patrimônio:</td>
                            <td className="border border-slate-300 p-2 font-black text-slate-800">{os.equipamentos?.tag || '-'}</td>
                            <td className="border border-slate-300 p-2 bg-slate-50 font-bold uppercase">Tipo de O.S.:</td>
                            <td className="border border-slate-300 p-2 font-black uppercase">{os.tipo || 'Corretiva'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* BLOCO 3: PROBLEMA E SOLUÇÃO */}
            <div className="mb-5">
                <div className="bg-slate-100 border-l-4 border-blue-900 text-blue-900 font-black uppercase text-[10px] p-1.5 mb-1">3. DETALHES TÉCNICOS DA INTERVENÇÃO</div>
                <table className="w-full border-collapse text-[10px]">
                    <tbody>
                        <tr>
                            <td className="border border-slate-300 p-3 bg-slate-50 font-bold uppercase w-[25%] align-top">Defeito Relatado / Motivo:</td>
                            <td className="border border-slate-300 p-3 w-[75%] italic text-slate-700 whitespace-pre-wrap">{os.defeito_relatado || os.descricao_problema || 'Sem relato inicial.'}</td>
                        </tr>
                        <tr>
                            <td className="border border-slate-300 p-3 bg-slate-50 font-bold uppercase w-[25%] align-top">Laudo Técnico / Solução:</td>
                            <td className="border border-slate-300 p-3 w-[75%] font-medium text-slate-900 whitespace-pre-wrap min-h-[80px]">{os.solucao_aplicada || os.laudo_tecnico || 'Atendimento em andamento / Sem laudo.'}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* BLOCO 4: FOTOS SE HOUVER */}
            {fotosValidas.length > 0 && (
                <div className="mb-5" style={{ pageBreakInside: 'avoid' }}>
                    <div className="bg-slate-100 border-l-4 border-blue-900 text-blue-900 font-black uppercase text-[10px] p-1.5 mb-2">4. EVIDÊNCIAS FOTOGRÁFICAS</div>
                    <div className="grid grid-cols-3 gap-2">
                        {fotosValidas.slice(0, 3).map((url, i) => { 
                            const imgSrc = getImageUrl(url);
                            return imgSrc ? (
                                <div key={i} className="border border-slate-300 p-1 flex items-center justify-center h-40">
                                    <img src={imgSrc} className="max-w-full max-h-full object-contain" alt="" />
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>
            )}

            {/* BLOCO 5: ASSINATURAS */}
            <div className="mt-16 flex justify-between gap-10 px-8" style={{ pageBreakInside: 'avoid' }}>
                <div className="w-[45%] text-center border-t border-black pt-2">
                    <p className="font-black text-[10px] uppercase text-slate-800">Técnico Responsável</p>
                    <p className="font-bold text-[9px] text-slate-600 uppercase mt-1">{os.tecnico_nome || 'Equipe Técnica'}</p>
                </div>
                <div className="w-[45%] text-center border-t border-black pt-2">
                    <p className="font-black text-[10px] uppercase text-slate-800">Aceite do Solicitante / Cliente</p>
                    <p className="font-bold text-[9px] text-slate-500 mt-1">Assinatura / Carimbo</p>
                </div>
            </div>

            <div className="mt-8 text-center text-[8px] text-slate-400 font-bold border-t border-slate-200 pt-4" style={{ pageBreakInside: 'avoid' }}>
                DOCUMENTO GERADO ELETRONICAMENTE POR {empresaNome.toUpperCase()} ATRAVÉS DO SISTEMA ATLASUM.
            </div>
        </div>
      </main>
    </div>
  );
}