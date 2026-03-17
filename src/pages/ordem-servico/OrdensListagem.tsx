import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Printer, FileBadge, X, SlidersHorizontal, 
  Building2, Zap, Settings2, FileDown, FileSpreadsheet, MessageCircle, Mail,
  ArrowUpDown, ArrowUp, ArrowDown, Calendar
} from 'lucide-react';
import { supabase } from '../../supabaseClient'; 
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [tiposOs, setTiposOs] = useState<any[]>([]);
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);

  // 🚀 ESTADOS DOS FILTROS AVANÇADOS E INLINE
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filtroClienteAv, setFiltroClienteAv] = useState('');
  
  const [colFilters, setColFilters] = useState({
      id: '', equipamento: '', serie: '', cliente: '', tipo: '', data: '', status: ''
  });

  // 🚀 ESTADOS DE ORDENAÇÃO (SORTING)
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'id', direction: 'desc' });

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

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  // 🚀 O MOTOR CENTRAL: FILTRA TUDO E ORDENA
  const list = useMemo(() => {
    let filtered = (ordens || []).filter(os => {
      const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
      const cli = clientes.find(c => c.id === eq.cliente_id || c.id === os.cliente_id) || {};
      
      const eqNome = (eq.tecnologia?.nome || os.equipamento_nome || eq.nome || '').toLowerCase();
      const eqSerie = (eq.numero_serie || eq.n_serie || eq.serie || os.equipamento_serie || '').toLowerCase();
      const tag = (eq.tag || os.equipamento_tag || '').toLowerCase();
      const tipoOS = (os.tipo || '').toLowerCase();
      const statusOS = (os.status || '').toLowerCase();
      const cliNome = (cli.nome_fantasia || cli.razao_social || '').toLowerCase();
      
      // 1. Busca Livre (Global)
      const termo = buscaLivre.toLowerCase();
      const matchBuscaLivre = !termo || String(os.id).includes(termo) || eqNome.includes(termo) || eqSerie.includes(termo) || tag.includes(termo) || cliNome.includes(termo);

      // 2. Filtros Inline (Por Coluna)
      const matchColId = !colFilters.id || String(os.id).includes(colFilters.id);
      const matchColEq = !colFilters.equipamento || eqNome.includes(colFilters.equipamento.toLowerCase());
      const matchColSerie = !colFilters.serie || tag.includes(colFilters.serie.toLowerCase()) || eqSerie.includes(colFilters.serie.toLowerCase());
      const matchColCli = !colFilters.cliente || cliNome.includes(colFilters.cliente.toLowerCase());
      const matchColTipo = !colFilters.tipo || tipoOS.includes(colFilters.tipo.toLowerCase());
      const matchColStatus = !colFilters.status || statusOS.includes(colFilters.status.toLowerCase());
      
      // 3. Filtros Avançados (Data e Cliente)
      const matchClienteAv = !filtroClienteAv || String(cli.id) === filtroClienteAv;
      
      let matchDate = true;
      if (dateRange.start || dateRange.end) {
          const osDate = new Date(os.created_at);
          if (dateRange.start) matchDate = matchDate && osDate >= new Date(dateRange.start + 'T00:00:00');
          if (dateRange.end) matchDate = matchDate && osDate <= new Date(dateRange.end + 'T23:59:59');
      }

      return matchBuscaLivre && matchColId && matchColEq && matchColSerie && matchColCli && matchColTipo && matchColStatus && matchClienteAv && matchDate;
    });

    // 4. Ordenação (Sorting)
    filtered.sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        const eqA = equipamentos.find(e => e.id === a.equipamento_id) || {};
        const cliA = clientes.find(c => c.id === eqA.cliente_id || c.id === a.cliente_id) || {};
        const eqB = equipamentos.find(e => e.id === b.equipamento_id) || {};
        const cliB = clientes.find(c => c.id === eqB.cliente_id || c.id === b.cliente_id) || {};

        if (sortConfig.key === 'id') { valA = a.id; valB = b.id; }
        else if (sortConfig.key === 'equipamento') { valA = (eqA.tecnologia?.nome || a.equipamento_nome || eqA.nome || '').toLowerCase(); valB = (eqB.tecnologia?.nome || b.equipamento_nome || eqB.nome || '').toLowerCase(); }
        else if (sortConfig.key === 'serie') { valA = (eqA.tag || '').toLowerCase(); valB = (eqB.tag || '').toLowerCase(); }
        else if (sortConfig.key === 'cliente') { valA = (cliA.nome_fantasia || '').toLowerCase(); valB = (cliB.nome_fantasia || '').toLowerCase(); }
        else if (sortConfig.key === 'tipo') { valA = (a.tipo || '').toLowerCase(); valB = (b.tipo || '').toLowerCase(); }
        else if (sortConfig.key === 'data') { valA = new Date(a.created_at || 0).getTime(); valB = new Date(b.created_at || 0).getTime(); }
        else if (sortConfig.key === 'status') { valA = (a.status || '').toLowerCase(); valB = (b.status || '').toLowerCase(); }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
  }, [ordens, equipamentos, clientes, buscaLivre, colFilters, sortConfig, dateRange, filtroClienteAv]);

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

  const handleBulkCertificados = () => {
      const validOsIds = list.filter(os => {
          if (!selectedIds.includes(os.id)) return false;
          const isTse = (os.tipo || '').toUpperCase().includes('SEGURANÇA');
          const exigeLaudo = os.tipo === 'Calibração' || isTse;
          return exigeLaudo && os.status === 'Concluída'; 
      }).map(os => os.id);

      if (validOsIds.length === 0) {
          alert('Atenção: Nenhuma das O.S. selecionadas possui Laudo/Certificado válido para emissão (Apenas Calibração ou TSE Concluídas possuem laudo).');
          return;
      }
      if (validOsIds.length < selectedIds.length) {
          alert(`Aviso: O lote contém O.S. sem laudo (ex: Corretivas). O sistema irá gerar laudos apenas para as ${validOsIds.length} ordens válidas.`);
      }
      onBulkPrintCertificados(validOsIds);
  };

  const getCommonClient = () => {
      const selectedOs = list.filter(os => selectedIds.includes(os.id));
      if (selectedOs.length === 0) return null;

      const firstEq = equipamentos.find(e => e.id === selectedOs[0].equipamento_id) || {};
      const firstClientId = firstEq.cliente_id || selectedOs[0].cliente_id;

      const allSameClient = selectedOs.every(os => {
          const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
          return (eq.cliente_id || os.cliente_id) === firstClientId;
      });

      if (allSameClient && firstClientId) return clientes.find(c => c.id === firstClientId);
      return null;
  };

  const buildShareText = () => {
      const baseUrl = window.location.origin; 
      const selectedOs = list.filter(os => selectedIds.includes(os.id));
      let text = `Olá! Seguem os links de acesso das Ordens de Serviço finalizadas:\n\n`;
      selectedOs.forEach(os => {
         const eq = equipamentos.find(e => e.id === os.equipamento_id) || {};
         const eqNome = eq.tecnologia?.nome || os.equipamento_nome || eq.nome || 'Equipamento';
         const link = `${baseUrl}/view/os/${os.id_publico || os.id}`;
         text += `*OS #${os.id}* - ${eqNome}\n🔗 ${link}\n\n`;
      });
      text += `Qualquer dúvida, a equipe técnica está à disposição.`;
      return text;
  };

  const handleShareWhatsApp = () => {
      const text = encodeURIComponent(buildShareText());
      const cliente = getCommonClient();
      let phone = '';
      if (cliente && cliente.telefone) phone = cliente.telefone.replace(/\D/g, ''); 
      const url = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`;
      window.open(url, '_blank');
  };

  // 🚀 E-MAIL BLINDADO (Injeção de <a> tag invisível)
  const handleShareEmail = () => {
      const text = encodeURIComponent(buildShareText());
      const subject = encodeURIComponent(`Envio de Ordens de Serviço - ${configEmpresa?.nome_fantasia || 'Engenharia Clínica'}`);
      const cliente = getCommonClient();
      let email = '';
      if (cliente && (cliente.email_contato || cliente.email)) email = cliente.email_contato || cliente.email;

      const mailtoLink = `mailto:${email}?subject=${subject}&body=${text}`;
      
      // Cria um link invisível e força o clique (Dribla bloqueios de pop-up e navegação SPA)
      const a = document.createElement('a');
      a.href = mailtoLink;
      a.click();
      
      // Feedback caso o Windows não abra
      if(!email) alert("O provedor de e-mail será aberto. Como as OS são de clientes diferentes, digite o destinatário manualmente.");
  };

  const SortIcon = ({ colKey }: { colKey: string }) => {
      if (sortConfig.key !== colKey) return <ArrowUpDown size={12} className="opacity-30 group-hover:opacity-100 transition-opacity ml-1 inline-block" />;
      return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-indigo-600 ml-1 inline-block" /> : <ArrowDown size={12} className="text-indigo-600 ml-1 inline-block" />;
  };

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-40">
        
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
          <div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">Gestão de Ordens de Serviço</h2>
             <p className="text-slate-500 font-medium text-sm mt-1">{list.length} registros encontrados com os filtros atuais.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
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

       {/* BARRA DE PESQUISA RÁPIDA E BOTÕES */}
       <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-wrap xl:flex-nowrap gap-2 items-center">
            <div className="relative flex-1 min-w-[300px]">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <input 
                 className="w-full h-12 pl-12 pr-4 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" 
                 placeholder="Busca rápida em qualquer campo (TAG, ID, Cliente, Equipamento)..." 
                 value={buscaLivre} onChange={e => setBuscaLivre(e.target.value)} 
               />
            </div>
            
            <div className="flex items-center gap-2 w-full xl:w-auto">
                <div className="relative">
                   <button onClick={() => setShowColMenu(!showColMenu)} className="h-10 px-4 flex items-center gap-2 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                      <Settings2 size={16}/> Colunas
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
                   <SlidersHorizontal size={16}/> {showAdvanced ? 'Ocultar Filtro Avançado' : 'Filtro Avançado'}
                </button>
            </div>
       </div>

       {/* 🚀 FILTROS AVANÇADOS (DATAS E CLIENTE MASTER) */}
       {showAdvanced && (
           <div className="mb-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-6 animate-slideDown">
               <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Data Inicial</label>
                   <input type="date" className="w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 outline-none focus:border-indigo-500 shadow-sm" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})}/>
               </div>
               <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Data Final</label>
                   <input type="date" className="w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 outline-none focus:border-indigo-500 shadow-sm" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})}/>
               </div>
               <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Building2 size={14}/> Filtrar por Unidade</label>
                   <select className="w-full h-11 bg-white border border-slate-200 rounded-xl text-sm font-bold px-3 outline-none focus:border-indigo-500 shadow-sm" value={filtroClienteAv} onChange={e => setFiltroClienteAv(e.target.value)}>
                       <option value="">Todas as Unidades</option>
                       {clientes.map(c => <option key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</option>)}
                   </select>
               </div>
               <div className="flex items-end">
                   <button onClick={() => { setFiltroClienteAv(''); setDateRange({start:'', end:''}); setColFilters({id:'', equipamento:'', serie:'', cliente:'', tipo:'', data:'', status:''}); setBuscaLivre(''); }} className="h-11 px-6 text-xs font-black text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100">
                       Limpar Todos os Filtros
                   </button>
               </div>
           </div>
       )}

       <div className="bg-white border border-slate-200 rounded-[2rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar pb-10">
            <table className="w-full text-left whitespace-nowrap">
                <thead>
                   {/* LINHA 1: TÍTULOS COM ORDENAÇÃO */}
                   <tr className="bg-slate-50 border-b border-slate-100">
                      {cols.id && (
                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group" onClick={() => handleSort('id')}>
                           <div className="flex items-center gap-3">
                              <input type="checkbox" checked={selectedIds.length === list.length && list.length > 0} onChange={toggleSelectAll} onClick={e => e.stopPropagation()} className="w-4 h-4 accent-indigo-600 rounded border-slate-300 cursor-pointer"/> 
                              <span>OS # <SortIcon colKey="id"/></span>
                           </div>
                        </th>
                      )}
                      {cols.equipamento && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('equipamento')}>Equipamento <SortIcon colKey="equipamento"/></th>}
                      {cols.serie && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('serie')}>Identificação <SortIcon colKey="serie"/></th>}
                      {cols.cliente && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('cliente')}>Localização <SortIcon colKey="cliente"/></th>}
                      {cols.tipo && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('tipo')}>Tipo de Serviço <SortIcon colKey="tipo"/></th>}
                      {cols.data && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('data')}>Abertura <SortIcon colKey="data"/></th>}
                      {cols.status && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>Status <SortIcon colKey="status"/></th>}
                      {cols.acoes && <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right pr-6">Ações</th>}
                   </tr>
                   
                   {/* 🚀 LINHA 2: FILTROS INLINE (O SEGREDO DA PRODUTIVIDADE) */}
                   <tr className="bg-white border-b-2 border-slate-100">
                      {cols.id && <th className="px-2 py-2 pl-11"><input placeholder="Filtrar ID..." className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400" value={colFilters.id} onChange={e => setColFilters({...colFilters, id: e.target.value})}/></th>}
                      {cols.equipamento && <th className="px-2 py-2"><input placeholder="Filtrar Eq..." className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400" value={colFilters.equipamento} onChange={e => setColFilters({...colFilters, equipamento: e.target.value})}/></th>}
                      {cols.serie && <th className="px-2 py-2"><input placeholder="Filtrar Tag/Série..." className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400" value={colFilters.serie} onChange={e => setColFilters({...colFilters, serie: e.target.value})}/></th>}
                      {cols.cliente && <th className="px-2 py-2"><input placeholder="Filtrar Cliente..." className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400" value={colFilters.cliente} onChange={e => setColFilters({...colFilters, cliente: e.target.value})}/></th>}
                      {cols.tipo && <th className="px-2 py-2">
                          <select className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400" value={colFilters.tipo} onChange={e => setColFilters({...colFilters, tipo: e.target.value})}>
                              <option value="">Todos</option>{tiposOs.map((t,i)=><option key={i} value={t.nome}>{t.nome}</option>)}
                          </select>
                      </th>}
                      {cols.data && <th className="px-2 py-2"><div className="w-full h-8 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase cursor-pointer" onClick={() => setShowAdvanced(true)}>Usar Filtro Data</div></th>}
                      {cols.status && <th className="px-2 py-2">
                          <select className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-bold outline-none focus:border-indigo-400" value={colFilters.status} onChange={e => setColFilters({...colFilters, status: e.target.value})}>
                              <option value="">Todos</option><option value="Aberta">Aberta</option><option value="Em Execução">Execução</option><option value="Concluída">Concluída</option>
                          </select>
                      </th>}
                      {cols.acoes && <th className="px-2 py-2"></th>}
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
                         
                         const isTse = (os.tipo || '').toUpperCase().includes('SEGURANÇA');
                         const exigeLaudo = os.tipo === 'Calibração' || isTse;

                         return (
                            <tr key={os.id} onClick={() => onOpenOs(os.id)} className={`group hover:bg-slate-50 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/40' : ''}`}>
                               
                               {cols.id && (
                                  <td className="px-4 py-4">
                                     <div className="flex items-center gap-3">
                                        <input type="checkbox" checked={isSelected} onClick={(e) => toggleSelectOs(os.id, e)} readOnly className="w-4 h-4 accent-indigo-600 rounded border-slate-300 cursor-pointer"/>
                                        <span className="text-sm font-black text-slate-900">#{os.id}</span>
                                     </div>
                                  </td>
                               )}

                               {cols.equipamento && (
                                  <td className="px-4 py-4">
                                     <div className="text-sm font-bold text-slate-800 truncate max-w-[200px]">{eq.tecnologia?.nome || os.equipamento_nome || eq.nome || 'Equipamento'}</div>
                                     <div className="text-[11px] font-medium text-slate-400">{eq.modelo || eq.tecnologia?.modelo || 'Sem Modelo'}</div>
                                  </td>
                               )}

                               {cols.serie && (
                                  <td className="px-4 py-4">
                                     <div className="text-xs font-black text-slate-700 uppercase tracking-tight">TAG: {eq.tag || os.equipamento_tag || '-'}</div>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase">S/N: {eq.numero_serie || eq.n_serie || '-'}</div>
                                  </td>
                               )}

                               {cols.cliente && (
                                  <td className="px-4 py-4">
                                     <div className="text-sm font-bold text-blue-600 truncate max-w-[150px]">{cli.nome_fantasia || cli.razao_social || 'Hospital Interno'}</div>
                                     <div className="text-[10px] font-bold text-slate-400 uppercase">{os.setor || 'UTI Geral'}</div>
                                  </td>
                               )}

                               {cols.tipo && (
                                  <td className="px-4 py-4">
                                     <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${exigeLaudo ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                                        {os.tipo || '-'}
                                     </span>
                                  </td>
                               )}

                               {cols.data && (
                                  <td className="px-4 py-4 text-xs font-bold text-slate-500">
                                     {os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '-'}
                                  </td>
                               )}

                               {cols.status && (
                                  <td className="px-4 py-4">
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
                                  <td className="px-4 py-4 text-right pr-6">
                                     <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickPrint(os); }} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-200 transition-all" title="Imprimir Ficha da O.S.">
                                           <Printer size={18}/>
                                        </button>
                                        
                                        {exigeLaudo && (
                                           <button 
                                              onClick={(e) => { 
                                                 e.preventDefault(); 
                                                 e.stopPropagation(); 
                                                 if (os.status !== 'Concluída') alert('Atenção: Esta Ordem de Serviço ainda não foi finalizada. O laudo pode estar incompleto.');
                                                 onQuickPrintCertificado(os.id); 
                                              }} 
                                              className={`px-3 py-2 flex items-center gap-1.5 rounded-xl shadow-sm border transition-all ${
                                                 os.status === 'Concluída' 
                                                 ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' 
                                                 : 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100'
                                              }`} 
                                              title={os.status === 'Concluída' ? "Baixar Laudo RBC/TSE" : "Laudo Pendente"}
                                           >
                                              {isTse ? <Zap size={18}/> : <FileBadge size={18}/>}
                                              <span className="text-[10px] font-black uppercase tracking-wider hidden sm:block">
                                                 {os.status === 'Concluída' ? 'Laudo OK' : 'Pendente'}
                                              </span>
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

       {/* BARRA DE AÇÕES EM LOTE */}
       {selectedIds.length > 0 && (
           <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 z-[9999] animate-slideUp">
               <div className="flex items-center gap-4 border-r border-slate-700 pr-8">
                   <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-base shadow-lg ring-4 ring-indigo-500/20">{selectedIds.length}</div>
                   <div className="flex flex-col"><span className="font-black text-xs uppercase tracking-widest text-slate-400">Seleção Ativa</span></div>
               </div>
               
               <div className="flex flex-wrap items-center gap-3">
                 <button onClick={() => onBulkPrintOs(selectedIds)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95">
                    <Printer size={16} className="text-slate-300"/> Fichas
                 </button>

                 <button onClick={handleBulkCertificados} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95">
                    <FileBadge size={16} className="text-white"/> Laudos
                 </button>
                 
                 <div className="w-px h-8 bg-slate-700 mx-2 hidden sm:block"></div>

                 <button onClick={handleShareWhatsApp} className="flex items-center gap-2 px-5 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95 shadow-md shadow-[#25D366]/20">
                    <MessageCircle size={16}/> Enviar WhatsApp
                 </button>
                 
                 <button onClick={handleShareEmail} className="flex items-center gap-2 px-5 py-2.5 bg-[#0078D4] hover:bg-[#006cbd] text-white rounded-xl transition-all text-xs font-black uppercase tracking-wider active:scale-95 shadow-md shadow-[#0078D4]/20">
                    <Mail size={16}/> E-mail
                 </button>
               </div>

               <button onClick={() => setSelectedIds([])} className="p-2.5 bg-slate-800 hover:bg-rose-500 text-slate-400 hover:text-white rounded-full transition-all ml-2 shadow-inner border border-slate-700 hover:border-rose-400"><X size={20}/></button>
           </div>
       )}
    </div>
  );
}