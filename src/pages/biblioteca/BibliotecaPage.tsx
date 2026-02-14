import { useState, useEffect } from 'react';
import { Search, FileText, Download, Upload, Trash2, Book, Loader2, Filter } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { StorageService } from '../../services/StorageService';

export function BibliotecaPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');

  useEffect(() => { fetchDocs(); }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const { data } = await supabase.from('biblioteca').select('*').order('created_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  // --- UPLOAD REAL ---
  const handleUploadReal = async () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf, image/*'; 
      
      input.onchange = async (e: any) => {
          const file = e.target.files[0];
          if (!file) return;

          const nome = prompt("Nome do Documento (Ex: Manual Philips CX50):", file.name);
          if(!nome) return;
          const categoria = prompt("Categoria (MANUAL, RDC, PROCEDIMENTO):", "MANUAL") || 'OUTROS';

          setUploading(true);
          
          try {
            const urlPublica = await StorageService.uploadArquivo(file, categoria);

            if (urlPublica) {
                await supabase.from('biblioteca').insert([{
                    titulo: nome,
                    categoria: categoria.toUpperCase(),
                    url_arquivo: urlPublica,
                    descricao: `Arquivo enviado em ${new Date().toLocaleDateString()}`
                }]);
                fetchDocs();
            }
          } catch (error) {
              alert("Erro no processo de upload.");
          } finally {
              setUploading(false);
          }
      };
      
      input.click();
  };

  const deleteDoc = async (doc: any) => {
      if(!confirm(`Deseja excluir "${doc.titulo}" permanentemente?`)) return;
      
      if(doc.url_arquivo) await StorageService.deleteArquivo(doc.url_arquivo);
      await supabase.from('biblioteca').delete().eq('id', doc.id);
      fetchDocs();
  }

  const docsFiltrados = docs.filter(d => {
      const matchTexto = d.titulo.toLowerCase().includes(busca.toLowerCase());
      const matchCat = filtroCategoria === 'TODOS' || d.categoria === filtroCategoria;
      return matchTexto && matchCat;
  });

  return (
    <div className="p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <span className="p-3 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-100"><Book size={24}/></span>
                Biblioteca Técnica
            </h2>
            <p className="text-slate-500 font-medium mt-2">Central de Manuais, Normas (RDC) e Procedimentos Operacionais.</p>
        </div>
        <button onClick={handleUploadReal} disabled={uploading} className="h-12 px-8 bg-violet-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-violet-700 transition disabled:opacity-50 active:scale-95">
            {uploading ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>} 
            {uploading ? 'Enviando...' : 'Novo Documento'}
        </button>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700 focus:bg-white focus:border-violet-500 transition-all" placeholder="Buscar por nome do arquivo..." value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <div className="relative w-full md:w-64">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <select value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)} className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none cursor-pointer focus:bg-white focus:border-violet-500 transition-all">
                <option value="TODOS">Todas as Categorias</option>
                <option value="MANUAL">Manuais Técnicos</option>
                <option value="RDC">Normas / RDC</option>
                <option value="PROCEDIMENTO">Procedimentos (POP)</option>
                <option value="OUTROS">Outros Arquivos</option>
            </select>
        </div>
      </div>

      {/* GRID DE DOCUMENTOS */}
      {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-violet-600" size={40}/></div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {docsFiltrados.map(doc => (
                  <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative flex flex-col h-64">
                      
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button onClick={() => deleteDoc(doc)} className="p-2 bg-white text-slate-300 hover:text-rose-500 rounded-full shadow-sm hover:bg-rose-50 transition-colors"><Trash2 size={18}/></button>
                      </div>

                      <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                          <FileText size={32}/>
                      </div>
                      
                      <div className="flex-1">
                          <h3 className="font-bold text-slate-800 text-lg leading-snug mb-2 line-clamp-2" title={doc.titulo}>{doc.titulo}</h3>
                          <p className="text-xs text-slate-400">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>

                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg border border-slate-200">{doc.categoria}</span>
                          
                          {doc.url_arquivo && (
                              <a href={doc.url_arquivo} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-violet-700 transition-colors">
                                  <Download size={14}/> Baixar
                              </a>
                          )}
                      </div>
                  </div>
              ))}
              
              {docsFiltrados.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-400 flex flex-col items-center">
                      <Book size={64} className="mb-4 opacity-10"/>
                      <p className="font-medium">Nenhum documento encontrado.</p>
                      <p className="text-sm opacity-70">Faça o upload do seu primeiro arquivo técnico.</p>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}