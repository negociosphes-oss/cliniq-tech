import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export function Hero() {
  return (
    <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden relative bg-slate-900 min-h-[90vh] flex items-center justify-center text-center">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80')] opacity-5 bg-cover bg-center mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/80"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center">
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/50 border border-cyan-900/50 text-cyan-400 text-xs font-bold mb-8 uppercase tracking-widest backdrop-blur-sm animate-slideUp">
          <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse"></span>
          O Futuro da Engenharia Clínica
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 leading-[1.1] animate-slideUp" style={{ animationDelay: '0.1s' }}>
          Controle total da sua operação em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">única tela.</span>
        </h1>
        
        <p className="max-w-2xl text-lg md:text-xl text-slate-400 mb-10 leading-relaxed font-medium animate-slideUp" style={{ animationDelay: '0.2s' }}>
          Automatize ordens de serviço, rastreabilidade de ativos e indicadores de desempenho com a plataforma mais moderna do mercado.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto animate-slideUp" style={{ animationDelay: '0.3s' }}>
          <a href="#contato" className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 hover:-translate-y-1">
            Agendar Demonstração <ArrowRight className="h-5 w-5" />
          </a>
          <div className="flex items-center justify-center gap-3 px-6 py-4 text-sm font-bold text-slate-300">
            <ShieldCheck className="h-5 w-5 text-cyan-500" />
            Adequado às normas RBC e ONA
          </div>
        </div>

      </div>
    </section>
  );
}