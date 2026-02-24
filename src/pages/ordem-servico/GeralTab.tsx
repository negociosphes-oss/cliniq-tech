import { 
  AlertTriangle, User, Activity, List, Tag, 
  Calendar, Info, Phone, Mail 
} from 'lucide-react';
import type { Tecnico, OrdemServico } from '../../types';

interface GeralTabProps {
  osForm: Partial<OrdemServico> & {
    tecnico?: string;
    prioridade?: string;
    tipo?: string;
    descricao?: string;
    descricao_problema?: string;
    created_at?: string;
    data_inicio?: string;
    solicitante_nome?: string;
    solicitante_telefone?: string;
    solicitante_email?: string;
  };
  setOsForm: (value: any) => void;
  tecnicos: Tecnico[];
  status: string;
  tiposOs?: any[]; // AQUI: Lista dinâmica vinda do banco
}

export function GeralTab({ osForm, setOsForm, tecnicos, status, tiposOs = [] }: GeralTabProps) {
  
  const isReadOnly = status === 'Concluída' || status === 'Fechada';

  const handleChange = (field: string, value: string) => {
    if (isReadOnly) return;
    setOsForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--/--/----';
    return new Date(dateStr).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      
      {/* HEADER DE DATAS */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/50 px-4 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Calendar size={12}/> Abertura: <strong>{formatDate(osForm.created_at)}</strong></span>
          {osForm.data_inicio && <span className="flex items-center gap-1"><Activity size={12}/> Início Técnico: <strong>{formatDate(osForm.data_inicio)}</strong></span>}
        </div>
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium">
          <Info size={12}/> Visualize os dados iniciais do chamado.
        </div>
      </div>

      {/* BLOCO DE DADOS DO SOLICITANTE */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <h3 className="text-sm font-bold uppercase text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <User size={18} className="text-orange-500"/> Contato do Solicitante
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block">Nome</label>
                <input className="input-form w-full bg-slate-100 dark:bg-slate-700/50 text-slate-500" value={osForm.solicitante_nome || ''} disabled />
            </div>
            <div className="group">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block flex items-center gap-1"><Phone size={12}/> Telefone / Zap</label>
                <input 
                    className="input-form w-full border-slate-200 dark:border-slate-700 focus:border-blue-500 bg-transparent" 
                    value={osForm.solicitante_telefone || ''} 
                    onChange={e => handleChange('solicitante_telefone', e.target.value)} 
                    placeholder="Ex: (11) 99999-9999"
                    disabled={isReadOnly}
                />
            </div>
            <div className="group">
                <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block flex items-center gap-1"><Mail size={12}/> Email</label>
                <input 
                    className="input-form w-full border-slate-200 dark:border-slate-700 focus:border-blue-500 bg-transparent" 
                    value={osForm.solicitante_email || ''} 
                    onChange={e => handleChange('solicitante_email', e.target.value)} 
                    placeholder="email@cliente.com"
                    disabled={isReadOnly}
                />
            </div>
        </div>
      </section>

      {/* DEFINIÇÃO DO ATENDIMENTO */}
      <section className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
        <h3 className="text-sm font-bold uppercase text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <User size={18} className="text-blue-500"/> Definição do Atendimento
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group">
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block group-focus-within:text-blue-600 transition-colors">Técnico Responsável</label>
            <div className="relative">
              <select 
                className={`w-full p-3 pl-4 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                value={osForm.tecnico || ''}
                onChange={(e) => handleChange('tecnico', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Selecione o executor...</option>
                {(tecnicos || []).map(t => (
                  <option key={t.id} value={t.nome}>{t.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="group">
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block flex items-center gap-1 group-focus-within:text-blue-600 transition-colors">
              <List size={12}/> Natureza do Serviço
            </label>
            
            {/* O DROPDOWN AGORA PUXA DO BANCO DE DADOS DINAMICAMENTE */}
            <select 
              className={`w-full p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold text-slate-700 dark:text-slate-200 ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              value={osForm.tipo || ''}
              onChange={(e) => handleChange('tipo', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="">Selecione...</option>
              {tiposOs.length > 0 ? (
                  tiposOs.map((t, idx) => (
                     <option key={t.id || idx} value={t.nome}>{t.nome}</option>
                  ))
              ) : (
                  // Fallback de segurança se o banco demorar a carregar
                  <>
                      <option value="Corretiva">Corretiva</option>
                      <option value="Preventiva">Preventiva</option>
                      <option value="Calibração">Calibração</option>
                  </>
              )}
            </select>
          </div>

          <div className="group">
            <label className="text-xs font-bold uppercase text-slate-500 mb-1.5 block flex items-center gap-1 group-focus-within:text-blue-600 transition-colors">
              <Tag size={12}/> Criticidade
            </label>
            <select 
              className={`w-full p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 dark:border-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium 
                ${osForm.prioridade === 'Crítica' ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'text-slate-700 dark:text-slate-200'}
                ${isReadOnly ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              value={osForm.prioridade || 'Média'}
              onChange={(e) => handleChange('prioridade', e.target.value)}
              disabled={isReadOnly}
            >
              <option>Baixa</option>
              <option>Média</option>
              <option>Alta</option>
              <option>Crítica</option>
            </select>
          </div>
        </div>
      </section>

      {/* QUEIXA PRINCIPAL */}
      <section className="bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-xl border border-orange-100 dark:border-orange-800/50 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg">
            <AlertTriangle size={20}/>
          </div>
          <h4 className="text-sm font-bold uppercase text-orange-800 dark:text-orange-400">Solicitação / Queixa Principal</h4>
        </div>
        <p className="text-slate-700 dark:text-slate-300 italic text-sm md:text-base leading-relaxed pl-4 border-l-2 border-orange-300 dark:border-orange-700">
          "{osForm.descricao || osForm.descricao_problema || 'Nenhum detalhe informado na abertura.'}"
        </p>
      </section>

    </div>
  );
}