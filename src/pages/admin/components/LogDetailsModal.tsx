import { X, ArrowRight, Activity, FileText, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LogDetailsModalProps {
  log: any;
  onClose: () => void;
}

export function LogDetailsModal({ log, onClose }: LogDetailsModalProps) {
  const navigate = useNavigate();

  // Função para navegar até o item (Deep Link)
  const handleNavegar = () => {
    if (!log.recurso_id) return;
    // Mapeamento de rotas baseado no módulo/tipo
    const rotas: any = {
      'operacional': `/ordens/${log.recurso_id}`,
      'equipamentos': `/equipamentos?id=${log.recurso_id}`, // Exige ajuste na página destino para ler query param
      'clientes': `/clientes`, // Clientes geralmente é lista
      'financeiro': `/financeiro`
    };
    
    // Tenta achar a rota ou vai para o módulo geral
    const destino = rotas[log.tipo_recurso] || rotas[log.modulo?.toLowerCase()] || null;
    
    if (destino) {
      navigate(destino);
      onClose();
    } else {
      alert("Link direto não disponível para este tipo de registro.");
    }
  };

  // Verifica se é um log de "Diff" (tem antes/depois)
  const isDiff = log.detalhes && Object.values(log.detalhes).some((val: any) => val?.antes !== undefined);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-theme-card border border-theme w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-theme flex justify-between items-start bg-theme-page/50">
          <div className="flex gap-4">
             <div className="p-3 bg-slate-200 dark:bg-slate-800 rounded-2xl">
                <Activity size={24} className="text-primary-theme"/>
             </div>
             <div>
                <h3 className="text-xl font-black text-theme-main">Auditoria de Evento</h3>
                <p className="text-sm text-theme-muted font-mono">ID: {log.id} • {new Date(log.data).toLocaleString()}</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
            <X size={20} className="text-theme-muted"/>
          </button>
        </div>

        {/* Corpo Scrollável */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
           
           {/* Resumo */}
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-theme">
                 <span className="text-[10px] font-black uppercase text-theme-muted tracking-widest">Responsável</span>
                 <p className="text-lg font-bold text-theme-main mt-1">{log.usuario_nome}</p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-theme">
                 <span className="text-[10px] font-black uppercase text-theme-muted tracking-widest">Ação</span>
                 <p className="text-lg font-bold text-theme-main mt-1">{log.acao}</p>
              </div>
           </div>

           {/* Área de Diferenças (O CORAÇÃO DO AUDIT) */}
           <div>
              <h4 className="text-xs font-black uppercase text-theme-muted mb-4 flex items-center gap-2">
                 <FileText size={14}/> Detalhes da Alteração
              </h4>
              
              {isDiff ? (
                <div className="space-y-3">
                   {Object.entries(log.detalhes).map(([campo, valor]: any) => (
                      <div key={campo} className="bg-white dark:bg-black border border-theme rounded-xl p-4 shadow-sm">
                         <p className="text-xs font-black uppercase text-slate-400 mb-2">{campo.replace(/_/g, ' ')}</p>
                         <div className="flex items-center gap-4 text-sm">
                            <div className="flex-1 p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-lg line-through opacity-70 break-all">
                               {String(valor.antes ?? 'Vazio')}
                            </div>
                            <ArrowRight size={16} className="text-slate-300"/>
                            <div className="flex-1 p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-lg font-bold break-all">
                               {String(valor.depois ?? 'Vazio')}
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-700">
                   {JSON.stringify(log.detalhes, null, 2)}
                </div>
              )}
           </div>
        </div>

        {/* Footer com Ação */}
        <div className="p-4 border-t border-theme bg-theme-page/30 flex justify-end">
           {log.recurso_id && (
             <button 
               onClick={handleNavegar}
               className="bg-primary-theme text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-theme/20 hover:scale-105 transition-transform flex items-center gap-2"
             >
               <ExternalLink size={18}/> Ver Registro Original
             </button>
           )}
        </div>

      </div>
    </div>
  );
}