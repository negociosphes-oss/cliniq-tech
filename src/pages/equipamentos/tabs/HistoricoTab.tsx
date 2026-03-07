import { useState } from 'react';
import { Search, Filter, CheckSquare, Square, Download, History, Wrench, CheckCircle, Calendar, Activity, ExternalLink } from 'lucide-react';

interface Props { equipamento: any; historico: any[]; loading: boolean; }

export function HistoricoTab({ equipamento, historico, loading }: Props) {
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [selectedOsIds, setSelectedOsIds] = useState<number[]>([]);

  const historicoFiltrado = historico.filter(os => {
      const matchBusca = os.id.toString().includes(filtroBusca) || (os.defeito_relatado || '').toLowerCase().includes(filtroBusca.toLowerCase());
      const matchTipo = filtroTipo ? os.tipo === filtroTipo : true;
      const dataOs = new Date(os.created_at);
      const matchInicio = filtroDataInicio ? dataOs >= new Date(filtroDataInicio) : true;
      const matchFim = filtroDataFim ? dataOs <= new Date(filtroDataFim + 'T23:59:59') : true;
      return matchBusca && matchTipo && matchInicio && matchFim;
  });

  const toggleSelectOs = (id: number) => setSelectedOsIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
      if (selectedOsIds.length === historicoFiltrado.length) setSelectedOsIds([]);
      else setSelectedOsIds(historicoFiltrado.map(os => os.id));
  };
  
  const handleBatchDownloadCSV = () => {
      if (selectedOsIds.length === 0) return alert('Selecione pelo menos uma O.S. para exportar.');
      const selectedOs = historicoFiltrado.filter(os => selectedOsIds.includes(os.id));
      let csv = "ID da OS;Data de Abertura;Tipo;Status;Defeito Relatado;Custo Total (R$);Data de Fechamento\n";
      selectedOs.forEach(os => {
          const dataAb = new Date(os.created_at).toLocaleDateString('pt-BR');
          const dataFech = os.data_fechamento ? new Date(os.data_fechamento).toLocaleDateString('pt-BR') : 'Pendente';
          const defeito = (os.defeito_relatado || 'N/A').replace(/;/g, ',');
          const custo = (os.valor_total || 0).toFixed(2).replace('.', ',');
          csv += `${os.id};${dataAb};${os.tipo};${os.status};${defeito};${custo};${dataFech}\n`;
      });
      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url); link.setAttribute("download", `Historico_O.S_${equipamento.tag}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Filter size={12}/> Buscar</label>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                  <input type="text" placeholder="Nº O.S. ou Defeito..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500" value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)}/>
               </div>
            </div>
            <div className="w-36">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Tipo de O.S.</label>
               <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 bg-white" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                   <option value="">Todos</option><option value="Corretiva">Corretiva</option><option value="Preventiva">Preventiva</option><option value="Calibração">Calibração</option><option value="Segurança Elétrica">Seg. Elétrica</option>
               </select>
            </div>
            <div className="w-32">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Período Início</label>
               <input type="date" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 text-slate-600" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)}/>
            </div>
            <div className="w-32">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Período Fim</label>
               <input type="date" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 text-slate-600" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)}/>
            </div>
        </div>

        <div className="flex items-center justify-between px-2">
            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors">
                {selectedOsIds.length === historicoFiltrado.length && historicoFiltrado.length > 0 ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                Selecionar Todas ({historicoFiltrado.length})
            </button>
            {selectedOsIds.length > 0 && (
                <button onClick={handleBatchDownloadCSV} className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-sm">
                    <Download size={14}/> Exportar {selectedOsIds.length} Excel/CSV
                </button>
            )}
        </div>

        {loading ? (
            <div className="text-center p-10 text-slate-400 text-sm">Carregando histórico...</div>
        ) : historicoFiltrado.length === 0 ? (
            <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400"><History size={20}/></div>
                <p className="text-sm font-bold text-slate-500">Nenhuma O.S. encontrada.</p>
            </div>
        ) : (
            <div className="space-y-3">
               {historicoFiltrado.map((os: any) => (
                   <div key={os.id} className={`bg-white p-4 rounded-2xl border shadow-sm transition-colors flex flex-col md:flex-row gap-4 md:items-center cursor-pointer ${selectedOsIds.includes(os.id) ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300'}`} onClick={() => toggleSelectOs(os.id)}>
                       <div className="shrink-0 pt-3 md:pt-0 pl-2">
                           {selectedOsIds.includes(os.id) ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20} className="text-slate-300"/>}
                       </div>
                       <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${os.status === 'Concluída' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                           {os.status === 'Concluída' ? <CheckCircle size={20}/> : <Wrench size={20}/>}
                       </div>
                       <div className="flex-1">
                           <div className="flex flex-wrap items-center gap-3 mb-1.5">
                              <h4 className="text-base font-black text-slate-800">O.S. #{os.id}</h4>
                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">{os.tipo}</span>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${os.status === 'Concluída' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>{os.status}</span>
                           </div>
                           <p className="text-sm text-slate-500 line-clamp-1">{os.defeito_relatado || 'Sem descrição cadastrada'}</p>
                       </div>
                       <div className="flex flex-row md:flex-col gap-4 md:gap-1 text-xs font-medium text-slate-500 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 min-w-[140px]">
                           <div className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-400"/> Aberta: <span className="font-bold text-slate-700">{new Date(os.created_at).toLocaleDateString('pt-BR')}</span></div>
                           {os.data_fechamento ? (
                              <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-emerald-400"/> Fechada: <span className="font-bold text-slate-700">{new Date(os.data_fechamento).toLocaleDateString('pt-BR')}</span></div>
                           ) : (
                              <div className="flex items-center gap-1.5"><Activity size={14} className="text-amber-400"/> Em andamento</div>
                           )}
                       </div>
                       <div className="shrink-0 mt-2 md:mt-0 flex gap-2">
                           <button onClick={(e) => { e.stopPropagation(); window.open(`/ordens?id=${os.id}`, '_blank'); }} className="px-4 py-2.5 bg-slate-50 hover:bg-blue-50 text-blue-600 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200 hover:border-blue-200">
                              Ver <ExternalLink size={14}/>
                           </button>
                       </div>
                   </div>
               ))}
            </div>
        )}
    </div>
  );
}