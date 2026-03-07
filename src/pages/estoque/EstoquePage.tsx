import { useState, useEffect } from 'react';
import { Search, Plus, Package, AlertTriangle, ArrowRightLeft, Edit, FileSpreadsheet, Briefcase } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ItemFormModal } from './ItemFormModal';
import { MovimentacaoModal } from './MovimentacaoModal';
import { ImportCsvModal } from './ImportCsvModal'; 

export function EstoquePage() {
  const [itens, setItens] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [isMovModalOpen, setMovModalOpen] = useState(false);
  const [isImportModalOpen, setImportModalOpen] = useState(false); 
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  const tenantId = 1;

  const fetchEstoque = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('estoque_itens').select('*').order('nome');
    if (!error && data) setItens(data);
    setLoading(false);
  };

  useEffect(() => { fetchEstoque(); }, []);

  const itensFiltrados = itens.filter(i => 
    i.nome.toLowerCase().includes(busca.toLowerCase()) || 
    (i.codigo_sku && i.codigo_sku.toLowerCase().includes(busca.toLowerCase())) ||
    i.categoria.toLowerCase().includes(busca.toLowerCase())
  );

  const openEdit = (item: any) => { setSelectedItem(item); setItemModalOpen(true); };
  const openMov = (item: any) => { setSelectedItem(item); setMovModalOpen(true); };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8 animate-fadeIn pb-24">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
             <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <span className="p-3 bg-indigo-600 text-white rounded-2xl shadow-xl"><Package size={28}/></span>
                Catálogo de Produtos & Serviços
             </h2>
             <p className="text-slate-500 font-medium mt-2 text-sm">Controle de peças, materiais e os serviços tabelados oferecidos aos clientes.</p>
          </div>
          
          <div className="flex gap-3">
             <button onClick={() => setImportModalOpen(true)} className="bg-white border border-slate-300 text-slate-700 px-5 py-3.5 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2 text-sm">
                 <FileSpreadsheet size={18}/> Importar Planilha
             </button>
             <button onClick={() => { setSelectedItem(null); setItemModalOpen(true); }} className="bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
                 <Plus size={18}/> Novo Cadastro
             </button>
          </div>
       </div>

       <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex">
           <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                className="w-full h-10 pl-10 pr-4 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-indigo-500 transition-all" 
                placeholder="Buscar por Código, Nome ou Categoria..." 
                value={busca} onChange={e => setBusca(e.target.value)} 
              />
           </div>
       </div>

       <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left whitespace-nowrap">
             <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase pl-6">SKU / Cadastro</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Estoque Atual</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                   <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase text-right pr-6">Ações Rápidas</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {loading ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400">Carregando catálogo...</td></tr>
                ) : itensFiltrados.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-slate-400">Nenhum item ou serviço cadastrado.</td></tr>
                ) : (
                   itensFiltrados.map(item => {
                      const isServico = item.categoria === 'Serviço';
                      const isLow = !isServico && item.estoque_atual <= item.estoque_minimo;
                      
                      return (
                         <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 pl-6">
                               <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                   {isServico && <Briefcase size={14} className="text-indigo-500"/>}
                                   {item.nome}
                               </div>
                               <div className="text-xs text-slate-400 mt-1">Cód: {item.codigo_sku || 'N/A'} {item.fabricante && !isServico ? `• Fab: ${item.fabricante}` : ''}</div>
                            </td>
                            <td className="px-4 py-4">
                               <span className={`px-2.5 py-1 rounded text-xs font-semibold border ${isServico ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                  {item.categoria}
                               </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                               {isServico ? (
                                   <span className="text-lg font-black text-slate-300">-</span>
                               ) : (
                                   <>
                                     <span className={`text-lg font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>{item.estoque_atual}</span>
                                     <span className="text-xs text-slate-500 ml-1">{item.unidade_medida}</span>
                                   </>
                               )}
                            </td>
                            <td className="px-4 py-4 text-center">
                                {isServico ? (
                                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Intangível</span>
                                ) : isLow ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-50 text-rose-600 border border-rose-200"><AlertTriangle size={12}/> Baixo</span>
                                ) : (
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">Estoque OK</span>
                                )}
                            </td>
                            <td className="px-4 py-4 text-right pr-6">
                               <div className="flex items-center justify-end gap-2">
                                  {!isServico && (
                                      <button onClick={() => openMov(item)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1">
                                          <ArrowRightLeft size={14}/> Kardex
                                      </button>
                                  )}
                                  <button onClick={() => openEdit(item)} className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-lg hover:bg-indigo-50 transition-colors" title="Editar Cadastro">
                                      <Edit size={16}/>
                                  </button>
                               </div>
                            </td>
                         </tr>
                      )
                   })
                )}
             </tbody>
          </table>
       </div>

       {isItemModalOpen && <ItemFormModal isOpen={isItemModalOpen} onClose={() => setItemModalOpen(false)} onSuccess={fetchEstoque} itemToEdit={selectedItem} tenantId={tenantId} />}
       {isMovModalOpen && <MovimentacaoModal isOpen={isMovModalOpen} onClose={() => setMovModalOpen(false)} onSuccess={fetchEstoque} item={selectedItem} tenantId={tenantId} />}
       {isImportModalOpen && <ImportCsvModal isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} onSuccess={fetchEstoque} tenantId={tenantId} />}
    </div>
  );
}