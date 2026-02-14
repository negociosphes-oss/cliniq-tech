import { useState, useEffect, useRef } from 'react';
import { X, Save, User, Shield, CreditCard, Briefcase, PenTool, Loader2, Eraser } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../../supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  techToEdit?: any;
}

export function EquipeForm({ isOpen, onClose, onSuccess, techToEdit }: Props) {
  const [loading, setLoading] = useState(false);
  const sigRef = useRef<any>(null);
  
  const [formData, setFormData] = useState(() => {
    if (techToEdit) {
        return { ...techToEdit };
    }
    return { nome: '', cargo: '', registro_profissional: '', cpf: '', assinatura_url: '' };
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    if (!formData.nome) return alert('O nome do técnico é obrigatório.');
    setLoading(true);
    
    try {
        let finalSignature = formData.assinatura_url;
        
        // Verifica se o usuário desenhou algo novo no Canvas
        if (sigRef.current && !sigRef.current.isEmpty()) {
            finalSignature = sigRef.current.toDataURL('image/png'); // Salva o desenho como Base64
        }

        const payload = { ...formData, assinatura_url: finalSignature };

        if (techToEdit) {
            await supabase.from('equipe_tecnica').update(payload).eq('id', techToEdit.id);
        } else {
            await supabase.from('equipe_tecnica').insert([payload]);
        }
        onSuccess();
    } catch (error: any) {
        alert('Erro ao salvar: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  const limparAssinatura = () => {
      if (sigRef.current) sigRef.current.clear();
      setFormData(prev => ({ ...prev, assinatura_url: '' })); // Limpa também a existente se for edição
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><PenTool size={20}/></div>
                <div>
                    <h3 className="font-bold text-lg text-slate-800">{techToEdit ? 'Editar Técnico' : 'Novo Cadastro'}</h3>
                    <p className="text-xs text-slate-500">Dados do profissional</p>
                </div>
            </div>
            <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="p-8 space-y-5">
            <Field 
                label="Nome Completo *" 
                icon={<User size={16}/>}
                value={formData.nome}
                onChange={(e:any) => handleChange('nome', e.target.value)}
                placeholder="Ex: João da Silva"
            />
            
            <div className="grid grid-cols-2 gap-4">
                <Field 
                    label="Cargo / Função" 
                    icon={<Briefcase size={16}/>}
                    value={formData.cargo}
                    onChange={(e:any) => handleChange('cargo', e.target.value)}
                    placeholder="Ex: Eng. Clínico"
                />
                <Field 
                    label="Registro (CREA/CFT)" 
                    icon={<Shield size={16}/>}
                    value={formData.registro_profissional}
                    onChange={(e:any) => handleChange('registro_profissional', e.target.value)}
                    placeholder="Nº Registro"
                />
            </div>

            <Field 
                label="CPF" 
                icon={<CreditCard size={16}/>}
                value={formData.cpf}
                onChange={(e:any) => handleChange('cpf', e.target.value)}
                placeholder="000.000.000-00"
            />

            {/* QUADRO DE ASSINATURA RESTAURADO */}
            <div className="pt-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider">Assinatura Digital</label>
                    <button type="button" onClick={limparAssinatura} className="text-[11px] text-rose-500 hover:underline flex items-center gap-1 font-bold">
                        <Eraser size={12}/> Limpar Quadro
                    </button>
                </div>
                
                <div className="border-2 border-slate-300 rounded-xl bg-slate-50 overflow-hidden relative" style={{ height: '150px' }}>
                    {/* Se já existir assinatura e o quadro estiver intacto, mostra a imagem de fundo */}
                    {formData.assinatura_url && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                            <img src={formData.assinatura_url} alt="Assinatura Atual" className="h-20 object-contain"/>
                        </div>
                    )}
                    <SignatureCanvas 
                        ref={sigRef} 
                        penColor="black"
                        canvasProps={{ className: 'w-full h-full cursor-crosshair relative z-10' }} 
                    />
                </div>
                <p className="text-[10px] text-slate-400 mt-2 text-center">Desenhe no quadro acima usando o mouse ou dedo (se mobile).</p>
            </div>
        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
            <button onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors text-sm">Cancelar</button>
            <button onClick={handleSave} disabled={loading} className="btn-primary bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-200 text-sm transition-transform active:scale-95">
                {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                Salvar Dados
            </button>
        </div>
      </div>
    </div>
  );
}

// Componente de Input "Caixa Forte"
const Field = ({ label, icon, ...props }: any) => (
    <div className="flex flex-col gap-1.5 group">
        <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider group-focus-within:text-indigo-600 transition-colors flex items-center gap-1.5">
            {label}
        </label>
        <div className="relative">
            {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">{icon}</div>}
            <input 
                className={`w-full h-11 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm ${icon ? 'pl-10' : 'px-4'}`}
                {...props}
            />
        </div>
    </div>
);