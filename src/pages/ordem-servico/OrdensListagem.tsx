import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Download, FileText, Printer, FileBadge, X, CheckSquare, Square, SlidersHorizontal, Calendar, Hash, Building2, Tag, Zap, Settings2 } from 'lucide-react';
import { supabase } from '../../supabaseClient'; 

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
  const [tiposOs, setTiposOs] = useState<any[]>([]);

  // 🚀 O GERENCIADOR DE COLUNAS CONFIGURÁVEL
  const [showColMenu, setShowColMenu] = useState(false);
  const [cols, setCols] = useState({
    id: true,
    equipamento: true,
    serie: true,
    cliente: true,
    tipo: true,
    data: true,
    status: true,
    acoes: true
  });

  const toggleCol = (col: keyof typeof cols) => {
    setCols(prev => ({ ...prev, [col]: !prev[col] }));
  };

  useEffect(() => {
    const fetchTipos = async () => {
      const { data } = await supabase.from('tipos_ordem_servico').select('nome').order('nome');
      if (data) setTiposOs(data);
      else setTiposOs([{nome: 'Calibração'}, {nome: 'Corretiva'}, {nome: 'Preventiva'}, {nome: 'Teste de Segurança Elétrica'}]);
    };
    fetchTipos();
  }, []);

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
        String(os.id).includes(termo) || eqTag.includes(termo) || eqNome.includes(termo) ||
        eqModelo.includes(termo) || eqFabricante.includes(termo);

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
             <p className="text-theme-muted font-bold mt-2 opacity-70 uppercase text-[10px] tracking-widest">Painel de Controle Operacional ({list.length} encontradas)</p>
          </div>
          <button onClick={onNewOs} className="bg-primary-theme px-8 py-4 rounded-2xl font-black text-white shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              <Plus size={20} strokeWidth={3}/> NOVA O.S.
          </button>
       </div>

       <div className="bg-theme-card border border-theme p-6 rounded-[32px] shadow-sm mb-6 transition-all">
           
           <div className="flex flex-col md:flex-row gap-4 items-center">
               <div className="relative flex-1 w-full">
                  <input 
                    className="input-theme pl-12 w-full h-14 rounded-2xl font-bold text-sm focus:ring-4 focus:ring-primary-theme/20 transition-all" 
                    placeholder="Busque por TAG, ID, Modelo, Fabricante ou Equipamento..." 
                    value={buscaLivre} onChange={e => setBuscaLivre(e.target.value)} 
                  />
                  <Search className="absolute left-4 top-4 text-theme-muted" size={20}/>
               </div>
               
               <select className="input-theme h-14 rounded-2xl font-black uppercase text-xs w-full md:w-40" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                  <option value="">Status (Todos)</option><option value="Aberta">Aberta</option><option value="Em Execução">Em Execução</option><option value="Concluída">Concluída</option>
               </select>
               
               <select className="input-theme h-14 rounded-2xl font-black uppercase text-xs w-full md:w-40" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                  <option value="">Tipos (Todos)</option>
                  {tiposOs.map((t, i) => (
                    <option key={i} value={t.nome}>{t.nome}</option>
                  ))}
               </select>

               {/* 🚀 O BOTÃO DE COLUNAS E AVANÇADO */}
               <div className="flex items-center gap-2">
                   <div className="relative">
                      <button onClick={() => setShowColMenu(!showColMenu)} className="h-14 w-14 flex items-center justify-center bg-theme-page border border-theme text-theme-muted rounded-2xl hover:text-primary-theme transition-all">
                         <Settings2 size={20}/>
                      </button>
                      {showColMenu && (
                         <div className="absolute right-0 top-16 w-56 bg-theme-card border border-theme shadow-2xl rounded-2xl p-4 z-50 animate-slideUp">
                            <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest mb-3">Colunas Visíveis</p>
                            <div className="space-y-2">
                               {Object.keys(cols).map((c) => (
                                 <label key={c} className="flex items-center gap-3 cursor-pointer text-xs font-bold text-theme-main hover:text-primary-theme transition-colors">
                                   <input type="checkbox" checked={cols[c as keyof typeof cols]} onChange={() => toggleCol(c as keyof typeof cols)} className="w-4 h-4 accent-primary-theme rounded"/> 
                                   {c === 'id' ? 'Nº da OS' : c === 'serie' ? 'Série / TAG' : c === 'acoes' ? 'Ações Rápidas' : c.charAt(0).toUpperCase() + c.slice(1)}
                                 </label>
                               ))}
                            </div>
                         </div>
                      )}
                   </div>

                   <button 
                     onClick={() => setShowAdvanced(!showAdvanced)} 
                     className={`h-14 px-6 rounded-2xl font-black uppercase text-xs flex items-center gap-2 transition-all border-2 shrink-0 ${showAdvanced ? 'bg-primary-theme text-white border-primary-theme shadow-md' : 'bg-theme-page text-theme-muted border-theme hover:border-primary-theme hover:text-primary-theme'}`}
                   >
                     <SlidersHorizontal size={18}/> {showAdvanced ? 'Ocultar' : 'Avançado'}
                   </button>
               </div>
           </div>

           {showAdvanced && (
               <div className="mt-6 pt-6 border-t border-theme animate-slideUp grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Building2 size={12}/> Cliente / Unidade</label>
                       <select className="input-theme h-12 rounded-xl text-xs font-bold" value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)}>
                           <option value="">Todas as Unidades</option>
                           {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                       </select>
                   </div>
                   
                   <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Hash size={12}/> Série ou Patrimônio</label>
                       <input 
                         type="text" className="input-theme h-12 rounded-xl text-xs font-bold px-3" placeholder="Digite a série ou patrimônio..." 
                         value={filtroSerieOuPatrimonio} onChange={e => setFiltroSerieOuPatrimonio(e.target.value)}
                       />
                   </div>

                   <div className="flex flex-col gap-1.5">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Calendar size={12}/> Data Inicial</label>
                       <input 
                         type="date" className="input-theme h-12 rounded-xl text-xs font-bold px-3" 
                         value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)}
                       />
                   </div>

                   <div className="flex flex-col gap-1.5 relative">
                       <label className="text-[10px] font-black uppercase text-theme-muted flex items-center gap-1"><Calendar size={12}/> Data Final</label>
                       <input 
                         type="date" className="input-theme h-12 rounded-xl text-xs font-bold px-3" 
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

       {/* AÇÕES EM LOTE */}
       <div className="mb-4 flex items-center justify-between px-2">
           <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-black uppercase text-theme-muted hover:text-primary-theme transition-all">
               {selectedIds.length === list.length && list.length > 0 ? <CheckSquare size={20} className="text-primary-theme"/> : <Square size={20}/>}
               {selectedIds.length > 0 ? `${selectedIds.length} selecionadas` : 'Marcar Todas'}
           </button>
       </div>

       {/* 🚀 A NOVA TABELA DE ALTA DENSIDADE */}
       <div className="bg-theme-card rounded-[24px] border border-theme shadow-sm overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
             <thead>
                <tr className="bg-theme-page border-b border-theme text-theme-muted">
                   {cols.id && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider pl-4">OS #</th>}
                   {cols.equipamento && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Equipamento</th>}
                   {cols.serie && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Série / TAG</th>}
                   {cols.cliente && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Cliente</th>}
                   {cols.tipo && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Tipo</th>}
                   {cols.data && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Data</th>}
                   {cols.status && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider">Status</th>}
                   {cols.acoes && <th className="px-4 py-4 text-[10px] font-black uppercase tracking-wider text-right pr-6">Ações Rápidas</th>}
                </tr>
             </thead>
             <tbody className="divide-y divide-theme">
                {list.length === 0 ? (
                   <tr>
                      <td colSpan={8} className="py-12 text-center text-theme-muted text-xs font-bold">Nenhuma OS encontrada com estes filtros.</td>
                   </tr>
                ) : (
                   list.map(os => {
                      const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
                      const cli = clientes.find(c => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
                      const isSelected = selectedIds.includes(os.id);
                      const isTse = os.tipo?.toUpperCase().includes('SEGURANÇA');
                      const exigeLaudo = os.tipo === 'Calibração' || isTse;

                      return (
                         <tr key={os.id} onClick={() => onOpenOs(os.id)} className={`hover:bg-primary-theme/5 cursor-pointer transition-colors group ${isSelected ? 'bg-primary-theme/10' : ''}`}>
                            
                            {cols.id && (
                               <td className="px-4 py-3 pl-4">
                                  <div className="flex items-center gap-3">
                                     <button onClick={(e) => toggleSelectOs(os.id, e)} className="hover:scale-110 transition-transform">
                                        {isSelected ? <CheckSquare size={18} className="text-primary-theme"/> : <Square size={18} className="text-theme-muted"/>}
                                     </button>
                                     <span className="text-xs font-black text-theme-main bg-theme-page px-2 py-1 rounded border border-theme">#{os.id}</span>
                                  </div>
                               </td>
                            )}

                            {cols.equipamento && (
                               <td className="px-4 py-3">
                                  <div className="font-bold text-[11px] md:text-xs text-theme-main truncate max-w-[200px]">{eq.tecnologia?.nome || os.equipamento_nome || 'Equipamento Indefinido'}</div>
                                  <div className="text-[10px] font-medium text-theme-muted">{eq.modelo || eq.tecnologia?.modelo || 'Sem Modelo'}</div>
                               </td>
                            )}

                            {cols.serie && (
                               <td className="px-4 py-3">
                                  <div className="text-[11px] font-black text-theme-main flex items-center gap-1"><Hash size={10} className="text-theme-muted"/> {eq.numero_serie || eq.n_serie || eq.serie || 'N/A'}</div>
                                  <div className="text-[9px] font-bold text-primary-theme flex items-center gap-1 uppercase tracking-widest"><Tag size={10}/> {eq.tag || os.equipamento_tag || 'S/TAG'}</div>
                               </td>
                            )}

                            {cols.cliente && (
                               <td className="px-4 py-3">
                                  <div className="text-[11px] font-bold text-theme-main truncate max-w-[150px]">{cli.nome_fantasia || cli.razao_social || 'Sem Cliente'}</div>
                               </td>
                            )}

                            {cols.tipo && (
                               <td className="px-4 py-3">
                                  <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border ${exigeLaudo ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : 'bg-theme-page border-theme text-theme-muted'}`}>
                                     {os.tipo}
                                  </span>
                               </td>
                            )}

                            {cols.data && (
                               <td className="px-4 py-3 text-[10px] font-bold text-theme-muted">
                                  {os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '-'}
                               </td>
                            )}

                            {cols.status && (
                               <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                     <div className={`w-2 h-2 rounded-full ${os.status === 'Concluída' ? 'bg-emerald-500' : os.status === 'Em Execução' ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                                     <span className="text-[10px] font-black uppercase text-theme-main">{os.status}</span>
                                  </div>
                               </td>
                            )}

                            {cols.acoes && (
                               <td className="px-4 py-3 text-right pr-6">
                                  <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                                     <button onClick={() => onQuickPrint(os)} className="p-2 text-theme-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all" title="Imprimir O.S.">
                                        <Printer size={16}/>
                                     </button>
                                     {exigeLaudo && (
                                        <button onClick={() => onQuickPrintCertificado(os.id)} className="p-2 text-theme-muted hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all" title="Baixar Laudo/Certificado">
                                           {isTse ? <Zap size={16}/> : <FileBadge size={16}/>}
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

       {/* MENU DE AÇÕES EM LOTE */}
       {selectedIds.length > 0 && (
           <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-6 z-[9999] animate-slideUp">
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-xs ring-4 ring-blue-500/20 shadow-lg">{selectedIds.length}</div>
                   <div className="flex flex-col hidden sm:flex"><span className="font-black text-[9px] uppercase tracking-widest text-blue-400">Ordens</span><span className="font-bold text-[11px] uppercase leading-none">Selecionadas</span></div>
               </div>
               <div className="flex items-center gap-4 sm:gap-6">
                 <button onClick={() => onBulkPrintOs(selectedIds)} className="flex items-center gap-2 hover:text-blue-400 transition-all font-black text-[10px] sm:text-xs uppercase tracking-tighter group">
                    <Printer size={18} className="group-hover:scale-110 transition-transform"/> <span className="hidden sm:inline">Baixar Lote O.S.</span><span className="sm:hidden">O.S.</span>
                 </button>
                 <button onClick={() => onBulkPrintCertificados(selectedIds)} className="flex items-center gap-2 hover:text-indigo-400 transition-all font-black text-[10px] sm:text-xs uppercase tracking-tighter group">
                    <FileBadge size={18} className="group-hover:scale-110 transition-transform"/> <span className="hidden sm:inline">Baixar Certificados</span><span className="sm:hidden">Certificados</span>
                 </button>
               </div>
               <button onClick={() => setSelectedIds([])} className="p-1.5 hover:bg-rose-600 bg-slate-800 rounded-full transition-all text-slate-400 hover:text-white ml-2"><X size={20}/></button>
           </div>
       )}
    </div>
  );
}