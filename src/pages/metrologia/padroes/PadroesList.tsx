import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Calendar, CheckCircle, UploadCloud, Edit, Scale } from 'lucide-react';
import { supabase } from '../../../supabaseClient';
import { PadroesFormModal } from './PadroesFormModal';
import { UploadCertificadoModal } from '../UploadCertificadoModal'; // <--- CORREÇÃO AQUI (Apenas um ponto duplo ../)
import { format, parseISO, isAfter, isValid } from 'date-fns';

export function PadroesList() {
  const [padroes, setPadroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => { carregarPadroes(); }, []);

  const carregarPadroes = async () => {
    setLoading(true);
    const { data } = await supabase.from('padroes').select('*').order('nome');
    if (data) setPadroes(data);
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleUpload = (item: any) => {
    setSelectedItem(item);
    setIsUploadOpen(true);
  };

  const openPdf = (url: string) => {
    window.open(url, '_blank');
  };

  const itensFiltrados = padroes.filter(p => 
    p.nome.toLowerCase().includes(busca.toLowerCase()) || 
    p.n_serie.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="animate-fadeIn">
      
      {/* BARRA DE FERRAMENTAS */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex gap-2 items-center w-full md:w-auto flex-1 max-w-lg">
            <Search className="ml-3 text-slate-400" size={20}/>
            <input 
                className="w-full h-10 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                placeholder="Buscar analisador por nome ou série..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
            />
        </div>
        <button 
            onClick={() => { setSelectedItem(null); setIsFormOpen(true); }} 
            className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-transform active:scale-95 w-full md:w-auto"
        >
            <Plus size={20}/> Novo Analisador
        </button>
      </div>

      {/* GRID DE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {itensFiltrados.map(item => {
            const dataVenc = item.data_vencimento ? parseISO(item.data_vencimento) : null;
            const vencido = dataVenc && isValid(dataVenc) ? !isAfter(dataVenc, new Date()) : false;
            
            return (
                <div key={item.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all group flex flex-col overflow-hidden">
                    
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 dark:bg-slate-900 border border-indigo-100 rounded-xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-inner">
                                <Scale size={20}/>
                            </div>
                            <span className={`px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-wider ${vencido ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                                {vencido ? 'Certificado Vencido' : 'Calibração Vigente'}
                            </span>
                        </div>
                        
                        <h3 className="font-black text-lg text-slate-800 dark:text-white truncate mb-1" title={item.nome}>{item.nome}</h3>
                        <p className="text-xs font-bold text-slate-400 font-mono mb-5 bg-slate-50 inline-block px-2 py-1 rounded border border-slate-100">SN: {item.n_serie}</p>
                        
                        <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-2 font-medium"><Calendar size={16} className={vencido ? 'text-red-400' : 'text-slate-400'}/> Validade</span>
                                <strong className={vencido ? 'text-red-600' : 'text-slate-800'}>
                                    {dataVenc ? format(dataVenc, 'dd/MM/yyyy') : 'N/A'}
                                </strong>
                            </div>
                            {item.orgao_calibrador && (
                                <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-2 font-medium"><CheckCircle size={16} className="text-emerald-500"/> Laboratório</span>
                                    <span className="truncate max-w-[150px] font-bold text-slate-800" title={item.orgao_calibrador}>{item.orgao_calibrador}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* AÇÕES (Rodapé do Card) */}
                    <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600 p-px">
                        <button onClick={() => handleEdit(item)} className="py-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                            <Edit size={14}/> Editar Dados
                        </button>
                        
                        <div className="flex gap-px">
                            <button onClick={() => handleUpload(item)} className="flex-1 py-3 bg-white dark:bg-slate-800 hover:bg-blue-50 text-slate-600 dark:text-blue-400 hover:text-blue-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors">
                                <UploadCloud size={14}/> Anexar
                            </button>

                            {item.certificado_url && (
                                <button onClick={() => openPdf(item.certificado_url)} className="flex-1 py-3 bg-white dark:bg-slate-800 hover:bg-emerald-50 text-emerald-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors" title="Ver Certificado Atual">
                                    <FileText size={14}/> Ver PDF
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {itensFiltrados.length === 0 && !loading && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300 mt-6">
              <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                  <Scale size={32}/>
              </div>
              <h3 className="text-slate-500 font-medium">Nenhum analisador encontrado.</h3>
          </div>
      )}

      {/* MODAIS (Protegidos por KEY) */}
      {isFormOpen && (
        <PadroesFormModal 
            key={selectedItem ? selectedItem.id : 'new-padrao'}
            isOpen={isFormOpen} 
            onClose={() => setIsFormOpen(false)} 
            onSuccess={() => { carregarPadroes(); setIsFormOpen(false); }} 
            padraoId={selectedItem?.id} 
        />
      )}
      
      {isUploadOpen && selectedItem && (
        <UploadCertificadoModal 
            key={`upload-${selectedItem.id}`}
            isOpen={isUploadOpen} 
            onClose={() => setIsUploadOpen(false)} 
            onSuccess={() => { carregarPadroes(); setIsUploadOpen(false); }} 
            item={selectedItem} 
        />
      )}
    </div>
  );
}