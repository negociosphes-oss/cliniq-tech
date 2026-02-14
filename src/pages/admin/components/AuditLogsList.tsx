import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';
import { 
  Search, Filter, Calendar, User, ArrowRight, 
  Activity, LayoutList, FileText, AlertCircle, 
  Clock, CheckCircle2, XCircle, Trash2, Plus, Edit3 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AuditLogsList() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  
  // Filtros
  const [filtroTexto, setFiltroTexto] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('Todos');

  useEffect(() => {
    fetchLogs();
  }, [filtroTexto, filtroModulo]);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('logs_auditoria')
      .select('*')
      .order('data', { ascending: false })
      .limit(50);

    if (filtroTexto) query = query.ilike('usuario_nome', `%${filtroTexto}%`);
    if (filtroModulo !== 'Todos') query = query.eq('modulo', filtroModulo);

    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Helper para ícone e cor baseada na ação
  const getActionMeta = (acao: string) => {
    const lower = acao.toLowerCase();
    if (lower.includes('exclu') || lower.includes('delet')) return { icon: Trash2, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' };
    if (lower.includes('cria') || lower.includes('cadastr') || lower.includes('novo')) return { icon: Plus, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' };
    if (lower.includes('edit') || lower.includes('alter')) return { icon: Edit3, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' };
    return { icon: Activity, color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' };
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. BARRA DE COMANDO SUPERIOR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center sticky top-24 z-20">
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
               <LayoutList size={20}/>
            </div>
            <div>
               <h3 className="font-bold text-slate-800 text-sm">Rastreabilidade</h3>
               <p className="text-[11px] text-slate-500 font-medium">Registro forense de atividades</p>
            </div>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <select 
                className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none cursor-pointer hover:border-blue-300 transition-colors"
                value={filtroModulo}
                onChange={e => setFiltroModulo(e.target.value)}
            >
                <option value="Todos">Todos Módulos</option>
                <option value="Operacional">Operacional</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Admin">Sistema</option>
            </select>

            <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input 
                    className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all placeholder:text-slate-400"
                    placeholder="Buscar usuário, ação ou ID..."
                    value={filtroTexto}
                    onChange={e => setFiltroTexto(e.target.value)}
                />
            </div>
         </div>
      </div>

      {/* 2. TIMELINE FORENSE */}
      <div className="relative pl-6 border-l-2 border-slate-100 ml-4 space-y-8 pb-12">
        {loading ? (
            <div className="pl-6 py-10 text-slate-400 text-sm flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-400 border-t-transparent"></div>
                Carregando auditoria...
            </div>
        ) : logs.length === 0 ? (
            <div className="pl-6 py-10 text-slate-400 text-sm italic">Nenhum registro encontrado para os filtros atuais.</div>
        ) : (
            logs.map((log) => {
                const meta = getActionMeta(log.acao);
                const Icon = meta.icon;
                const isExpanded = expandedId === log.id;
                
                return (
                    <div key={log.id} className="relative group">
                        
                        {/* Ponto da Timeline */}
                        <div className={`absolute -left-[31px] top-0 w-8 h-8 rounded-full border-4 border-slate-50 bg-white flex items-center justify-center shadow-sm z-10 transition-colors ${isExpanded ? 'border-blue-100' : 'group-hover:border-blue-50'}`}>
                           <Icon size={14} className={meta.color} />
                        </div>

                        {/* Card do Log */}
                        <div 
                            className={`ml-6 bg-white border rounded-2xl transition-all duration-300 overflow-hidden cursor-pointer
                                ${isExpanded ? 'border-blue-200 shadow-lg ring-1 ring-blue-100' : 'border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-md'}
                            `}
                            onClick={() => toggleExpand(log.id)}
                        >
                            {/* Cabeçalho do Card */}
                            <div className="p-4 flex flex-col md:flex-row md:items-center gap-4 justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 shrink-0">
                                        {log.usuario_nome?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 text-sm">{log.acao}</h4>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${meta.bg} ${meta.color} bg-opacity-30`}>
                                                {log.modulo}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-medium">
                                            <span className="flex items-center gap-1"><User size={12}/> {log.usuario_nome}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <span className="flex items-center gap-1" title={new Date(log.data).toLocaleString()}>
                                                <Clock size={12}/> {formatDistanceToNow(new Date(log.data), { addSuffix: true, locale: ptBR })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                {log.recurso_id && (
                                    <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100 self-start md:self-center">
                                        ID: {log.recurso_id}
                                    </div>
                                )}
                            </div>

                            {/* Detalhes Expansíveis (O DIFF) */}
                            {isExpanded && (
                                <div className="border-t border-slate-100 bg-slate-50/50 p-6 animate-slideDown">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <FileText size={12}/> Detalhes da Operação
                                    </h5>
                                    
                                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                        <DiffViewer detalhes={log.detalhes} />
                                    </div>

                                    <div className="mt-4 flex justify-end">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                            Log ID: {log.id} • IP: {log.ip_origem || 'Interno'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------------------------------
// COMPONENTE VISUALIZADOR DE DIFERENÇAS (DIFF VIEWER)
// --------------------------------------------------------------------------
function DiffViewer({ detalhes }: { detalhes: any }) {
    if (!detalhes || Object.keys(detalhes).length === 0) {
        return <div className="p-4 text-xs text-slate-400 italic text-center">Nenhum detalhe técnico registrado.</div>;
    }

    // 1. Caso seja um backup de exclusão ou dados iniciais (Objeto único)
    if (detalhes.dados_excluidos || detalhes.dados_iniciais || detalhes.backup) {
        const dados = detalhes.dados_excluidos || detalhes.dados_iniciais || detalhes.backup;
        return (
            <div className="p-4">
                <table className="w-full text-xs">
                    <tbody>
                        {Object.entries(dados).map(([key, val]: any) => (
                            <tr key={key} className="border-b border-slate-50 last:border-0">
                                <td className="py-2 font-bold text-slate-500 w-1/3 capitalize">{key.replace(/_/g, ' ')}</td>
                                <td className="py-2 font-mono text-slate-700">{String(val)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // 2. Caso seja uma alteração (Antes vs Depois)
    // Detecta se o objeto tem estrutura { chave: { antes: X, depois: Y } }
    const isDiff = Object.values(detalhes).some((val: any) => val && typeof val === 'object' && ('antes' in val || 'depois' in val));

    if (isDiff) {
        return (
            <div className="w-full">
                <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    <div className="col-span-3 p-3">Campo Alterado</div>
                    <div className="col-span-4 p-3 border-l border-slate-200 text-rose-600">Valor Anterior</div>
                    <div className="col-span-1 p-3 flex items-center justify-center"><ArrowRight size={12}/></div>
                    <div className="col-span-4 p-3 text-emerald-600">Novo Valor</div>
                </div>
                {Object.entries(detalhes).map(([campo, valor]: any) => (
                    <div key={campo} className="grid grid-cols-12 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors text-xs">
                        <div className="col-span-3 p-3 font-bold text-slate-700 capitalize break-words flex items-center">
                            {campo.replace(/_/g, ' ')}
                        </div>
                        <div className="col-span-4 p-3 border-l border-slate-100 font-mono text-rose-700 bg-rose-50/30 break-all flex items-center">
                            <span className="line-through opacity-70">{String(valor.antes ?? 'Vazio')}</span>
                        </div>
                        <div className="col-span-1 p-3 flex items-center justify-center text-slate-300">
                            <ArrowRight size={14}/>
                        </div>
                        <div className="col-span-4 p-3 font-mono text-emerald-700 bg-emerald-50/30 font-bold break-all flex items-center">
                            {String(valor.depois ?? 'Vazio')}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 3. Fallback: JSON formatado bonito se não reconhecer a estrutura
    return (
        <div className="bg-slate-900 p-4 overflow-x-auto">
            <pre className="text-[10px] font-mono text-emerald-400 leading-relaxed">
                {JSON.stringify(detalhes, null, 2)}
            </pre>
        </div>
    );
}