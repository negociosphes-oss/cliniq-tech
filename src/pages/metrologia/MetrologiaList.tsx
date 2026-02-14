import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Calendar, AlertTriangle, CheckCircle, UploadCloud, Edit, Scale } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { PadroesFormModal } from './PadroesFormModal';
import { UploadCertificadoModal } from '../UploadCertificadoModal'; // Importando o novo modal
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
      {/* Barra de Topo */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-3 text-slate-400" size={18}/>
            <input 
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Buscar por nome ou série..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
            />
        </div>
        <button onClick={() => { setSelectedItem(null); setIsFormOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95">
            <Plus size={18}/> Novo Instrumento
        </button>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {itensFiltrados.map(item => {
            const dataVenc = item.data_vencimento ? parseISO(item.data_vencimento) : null;
            const vencido = dataVenc && isValid(dataVenc) ? !isAfter(dataVenc, new Date()) : false;
            
            return (
                <div key={item.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                            <Scale size={24}/>
                        </div>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${vencido ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            {vencido ? 'Vencido' : 'Vigente'}
                        </span>
                    </div>
                    
                    <h3 className="font-bold text-slate-800 dark:text-white truncate" title={item.nome}>{item.nome}</h3>
                    <p className="text-xs text-slate-500 mb-4">S/N: {item.n_serie}</p>
                    
                    <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <Calendar size={14} className="text-slate-400"/>
                            <span>Vence: <strong>{dataVenc ? format(dataVenc, 'dd/MM/yyyy') : 'N/A'}</strong></span>
                        </div>
                        {item.orgao_calibrador && (
                            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                                <FileText size={14} className="text-slate-400"/>
                                <span>Lab: {item.orgao_calibrador}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-4 border-t dark:border-slate-700">
                        <button onClick={() => handleEdit(item)} className="flex-1 py-2 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                            <Edit size={14}/> Editar
                        </button>
                        
                        <button onClick={() => handleUpload(item)} className="flex-1 py-2 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold flex items-center justify-center gap-2">
                            <UploadCloud size={14}/> PDF
                        </button>

                        {item.certificado_url && (
                             <button onClick={() => openPdf(item.certificado_url)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-100" title="Ver Certificado">
                                <FileText size={16}/>
                             </button>
                        )}
                    </div>
                </div>
            );
        })}
      </div>

      {isFormOpen && <PadroesFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={() => { carregarPadroes(); setIsFormOpen(false); }} padraoId={selectedItem?.id} />}
      {isUploadOpen && <UploadCertificadoModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={() => { carregarPadroes(); setIsUploadOpen(false); }} item={selectedItem} />}
    </div>
  );
}