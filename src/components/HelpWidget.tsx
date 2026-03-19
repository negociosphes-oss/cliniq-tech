import { useState } from 'react';
import { MessageCircle, Lightbulb, Book, X, HelpCircle, Send, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function HelpWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'menu' | 'sugestao'>('menu');
  const [sugestao, setSugestao] = useState('');
  const navigate = useNavigate();

  // 🚀 O SEU NÚMERO DE WHATSAPP CONFIGURADO (Com 55 do Brasil)
  const SEU_WHATSAPP = '5585991647349';

  const handleSupportClick = () => {
    const texto = encodeURIComponent('Olá! Preciso de ajuda com o sistema Atlasum.');
    window.open(`https://wa.me/${SEU_WHATSAPP}?text=${texto}`, '_blank');
  };

  const handleSendSugestao = () => {
    if (!sugestao.trim()) return;
    const texto = encodeURIComponent(`💡 *Nova Sugestão de Melhoria (Atlasum)*\n\n"${sugestao}"`);
    window.open(`https://wa.me/${SEU_WHATSAPP}?text=${texto}`, '_blank');
    setSugestao('');
    setView('menu');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {/* O PAINEL QUE ABRE */}
      {isOpen && (
        <div className="bg-white w-80 sm:w-96 rounded-2xl shadow-2xl border border-slate-200 mb-4 overflow-hidden animate-slideUp">
          
          {/* Cabeçalho do Painel */}
          <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              {view === 'sugestao' ? (
                <button onClick={() => setView('menu')} className="hover:bg-blue-700 p-1 rounded-lg transition-colors"><ArrowLeft size={18}/></button>
              ) : (
                <HelpCircle size={20} />
              )}
              <h3 className="font-bold">{view === 'menu' ? 'Central de Ajuda' : 'Sugerir Melhoria'}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-blue-700 p-1 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Corpo do Painel - MENU PRINCIPAL */}
          {view === 'menu' && (
            <div className="p-4 space-y-2 bg-slate-50">
              <button onClick={() => { setIsOpen(false); navigate('/manuais'); }} className="w-full bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-blue-400 hover:shadow-md transition-all text-left group">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform"><Book size={20}/></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Manuais e Treinamentos</h4>
                  <p className="text-xs text-slate-500">Aprenda a usar os módulos</p>
                </div>
              </button>

              <button onClick={handleSupportClick} className="w-full bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-emerald-400 hover:shadow-md transition-all text-left group">
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg group-hover:scale-110 transition-transform"><MessageCircle size={20}/></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Falar com Suporte</h4>
                  <p className="text-xs text-slate-500">Atendimento via WhatsApp</p>
                </div>
              </button>

              <button onClick={() => setView('sugestao')} className="w-full bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:border-amber-400 hover:shadow-md transition-all text-left group">
                <div className="bg-amber-100 text-amber-600 p-2 rounded-lg group-hover:scale-110 transition-transform"><Lightbulb size={20}/></div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Sugerir uma Melhoria</h4>
                  <p className="text-xs text-slate-500">Tem uma ideia? Conta pra gente!</p>
                </div>
              </button>
            </div>
          )}

          {/* Corpo do Painel - TELA DE SUGESTÃO */}
          {view === 'sugestao' && (
            <div className="p-4 bg-slate-50 flex flex-col gap-3">
              <p className="text-sm text-slate-600 font-medium">Como podemos deixar o Atlasum ainda melhor para a sua operação?</p>
              <textarea 
                value={sugestao}
                onChange={(e) => setSugestao(e.target.value)}
                placeholder="Descreva sua ideia, nova funcionalidade ou algo que podemos melhorar..."
                className="w-full h-32 p-3 text-sm border border-slate-300 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
              ></textarea>
              <button 
                onClick={handleSendSugestao}
                disabled={!sugestao.trim()}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} /> Enviar Ideia
              </button>
            </div>
          )}
        </div>
      )}

      {/* BOTÃO FLUTUANTE PRINCIPAL */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 border-4 border-white"
      >
        {isOpen ? <X size={24} /> : <HelpCircle size={28} />}
      </button>
    </div>
  );
}