import { useState, useEffect } from 'react';
import { CheckSquare, Loader2, AlertCircle, RefreshCw, Zap, ListChecks, Save, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface ChecklistTabProps {
  osId: number;
  equipamentoId: number;
  tipoServico: string;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export function ChecklistTab({ osId, equipamentoId, tipoServico, showToast }: ChecklistTabProps) {
  const [loading, setLoading] = useState(true);
  const [modelo, setModelo] = useState<any | null>(null);
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [observacao, setObservacao] = useState('');
  const [execucaoId, setExecucaoId] = useState<number | null>(null);
  const [status, setStatus] = useState('Rascunho');
  const [origem, setOrigem] = useState<'Especifico' | 'Generico' | 'Manual'>('Manual');

  useEffect(() => {
    carregarChecklist();
  }, [osId]);

  const carregarChecklist = async () => {
    setLoading(true);
    try {
      // 1. Verifica se JÁ existe uma execução salva
      const { data: execExistente } = await supabase.from('os_checklists_execucao')
        .select('*').eq('ordem_servico_id', osId).maybeSingle();

      if (execExistente) {
        const { data: mod } = await supabase.from('checklists_biblioteca').select('*').eq('id', execExistente.checklist_id).single();
        setModelo(mod);
        setRespostas(typeof execExistente.respostas === 'string' ? JSON.parse(execExistente.respostas) : execExistente.respostas || {});
        setObservacao(execExistente.observacoes || '');
        setExecucaoId(execExistente.id);
        setStatus(execExistente.status);
        setOrigem('Manual');
      } else {
        // 2. MOTOR DE REGRAS INTELIGENTE
        const { data: eq } = await supabase.from('equipamentos').select('tecnologia_id').eq('id', equipamentoId).single();
        
        let modeloEncontrado = null;
        let origemEncontrada: any = 'Manual';

        // A) Tenta Regra ESPECÍFICA
        if (eq?.tecnologia_id) {
          const { data: regraEsp } = await supabase.from('checklists_regras')
            .select('checklist_id')
            .eq('tecnologia_id', eq.tecnologia_id)
            .eq('tipo_servico', tipoServico)
            .maybeSingle();

          if (regraEsp) {
            const { data: mod } = await supabase.from('checklists_biblioteca').select('*').eq('id', regraEsp.checklist_id).single();
            modeloEncontrado = mod;
            origemEncontrada = 'Especifico';
          }
        }

        // B) Se falhar, Tenta Regra GENÉRICA
        if (!modeloEncontrado) {
            const { data: regraGen } = await supabase.from('checklists_regras')
                .select('checklist_id')
                .is('tecnologia_id', null)
                .eq('tipo_servico', tipoServico)
                .maybeSingle();

            if (regraGen) {
                const { data: mod } = await supabase.from('checklists_biblioteca').select('*').eq('id', regraGen.checklist_id).single();
                modeloEncontrado = mod;
                origemEncontrada = 'Generico';
            }
        }

        // C) Fallback Seguro (Correção do Erro toLowerCase)
        if (!modeloEncontrado) {
             const { data: modelos } = await supabase.from('checklists_biblioteca').select('*');
             // BLINDAGEM DE SEGURANÇA AQUI:
             const match = modelos?.find(m => String(m.nome || '').toLowerCase().includes(String(tipoServico || '').toLowerCase()));
             if (match) {
                 modeloEncontrado = match;
                 origemEncontrada = 'Generico';
             }
        }

        if (modeloEncontrado) {
            setModelo(modeloEncontrado);
            setOrigem(origemEncontrada);
            
            const payload = {
                ordem_servico_id: osId,
                checklist_id: modeloEncontrado.id,
                respostas: {},
                status: 'Pendente',
                data_inicio: new Date().toISOString()
            };
            const { data: newExec } = await supabase.from('os_checklists_execucao').insert([payload]).select().single();
            if (newExec) setExecucaoId(newExec.id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (index: number, value: any) => {
    const novas = { ...respostas, [index]: value };
    setRespostas(novas);
  };

  const handleSave = async (finalizar = false) => {
    if (!execucaoId) return;
    setLoading(true);

    const novoStatus = finalizar ? 'Concluído' : 'Em Andamento';
    const payload = {
      respostas: respostas,
      observacoes: observacao,
      status: novoStatus,
      data_conclusao: finalizar ? new Date().toISOString() : null,
      data_atualizacao: new Date().toISOString()
    };

    try {
      await supabase.from('os_checklists_execucao').update(payload).eq('id', execucaoId);
      setStatus(novoStatus);
      showToast(finalizar ? 'Checklist finalizado!' : 'Progresso salvo.', 'success');
    } catch (e: any) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-theme-muted font-bold flex flex-col items-center gap-2"><Loader2 className="animate-spin text-primary-theme" size={32}/> Carregando checklist...</div>;

  if (!modelo) return (
    <div className="p-8 text-center bg-theme-page rounded-3xl border border-dashed border-theme flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-theme-card rounded-full flex items-center justify-center mb-4 shadow-sm">
        <AlertCircle className="text-theme-muted" size={32}/>
      </div>
      <h3 className="font-black text-theme-main text-lg">Nenhum Checklist Automático</h3>
      <p className="text-sm text-theme-muted mb-6 max-w-md">
        O sistema não encontrou regras automáticas para <strong>{tipoServico}</strong> neste equipamento.
      </p>
      <button onClick={carregarChecklist} className="px-6 py-3 bg-theme-card border border-theme hover:border-primary-theme text-theme-main rounded-xl font-bold flex items-center gap-2 transition-all">
        <RefreshCw size={16}/> Tentar Novamente
      </button>
    </div>
  );

  const isLocked = status === 'Concluído' || status === 'Finalizado';
  const perguntas = typeof modelo.perguntas === 'string' ? JSON.parse(modelo.perguntas) : (modelo.perguntas || modelo.itens_configuracao || []);

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn pb-10">
      
      <div className="bg-theme-page border border-theme p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-theme-card text-primary-theme rounded-xl shadow-sm border border-theme">
                <ListChecks size={28}/>
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-theme-main leading-tight">{modelo.nome || modelo.titulo}</h3>
                    {origem === 'Generico' && <span className="bg-theme-card text-theme-muted border border-theme text-[10px] px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1"><Zap size={10}/> Padrão</span>}
                    {origem === 'Especifico' && <span className="bg-primary-theme text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase">Específico</span>}
                </div>
                <p className="text-theme-muted text-sm font-bold mt-1">
                    {perguntas.length} itens de verificação.
                </p>
            </div>
        </div>
        <div className={`px-4 py-2 rounded-lg font-black uppercase text-xs tracking-widest border shadow-sm
            ${status === 'Concluído' || status === 'Finalizado'
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400' 
                : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400'}`}>
            {status}
        </div>
      </div>

      <div className="space-y-4">
        {perguntas.map((item: any, idx: number) => {
          const textoPergunta = item.texto || item.titulo || `Item ${idx + 1}`;
          const isHeader = item.tipo === 'cabecalho';

          if (isHeader) return (
            <div key={idx} className="pt-6 pb-2">
                <h4 className="font-black text-theme-muted uppercase tracking-[0.2em] text-xs border-b border-theme pb-2">{textoPergunta}</h4>
            </div>
          );

          return (
            <div key={idx} className={`bg-theme-card border border-theme p-6 rounded-2xl shadow-sm transition-all ${isLocked ? 'opacity-80' : 'hover:border-primary-theme'}`}>
              <div className="mb-4">
                  <span className="text-xs font-black text-primary-theme mr-2">0{idx + 1}.</span>
                  <span className="font-bold text-theme-main text-sm md:text-base">
                    {textoPergunta} {item.obrigatorio && <span className="text-rose-500">*</span>}
                  </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                 {(!item.tipo || item.tipo === 'sim_nao') && ['Conforme', 'Não Conforme', 'N.A.'].map(opcao => {
                      const isSelected = respostas[idx] === opcao;
                      let btnClass = "bg-theme-page text-theme-muted border-theme hover:bg-slate-200 dark:hover:bg-slate-800";
                      
                      if (isSelected) {
                          if (opcao === 'Não Conforme') btnClass = "bg-rose-500 text-white border-rose-600 shadow-md ring-2 ring-rose-500/30";
                          else if (opcao === 'N.A.') btnClass = "bg-slate-500 text-white border-slate-600 shadow-md";
                          else btnClass = "bg-primary-theme text-white border-primary-theme shadow-md ring-2 ring-primary-theme/30";
                      }

                      return (
                        <button
                            key={opcao}
                            onClick={() => !isLocked && handleAnswer(idx, opcao)}
                            disabled={isLocked}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all border ${btnClass} ${isLocked ? 'cursor-not-allowed' : ''}`}
                        >
                            {opcao}
                        </button>
                      );
                 })}

                 {item.tipo === 'texto' && (
                    <input 
                        className="input-theme w-full h-12 px-4 rounded-xl font-medium"
                        placeholder="Digite a resposta..."
                        value={respostas[idx] || ''}
                        onChange={e => handleAnswer(idx, e.target.value)}
                        disabled={isLocked}
                    />
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-theme-card border border-theme p-6 rounded-2xl shadow-sm">
          <label className="text-xs font-black uppercase text-theme-muted mb-2 block">Observações Gerais</label>
          <textarea 
            className="input-theme w-full p-4 rounded-xl font-medium h-24 resize-none mb-6"
            placeholder="Observações finais sobre a execução..."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            disabled={isLocked}
          />
          
          {!isLocked && (
            <div className="flex flex-col md:flex-row gap-3">
                <button 
                    onClick={() => handleSave(false)} 
                    className="flex-1 py-4 bg-theme-page border border-theme text-theme-muted hover:text-theme-main rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                    <Save size={20}/> Salvar Progresso
                </button>
                <button 
                    onClick={() => handleSave(true)}
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                    <CheckCircle size={20}/> FINALIZAR CHECKLIST
                </button>
            </div>
          )}
      </div>
    </div>
  );
}