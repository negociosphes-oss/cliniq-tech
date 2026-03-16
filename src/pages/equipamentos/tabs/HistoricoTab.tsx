import { useState, useMemo, useEffect } from 'react';
import { Search, Printer, Eye, Edit3, ArrowUpDown, ChevronDown, ChevronUp, CheckSquare, Square, Filter } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { RelatorioOSService } from '../../../services/RelatorioOSService';

interface Props { equipamento: any; historico: any[]; loading: boolean; }

export function HistoricoTab({ equipamento, historico, loading }: Props) {
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  
  const [linhasPorPagina, setLinhasPorPagina] = useState(10);
  const [selectedOsIds, setSelectedOsIds] = useState<number[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);

  // Busca a configuração da empresa para o Relatório sair com Logo e Nome corretos
  useEffect(() => {
      const loadConfig = async () => {
          if (equipamento?.tenant_id) {
              const { data } = await supabase.from('empresas_inquilinas').select('*').eq('id', equipamento.tenant_id).maybeSingle();
              if (data) setConfigEmpresa(data);
          }
      };
      loadConfig();
  }, [equipamento]);

  const historicoFiltrado = useMemo(() => {
      let dados = historico.filter(os => {
          const searchL = filtroBusca.toLowerCase();
          const matchBusca = os.id.toString().includes(searchL) || (os.defeito_relatado || '').toLowerCase().includes(searchL);
          const matchTipo = filtroTipo ? os.tipo === filtroTipo : true;
          
          const dataOs = new Date(os.created_at);
          const matchInicio = filtroDataInicio ? dataOs >= new Date(filtroDataInicio) : true;
          const matchFim = filtroDataFim ? dataOs <= new Date(filtroDataFim + 'T23:59:59') : true;

          return matchBusca && matchTipo && matchInicio && matchFim;
      });

      dados.sort((a, b) => {
          let aValue = a[sortConfig.key] || '';
          let bValue = b[sortConfig.key] || '';

          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });

      return dados;
  }, [historico, filtroBusca, filtroTipo, filtroDataInicio, filtroDataFim, sortConfig]);

  const requestSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
      setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
      if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-30 ml-1" />;
      return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-blue-500 ml-1" /> : <ChevronDown size={12} className="text-blue-500 ml-1" />;
  };

  const toggleSelectOs = (id: number) => setSelectedOsIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleSelectAll = () => {
      if (selectedOsIds.length === historicoFiltrado.length) setSelectedOsIds([]);
      else setSelectedOsIds(historicoFiltrado.map(os => os.id));
  };

  // 🚀 MOTOR DE IMPRESSÃO (LIGADO NO NOVO MOTOR DE FICHAS DE O.S.)
  const handlePrint = (osList: any[]) => {
      if (!osList || osList.length === 0) return alert('Selecione pelo menos uma O.S. para imprimir.');
      // Formata os dados para o RelatorioOSService entender (ele precisa do objeto equipamento e cliente dentro da OS)
      const ordensFormatadas = osList.map(os => ({
          ...os,
          equipamento: equipamento,
          cliente: equipamento.clienteData || equipamento.clientes
      }));
      // Chama o método atualizado que desenha a folha A4 real
      RelatorioOSService.imprimirFichaOS(ordensFormatadas, configEmpresa);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 space-y-6 animate-fadeIn">
      
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1"><Filter size={12}/> Buscar</label>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                <input type="text" placeholder="Nº O.S. ou Defeito..." className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 transition-colors" value={filtroBusca} onChange={e => setFiltroBusca(e.target.value)}/>
             </div>
          </div>
          <div className="w-40">
             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Tipo de O.S.</label>
             <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 bg-white transition-colors" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                 <option value="">Todos</option><option value="Corretiva">Corretiva</option><option value="Preventiva">Preventiva</option><option value="Calibração">Calibração</option><option value="Segurança Elétrica">Seg. Elétrica</option>
             </select>
          </div>
          <div className="w-36">
             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Período Início</label>
             <input type="date" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 text-slate-600 transition-colors" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)}/>
          </div>
          <div className="w-36">
             <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Período Fim</label>
             <input type="date" className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm font-medium outline-none focus:border-blue-500 text-slate-600 transition-colors" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)}/>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
              <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">Histórico de Atividades</h3>
              {selectedOsIds.length > 0 && (
                  <button onClick={() => handlePrint(historicoFiltrado.filter(os => selectedOsIds.includes(os.id)))} className="text-xs font-bold flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-emerald-700 hover:shadow-lg transition-all animate-fadeIn">
                      <Printer size={16}/> Relatório em Lote ({selectedOsIds.length})
                  </button>
              )}
          </div>
          <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Linhas por página:</span>
              <select className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 outline-none bg-white cursor-pointer focus:border-blue-500" value={linhasPorPagina} onChange={e => setLinhasPorPagina(Number(e.target.value))}>
                  <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
              </select>
          </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left whitespace-nowrap min-w-[1400px]">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-widest">
                        <th className="p-4 w-12 text-center">
                            <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                                {selectedOsIds.length === historicoFiltrado.length && historicoFiltrado.length > 0 ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                            </button>
                        </th>
                        <th className="p-4 text-center">Ações</th>
                        <th className="p-4 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestSort('id')}><div className="flex items-center">Número {getSortIcon('id')}</div></th>
                        <th className="p-4 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestSort('status')}><div className="flex items-center">Estado {getSortIcon('status')}</div></th>
                        <th className="p-4">Solicitante</th>
                        <th className="p-4">Responsável</th>
                        <th className="p-4 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestSort('tipo')}><div className="flex items-center">Tipo de Serviço {getSortIcon('tipo')}</div></th>
                        <th className="p-4 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestSort('created_at')}><div className="flex items-center">Data de Criação {getSortIcon('created_at')}</div></th>
                        <th className="p-4 cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => requestSort('data_fechamento')}><div className="flex items-center">Data Fechamento {getSortIcon('data_fechamento')}</div></th>
                        <th className="p-4 text-amber-600">Prioridade</th>
                        <th className="p-4 text-slate-400">Problema Relatado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={11} className="p-12 text-center font-bold text-slate-400">Sincronizando histórico...</td></tr>
                    ) : historicoFiltrado.length === 0 ? (
                        <tr><td colSpan={11} className="p-12 text-center font-bold text-slate-400">Nenhum registro de O.S. encontrado para este equipamento.</td></tr>
                    ) : (
                        historicoFiltrado.slice(0, linhasPorPagina).map((os: any) => (
                            <tr key={os.id} className={`hover:bg-blue-50/50 transition-colors group ${selectedOsIds.includes(os.id) ? 'bg-blue-50/30' : ''}`}>
                                <td className="p-4 text-center">
                                    <button onClick={() => toggleSelectOs(os.id)} className="text-slate-400 hover:text-blue-600 transition-colors">
                                        {selectedOsIds.includes(os.id) ? <CheckSquare size={18} className="text-blue-600"/> : <Square size={18}/>}
                                    </button>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-3 text-teal-600">
                                        <button title="Visualizar O.S." onClick={() => window.open(`/ordens?id=${os.id}`, '_blank')} className="hover:text-blue-600 transition-transform hover:scale-110"><Eye size={18}/></button>
                                        <button title="Imprimir PDF" onClick={() => handlePrint([os])} className="hover:text-blue-600 transition-transform hover:scale-110"><Printer size={18}/></button>
                                        <button title="Editar O.S." onClick={() => window.open(`/ordens?id=${os.id}&edit=true`, '_blank')} className="hover:text-blue-600 transition-transform hover:scale-110"><Edit3 size={18}/></button>
                                    </div>
                                </td>
                                <td className="p-4 font-black text-slate-700">{os.id}</td>
                                <td className="p-4">
                                   <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${os.status === 'Concluída' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>
                                       {os.status}
                                   </span>
                                </td>
                                <td className="p-4 text-xs font-bold text-slate-600 max-w-[200px] truncate" title={equipamento.clienteData?.nome_fantasia || equipamento.clientes?.nome_fantasia || 'N/A'}>
                                    {equipamento.clienteData?.nome_fantasia || equipamento.clientes?.nome_fantasia || 'N/A'}
                                </td>
                                <td className="p-4 text-xs font-medium text-slate-500">Técnico ID: {os.tecnico_id || 'Não atribuído'}</td>
                                <td className="p-4 text-xs font-bold text-slate-700">{os.tipo}</td>
                                <td className="p-4 text-xs font-medium text-slate-500">{new Date(os.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                <td className="p-4 text-xs font-medium text-slate-500">{os.data_fechamento ? new Date(os.data_fechamento).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</td>
                                <td className="p-4 text-xs font-black text-slate-500 uppercase">Normal</td>
                                <td className="p-4 text-xs font-medium text-slate-500 max-w-[250px] truncate" title={os.defeito_relatado}>{os.defeito_relatado || 'Manutenção Preventiva Padrão'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}