import { useState, useMemo } from 'react';
import { Search, Plus, Download, ChevronRight, FileText, Printer, FileBadge, X, UserCheck, CheckSquare, Square, SlidersHorizontal, Calendar, Hash, Building2, Tag } from 'lucide-react';

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
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filtroCliente, setFiltroCliente] = useState('');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroSerieOuPatrimonio, setFiltroSerieOuPatrimonio] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const list = useMemo(() => {
    return (ordens || []).filter(os => {
      const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
      const cli = clientes.find(c => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
      
      const eqNome = (eq.tecnologia?.nome || os.equipamento_nome || eq.nome || '').toLowerCase();
      const eqModelo = (eq.modelo || eq.tecnologia?.modelo || '').toLowerCase();
      const eqFabricante = (eq.fabricante || eq.tecnologia?.fabricante || '').toLowerCase();
      const eqSerie = (eq.numero_serie || eq.n_serie || eq.serie || os.equipamento_serie || '').toLowerCase();
      const eqPatrimonio = (eq.patrimonio || os.equipamento_patrimonio || '').toLowerCase();
      const eqTag = (eq.tag || os.equipamento_tag || '').toLowerCase();
      const termo = buscaLivre.toLowerCase();

      const matchBuscaLivre = !termo || 
        String(os.id).includes(termo) || 
        eqTag.includes(termo) ||
        eqNome.includes(termo) ||
        eqModelo.includes(termo) ||
        eqFabricante.includes(termo);

      const matchStatus = !filtroStatus || os.status === filtroStatus;
      const matchTipo = !filtroTipo || os.tipo === filtroTipo;

      const matchCliente = !filtroCliente || String(cli.id) === filtroCliente;
      const matchSeriePat = !filtroSerieOuPatrimonio || 
        eqSerie.includes(filtroSerieOuPatrimonio.toLowerCase()) || 
        eqPatrimonio.includes(filtroSerieOuPatrimonio.toLowerCase());

      const dataOs = new Date(os.data_abertura || os.created_at);
      let matchDataInicio = true;
      let matchDataFim = true;

      if (filtroDataInicio) {
        const dInicio = new Date(filtroDataInicio + 'T00:00:00');
        matchDataInicio = dataOs >= dInicio;
      }
      if (filtroDataFim) {
        const dFim = new Date(filtroDataFim + 'T23:59:59');
        matchDataFim = dataOs <= dFim;
      }

      return matchBuscaLivre && matchStatus && matchTipo && matchCliente && matchSeriePat && matchDataInicio && matchDataFim;
    }).sort((a, b) => b.id - a.id);
  }, [ordens, equipamentos, clientes, buscaLivre, filtroStatus, filtroTipo, filtroCliente, filtroSerieOuPatrimonio, filtroDataInicio, filtroDataFim]);

  const toggleSelectAll = () => {
    if (selectedIds.length === list.length && list.length > 0) setSelectedIds([]);
    else setSelectedIds(list.map(os => os.id));
  };

  const toggleSelectOs = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const limparFiltros = () => {
      setBuscaLivre(''); setFiltroStatus(''); setFiltroTipo('');
      setFiltroCliente(''); setFiltroDataInicio(''); setFiltroDataFim(''); setFiltroSerieOuPatrimonio('');
  };

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-40 relative">
       
       <div className="flex justify-between items-end mb-8 border-b border-theme pb-6">
          <div>
             <h2 className="text-3xl font-black text-theme-main flex items-center gap-3">
                <span className="p-3 bg-primary-theme text-white rounded-2xl shadow-xl"><FileText size={28}/></span>
                Gestão de Ordens
             </h2>
             <p className="text-theme-muted font-bold mt-2 opacity-70 uppercase text-[10px] tracking-widest">Painel de Controle Operacional</p>
          </div>
          <button onClick={onNewOs} className="bg-primary-theme px-8 py-4 rounded-2xl font-black text-white shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={20} strokeWidth={3}/> NOVA O.S.
          </button>
       </div>

       <div className="bg-theme-card border border-theme p-6 rounded-[32px] shadow-sm mb-6 transition-all">
           
           <div className="flex flex-col md:flex-row gap-4 items-center">
               <div className="relative flex-1 w-full">
                  <input 
                    className="input-theme pl-12 w-full h-14 rounded-2xl font-bold text-lg focus:ring-4 focus:ring-primary-theme/20 transition-all" 
                    placeholder="Busque por TAG, ID, Modelo, Fabricante ou Equipamento..." 
                    value={buscaLivre} onChange={e => setBuscaLivre(e.target.value)} 
                  />
                  <Search className="absolute left-4 top-4 text-theme-muted" size={20}/>
               </div>
               
               <select className="input-theme h-14 rounded-2xl font-black uppercase text-xs w-full md:w-48" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="">Status (Todos)</option><option value="Aberta">Aberta</option><option value="Em Execução">Em Execução</option><option value="Concluída">Concluída</option>
               </select>
               
               <select className="input-theme h-14 rounded-2xl font-black uppercase text-xs w-full md:w-48" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                  <option value="">Tipos (Todos)</option><option value="Corretiva">Corretiva</option><option value="Preventiva">Preventiva</option><option value="Calibração">Calibração</option>
               </select>

               <button 
                  onClick={() => setShowAdvanced(!showAdvanced)} 
                  className={`h-14 px-6 rounded-2xl font-black uppercase text-xs flex items-center gap-2 transition-all border-2 shrink-0 ${showAdvanced ? 'bg-primary-theme text-white border-primary-theme shadow-md' : 'bg-theme-page text-theme-muted border-theme hover:border-primary-theme hover:text-primary-theme'}`}
               >
                  <SlidersHorizontal size={18}/> {showAdvanced ? 'Ocultar' : 'Avançado'}
               </button>
           </div>

           {showAdvanced && (
               <div className="mt-6 pt-6 border-t border-theme animate-slideUp grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Building2 size={12}/> Cliente / Unidade</label>
                       <select className="input-theme h-12 rounded-xl text-sm font-bold" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
                           <option value="">Todas as Unidades</option>
                           {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                       </select>
                   </div>
                   
                   <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Hash size={12}/> Série ou Patrimônio</label>
                       <input 
                         type="text" className="input-theme h-12 rounded-xl text-sm font-bold px-3" placeholder="Digite a série ou patrimônio..." 
                         value={filtroSerieOuPatrimonio} onChange={e => setFiltroSerieOuPatrimonio(e.target.value)}
                       />
                   </div>

                   <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Calendar size={12}/> Data Inicial</label>
                       <input 
                         type="date" className="input-theme h-12 rounded-xl text-sm font-bold px-3" 
                         value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)}
                       />
                   </div>

                   <div className="flex flex-col gap-1.5 relative">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Calendar size={12}/> Data Final</label>
                       <input 
                         type="date" className="input-theme h-12 rounded-xl text-sm font-bold px-3" 
                         value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)}
                       />
                       
                       {(filtroCliente || filtroDataInicio || filtroDataFim || filtroSerieOuPatrimonio) && (
                          <button onClick={limparFiltros} className="absolute -bottom-8 right-0 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors">
                              Limpar Filtros Avançados
                          </button>
                       )}
                   </div>
               </div>
           )}
       </div>

       <div className="mb-6 flex items-center justify-between px-4">
           <button onClick={toggleSelectAll} className="flex items-center gap-3 text-xs font-black uppercase text-theme-muted hover:text-primary-theme transition-all">
               {selectedIds.length === list.length && list.length > 0 ? <CheckSquare size={24} className="text-primary-theme"/> : <Square size={24}/>}
               {selectedIds.length > 0 ? `${selectedIds.length} selecionadas` : 'Selecionar Tudo'}
           </button>
           <span className="text-xs font-bold text-theme-muted">{list.length} resultados encontrados</span>
       </div>

       <div className="grid gap-4">
          {list.length === 0 ? (
             <div className="p-12 text-center bg-theme-page border border-dashed border-theme rounded-3xl">
                <Search className="mx-auto text-theme-muted mb-4" size={40}/>
                <h3 className="font-black text-theme-main text-lg">Nenhuma OS encontrada</h3>
                <p className="text-theme-muted text-sm mt-1">Tente ajustar seus filtros de busca para encontrar o que precisa.</p>
             </div>
          ) : list.map(os => {
             const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
             const cli = clientes.find(c => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
             const isSelected = selectedIds.includes(os.id);

             return (
               <div key={os.id} onClick={() => onOpenOs(os.id)} className={`bg-theme-card p-6 rounded-[28px] border-2 transition-all flex flex-col md:flex-row justify-between items-center gap-4 group cursor-pointer relative overflow-hidden ${isSelected ? 'border-primary-theme bg-primary-theme/5 shadow-md shadow-primary-theme/10' : 'border-theme hover:border-primary-theme/50 hover:shadow-lg hover:shadow-primary-theme/5'}`}>
                  
                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${os.status === 'Concluída' || os.status === 'Finalizada' ? 'bg-emerald-500' : os.status === 'Em Execução' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>

                  <div className="flex items-center gap-4 md:gap-6 w-full pl-2">
                     <button onClick={(e) => toggleSelectOs(os.id, e)} className="shrink-0 hover:scale-110 transition-transform">
                         {isSelected ? <CheckSquare size={26} className="text-primary-theme"/> : <Square size={26} className="text-slate-300"/>}
                     </button>
                     
                     <div className="w-14 h-14 md:w-16 md:h-16 bg-theme-page border-2 border-theme rounded-2xl flex items-center justify-center font-black text-theme-main text-lg shadow-inner">
                         #{os.id}
                     </div>
                     
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-black text-theme-main text-lg md:text-xl tracking-tight leading-none truncate max-w-[200px] md:max-w-none">
                                {eq.tecnologia?.nome || os.equipamento_nome || 'Equipamento'}
                            </h3>
                            <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase bg-theme-page border border-theme text-theme-muted shrink-0">
                                {os.tipo}
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-tighter mt-2">
                            <span className="text-primary-theme font-black bg-primary-theme/10 px-2 py-0.5 rounded flex items-center gap-1"><Tag size={12}/> {eq.tag || os.equipamento_tag || 'S/TAG'}</span>
                            <span className="flex items-center gap-1.5"><UserCheck size={14}/> {cli.nome_fantasia || cli.razao_social || 'Unidade'}</span>
                            <span className="flex items-center gap-1.5 text-slate-400"><Calendar size={12}/> {new Date(os.data_abertura || os.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex flex-row items-center gap-2 shrink-0 pt-4 md:pt-0 justify-end w-full md:w-auto border-t border-theme md:border-none mt-2 md:mt-0">
                     {os.tipo === 'Calibração' && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); onQuickPrintCertificado(os.id); }} 
                          className="p-3 bg-indigo-500/10 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm flex items-center gap-2"
                          title="Baixar Certificado de Calibração"
                        >
                            <FileBadge size={18}/>
                        </button>
                     )}
                     
                     <button 
                       onClick={(e) => { e.stopPropagation(); onQuickPrint(os); }} 
                       className="p-3 bg-blue-500/10 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm flex items-center gap-2"
                       title="Baixar Relatório de O.S."
                     >
                        <Download size={18}/>
                     </button>
                     
                     <ChevronRight className="text-slate-300 group-hover:text-primary-theme transition-all ml-1 hidden md:block" size={24}/>
                  </div>
               </div>
             );
          })}
       </div>

       {selectedIds.length > 0 && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-6 z-[9999] animate-slideUp">
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-xs ring-4 ring-blue-500/20 shadow-lg">{selectedIds.length}</div>
                   <div className="flex flex-col hidden sm:flex"><span className="font-black text-[9px] uppercase tracking-widest text-blue-400">Ordens</span><span className="font-bold text-[11px] uppercase leading-none">Selecionadas</span></div>
               </div>
               <div className="w-px h-8 bg-slate-700"></div>
               <div className="flex items-center gap-4 sm:gap-6">
                 <button onClick={() => onBulkPrintOs(selectedIds)} className="flex items-center gap-2 hover:text-blue-400 transition-all font-black text-[10px] sm:text-xs uppercase tracking-tighter group">
                    <Printer size={18} className="group-hover:scale-110 transition-transform"/> <span className="hidden sm:inline">Baixar Lote O.S.</span><span className="sm:hidden">O.S.</span>
                 </button>
                 <button onClick={() => onBulkPrintCertificados(selectedIds)} className="flex items-center gap-2 hover:text-indigo-400 transition-all font-black text-[10px] sm:text-xs uppercase tracking-tighter group">
                    <FileBadge size={18} className="group-hover:scale-110 transition-transform"/> <span className="hidden sm:inline">Baixar Certificados</span><span className="sm:hidden">Certificados</span>
                 </button>
               </div>
               <div className="w-px h-8 bg-slate-700"></div>
               <button onClick={() => setSelectedIds([])} className="p-1.5 hover:bg-rose-600 bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white"><X size={20}/></button>
           </div>
       )}
    </div>
  );
}