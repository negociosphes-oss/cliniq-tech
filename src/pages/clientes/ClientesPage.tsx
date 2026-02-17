import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Building2, MapPin, Edit3, Trash2, ChevronRight, FileText, Printer, Filter } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { ClienteHub } from './ClienteHub';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<any>(null);
  
  const [tenantId, setTenantId] = useState<number>(1); // 🚀 ESTADO DO FAREJADOR

  // 🚀 1. MOTOR FAREJADOR
  useEffect(() => {
    const initTenant = async () => {
      try {
        const hostname = window.location.hostname;
        let slug = hostname.split('.')[0];
        
        if (slug === 'localhost' || slug === 'app' || slug === 'www') {
            slug = 'atlasum';
        }

        const { data: tenant } = await supabase
            .from('empresas_inquilinas')
            .select('id')
            .eq('slug_subdominio', slug)
            .maybeSingle();

        const tId = tenant ? tenant.id : 1;
        setTenantId(tId);
        fetchClientes(tId);
      } catch (err) {
        console.error("Erro ao identificar inquilino:", err);
      }
    };
    initTenant();
  }, []);

  // 🚀 2. FECHADURA DE BUSCA: Só vê os próprios clientes
  const fetchClientes = async (tId: number) => {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('tenant_id', tId) // Trava de Segurança
      .order('nome_fantasia');
    setClientes(data || []);
  };

  const handleOpenHub = (cliente: any = null) => {
    setSelectedCliente(cliente);
    setIsHubOpen(true);
  };

  // 🚀 3. FECHADURA DE EXCLUSÃO
  const handleDelete = async (id: number) => {
    if(!confirm('ATENÇÃO: Excluir o cliente apagará também Contratos e Dados Bancários. Continuar?')) return;
    try {
        const { error } = await supabase
          .from('clientes')
          .delete()
          .eq('id', id)
          .eq('tenant_id', tenantId); // Trava Hacker-Proof
          
        if (error) throw error;
        fetchClientes(tenantId);
    } catch (error: any) {
        alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleReport = () => {
    const doc = new jsPDF();
    doc.text('Relatório Geral de Clientes', 14, 20);
    const tableData = clientes.map(c => [c.nome_fantasia, c.doc_id, c.telefone, c.cidade]);
    autoTable(doc, { startY: 30, head: [['Cliente', 'Documento', 'Telefone', 'Cidade']], body: tableData });
    doc.save('clientes.pdf');
  };

  const filtered = useMemo(() => {
    return clientes.filter(c => 
        c.nome_fantasia?.toLowerCase().includes(busca.toLowerCase()) || 
        c.doc_id?.includes(busca)
    );
  }, [clientes, busca]);

  return (
    <div className="min-h-screen bg-slate-50/50 p-8 animate-fadeIn max-w-[1600px] mx-auto pb-24">
      {/* HEADER PROFISSIONAL */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 border-b border-slate-200 pb-6">
        <div>
            <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <span className="p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200"><Building2 size={24}/></span>
              Gestão de Clientes
            </h2>
            <p className="text-slate-500 font-medium mt-2 ml-1">Gerencie contratos, financeiro e unidades.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={handleReport} className="h-10 px-4 bg-white border border-slate-300 text-slate-700 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-sm">
                <Printer size={18}/> Relatório
            </button>
            <button onClick={() => handleOpenHub(null)} className="h-10 px-6 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg hover:bg-blue-700 transition active:scale-95">
                <Plus size={18}/> Novo Cliente
            </button>
        </div>
      </div>

      {/* BARRA DE FERRAMENTAS */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-6 flex gap-2 items-center">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
            <input 
                className="w-full pl-10 pr-4 h-12 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400" 
                placeholder="Pesquisar por Nome Fantasia, Razão Social ou CNPJ..." 
                value={busca} 
                onChange={e => setBusca(e.target.value)} 
            />
        </div>
        <div className="h-8 w-px bg-slate-200 mx-2"></div>
        <div className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
            {filtered.length} Registros
        </div>
      </div>

      {/* TABELA COM BORDAS E DEFINIÇÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                    <th className="p-4 w-1/3 border-r border-slate-200">Cliente / Razão Social</th>
                    <th className="p-4 w-1/4 border-r border-slate-200">Documento (CNPJ/CPF)</th>
                    <th className="p-4 border-r border-slate-200">Localização</th>
                    <th className="p-4 text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map(c => (
                    <tr key={c.id} className="hover:bg-blue-50/40 transition-colors group">
                        <td className="p-4 border-r border-slate-100">
                            <div className="font-bold text-slate-800 text-base">{c.nome_fantasia}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">{c.razao_social}</div>
                        </td>
                        <td className="p-4 border-r border-slate-100">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
                                {c.doc_id || 'Não Informado'}
                            </span>
                        </td>
                        <td className="p-4 border-r border-slate-100 text-slate-600 flex items-center gap-2">
                            <div className="p-1.5 bg-rose-50 text-rose-500 rounded"><MapPin size={14}/></div>
                            <div>
                                <div className="font-medium">{c.cidade || '-'}</div>
                                <div className="text-[10px] text-slate-400">{c.estado || 'UF'}</div>
                            </div>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleOpenHub(c)} className="h-8 px-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-blue-100 hover:border-blue-200 transition-all">
                                    Abrir Ficha <ChevronRight size={14}/>
                                </button>
                                <button onClick={() => handleDelete(c.id)} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Excluir">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {filtered.length === 0 && (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Nenhum cliente encontrado.</td></tr>
                )}
            </tbody>
        </table>
      </div>

      {isHubOpen && (
        <ClienteHub 
            key={selectedCliente ? selectedCliente.id : 'new'} 
            isOpen={isHubOpen} 
            onClose={() => setIsHubOpen(false)} 
            cliente={selectedCliente} 
            onUpdate={() => fetchClientes(tenantId)}
            tenantId={tenantId} // 🚀 4. PASSANDO O INQUILINO PARA O FORMULÁRIO DE CLIENTE
        />
      )}
    </div>
  );
}