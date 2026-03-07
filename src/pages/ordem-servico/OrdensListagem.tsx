import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Printer, FileBadge, X, SlidersHorizontal, 
  Building2, Tag, Zap, Settings2, FileDown, FileSpreadsheet, ChevronDown 
} from 'lucide-react';
import { supabase } from '../../supabaseClient'; 

// 🚀 IMPORTANDO O MOTOR DE RELATÓRIOS
import { RelatorioOSService } from '../../services/RelatorioOSService';

interface OrdensListagemProps {
  ordens: any[];
  equipamentos: any[];
  clientes: any[];
  onOpenOs: (id: number) => void;
  onNewOs: () => void;
  onQuickPrint: (os: any) => void;
  onQuickPrintCertificado: (id: number) => void;
  onBulkPrintOs: (osIds: number[]) => void;
  onBulkPrintCertificados: (osIds: number[]) => void;
}

export function OrdensListagem({ 
  ordens, equipamentos, clientes, onOpenOs, onNewOs, onQuickPrint, 
  onQuickPrintCertificado, onBulkPrintOs, onBulkPrintCertificados 
}: OrdensListagemProps) {
  
  const [buscaLivre, setBuscaLivre] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroCliente, setFiltroCliente] = useState('');
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tiposOs, setTiposOs] = useState<any[]>([]);
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);

  const [showColMenu, setShowColMenu] = useState(false);
  const [cols, setCols] = useState({
    id: true, equipamento: true, serie: true, cliente: true, tipo: true, data: true, status: true, acoes: true
  });

  const toggleCol = (col: keyof typeof cols) => setCols(prev => ({ ...prev, [col]: !prev[col] }));

  useEffect(() => {
    const loadData = async () => {
      const [{ data: tipos }, { data: conf }] = await Promise.all([
        supabase.from('tipos_ordem_servico').select('nome').order('nome'),
        supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle()
      ]);
      if (tipos) setTiposOs(tipos);
      if (conf) setConfigEmpresa(conf);
    };
    loadData();
  }, []);

  // 🚀 MOTOR DE FILTRAGEM
  const list = useMemo(() => {
    return (ordens || []).filter(os => {
      const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
      const cli = clientes.find(c => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
      const eqNome = (eq.tecnologia?.nome || os.equipamento_nome || eq.nome || '').toLowerCase();
      const eqSerie = (eq.numero_serie || eq.n_serie || eq.serie || os.equipamento_serie || '').toLowerCase();
      const tag = (eq.tag || os.equipamento_tag || '').toLowerCase();
      const termo = buscaLivre.toLowerCase();

      const matchBuscaLivre = !termo || String(os.id).includes(termo) || eqNome.includes(termo) || eqSerie.includes(termo) || tag.includes(termo);
      const matchStatus = !filtroStatus || os.status === filtroStatus;
      const matchTipo = !filtroTipo || os.tipo === filtroTipo;
      const matchCliente = !filtroCliente || String(cli.id) === filtroCliente;

      return matchBuscaLivre && matchStatus && matchTipo && matchCliente;
    }).sort((a, b) => b.id - a.id);
  }, [ordens, equipamentos, clientes, buscaLivre, filtroStatus, filtroTipo, filtroCliente]);

  // 🚀 AÇÕES DE EXPORTAÇÃO (INTEGRADAS AO SERVIÇO)
  const handleExportExcel = () => {
    const dataToExport = selectedIds.length > 0 ? list.filter(o => selectedIds.includes(o.id)) : list;
    RelatorioOSService.exportarExcel(dataToExport);
  };

  const handlePrintPDF = () => {
    const dataToExport = selectedIds.length > 0 ? list.filter(o => selectedIds.includes(o.id)) : list;
    RelatorioOSService.imprimirPDF(dataToExport, configEmpresa);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === list.length && list.length > 0) setSelectedIds([]);
    else setSelectedIds(list.map(os => os.id));
  };

  const toggleSelectOs = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-40">
        
       {/* 🚀 HEADER DA PÁGINA COM BOTÕES DE RELATÓRIO */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
          <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Ordens de Serviço</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">{list.length} registros ativos na visualização.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
             {/* BOTÕES DE EXPORTAÇÃO ESTILO INVENTÁRIO */}
             <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button onClick={handlePrintPDF} className="px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-2 transition-all" title="Gerar Relatório em PDF">
                    <FileDown size={18}/> PDF
                </button>
                <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                <button onClick={handleExportExcel} className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold flex items-center gap-2 transition-all" title="Baixar Planilha Excel">
                    <FileSpreadsheet size={18}/> Excel
                </button>
             </div>

             <button onClick={onNewOs} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 text-sm ml-2">
                 <Plus size={20} strokeWidth={3}/> Nova O.S.
             </button>
          </div>
       </div>

       {/* BARRA DE FILTROS */}
       <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-wrap xl:flex-nowrap gap-2 items-center">
            <div className="relative flex-1 min-w-[300px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <input 
                 className="w-full h-12 pl-12 pr-4 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" 
                 placeholder="Busca rápida por TAG, ID, Modelo ou Série..." 
                 value={buscaLivre} onChange={e => setBuscaLivre(e.target.value)} 
               />
            </div>
            
            <div className="flex items-center gap-2 w-full xl:w-auto">
                <select className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none flex-1 xl:w-44" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                   <option value="">Status (Todos)</option><option value="Aberta">Aberta</option><option value="Em Execução">Em Execução</option><option value="Concluída">Concluída</option>
                </select>
                
                <select className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none flex-1 xl:w-44" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                   <option value="">Tipos (Todos)</option>
                   {tiposOs.map((t, i) => <option key={i} value={t.nome}>{t.nome}</option>)}
                </select>

                <div className="relative">
                   <button onClick={() => setShowColMenu(!showColMenu)} className="h-10 w-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                      <Settings2 size={18}/>
                   </button>
                   {showColMenu && (
                      <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 shadow-2xl rounded-2xl p-4 z-50 animate-slideUp">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Colunas Visíveis</p>
                         <div className="space-y-2">
                            {Object.keys(cols).map((c) => (
                              <label key={c} className="flex items-center gap-3 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors">
                                <input type="checkbox" checked={cols[c as keyof typeof cols]} onChange={() => toggleCol(c as keyof typeof cols)} className="w-4 h-4 accent-indigo-600 rounded-md border-slate-300"/> 
                                <span className="text-xs font-bold text-slate-600 capitalize">{c === 'id' ? 'Nº O.S.' : c === 'serie' ? 'TAG/Série' : c}</span>
                              </label>
                            ))}
                         </div>
                      </div>
                   )}
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className={`h-10 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${showAdvanced ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                   <SlidersHorizontal size={16}/> {showAdvanced ? 'Fechar Filtros' : 'Filtro Avançado'}
                </button>
            </div>
       </div>

       {showAdvanced && (
           <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 animate-slideUp">
               <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building2 size={14}/> Hospital / Cliente</label>
                   <select className="w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 outline-none focus:border-indigo-500 shadow-sm" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
                       <option value="">Todas as Unidades</option>
                       {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                   </select>
               </div>
               {/* Espaço para outros filtros futuros */}
               <div className="flex items-end">
                   <button onClick={() => { setFiltroCliente(''); setFiltroStatus(''); setFiltroTipo(''); setBuscaLivre(''); }} className="h-11 px-6 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                       Limpar Filtros
                   </button>
               </div>
           </div>
       )}

       {/* TABELA CORPORATIVA */}
       <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                      {cols.id && (
                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <div className="flex items-center gap-4">
                              <input type="checkbox" checked={selectedIds.length === list.length && list.length > 0} onChange={toggleSelectAll} className="w-4 h-4 accent-indigo-600 rounded border-slate-300 cursor-pointer"/> 
                              OS #
                           </div>
                        </th>
                      )}
                      {cols.equipamento && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Equipamento</th>}
                      {cols.serie && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identificação</th>}
                      {cols.cliente && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Localização</th>}
                      {cols.tipo && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Serviço</th>}
                      {cols.data && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Abertura</th>}
                      {cols.status && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>}
                      {cols.acoes && <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-10">Ações</th>}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {list.length === 0 ? (
                      <tr>
                         <td colSpan={8} className="py-20 text-center">
                            <div className="flex flex-col items-center opacity-40">
                               <Search size={48} className="mb-4" />
                               <p className="font-bold text-lg">Nenhuma ordem encontrada.</p>
                            </div>
                         </td>
                      </tr>
                   ) : (
                      list.map(os => {
                         const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
                         const cli = clientes.find(c => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
                         const isSelected = selectedIds.includes(os.id);
                         const isTse = os.tipo?.toUpperCase().includes('SEGURANÇA');
                         const exigeLaudo = os.tipo === 'Calibração' || isTse;

                         return (
                            <tr key={os.id} onClick={() => onOpenOs(os.id)} className={`group hover:bg-slate-50 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                               
                               {cols.id && (
                                  <td className="px-6 py-4">
                                     <div className="flex items-center gap-4">
                                        <input type="checkbox" checked={isSelected} onClick={(e) => toggleSelectOs(os.id, e)} readOnly className="w-4 h-4 accent-indigo-600 rounded border-slate-300 cursor-pointer"/>
                                        <span className="text-sm font-black text-slate-900">#{os.id}</span>
                                     </div>
                                  </td>
                               )}

                               {cols.equipamento && (
                                  <td className="px-6 py-4">
                                     <div className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{eq.tecnologia?.nome || os.equipamento_nome || eq.nome || 'Equipamento'}</div>
                                     <div className="text-[11px] font-medium text-slate-400">{eq.modelo || eq.tecnologia?.modelo || 'Sem Modelo'}</div>
                                  </td>
                               )}

                               {cols.serie && (
                                  <td className="px-6 py-4">
                                     <div className="text-xs font-black text-slate-700 uppercase tracking-tight">TAG: {eq.tag || os.equipamento_tag || '-'}</div>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase">S/N: {eq.numero_serie || eq.n_serie || '-'}</div>
                                  </td>
                               )}

                               {cols.cliente && (
                                  <td className="px-6 py-4">
                                     <div className="text-sm font-bold text-blue-600 truncate max-w-[150px]">{cli.nome_fantasia || cli.razao_social || 'Hospital Interno'}</div>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase">{os.setor || 'UTI Geral'}</div>
                                  </td>
                               )}

                               {cols.tipo && (
                                  <td className="px-6 py-4">
                                     <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${exigeLaudo ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                        {os.tipo}
                                     </span>
                                  </td>
                               )}

                               {cols.data && (
                                  <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                     {os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '-'}
                                  </td>
                               )}

                               {cols.status && (
                                  <td className="px-6 py-4">
                                     <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
                                        os.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                        os.status === 'Em Execução' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' : 
                                        'bg-amber-50 text-amber-700 border-amber-200'
                                     }`}>
                                        {os.status}
                                     </span>
                                  </td>
                               )}

                               {cols.acoes && (
                                  <td className="px-6 py-4 text-right pr-10">
                                     <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPrint(os); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-indigo-100 transition-all" title="Imprimir O.S.">
                                           <Printer size={18}/>
                                        </button>
                                        {exigeLaudo && (
                                           <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPrintCertificado(os.id); }} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-emerald-100 transition-all" title="Baixar Laudo/Certificado">
                                              {isTse ? <Zap size={18}/> : <FileBadge size={18}/>}
                                           </button>
                                        )}
                                     </div>
                                  </td>
                               )}

                            </tr>
                         )
                      })
                   )}
                </tbody>
            </table>
          </div>
       </div>

       {/* MENU DE AÇÕES EM LOTE (BULK ACTIONS) */}
       {selectedIds.length > 0 && (
           <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-[9999] animate-slideUp">
               <div className="flex items-center gap-4 border-r border-slate-700 pr-8">
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-base shadow-lg ring-4 ring-indigo-500/20">{selectedIds.length}</div>
                   <div className="flex flex-col"><span className="font-black text-xs uppercase tracking-widest text-slate-400">Seleção Ativa</span></div>
               </div>
               <div className="flex items-center gap-4">
                 <button onClick={() => onBulkPrintOs(selectedIds)} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-all text-sm font-black uppercase tracking-wider active:scale-95 shadow-md">
                    <Printer size={18} className="text-blue-400"/> Imprimir Lote
                 </button>
                 <button onClick={() => onBulkPrintCertificados(selectedIds)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all text-sm font-black uppercase tracking-wider active:scale-95 shadow-md">
                    <FileBadge size={18} className="text-white"/> Baixar Laudos
                 </button>
               </div>
               <button onClick={() => setSelectedIds([])} className="p-2.5 bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white rounded-full transition-all ml-2 shadow-inner"><X size={20}/></button>
           </div>
       )}
    </div>
  );
}