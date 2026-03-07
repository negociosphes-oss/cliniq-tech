import { QrCode, FileText, Calendar, AlertTriangle, Zap, CheckCircle, X, ExternalLink, ShieldAlert, Hash } from 'lucide-react';

interface Props { equipamento: any; }

const InfoItem = ({ label, value, icon }: any) => (
  <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-400">{icon}<span className="text-[9px] font-black uppercase tracking-widest">{label}</span></div>
      <span className="text-sm font-bold text-slate-800 leading-tight">{value || 'N/A'}</span>
  </div>
);

export function ProntuarioTab({ equipamento }: Props) {
  const hoje = new Date().getTime();
  let garantiaAtiva = false;
  let progressoGarantia = 100;
  let diasGarantiaRestantes = 0;

  if (equipamento.data_instalacao && equipamento.vencimento_garantia) {
       const inicio = new Date(equipamento.data_instalacao).getTime();
       const fim = new Date(equipamento.vencimento_garantia).getTime();
       if (hoje >= inicio && hoje <= fim) {
           garantiaAtiva = true;
           progressoGarantia = ((hoje - inicio) / (fim - inicio)) * 100;
           diasGarantiaRestantes = Math.ceil((fim - hoje) / (1000 * 60 * 60 * 24));
       } else if (hoje < inicio) {
           progressoGarantia = 0;
       }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
        <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><QrCode size={14}/> Identificação e Rastreabilidade</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><InfoItem label="Nº de Série" value={equipamento.n_serie} icon={<Hash size={14}/>}/></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><InfoItem label="Patrimônio" value={equipamento.patrimonio} /></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><InfoItem label="Modelo Exacto" value={equipamento.modelo || equipamento.dict_modelos?.nome} /></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><InfoItem label="TAG Sistema" value={equipamento.tag} /></div>
            </div>
        </div>

        <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><ShieldAlert size={14}/> Regulatório e Segurança Clínica</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><InfoItem label="Registro ANVISA" value={equipamento.registro_anvisa || equipamento.tecnologia?.registro_anvisa} icon={<FileText size={14}/>}/></div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <InfoItem label="Classe de Risco (ANVISA)" value={equipamento.classe_risco || equipamento.tecnologia?.criticidade} icon={<AlertTriangle size={14} className={equipamento.classe_risco?.includes('III') || equipamento.classe_risco?.includes('IV') ? 'text-rose-500' : 'text-blue-500'}/>}/>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><InfoItem label="Proteção Elétrica (IEC)" value={equipamento.dict_modelos?.classe_protecao_eletrica || 'Não Informada'} icon={<Zap size={14}/>}/></div>
            </div>
        </div>

        <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2"><Calendar size={14}/> Instalação e Garantia Contratual</h3>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100 flex-1 grid grid-cols-2 gap-4">
                    <InfoItem label="Data Instalação" value={equipamento.data_instalacao ? new Date(equipamento.data_instalacao).toLocaleDateString('pt-BR') : 'Não Cadastrada'} />
                    <InfoItem label="Fim da Garantia" value={equipamento.vencimento_garantia ? new Date(equipamento.vencimento_garantia).toLocaleDateString('pt-BR') : 'Não Cadastrada'} />
                </div>
                <div className="p-6 flex-1 bg-slate-50 flex flex-col justify-center">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-slate-500 uppercase tracking-wide">Status da Garantia</span>
                        {equipamento.vencimento_garantia ? (
                            garantiaAtiva ? <span className="text-emerald-600 flex items-center gap-1"><CheckCircle size={14}/> Ativa ({diasGarantiaRestantes} dias)</span> : <span className="text-rose-500 flex items-center gap-1"><X size={14}/> Expirada</span>
                        ) : <span className="text-slate-400">Desconhecido</span>}
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-2.5 rounded-full ${garantiaAtiva ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${progressoGarantia}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {equipamento.manual_url && (
            <a href={equipamento.manual_url} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-blue-50 p-5 rounded-2xl border border-blue-100 shadow-sm hover:border-blue-400 hover:bg-blue-100 transition-colors group">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md"><FileText size={24}/></div>
                    <div><p className="text-sm font-black text-blue-900 uppercase tracking-wide">Manual Técnico e Datasheet</p><p className="text-xs text-blue-600 font-medium">Arquivo PDF do fabricante salvo na nuvem</p></div>
                </div>
                <ExternalLink size={24} className="text-blue-400 group-hover:text-blue-700"/>
            </a>
        )}
    </div>
  );
}