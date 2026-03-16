import { useState, useEffect } from 'react';
import { Plus, Search, Filter, QrCode, Edit2, Trash2, Loader2, CheckSquare, Square, Printer, FileSpreadsheet, FileDown, X, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { supabase } from '../../supabaseClient';

import { RelatorioInventarioService } from '../../services/RelatorioInventarioService';
import { EquipamentosForm } from './EquipamentosForm'; 
import { EquipamentoDetalhes } from './EquipamentoDetalhes'; 
import { BatchEtiquetasModal } from './components/BatchEtiquetasModal'; 

// 🚀 FAREJADOR DE SUBDOMÍNIO CORRIGIDO
const getSubdomain = () => {
  const hostname = window.location.hostname;
  if (hostname === 'atlasum.com.br' || hostname === 'www.atlasum.com.br') return 'atlasum-sistema';
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') return parts[0];
  return 'atlasum-sistema'; 
};

export function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configEmpresa, setConfigEmpresa] = useState<any>(null);
  const [tenantId, setTenantId] = useState<number | null>(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedEquipForDetails, setSelectedEquipForDetails] = useState<any>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedEquips, setSelectedEquips] = useState<number[]>([]);

  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  const [fTag, setFTag] = useState('');
  const [fPatrimonio, setFPatrimonio] = useState('');
  const [fSerie, setFSerie] = useState('');
  const [fCliente, setFCliente] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fRisco, setFRisco] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fFabricante, setFFabricante] = useState('');

  useEffect(() => {
    const initTenant = async () => {
      try {
        const slug = getSubdomain();
        let { data } = await supabase.from('empresas_inquilinas').select('*').eq('slug_subdominio', slug).maybeSingle();
        if (data) {
            setTenantId(data.id);
            setConfigEmpresa(data); // 🚀 O PDF VAI USAR A CONFIGURAÇÃO DO CLIENTE CERTO AQUI!
        } else {
            setTenantId(-1);
        }
      } catch (err) {
        setTenantId(-1);
      }
    };
    initTenant();
  }, []);

  useEffect(() => {
      if (tenantId && tenantId > 0) fetchData();
  }, [tenantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🚀 BUSCA BLINDADA POR TENANT_ID
      const [resEq, resCli] = await Promise.all([
          supabase.from('equipamentos').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
          supabase.from('clientes').select('id, nome_fantasia').eq('tenant_id', tenantId)
      ]);

      if (resEq.error) throw resEq.error;

      const cliMap = new Map((resCli.data || []).map(c => [String(c.id), c]));
      const eqHidratados = (resEq.data || []).map(eq => ({
          ...eq,
          clienteData: cliMap.get(String(eq.cliente_id))
      }));

      setEquipamentos(eqHidratados);
    } catch (error: any) {
      console.error('Erro de conexão:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEquipamentos = equipamentos.filter(eq => {
      const tag = (eq.tag || '').toLowerCase();
      const patrimonio = (eq.patrimonio || '').toLowerCase();
      const serie = (eq.n_serie || '').toLowerCase();
      const cliente = (eq.clienteData?.nome_fantasia || eq.clientes?.nome_fantasia || '').toLowerCase();
      const status = (eq.status || 'Operacional').toLowerCase();
      const risco = (eq.classe_risco || '').toLowerCase();
      const tipo = (eq.nome || '').toLowerCase();
      const fabricante = (eq.fabricante || '').toLowerCase();

      if (fTag && !tag.includes(fTag.toLowerCase())) return false;
      if (fPatrimonio && !patrimonio.includes(fPatrimonio.toLowerCase())) return false;
      if (fSerie && !serie.includes(fSerie.toLowerCase())) return false;
      if (fCliente && cliente !== fCliente.toLowerCase()) return false;
      if (fStatus && status !== fStatus.toLowerCase()) return false;
      if (fRisco && risco !== fRisco.toLowerCase()) return false;
      if (fTipo && tipo !== fTipo.toLowerCase()) return false;
      if (fFabricante && fabricante !== fFabricante.toLowerCase()) return false;

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchesGeneral = tag.includes(term) || serie.includes(term) || tipo.includes(term) || cliente.includes(term) || fabricante.includes(term);
          if (!matchesGeneral) return false;
      }
      return true;
  });

  const uniqueClientes = Array.from(new Set(equipamentos.map(eq => eq.clienteData?.nome_fantasia || eq.clientes?.nome_fantasia).filter(Boolean))).sort();
  const uniqueTipos = Array.from(new Set(equipamentos.map(eq => eq.nome).filter(Boolean))).sort();
  const uniqueFabs = Array.from(new Set(equipamentos.map(eq => eq.fabricante).filter(Boolean))).sort();

  const limparFiltros = () => {
      setFTag(''); setFPatrimonio(''); setFSerie(''); setFCliente('');
      setFStatus(''); setFRisco(''); setFTipo(''); setFFabricante('');
      setSearchTerm('');
  };

  const handleSelectEquip = (id: number) => setSelectedEquips(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = () => {
      if (selectedEquips.length === filteredEquipamentos.length) setSelectedEquips([]);
      else setSelectedEquips(filteredEquipamentos.map(eq => eq.id));
  };

  const handleDelete = async (id: number, tag: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o equipamento ${tag}? Esta ação não pode ser desfeita.`)) return;
    try {
      await supabase.from('equipamentos').delete().eq('id', id);
      fetchData();
      setSelectedEquips(prev => prev.filter(x => x !== id));
    } catch (error: any) { alert('Erro ao excluir: ' + error.message); }
  };

  const handleOpenEdit = (id: number) => { setEditId(id); setShowFormModal(true); };
  const handleOpenDetails = (equipamento: any) => { setSelectedEquipForDetails(equipamento); };
  const handleCloseForm = () => { setShowFormModal(false); setEditId(null); };

  const handleExportExcel = () => {
      const dataToExport = selectedEquips.length > 0 ? filteredEquipamentos.filter(eq => selectedEquips.includes(eq.id)) : filteredEquipamentos;
      RelatorioInventarioService.exportarExcel(dataToExport);
  };
  const handlePrintPDF = () => {
      const dataToExport = selectedEquips.length > 0 ? filteredEquipamentos.filter(eq => selectedEquips.includes(eq.id)) : filteredEquipamentos;
      RelatorioInventarioService.imprimirPDF(dataToExport, configEmpresa);
  };

  if (!tenantId) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  return (
    <div className="p-6 md:p-8 max-w-[1920px] mx-auto min-h-screen animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg"><QrCode size={24}/></div>
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Inventário Geral</h1>
                <p className="text-slate-500 font-medium mt-1">Base instalada ({filteredEquipamentos.length} ativos listados).</p>
            </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            {selectedEquips.length > 0 && (
                <button onClick={() => setShowBatchModal(true)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-black flex items-center gap-2 transition-all shadow-lg animate-fadeIn">
                    <Printer size={18}/> Lote Etiquetas ({selectedEquips.length})
                </button>
            )}
            
            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                <button onClick={handlePrintPDF} className="px-4 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-2 transition-all" title="Gerar Relatório em PDF">
                    <FileDown size={18}/> PDF
                </button>
                <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                <button onClick={handleExportExcel} className="px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg font-bold flex items-center gap-2 transition-all" title="Baixar Planilha Excel">
                    <FileSpreadsheet size={18}/> Excel
                </button>
            </div>

            <button onClick={() => { setEditId(null); setShowFormModal(true); }} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 ml-2">
                <Plus size={20}/> Novo Ativo
            </button>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm mb-4 flex flex-wrap md:flex-nowrap gap-2 items-center">
        <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input type="text" placeholder="Busca Rápida Geral..." className="w-full h-12 pl-12 pr-4 bg-transparent text-slate-700 font-medium outline-none placeholder:text-slate-400" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border ${showFilters ? 'bg-blue-50 text-blue-600 border-blue-200 shadow-inner' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
            <Filter size={18}/> Filtros Avançados {showFilters && <X size={16} className="ml-1"/>}
        </button>
      </div>

      {showFilters && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg mb-6 animate-slideDown">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2"><SlidersHorizontal size={16} className="text-blue-600"/> Cruzamento de Dados</h3>
                  <button onClick={limparFiltros} className="text-xs font-bold text-rose-500 hover:text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">Limpar Todos</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">TAG do Ativo</label>
                      <input type="text" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500" value={fTag} onChange={e => setFTag(e.target.value)} placeholder="Ex: TAG-001" />
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Patrimônio</label>
                      <input type="text" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500" value={fPatrimonio} onChange={e => setFPatrimonio(e.target.value)} placeholder="Ex: 405020" />
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Nº de Série</label>
                      <input type="text" className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500" value={fSerie} onChange={e => setFSerie(e.target.value)} placeholder="Ex: SN..." />
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Status de Operação</label>
                      <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500" value={fStatus} onChange={e => setFStatus(e.target.value)}>
                          <option value="">Todos</option><option value="operacional">Operacional</option><option value="manutenção">Em Manutenção</option><option value="inativo">Inativo / Baixado</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">Classe de Risco</label>
                      <select className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:border-blue-500" value={fRisco} onChange={e => setFRisco(e.target.value)}>
                          <option value="">Todas</option><option value="I - Baixo Risco">I - Baixo Risco</option><option value="II - Médio Risco">II - Médio Risco</option><option value="III - Alto Risco">III - Alto Risco</option><option value="IV - Máximo Risco">IV - Máximo Risco</option>
                      </select>
                  </div>
                  <SearchableSelect label="Cliente / Unidade" placeholder="Selecionar..." options={uniqueClientes} value={fCliente} onChange={setFCliente} />
                  <SearchableSelect label="Tipo de Equipamento" placeholder="Selecionar..." options={uniqueTipos} value={fTipo} onChange={setFTipo} />
                  <SearchableSelect label="Fabricante" placeholder="Selecionar..." options={uniqueFabs} value={fFabricante} onChange={setFFabricante} />
              </div>
          </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-5 w-14 text-center">
                            <button onClick={handleSelectAll} className="text-slate-400 hover:text-blue-600 transition-colors">
                                {selectedEquips.length === filteredEquipamentos.length && filteredEquipamentos.length > 0 ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                            </button>
                        </th>
                        <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-400">TAG / ID</th>
                        <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Equipamento</th>
                        <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Localização</th>
                        <th className="p-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={6} className="p-12 text-center text-slate-400"><Loader2 className="animate-spin mx-auto mb-2" size={24}/> Carregando inventário...</td></tr>
                    ) : filteredEquipamentos.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="p-16 text-center">
                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Search size={32} className="text-slate-300"/></div>
                                <p className="text-slate-500 font-bold text-lg">Nenhum equipamento encontrado.</p>
                                <p className="text-slate-400 text-sm mt-1">Tente ajustar a busca ou limpar os filtros avançados.</p>
                            </td>
                        </tr>
                    ) : (
                        filteredEquipamentos.map((eq) => {
                            const isSelected = selectedEquips.includes(eq.id);
                            const nomeEquip = eq.nome || 'N/A';
                            const fabricante = eq.fabricante || '-';
                            const modelo = eq.modelo || '';
                            const nomeCliente = eq.clienteData?.nome_fantasia || eq.clientes?.nome_fantasia || 'Sem Cliente';
                            const status = eq.status || 'OPERACIONAL';

                            return (
                                <tr key={eq.id} className={`hover:bg-slate-50 transition-colors group cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`} onClick={() => handleSelectEquip(eq.id)}>
                                    <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                                        <button onClick={() => handleSelectEquip(eq.id)} className="text-slate-300 hover:text-blue-600 transition-colors">
                                            {isSelected ? <CheckSquare size={20} className="text-blue-600"/> : <Square size={20}/>}
                                        </button>
                                    </td>
                                    <td className="p-5" onClick={() => handleOpenDetails(eq)}>
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${status === 'OPERACIONAL' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-amber-200 text-amber-700 bg-amber-50'}`}>{status}</span>
                                    </td>
                                    <td className="p-5" onClick={() => handleOpenDetails(eq)}>
                                        <p className="font-black text-sm text-slate-800">{eq.tag}</p>
                                        <p className="text-xs font-medium text-slate-500 mt-0.5">S/N: {eq.n_serie || 'N/A'}</p>
                                    </td>
                                    <td className="p-5" onClick={() => handleOpenDetails(eq)}>
                                        <p className="font-bold text-sm text-slate-800">{nomeEquip}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{fabricante} {modelo ? `• ${modelo}` : ''}</p>
                                    </td>
                                    <td className="p-5" onClick={() => handleOpenDetails(eq)}>
                                        <p className="font-bold text-sm text-blue-600">{nomeCliente}</p>
                                        {eq.setor && <p className="text-xs text-slate-500 mt-0.5">{eq.setor}</p>}
                                    </td>
                                    <td className="p-5" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenDetails(eq)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Abrir HUB do Equipamento"><QrCode size={18}/></button>
                                            <button onClick={() => handleOpenEdit(eq.id)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar Dados"><Edit2 size={18}/></button>
                                            <button onClick={() => handleDelete(eq.id, eq.tag)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={18}/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {showFormModal && <EquipamentosForm isOpen={showFormModal} onClose={handleCloseForm} onSuccess={() => { handleCloseForm(); fetchData(); }} editId={editId} tenantId={tenantId} />}
      {/* 🚀 PASSANDO O TENANT_ID PARA OS DETALHES PARA CORRIGIR O PDF */}
      {selectedEquipForDetails && <EquipamentoDetalhes isOpen={!!selectedEquipForDetails} onClose={() => setSelectedEquipForDetails(null)} equipamento={selectedEquipForDetails} tenantId={tenantId} />}
      {showBatchModal && <BatchEtiquetasModal equipamentos={equipamentos.filter(eq => selectedEquips.includes(eq.id))} configEmpresa={configEmpresa} onClose={() => setShowBatchModal(false)} />}
    </div>
  );
}

function SearchableSelect({ label, options, value, onChange, placeholder }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filteredOptions = options.filter((opt: string) => opt.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="relative">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1.5 block">{label}</label>
            <div className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold flex items-center justify-between cursor-pointer transition-colors hover:border-blue-300" onClick={() => setIsOpen(!isOpen)}>
                <span className={`truncate mr-2 ${value ? "text-slate-800" : "text-slate-400"}`}>{value || placeholder}</span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
            </div>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
                        <div className="p-2 border-b border-slate-100 bg-slate-50">
                            <input type="text" className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors" placeholder="Pesquisar..." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                        </div>
                        <ul className="max-h-48 overflow-y-auto custom-scrollbar bg-white">
                            <li className="px-4 py-2.5 text-xs hover:bg-blue-50 cursor-pointer text-slate-500 font-bold border-b border-slate-50" onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}>Mostrar Todos</li>
                            {filteredOptions.map((opt: string, i: number) => (
                                <li key={i} className={`px-4 py-2.5 text-xs cursor-pointer font-bold border-b border-slate-50 last:border-0 ${value === opt ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 text-slate-700'}`} onClick={() => { onChange(opt); setIsOpen(false); setSearch(''); }}>{opt}</li>
                            ))}
                            {filteredOptions.length === 0 && <li className="px-4 py-3 text-xs text-slate-400 text-center font-medium">Nenhum resultado</li>}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}