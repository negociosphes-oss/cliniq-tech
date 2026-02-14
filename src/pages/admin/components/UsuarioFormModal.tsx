import { useState } from 'react';
import { X, Mail, ShieldCheck, User, Send, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function UsuarioFormModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
      nome: '',
      email: '',
      perfil: 'tecnico'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: any) => {
      e.preventDefault();
      setLoading(true);
      
      // Simulação do envio do convite pelo Supabase Auth
      setTimeout(() => {
          setLoading(false);
          alert(`Convite enviado com sucesso para ${formData.email}! O usuário receberá um link para definir a senha e acessar o sistema.`);
          onClose();
      }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
                <h3 className="font-black text-lg text-slate-800">Convidar Novo Usuário</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ele receberá um e-mail com o link de acesso.</p>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20}/>
            </button>
        </div>

        {/* FORMULÁRIO */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5"><User size={14}/> Nome Completo</label>
                <input 
                    required
                    type="text" 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    placeholder="Ex: João da Silva"
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
            </div>

            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5"><Mail size={14}/> Endereço de E-mail</label>
                <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="joao@empresa.com.br"
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-sm font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
            </div>

            <div className="space-y-1.5 group">
                <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider flex items-center gap-1.5"><ShieldCheck size={14}/> Nível de Acesso (Perfil)</label>
                <select 
                    value={formData.perfil}
                    onChange={e => setFormData({...formData, perfil: e.target.value})}
                    className="w-full h-11 bg-slate-50 border border-slate-300 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
                >
                    <option value="tecnico">Engenheiro / Técnico (Operacional)</option>
                    <option value="admin">Administrador (Gestão Total)</option>
                    <option value="visualizador">Cliente (Apenas Visualização)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Define quais menus e ações este usuário poderá acessar.</p>
            </div>

            {/* FOOTER DO MODAL */}
            <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">Cancelar</button>
                <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 text-sm">
                    {loading ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>}
                    Enviar Convite
                </button>
            </div>
        </form>

      </div>
    </div>
  );
}