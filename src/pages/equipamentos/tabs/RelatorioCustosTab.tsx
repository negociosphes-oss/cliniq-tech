import { useState } from 'react';
import { FileBarChart, Download, Wrench, TrendingDown, AlertTriangle } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { EquipamentoDossiePDF } from '../EquipamentoDossiePDF'; // Sobe uma pasta para achar o PDF

interface Props { equipamento: any; historico: any[]; configEmpresa: any; }

export function RelatorioCustosTab({ equipamento, historico, configEmpresa }: Props) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const valorAquisicao = Number(equipamento.valor_bem) || 0;
  const dataAquisicao = equipamento.data_aquisicao ? new Date(equipamento.data_aquisicao) : new Date(equipamento.created_at);
  const diffMeses = (new Date().getFullYear() - dataAquisicao.getFullYear()) * 12 + (new Date().getMonth() - dataAquisicao.getMonth());
  const mesesVidaUtil = 120;
  const mesesConsumidos = Math.min(diffMeses, mesesVidaUtil);
  const valorAtual = Math.max(0, valorAquisicao - (valorAquisicao * (mesesConsumidos / mesesVidaUtil)));
  const porcentagemDepreciada = (mesesConsumidos / mesesVidaUtil) * 100;
  
  const custoTotalManutencao = historico.reduce((acc, os) => acc + (Number(os.valor_total) || 0), 0);
  const riscoSubstituicao = custoTotalManutencao >= (valorAtual > 0 ? valorAtual : valorAquisicao * 0.5);

  const handleGerarDossie = async () => {
     setIsGeneratingPdf(true);
     try {
        const blob = await pdf(<EquipamentoDossiePDF equipamento={equipamento} historico={historico} configEmpresa={configEmpresa} custoTotal={custoTotalManutencao} valorAquisicao={valorAquisicao} valorAtual={valorAtual} />).toBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `Dossie_${equipamento.tag}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); window.open(url, '_blank');
     } catch (e) {
        console.error(e); alert("Erro ao gerar relatório.");
     } finally { setIsGeneratingPdf(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-2xl font-black mb-2 flex items-center gap-2"><FileBarChart className="text-blue-400"/> Dossiê do Equipamento</h3>
                <p className="text-slate-300 text-sm max-w-lg leading-relaxed">Emita um relatório completo contendo os dados técnicos, a depreciação financeira e a lista de todas as ordens de serviço executadas ao longo da vida útil.</p>
            </div>
            <button onClick={handleGerarDossie} disabled={isGeneratingPdf} className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
                {isGeneratingPdf ? 'GERANDO PDF...' : <><Download size={20}/> BAIXAR DOSSIÊ PDF</>}
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><Wrench size={18} className="text-blue-500"/><h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Custo Total de Manutenção</h3></div>
                <div className="p-8 text-center">
                    <p className="text-[10px] font-bold uppercase text-slate-400 mb-2">Soma de todas as O.S. (Peças + Serviço)</p>
                    <p className="text-4xl font-black text-slate-800">R$ {custoTotalManutencao.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><span className="block text-[10px] text-slate-400 font-bold uppercase">Total O.S.</span><span className="font-black text-slate-700 text-lg">{historico.length}</span></div>
                        <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"><span className="block text-[10px] text-slate-400 font-bold uppercase">Corretivas</span><span className="font-black text-rose-600 text-lg">{historico.filter(o=>o.tipo==='Corretiva').length}</span></div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-2"><TrendingDown size={18} className="text-slate-500"/><h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">Depreciação Financeira</h3></div>
                <div className="p-6">
                    <div className="flex justify-between items-end mb-4">
                        <div><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor de Aquisição</p><p className="text-xl font-black text-slate-800">R$ {valorAquisicao.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                        <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400 mb-1">Valor Atual Estimado</p><p className="text-xl font-black text-blue-600">R$ {valorAtual.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
                    </div>
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2 mt-6">Ciclo de Vida Consumido (10 anos)</p>
                    <div className="w-full bg-slate-100 rounded-full h-4 mb-2 overflow-hidden shadow-inner">
                        <div className={`h-4 rounded-full ${porcentagemDepreciada > 80 ? 'bg-rose-500' : porcentagemDepreciada > 50 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, porcentagemDepreciada)}%` }}></div>
                    </div>
                    <p className="text-xs font-black text-slate-600 text-right">{porcentagemDepreciada.toFixed(1)}% consumido</p>
                    {riscoSubstituicao && custoTotalManutencao > 0 && (
                        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex gap-3 items-start"><AlertTriangle size={18} className="text-rose-500 shrink-0"/><p className="text-xs text-rose-700 font-medium">O custo de manutenção já ultrapassou a margem de segurança do valor atual. Avalie a substituição deste ativo.</p></div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}