import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Download, Wrench, ShieldCheck, 
  Building2, AlertTriangle, FileText, Zap, FileBadge, Loader2, CheckCircle2 
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { pdf } from '@react-pdf/renderer';

// Motores Oficiais
import { TseCertificadoService } from '../../services/TseCertificadoService';
import { TseCertificadoPDF } from '../metrologia/TseCertificadoPDF';
import { CertificadoService } from '../../services/CertificadoService';
import { MetrologiaCertificadoPDF } from '../../documents/MetrologiaCertificadoPDF';
import { imprimirRelatorio } from './reports/RelatorioTecnicoTemplate';

export function OSPublicView() {
  const [os, setOs] = useState<any>(null);
  const [systemConfig, setSystemConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloadingOs, setIsDownloadingOs] = useState(false);
  const [isDownloadingLaudo, setIsDownloadingLaudo] = useState(false);

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
      const { data: osData } = await supabase
        .from('ordens_servico')
        .select('*, equipamentos:equipamento_id (*)')
        .eq('id_publico', osUuid)
        .maybeSingle();

      if (osData) {
        const clienteId = osData.cliente_id || osData.equipamentos?.cliente_id;
        const tecId = osData.equipamentos?.tecnologia_id;

        let [cliRes, tecRes] = await Promise.all([
           clienteId ? supabase.from('clientes').select('*').eq('id', clienteId).maybeSingle() : Promise.resolve({data: null}),
           tecId ? supabase.from('tecnologias').select('*').eq('id', tecId).maybeSingle() : Promise.resolve({data: null})
        ]);

        if (osData.equipamentos) {
           osData.equipamentos.clientes = cliRes.data;
           osData.equipamentos.tecnologias = tecRes.data;
        }

        setOs(osData);

        // Busca Configuração (Logo) de forma idêntica ao sistema interno
        const { data: confData } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
        const { data: tenants } = await supabase.from('empresas_inquilinas').select('*').limit(1).maybeSingle();
        setSystemConfig({ ...tenants, ...confData });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOS = async () => {
      setIsDownloadingOs(true);
      try {
         // Busca dados complementares para o Layout Azul
         const [apt, pec, chk] = await Promise.all([
            supabase.from('apontamentos').select('*').eq('os_id', os.id).order('data_inicio'),
            supabase.from('estoque_movimentacoes').select('*, estoque_itens(*)').eq('os_id', os.id).eq('tipo', 'SAIDA'),
            supabase.from('os_checklists_execucao').select('*').eq('ordem_servico_id', os.id).maybeSingle()
         ]);

         let checklistData = null;
         if (chk.data?.checklist_id) {
             const { data: bib } = await supabase.from('checklists_biblioteca').select('*').eq('id', chk.data.checklist_id).maybeSingle();
             if (bib) checklistData = { perguntas: bib.itens_configuracao || bib.perguntas, respostas: chk.data.respostas || [] };
         }

         const fullData = {
            ...os,
            equipamento: { ...os.equipamentos },
            cliente: { ...os.equipamentos?.clientes },
            pecas: pec.data || [],
            checklistData,
            apontamentos: apt.data || []
         };
         
         // Injeta a logo convertida para o template
         const configFinal = { ...systemConfig };
         if (systemConfig?.logo_url) configFinal.logo_url = getImageUrl(systemConfig.logo_url, 'logos');

         await imprimirRelatorio(fullData, fullData.apontamentos, configFinal);
      } catch (err) {
         alert("Erro ao gerar PDF.");
      } finally {
         setIsDownloadingOs(false);
      }
  };

  const handleDownloadLaudo = async () => {
      setIsDownloadingLaudo(true);
      try {
          if (os.tipo?.toUpperCase().includes('SEGURANÇA')) {
              const payload = await TseCertificadoService.gerarPayload(os.id);
              const blob = await pdf(<TseCertificadoPDF data={payload.data} empresaConfig={payload.empresaConfig || systemConfig} />).toBlob();
              saveAs(blob, `Laudo_TSE_OS_${os.id}.pdf`);
          } else {
              const payload = await CertificadoService.gerarPayload(os.id);
              const blob = await pdf(<MetrologiaCertificadoPDF data={payload} />).toBlob();
              saveAs(blob, `Certificado_RBC_OS_${os.id}.pdf`);
          }
      } catch (err) { 
          alert("Erro ao baixar laudo."); 
      } finally { 
          setIsDownloadingLaudo(false); 
      }
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Acessando documentos...</div>;
  if (!os) return <div className="h-screen flex items-center justify-center">Link indisponível.</div>;

  const equip = os.equipamentos;
  const tec = equip?.tecnologias;
  const nomeEquipamento = `${tec?.nome || equip?.nome || 'Equipamento'} ${tec?.fabricante ? `(${tec.fabricante} - ${tec.modelo})` : ''}`;

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center font-sans">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-black text-slate-800 text-center mb-8">Portal de Documentos Técnicos</h1>
        <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-200">
           <p className="text-[10px] font-bold uppercase text-slate-400">Ativo</p>
           <h2 className="text-lg font-bold text-slate-800 mb-2">{nomeEquipamento}</h2>
           <p className="text-sm font-medium text-slate-600">TAG: {equip?.tag} | Cliente: {equip?.clientes?.nome_fantasia}</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 border rounded-2xl hover:border-indigo-500 transition-all">
            <div className="flex items-center gap-4"><FileText className="text-blue-600" /> <div><p className="font-bold">Ordem de Serviço</p><p className="text-xs text-slate-500">OS #{os.id}</p></div></div>
            <button onClick={handleDownloadOS} disabled={isDownloadingOs} className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-xs">
              {isDownloadingOs ? <Loader2 className="animate-spin" /> : 'BAIXAR PDF'}
            </button>
          </div>
          {(os.tipo === 'Calibração' || os.tipo?.includes('SEGURANÇA')) && os.status === 'Concluída' && (
            <div className="flex items-center justify-between p-5 border-emerald-200 border bg-emerald-50/30 rounded-2xl">
              <div className="flex items-center gap-4"><CheckCircle2 className="text-emerald-600" /> <div><p className="font-bold text-emerald-800">Laudo / Certificado</p><p className="text-xs text-emerald-600">Válido e Assinado</p></div></div>
              <button onClick={handleDownloadLaudo} disabled={isDownloadingLaudo} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-xs">
                {isDownloadingLaudo ? <Loader2 className="animate-spin" /> : 'BAIXAR LAUDO'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}