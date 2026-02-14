import { useState, useEffect } from 'react';
import { Trash2, Save, GripVertical, CheckSquare, Type, Hash, X, Loader2, Info, Plus } from 'lucide-react'; 
import { supabase } from '../../supabaseClient'; 

interface Props {
  isOpen: boolean;
  onClose: () => void;
  modeloInicial: any;
  onSuccess: () => void;
}

export function ChecklistBuilder({ isOpen, onClose, modeloInicial, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [currentModel, setCurrentModel] = useState<any>({ titulo: '', descricao: '', tipo_os: '', itens_configuracao: [] });
  
  const [tiposOs, setTiposOs] = useState<any[]>([]);

  useEffect(() => {
    const fetchTipos = async () => {
        const { data } = await supabase.from('tipos_ordem_servico').select('*').order('nome');
        if (data) setTiposOs(data);
    };
    fetchTipos();

    if (isOpen) {
      if (modeloInicial) {
        let parsedPerguntas = [];
        const itemsToParse = modeloInicial.itens_configuracao || modeloInicial.perguntas;
        if (typeof itemsToParse === 'string') {
          try { parsedPerguntas = JSON.parse(itemsToParse); } catch(e){}
        } else if (Array.isArray(itemsToParse)) {
          parsedPerguntas = itemsToParse; 
        }
        
        setCurrentModel({
          id: modeloInicial.id,
          titulo: modeloInicial.titulo || modeloInicial.nome || '', 
          descricao: modeloInicial.descricao || '',
          tipo_os: modeloInicial.tipo_os || '', 
          itens_configuracao: parsedPerguntas
        });
      } else {
        setCurrentModel({ titulo: '', descricao: '', tipo_os: '', itens_configuracao: [] });
      }
    }
  }, [isOpen, modeloInicial]);

  const handleAddItem = (tipo: 'sim_nao' | 'texto' | 'cabecalho') => {
    const newItem = { id: crypto.randomUUID(), ordem: currentModel.itens_configuracao.length + 1, texto: tipo === 'cabecalho' ? 'Nova Seção' : 'Nova Pergunta', tipo, obrigatorio: false };
    setCurrentModel({ ...currentModel, itens_configuracao: [...currentModel.itens_configuracao, newItem] });
  };

  const updateItem = (id: string, field: string, value: any) => {
    setCurrentModel({ ...currentModel, itens_configuracao: currentModel.itens_configuracao.map((item: any) => item.id === id ? { ...item, [field]: value } : item) });
  };

  const deleteItem = (id: string) => {
    setCurrentModel({ ...currentModel, itens_configuracao: currentModel.itens_configuracao.filter((item: any) => item.id !== id) });
  };

  const handleSave = async () => {
    if (!currentModel.titulo) return alert('Obrigatório preencher o Nome do Checklist.');
    setLoading(true);

    // 🚀 Payload exato exigido pelo seu Banco de Dados
    const payload = {
      titulo: currentModel.titulo,
      descricao: currentModel.descricao,
      tipo_os: currentModel.tipo_os || null, 
      itens_configuracao: currentModel.itens_configuracao
    };

    try {
        if (currentModel.id) {
            await supabase.from('checklists_biblioteca').update(payload).eq('id', currentModel.id);
        } else {
            await supabase.from('checklists_biblioteca').insert([payload]);
        }
        onSuccess();
    } catch (e: any) { alert('Erro ao salvar: ' + e.message); } finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col animate-fadeIn bg-theme-card rounded-2xl overflow-hidden shadow-2xl ring-1 ring-theme">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center p-6 border-b border-theme bg-theme-page/50 gap-4">
        <div className="w-full lg:w-3/5 flex flex-col gap-3">
          <input 
            className="text-2xl font-black bg-transparent border-b-2 border-transparent focus:border-primary-theme outline-none w-full text-theme-main transition-colors placeholder:text-slate-300" 
            placeholder="Nome do Checklist (Ex: Preventiva Tomógrafo)"
            value={currentModel.titulo}
            onChange={e => setCurrentModel({...currentModel, titulo: e.target.value})}
          />
          <div className="flex flex-col sm:flex-row gap-3">
              <select 
                  className="sm:w-1/2 input-theme px-3 py-2 rounded-lg text-sm font-bold text-theme-main cursor-pointer"
                  value={currentModel.tipo_os}
                  onChange={e => setCurrentModel({...currentModel, tipo_os: e.target.value})}
              >
                  <option value="">Vincular a um Serviço (Opcional)...</option>
                  {tiposOs.map(t => <option key={t.id} value={t.nome}>{t.nome}</option>)}
              </select>
              <input 
                className="sm:w-1/2 text-sm font-medium text-theme-muted bg-transparent outline-none px-2 border-b border-transparent focus:border-theme" 
                placeholder="Descrição ou código normativo..."
                value={currentModel.descricao}
                onChange={e => setCurrentModel({...currentModel, descricao: e.target.value})}
              />
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 text-theme-muted font-bold hover:bg-theme-card border border-transparent hover:border-theme rounded-xl transition-all flex items-center gap-2">
              <X size={18}/> Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="px-8 py-2.5 bg-primary-theme text-white rounded-xl font-black shadow-lg hover:scale-105 transition-all flex items-center gap-2">
              {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} 
              Salvar Checklist
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-theme bg-theme-page p-6 flex flex-col gap-3 overflow-y-auto">
          <p className="text-[10px] font-black uppercase text-theme-muted tracking-widest mb-2 flex items-center gap-2"><Plus size={14}/> Adicionar Campos</p>
          <button onClick={() => handleAddItem('cabecalho')} className="p-4 bg-theme-card border border-theme hover:border-primary-theme rounded-xl flex items-center gap-3 text-sm font-bold text-theme-main transition-all group shadow-sm"><div className="p-2 bg-theme-page rounded-lg group-hover:bg-primary-theme group-hover:text-white transition-colors"><Hash size={16}/></div> Título de Seção</button>
          <button onClick={() => handleAddItem('sim_nao')} className="p-4 bg-theme-card border border-theme hover:border-primary-theme rounded-xl flex items-center gap-3 text-sm font-bold text-theme-main transition-all group shadow-sm"><div className="p-2 bg-theme-page rounded-lg group-hover:bg-primary-theme group-hover:text-white transition-colors"><CheckSquare size={16}/> Conformidade (OK/NOK)</div></button>
          <button onClick={() => handleAddItem('texto')} className="p-4 bg-theme-card border border-theme hover:border-primary-theme rounded-xl flex items-center gap-3 text-sm font-bold text-theme-main transition-all group shadow-sm"><div className="p-2 bg-theme-page rounded-lg group-hover:bg-primary-theme group-hover:text-white transition-colors"><Type size={16}/> Resposta em Texto</div></button>
          
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 p-4 rounded-xl flex items-start gap-2">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5"/>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">A ordem das perguntas pode ser alterada arrastando o ícone à esquerda do campo.</p>
          </div>
        </div>

        <div className="flex-1 bg-slate-100/50 dark:bg-[#0b1120]/50 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-3xl mx-auto space-y-3 pb-20">
              {currentModel.itens_configuracao?.length === 0 && (
                <div className="text-center text-theme-muted mt-32 flex flex-col items-center">
                  <div className="w-20 h-20 bg-theme-card border border-dashed border-theme rounded-full flex items-center justify-center mb-6 shadow-sm"><GripVertical size={32} className="opacity-20"/></div>
                  <h3 className="text-xl font-black text-theme-main mb-2">Formulário Vazio</h3>
                  <p className="text-sm font-medium max-w-sm">Clique nos botões do painel à esquerda para começar a montar o seu checklist.</p>
                </div>
              )}
              
              {currentModel.itens_configuracao?.map((item: any, idx: number) => (
                <div key={item.id} className={`group flex items-start gap-4 p-5 rounded-2xl shadow-sm border transition-all ${item.tipo === 'cabecalho' ? 'bg-theme-page border-theme mt-8' : 'bg-theme-card border-theme hover:border-primary-theme'}`}>
                  <div className="mt-3 text-theme-muted cursor-move hover:text-primary-theme"><GripVertical size={20}/></div>
                  <div className="flex-1 space-y-3">
                    <input className={`w-full bg-transparent outline-none border-b border-transparent focus:border-theme pb-1 ${item.tipo === 'cabecalho' ? 'font-black text-xl uppercase text-theme-main tracking-wider' : 'font-bold text-base text-theme-main'}`} placeholder={item.tipo === 'cabecalho' ? "NOME DA SEÇÃO" : "Digite a pergunta de inspeção..."} value={item.texto} onChange={e => updateItem(item.id, 'texto', e.target.value)} autoFocus={idx === currentModel.itens_configuracao.length - 1} />
                    {item.tipo !== 'cabecalho' && (
                      <div className="flex items-center gap-4 text-xs">
                        <span className="font-black uppercase tracking-wider text-primary-theme bg-primary-theme/10 px-3 py-1 rounded-lg border border-primary-theme/20">{item.tipo === 'sim_nao' ? 'Conformidade' : item.tipo === 'texto' ? 'Texto Livre' : item.tipo}</span>
                        <label className="flex items-center gap-2 cursor-pointer text-theme-muted hover:text-theme-main font-bold select-none"><input type="checkbox" className="w-4 h-4 rounded border-theme text-primary-theme focus:ring-primary-theme" checked={item.obrigatorio} onChange={e => updateItem(item.id, 'obrigatorio', e.target.checked)}/> Resposta Obrigatória</label>
                      </div>
                    )}
                  </div>
                  <button onClick={() => deleteItem(item.id)} className="text-theme-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 p-2.5 rounded-xl transition-all" title="Remover Campo"><Trash2 size={18}/></button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}