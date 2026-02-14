import { useState, useEffect, useMemo } from 'react';
import { X, Save, Building, MapPin, FileText, UploadCloud, Download, DollarSign, Landmark, Receipt, FilePlus, Loader2, Trash2, Search, Filter, ShieldCheck } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { format, isAfter, parseISO } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cliente: any;
  onUpdate: () => void;
}

export function ClienteHub({ isOpen, onClose, cliente, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'cadastro' | 'financeiro' | 'contratos'>('cadastro');
  const [loading, setLoading] = useState(false);
  
  // Estados de Filtro
  const [buscaDoc, setBuscaDoc] = useState('');
  const [filtroAno, setFiltroAno] = useState('Todos');
  
  const [formData, setFormData] = useState(() => {
    if (cliente) return { ...cliente };
    return { 
        razao_social: '', nome_fantasia: '', doc_id: '', email: '', telefone: '',
        cep: '', endereco: '', cidade: '', estado: '', responsavel: '',
        banco: '', agencia: '', conta: '', chave_pix: '', condicao_pagamento: ''
    };
  });

  const [documentos, setDocumentos] = useState<any[]>([]);
  const [contratos, setContratos] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  const [novoDoc, setNovoDoc] = useState({ tipo: 'NOTA_FISCAL', numero_documento: '', valor: '', data_emissao: format(new Date(), 'yyyy-MM-dd') });
  const [novoContrato, setNovoContrato] = useState({ titulo: '', data_vencimento: '' });

  useEffect(() => {
    if (cliente?.id) {
        fetchDocumentos();
        fetchContratos();
    }
  }, [cliente]);

  const fetchDocumentos = async () => {
    const { data } = await supabase.from('cliente_financeiro').select('*').eq('cliente_id', cliente.id).order('data_emissao', { ascending: false });
    setDocumentos(data || []);
  };

  const fetchContratos = async () => {
    const { data } = await supabase.from('cliente_contratos').select('*').eq('cliente_id', cliente.id).order('created_at', { ascending: false });
    setContratos(data || []);
  };

  // LÓGICA DE FILTRO RESTAURADA
  const documentosFiltrados = useMemo(() => {
    return documentos.filter(doc => {
        const matchesBusca = doc.numero_documento.toLowerCase().includes(buscaDoc.toLowerCase()) || doc.tipo.toLowerCase().includes(buscaDoc.toLowerCase());
        const matchesAno = filtroAno === 'Todos' || doc.data_emissao.startsWith(filtroAno);
        return matchesBusca && matchesAno;
    });
  }, [documentos, buscaDoc, filtroAno]);

  const totalFiltrado = useMemo(() => {
    return documentosFiltrados.reduce((acc, curr) => acc + Number(curr.valor), 0);
  }, [documentosFiltrados]);

  const anosDisponiveis = useMemo(() => {
    const anos = documentos.map(d => d.data_emissao.substring(0, 4));
    return ['Todos', ...Array.from(new Set(anos)).sort().reverse()];
  }, [documentos]);

  const handleSaveCliente = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
        if (cliente?.id) {
            await supabase.from('clientes').update(formData).eq('id', cliente.id);
            alert('Cadastro atualizado!');
            onUpdate();
        } else {
            const { data, error } = await supabase.from('clientes').insert([formData]).select().single();
            if (error) throw error;
            alert('Cliente criado com sucesso!');
            onUpdate();
            onClose();
        }
    } catch (error: any) { alert('Erro: ' + error.message); } 
    finally { setLoading(false); }
  };

  const handleUploadDocumento = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !cliente?.id) return;
    if (!novoDoc.numero_documento || !novoDoc.valor) return alert("Preencha Nº e Valor.");

    setUploadingDoc(true);
    try {
        const fileName = `financeiro/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        await supabase.storage.from('app-assets').upload(fileName, file);
        const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(fileName);
        
        await supabase.from('cliente_financeiro').insert([{
            cliente_id: cliente.id,
            tipo: novoDoc.tipo,
            numero_documento: novoDoc.numero_documento,
            valor: parseFloat(novoDoc.valor.replace(',', '.')),
            data_emissao: novoDoc.data_emissao,
            arquivo_url: urlData.publicUrl
        }]);

        setNovoDoc({ tipo: 'NOTA_FISCAL', numero_documento: '', valor: '', data_emissao: format(new Date(), 'yyyy-MM-dd') });
        fetchDocumentos();
    } catch (err: any) { alert(err.message); } finally { setUploadingDoc(false); }
  };

  const handleAddContrato = async (e: any) => {
    const file = e.target.files[0];
    if (!file || !novoContrato.titulo) return alert("Defina um título para o contrato.");
    setUploadingDoc(true);
    try {
        const fileName = `contratos/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
        await supabase.storage.from('app-assets').upload(fileName, file);
        const { data: urlData } = supabase.storage.from('app-assets').getPublicUrl(fileName);
        
        await supabase.from('cliente_contratos').insert([{
            cliente_id: cliente.id,
            titulo: novoContrato.titulo,
            data_vencimento: novoContrato.data_vencimento || null,
            arquivo_url: urlData.publicUrl
        }]);
        setNovoContrato({ titulo: '', data_vencimento: '' });
        fetchContratos();
    } catch (err: any) { alert(err.message); } finally { setUploadingDoc(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[92vh] rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col animate-fadeIn">
        
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-xl border border-indigo-400 uppercase">
                    {formData.nome_fantasia?.charAt(0) || <Building size={24}/>}
                </div>
                <div>
                    <h2 className="text-xl font-black tracking-tight uppercase">{formData.nome_fantasia || 'Novo Cliente'}</h2>
                    <p className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase">{formData.doc_id || 'CNPJ PENDENTE'}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"><X size={24}/></button>
        </div>
        
        {/* ABAS */}
        <div className="flex bg-slate-50 border-b border-slate-200 px-6 pt-4 gap-4 shrink-0">
            <TabButton active={activeTab === 'cadastro'} onClick={() => setActiveTab('cadastro')} label="Dados Gerais" icon={<Building size={16}/>} />
            <TabButton active={activeTab === 'financeiro'} onClick={() => setActiveTab('financeiro')} label="Financeiro & Notas" icon={<DollarSign size={16}/>} disabled={!cliente?.id}/>
            <TabButton active={activeTab === 'contratos'} onClick={() => setActiveTab('contratos')} label="Contratos" icon={<FileText size={16}/>} disabled={!cliente?.id}/>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 custom-scrollbar">
            
            {activeTab === 'cadastro' && (
                <div className="max-w-4xl mx-auto space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Nome Fantasia" value={formData.nome_fantasia} onChange={(e:any) => setFormData({...formData, nome_fantasia: e.target.value})} />
                        <Field label="CNPJ / CPF" value={formData.doc_id} onChange={(e:any) => setFormData({...formData, doc_id: e.target.value})} />
                        <Field label="Razão Social" value={formData.razao_social} onChange={(e:any) => setFormData({...formData, razao_social: e.target.value})} />
                        <Field label="E-mail" value={formData.email} onChange={(e:any) => setFormData({...formData, email: e.target.value})} />
                    </div>
                </div>
            )}

            {activeTab === 'financeiro' && (
                <div className="max-w-5xl mx-auto space-y-6">
                    
                    {/* BARRA DE FILTROS RESTAURADA */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex-1 relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                            <input 
                                className="w-full pl-10 h-10 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="Procurar por NF ou Orçamento..."
                                value={buscaDoc}
                                onChange={e => setBuscaDoc(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-slate-400"/>
                            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-sm font-bold outline-none">
                                {anosDisponiveis.map(ano => <option key={ano} value={ano}>{ano}</option>)}
                            </select>
                        </div>
                        <div className="h-10 px-4 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-2 border border-indigo-100">
                            <span className="text-[10px] font-black uppercase tracking-wider">Total:</span>
                            <span className="font-black text-sm">R$ {totalFiltrado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    {/* FORM DE UPLOAD */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Tipo</label>
                            <select value={novoDoc.tipo} onChange={e => setNovoDoc({...novoDoc, tipo: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-2 text-sm font-bold outline-none">
                                <option value="NOTA_FISCAL">Nota Fiscal</option>
                                <option value="ORCAMENTO">Orçamento</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Número</label>
                            <input value={novoDoc.numero_documento} onChange={e => setNovoDoc({...novoDoc, numero_documento: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none" placeholder="Ex: NF-001"/>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Valor</label>
                            <input type="number" value={novoDoc.valor} onChange={e => setNovoDoc({...novoDoc, valor: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none" placeholder="0.00"/>
                        </div>
                        <div className="md:col-span-2 relative">
                            <input type="file" accept=".pdf" onChange={handleUploadDocumento} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <button disabled={uploadingDoc} className="w-full h-11 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg hover:bg-indigo-700 flex items-center justify-center gap-2">
                                {uploadingDoc ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={18}/>} ANEXAR PDF
                            </button>
                        </div>
                    </div>

                    {/* LISTA DE DOCUMENTOS */}
                    <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                <tr>
                                    <th className="p-5 pl-8">Documento / Data</th>
                                    <th className="p-5 text-right">Valor</th>
                                    <th className="p-5 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {documentosFiltrados.map(doc => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-5 pl-8 font-black text-slate-700">
                                            <span className={`text-[9px] px-2 py-0.5 rounded border mr-2 ${doc.tipo === 'NOTA_FISCAL' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>{doc.tipo}</span>
                                            {doc.numero_documento}
                                            <span className="block text-[10px] text-slate-400 mt-1">{format(new Date(doc.data_emissao), 'dd/MM/yyyy')}</span>
                                        </td>
                                        <td className="p-5 text-right font-black text-slate-900">R$ {Number(doc.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-5 text-center">
                                            <button onClick={() => window.open(doc.arquivo_url, '_blank')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"><Download size={16}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ABA CONTRATOS */}
            {activeTab === 'contratos' && (
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nome do Contrato / Aditivo</label>
                            <input value={novoContrato.titulo} onChange={e => setNovoContrato({...novoContrato, titulo: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none" placeholder="Ex: Manutenção Preventiva 2026"/>
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Vencimento</label>
                            <input type="date" value={novoContrato.data_vencimento} onChange={e => setNovoContrato({...novoContrato, data_vencimento: e.target.value})} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold outline-none"/>
                        </div>
                        <div className="relative">
                            <input type="file" accept=".pdf" onChange={handleAddContrato} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                            <button className="w-full h-11 bg-slate-900 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black">
                                <UploadCloud size={18}/> SUBIR CONTRATO
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contratos.map(c => {
                            const vencido = c.data_vencimento && !isAfter(parseISO(c.data_vencimento), new Date());
                            return (
                                <div key={c.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-2xl ${vencido ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                            <ShieldCheck size={24}/>
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-sm">{c.titulo}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">Validade: {c.data_vencimento ? format(parseISO(c.data_vencimento), 'dd/MM/yyyy') : 'Indeterminada'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => window.open(c.arquivo_url, '_blank')} className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <Download size={20}/>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
            <button onClick={onClose} className="px-6 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-xl">Fechar Janela</button>
            <button onClick={handleSaveCliente} disabled={loading} className="bg-slate-900 text-white px-10 py-3 rounded-2xl font-black text-xs shadow-xl flex items-center gap-2 hover:bg-black transition-all">
                <Save size={18}/> GRAVAR ALTERAÇÕES
            </button>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, ...props }: any) => (
    <div className="flex flex-col gap-2 w-full">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{label}</label>
        <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner" {...props} />
    </div>
);

const TabButton = ({ active, onClick, label, icon, disabled }: any) => (
    <button 
        onClick={onClick} 
        disabled={disabled}
        className={`px-8 py-5 text-[10px] font-black uppercase tracking-widest border-b-4 transition-all flex items-center gap-2 
        ${active ? 'bg-white border-indigo-600 text-indigo-600 shadow-sm' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100'}
        ${disabled ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
    >
        {icon} {label}
    </button>
);