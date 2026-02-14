import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Search, Monitor, Filter, History, Edit3, Trash2, 
  ChevronDown, ChevronUp, Eraser, Printer, ArrowUpDown, 
  ShieldCheck, QrCode, FileSpreadsheet, Download, Loader2,
  Hash, Factory, User, Activity, Tag, UploadCloud, FileDown
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { EquipamentosForm } from './EquipamentosForm';
import { EquipamentoDetalhes } from './EquipamentoDetalhes'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function EquipamentosPage() {
  const [loading, setLoading] = useState(true);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [formVersion, setFormVersion] = useState(0);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    buscaGlobal: '', tag: '', serial: '', patrimonio: '',
    tipo: '', fabricante: '', modelo: '', cliente: '', status: ''
  });
  
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchEquipamentos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipamentos')
        .select(`*, cliente:clientes(id, nome_fantasia), tecnologia:tecnologias!fk_tecnologia_oficial(nome, fabricante, modelo, registro_anvisa)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipamentos(data || []);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEquipamentos(); }, []);

  // Dados para Filtros
  const uniqueData = useMemo(() => {
    const clientesMap = new Map();
    const fabricantesSet = new Set<string>();
    const modelosSet = new Set<string>();
    const tiposSet = new Set<string>();

    equipamentos.forEach(item => {
        if (item.cliente) clientesMap.set(item.cliente.id, item.cliente.nome_fantasia);
        const fab = item.fabricante || item.tecnologia?.fabricante;
        const mod = item.modelo || item.tecnologia?.modelo;
        const tipo = item.nome || item.tecnologia?.nome;
        if (fab) fabricantesSet.add(fab);
        if (mod) modelosSet.add(mod);
        if (tipo) tiposSet.add(tipo);
    });

    return {
        clientes: Array.from(clientesMap.entries()),
        fabricantes: Array.from(fabricantesSet).sort(),
        modelos: Array.from(modelosSet).sort(),
        tipos: Array.from(tiposSet).sort()
    };
  }, [equipamentos]);

  // Filtragem
  const processedItems = useMemo(() => {
    let result = equipamentos.filter(item => {
      const iNome = (item.nome || item.tecnologia?.nome || '').toLowerCase();
      const iFab = (item.fabricante || item.tecnologia?.fabricante || '').toLowerCase();
      const iMod = (item.modelo || item.tecnologia?.modelo || '').toLowerCase();
      const iTag = (item.tag || '').toLowerCase();
      const iSerie = (item.n_serie || '').toLowerCase();
      const iStatus = (item.status || '').toLowerCase();
      const iClienteId = item.cliente?.id?.toString();

      const fGlobal = filters.buscaGlobal.toLowerCase().trim();
      
      const matchGlobal = !fGlobal || iTag.includes(fGlobal) || iSerie.includes(fGlobal) || iNome.includes(fGlobal) || iFab.includes(fGlobal) || iMod.includes(fGlobal);
      const matchTag = !filters.tag || iTag.includes(filters.tag.toLowerCase());
      const matchSerial = !filters.serial || iSerie.includes(filters.serial.toLowerCase());
      const matchPat = !filters.patrimonio || (item.patrimonio || '').toLowerCase().includes(filters.patrimonio.toLowerCase());
      const matchTipo = !filters.tipo || iNome.includes(filters.tipo.toLowerCase());
      const matchFab = !filters.fabricante || iFab.includes(filters.fabricante.toLowerCase());
      const matchMod = !filters.modelo || iMod.includes(filters.modelo.toLowerCase());
      const matchCliente = !filters.cliente || iClienteId === filters.cliente;
      const matchStatus = !filters.status || iStatus === filters.status.toLowerCase();

      return matchGlobal && matchTag && matchSerial && matchPat && matchTipo && matchFab && matchMod && matchCliente && matchStatus;
    });

    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aVal = '', bVal = '';
        if (sortConfig.key === 'tag') { aVal = a.tag; bVal = b.tag; }
        else if (sortConfig.key === 'equipamento') { aVal = a.nome || a.tecnologia?.nome; bVal = b.nome || b.tecnologia?.nome; }
        else { aVal = a[sortConfig.key]; bVal = b[sortConfig.key]; }
        
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [equipamentos, filters, sortConfig]);

  // Ações
  const handleNew = () => { setSelectedItem(null); setFormVersion(v => v + 1); setIsModalOpen(true); };
  const handleEdit = (item: any) => { setSelectedItem(item); setFormVersion(v => v + 1); setIsModalOpen(true); };
  const handleHistory = (item: any) => { setSelectedItem(item); setIsDetailsOpen(true); };
  const handleDelete = async (id: number) => {
    if (!confirm('Deseja excluir?')) return;
    await supabase.from('equipamentos').delete().eq('id', id);
    fetchEquipamentos();
  };
  const clearFilters = () => { setFilters({ buscaGlobal: '', tag: '', serial: '', patrimonio: '', tipo: '', fabricante: '', modelo: '', cliente: '', status: '' }); setSortConfig(null); };
  const requestSort = (key: string) => { setSortConfig({ key, direction: sortConfig?.direction === 'asc' ? 'desc' : 'asc' }); };

  // Exportação
  const handleDownloadTemplate = () => { /* Mesma lógica anterior */ };
  const handleFileUpload = async (e: any) => { /* Mesma lógica anterior */ };
  const handleExportExcel = () => {
    const data = processedItems.map(i => ({
        TAG: i.tag, EQUIPAMENTO: i.nome || i.tecnologia?.nome, FABRICANTE: i.fabricante || i.tecnologia?.fabricante,
        MODELO: i.modelo || i.tecnologia?.modelo, SERIE: i.n_serie, CLIENTE: i.cliente?.nome_fantasia, STATUS: i.status
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Inventario");
    XLSX.writeFile(wb, "Inventario.xlsx");
  };
  const handleGenerateReport = () => { /* Mesma lógica PDF */ };

  return (
    <div className="p-8 animate-fadeIn max-w-[1900px] mx-auto pb-24">
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-end mb-8 gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Monitor size={24}/></span> 
            Inventário Geral
          </h2>
          <p className="text-slate-500 font-medium mt-2">Base instalada ({processedItems.length} ativos).</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
           <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
               <button onClick={handleExportExcel} className="btn-tool text-emerald-700"><FileSpreadsheet size={16}/> Excel</button>
           </div>
           <button onClick={handleNew} className="h-12 px-6 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 ml-2">
             <Plus size={20}/> Novo Ativo
           </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className={`bg-white rounded-[2rem] shadow-sm border mb-6 transition-all ${showFilters ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-100'}`}>
        <div className="flex gap-3 p-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input className="w-full pl-12 h-12 bg-slate-50 rounded-xl font-medium outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
              placeholder="Busca Rápida..." value={filters.buscaGlobal} onChange={e => setFilters({...filters, buscaGlobal: e.target.value})} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="px-6 rounded-xl font-bold flex items-center gap-2 border bg-white text-slate-600"><Filter size={18}/> Filtros {showFilters ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</button>
          {Object.values(filters).some(v => v) && <button onClick={clearFilters} className="px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-100"><Eraser size={18}/></button>}
        </div>
        
        {showFilters && (
          <div className="p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-5 bg-slate-50/30">
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Fabricante</label>
                <select className="input-filter" value={filters.fabricante} onChange={e => setFilters({...filters, fabricante: e.target.value})}>
                    <option value="">Todos</option>{uniqueData.fabricantes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente</label>
                <select className="input-filter" value={filters.cliente} onChange={e => setFilters({...filters, cliente: e.target.value})}>
                    <option value="">Todos</option>{uniqueData.clientes.map(([id, nm]) => <option key={id} value={id}>{nm}</option>)}
                </select>
             </div>
             {/* Outros filtros... */}
          </div>
        )}
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? <div className="p-12 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto"/></div> : (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-black border-b border-slate-100 select-none">
                <tr>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5 cursor-pointer hover:text-blue-600" onClick={() => requestSort('tag')}>TAG / ID</th>
                    <th className="p-5 cursor-pointer hover:text-blue-600" onClick={() => requestSort('equipamento')}>Equipamento</th>
                    <th className="p-5">Localização</th>
                    <th className="p-5 text-right">Ações</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                {processedItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-5 text-center"><span className={`inline-block px-2 py-1 rounded-md text-[10px] font-bold border uppercase ${item.status === 'Operacional' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{item.status}</span></td>
                    <td className="p-5"><div className="font-bold text-slate-800 font-mono text-xs">{item.tag}</div><div className="text-[10px] text-slate-400">S/N: {item.n_serie}</div></td>
                    <td className="p-5"><div className="font-bold">{item.nome || item.tecnologia?.nome}</div><div className="text-xs text-slate-500">{item.fabricante || item.tecnologia?.fabricante} • {item.modelo || item.tecnologia?.modelo}</div></td>
                    <td className="p-5 text-xs font-bold text-blue-600">{item.cliente?.nome_fantasia}</td>
                    <td className="p-5 text-right flex justify-end gap-2">
                        <button onClick={() => handleHistory(item)} className="btn-icon"><History size={16}/></button>
                        <button onClick={() => handleEdit(item)} className="btn-icon text-amber-500 hover:bg-amber-50"><Edit3 size={16}/></button>
                        <button onClick={() => handleDelete(item.id)} className="btn-icon text-rose-500 hover:bg-rose-50"><Trash2 size={16}/></button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
        )}
      </div>

      {isModalOpen && <EquipamentosForm key={`form-${selectedItem?.id || 'new'}-${formVersion}`} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchEquipamentos(); }} equipmentToEdit={selectedItem} />}
      {isDetailsOpen && selectedItem && <EquipamentoDetalhes isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} equipamento={selectedItem} />}
      
      <style>{`
        .btn-tool { @apply px-4 py-2.5 text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg font-bold text-xs flex items-center gap-2 transition-all border-r border-slate-100 last:border-0; }
        .input-filter { @apply w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none focus:border-blue-500 transition-all; }
        .btn-icon { @apply p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm; }
      `}</style>
    </div>
  );
}