import { useState, useEffect } from 'react';
import { Search, FileText, Download, Upload, Trash2, Book, Loader2, Folder, FolderOpen, MoreVertical, ShieldCheck, X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { StorageService } from '../../services/StorageService';

const getSubdomain = () => {
  const hostname = window.location.hostname;
  if (hostname === 'atlasum.com.br' || hostname === 'www.atlasum.com.br') return 'atlasum-sistema';
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'localhost') return parts[0];
  return 'atlasum-sistema'; 
};

export function BibliotecaPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<number | null>(null);

  // Estados de UI do "Drive"
  const [busca, setBusca] = useState('');
  const [pastaAtual, setPastaAtual] = useState('TODOS');
  
  // Estados do Modal de Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({ titulo: '', categoria: 'MANUAL', descricao: '', file: null as File | null });

  useEffect(() => {
    const initTenant = async () => {
      try {
        const slug = getSubdomain();
        let { data } = await supabase.from('empresas_inquilinas').select('id').eq('slug_subdominio', slug).maybeSingle();
        if (data) setTenantId(data.id);
        else setTenantId(-1);
      } catch (err) { setTenantId(-1); }
    };
    initTenant();
  }, []);

  useEffect(() => { if (tenantId && tenantId > 0) fetchDocs(); }, [tenantId]);

  const fetchDocs = async () => {
    setLoading(true);
    // 🚀 LÓGICA HÍBRIDA: Puxa os documentos do cliente E os globais da Atlasum
    const queryFilter = `tenant_id.eq.${tenantId},tenant_id.eq.1`;
    const { data } = await supabase.from('biblioteca').select('*').or(queryFilter).order('created_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  const handleUploadSubmit = async () => {
      if (!uploadForm.file || !uploadForm.titulo) return alert("Selecione um arquivo e dê um título a ele.");
      setUploading(true);
      
      try {
        const urlPublica = await StorageService.uploadArquivo(uploadForm.file, uploadForm.categoria);

        if (urlPublica) {
            await supabase.from('biblioteca').insert([{
                tenant_id: tenantId, // 🚀 SALVANDO NO COFRE DO CLIENTE
                titulo: uploadForm.titulo,
                categoria: uploadForm.categoria,
                url_arquivo: urlPublica,
                descricao: uploadForm.descricao || `Arquivo enviado em ${new Date().toLocaleDateString()}`
            }]);
            
            fetchDocs();
            setIsUploadModalOpen(false);
            setUploadForm({ titulo: '', categoria: 'MANUAL', descricao: '', file: null });
        }
      } catch (error) {
          alert("Erro no processo de upload.");
      } finally {
          setUploading(false);
      }
  };

  const deleteDoc = async (doc: any) => {
      if (doc.tenant_id === 1 && tenantId !== 1) return alert("Você não pode excluir um documento base da plataforma.");
      if (!confirm(`Deseja excluir "${doc.titulo}" permanentemente?`)) return;
      
      try {
          if(doc.url_arquivo) await StorageService.deleteArquivo(doc.url_arquivo);
          await supabase.from('biblioteca').delete().eq('id', doc.id);
          fetchDocs();
      } catch(e) { alert("Erro ao excluir o documento."); }
  }

  const pastas = [
      { id: 'TODOS', nome: 'Meu Drive (Todos)' },
      { id: 'MANUAL', nome: 'Manuais Técnicos' },
      { id: 'RDC', nome: 'Normas (RDC / ABNT)' },
      { id: 'PROCEDIMENTO', nome: 'Procedimentos (POP)' },
      { id: 'OUTROS', nome: 'Outros Arquivos' }
  ];

  const docsFiltrados = docs.filter(d => {
      const matchTexto = d.titulo.toLowerCase().includes(busca.toLowerCase()) || (d.descricao && d.descricao.toLowerCase().includes(busca.toLowerCase()));
      const matchCat = pastaAtual === 'TODOS' || d.categoria === pastaAtual;
      return matchTexto && matchCat;
  });

  if (!tenantId) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-violet-600" size={40}/></div>;

  return (
    <div className="p-6 md:p-8 animate-fadeIn max-w-[1920px] mx-auto h-[calc(100vh-4rem)] flex flex-col">
      
      {/* HEADER DO DRIVE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
        <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <span className="p-2.5 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200"><Book size={20}/></span>
                Biblioteca Digital
            </h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Armazenamento em nuvem de normativas e documentos técnicos.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold text-slate-700 focus:border-violet-500 shadow-sm transition-all" placeholder="Buscar no drive..." value={busca} onChange={e => setBusca(e.target.value)} />
            </div>
            <button onClick={() => setIsUploadModalOpen(true)} className="h-11 px-6 bg-violet-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-violet-700 transition-all active:scale-95 shrink-0 text-sm">
                <Upload size={18} strokeWidth={2.5}/> Novo Arquivo
            </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: SIDEBAR (PASTAS) + CONTEÚDO (ARQUIVOS) */}
      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
          
          {/* SIDEBAR DE PASTAS */}
          <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 pl-2">Pastas do Sistema</h3>
              {pastas.map(pasta => (
                  <button 
                    key={pasta.id} 
                    onClick={() => setPastaAtual(pasta.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all w-full text-left ${pastaAtual === pasta.id ? 'bg-violet-100 text-violet-700 shadow-inner' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                      {pastaAtual === pasta.id ? <FolderOpen size={18} className="text-violet-600"/> : <Folder size={18} className="text-slate-400"/>}
                      {pasta.nome}
                  </button>
              ))}
          </div>

          {/* ÁREA DE ARQUIVOS (LISTA) */}
          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                      <FolderOpen size={18} className="text-slate-400"/>
                      {pastas.find(p => p.id === pastaAtual)?.nome}
                  </h3>
                  <span className="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">{docsFiltrados.length} itens</span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  {loading ? (
                      <div className="flex justify-center p-20"><Loader2 className="animate-spin text-violet-600" size={40}/></div>
                  ) : docsFiltrados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-dashed border-slate-300"><FolderOpen size={32} className="text-slate-300"/></div>
                          <p className="font-bold text-lg text-slate-500">Esta pasta está vazia.</p>
                          <p className="text-sm mt-1">Nenhum documento encontrado na categoria selecionada.</p>
                      </div>
                  ) : (
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                  <th className="p-4 pl-6">Nome do Arquivo</th>
                                  <th className="p-4">Data do Upload</th>
                                  <th className="p-4 text-right pr-6">Ações</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {docsFiltrados.map(doc => {
                                  const isGlobal = doc.tenant_id === 1 && tenantId !== 1;
                                  return (
                                      <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group">
                                          <td className="p-4 pl-6">
                                              <div className="flex items-center gap-4">
                                                  <div className={`p-3 rounded-xl flex items-center justify-center shadow-sm ${isGlobal ? 'bg-amber-50 text-amber-500' : 'bg-violet-50 text-violet-500'}`}>
                                                      <FileText size={20}/>
                                                  </div>
                                                  <div>
                                                      <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                                                          {isGlobal && <ShieldCheck size={14} className="text-amber-500" title="Documento Global Padrão"/>}
                                                          {doc.titulo}
                                                      </h4>
                                                      <p className="text-xs text-slate-400 line-clamp-1">{doc.descricao}</p>
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="p-4 text-xs font-bold text-slate-500">{new Date(doc.created_at).toLocaleDateString('pt-BR')}</td>
                                          <td className="p-4 pr-6 flex justify-end gap-2 items-center h-full">
                                              {doc.url_arquivo && (
                                                  <a href={doc.url_arquivo} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold" title="Fazer Download">
                                                      <Download size={16}/>
                                                  </a>
                                              )}
                                              <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
                                              <button onClick={() => deleteDoc(doc)} className={`p-2 rounded-lg transition-colors ${isGlobal ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`} title={isGlobal ? "Documento Base (Apenas Leitura)" : "Excluir Arquivo"}>
                                                  <Trash2 size={16}/>
                                              </button>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>
      </div>

      {/* 🚀 MODAL PROFISSIONAL DE UPLOAD */}
      {isUploadModalOpen && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-slideUp">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-xl text-slate-800 flex items-center gap-2"><UploadCloud className="text-violet-600"/> Enviar Novo Arquivo</h3>
                      <button onClick={() => setIsUploadModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Nome de Exibição *</label>
                          <input type="text" className="w-full h-12 px-4 border border-slate-200 rounded-xl outline-none focus:border-violet-500 font-bold text-slate-700 bg-slate-50" placeholder="Ex: Manual de Serviço Philips CX50" value={uploadForm.titulo} onChange={e => setUploadForm({...uploadForm, titulo: e.target.value})} />
                      </div>
                      <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Pasta / Categoria *</label>
                          <select className="w-full h-12 px-4 border border-slate-200 rounded-xl outline-none focus:border-violet-500 font-bold text-slate-700 bg-slate-50 cursor-pointer" value={uploadForm.categoria} onChange={e => setUploadForm({...uploadForm, categoria: e.target.value})}>
                              {pastas.filter(p => p.id !== 'TODOS').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Descrição ou Versão (Opcional)</label>
                          <input type="text" className="w-full h-10 px-4 border border-slate-200 rounded-xl outline-none focus:border-violet-500 text-sm font-medium text-slate-600 bg-slate-50" placeholder="Ex: Rev. 2.0 (Em Português)" value={uploadForm.descricao} onChange={e => setUploadForm({...uploadForm, descricao: e.target.value})} />
                      </div>
                      <div className="pt-2">
                          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-violet-200 rounded-2xl bg-violet-50/50 hover:bg-violet-50 cursor-pointer transition-colors group">
                              <input type="file" className="hidden" accept="application/pdf,.doc,.docx" onChange={e => setUploadForm({...uploadForm, file: e.target.files?.[0] || null})} />
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                  <FileText className="text-violet-500" size={24}/>
                              </div>
                              <span className="font-bold text-slate-700 text-sm">{uploadForm.file ? uploadForm.file.name : 'Clique para buscar no computador'}</span>
                              <span className="text-xs text-slate-400 mt-1">Apenas PDF ou Word (Max. 10MB)</span>
                          </label>
                      </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                      <button onClick={() => setIsUploadModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                      <button onClick={handleUploadSubmit} disabled={uploading || !uploadForm.file} className="px-8 py-3 bg-violet-600 text-white font-black rounded-xl flex gap-2 items-center shadow-lg hover:bg-violet-700 transition-all disabled:opacity-50 disabled:hover:scale-100 active:scale-95">
                          {uploading ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>} 
                          {uploading ? 'Enviando...' : 'Fazer Upload'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}