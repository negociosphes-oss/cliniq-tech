import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import SignaturePad from 'react-signature-canvas';
import { PenTool, Eraser, User, Image as ImageIcon } from 'lucide-react';

interface Props {
  osId: number;
  status: string;
  tecnicos: any[]; 
  assinaturaTecnico?: string;
  assinaturaCliente?: string;
}

export interface AssinaturasTabHandle {
  getAssinaturas: () => { tecnico: string | null; cliente: string | null };
}

export const AssinaturasTab = forwardRef<AssinaturasTabHandle, Props>(({ status, tecnicos, assinaturaTecnico, assinaturaCliente }, ref) => {
  const padTecnico = useRef<SignaturePad>(null);
  const padCliente = useRef<SignaturePad>(null);

  const [tecnicoSelecionado, setTecnicoSelecionado] = useState('');
  const [assinaturaAutomatica, setAssinaturaAutomatica] = useState<string | null>(assinaturaTecnico || null);

  useEffect(() => {
    setAssinaturaAutomatica(assinaturaTecnico || null);
  }, [assinaturaTecnico]);

  const handleSelecionarTecnico = (id: string) => {
    setTecnicoSelecionado(id);
    const tec = tecnicos.find(t => String(t.id) === id);
    if (tec && (tec.assinatura_url || tec.foto_url || tec.assinatura)) {
      setAssinaturaAutomatica(tec.assinatura_url || tec.foto_url || tec.assinatura);
    } else {
      setAssinaturaAutomatica(null);
    }
  };

  const limparTecnico = () => {
    padTecnico.current?.clear();
    setAssinaturaAutomatica(null);
    setTecnicoSelecionado('');
  };

  const limparCliente = () => padCliente.current?.clear();

  useImperativeHandle(ref, () => ({
    getAssinaturas: () => {
      let tecData = assinaturaAutomatica;
      // Extração direta via Canvas nativo para evitar erro de import/trim
      if (!tecData && padTecnico.current && !padTecnico.current.isEmpty()) {
        const canvas = padTecnico.current.getCanvas();
        tecData = canvas.toDataURL('image/png');
      }
      
      let cliData = assinaturaCliente || null;
      if (!cliData && padCliente.current && !padCliente.current.isEmpty()) {
        const canvas = padCliente.current.getCanvas();
        cliData = canvas.toDataURL('image/png');
      }

      return { tecnico: tecData, cliente: cliData };
    }
  }));

  // Bloqueia apenas se a OS já estiver concluída ou se já houver uma assinatura salva no banco
  const isReadOnly = status === 'Concluída';

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><PenTool className="text-indigo-600"/> Coleta de Assinaturas</h3>
          <p className="text-xs font-medium text-slate-400 mt-1">Chancela técnica e validação do cliente.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        
        {/* TÉCNICO EXECUTOR */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-xs font-black uppercase text-slate-500 flex items-center gap-2">
              <User size={14}/> Técnico Executor *
            </label>
            {!isReadOnly && <button onClick={limparTecnico} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:text-rose-600"><Eraser size={12}/> Limpar</button>}
          </div>

          {!isReadOnly && (
            <select className="input-theme w-full p-3 rounded-xl font-bold text-sm text-slate-700 cursor-pointer" value={tecnicoSelecionado} onChange={(e) => handleSelecionarTecnico(e.target.value)}>
              <option value="">Selecione na lista...</option>
              {tecnicos.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          )}

          <div className="border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 relative overflow-hidden h-40 flex items-center justify-center">
            {assinaturaAutomatica ? (
               <div className="flex flex-col items-center gap-2">
                   <img src={assinaturaAutomatica} alt="Assinatura Digital" className="h-24 object-contain mix-blend-multiply" />
                   <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md flex items-center gap-1"><ImageIcon size={10}/> Assinatura Vinculada</span>
               </div>
            ) : isReadOnly ? (
               <p className="text-sm font-bold text-slate-400 italic">Não assinado</p>
            ) : (
              <SignaturePad ref={padTecnico} canvasProps={{ className: 'w-full h-full cursor-crosshair' }} />
            )}
          </div>
        </div>

        {/* CLIENTE - AQUI ESTAVA O BLOQUEIO */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <label className="text-xs font-black uppercase text-slate-500">Cliente / Aceite *</label>
            {!isReadOnly && <button onClick={limparCliente} className="text-[10px] font-bold text-rose-500 flex items-center gap-1 hover:text-rose-600"><Eraser size={12}/> Limpar</button>}
          </div>
          
          <div className={`border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 relative overflow-hidden h-40 flex items-center justify-center ${!isReadOnly && !assinaturaCliente ? 'cursor-crosshair' : ''}`}>
            {assinaturaCliente ? (
              <img src={assinaturaCliente} alt="Assinatura Cliente" className="h-full w-full object-contain p-4 mix-blend-multiply" />
            ) : isReadOnly ? (
              <p className="text-sm font-bold text-slate-400 italic">Não assinado</p>
            ) : (
              <SignaturePad ref={padCliente} canvasProps={{ className: 'w-full h-full' }} />
            )}
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-center">
        <p className="text-xs font-bold text-amber-700 italic">"Declaro que o serviço foi executado conforme descrito, o equipamento foi testado em minha presença e encontra-se em condições operacionais."</p>
      </div>
    </div>
  );
});