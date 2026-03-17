import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLanguageClick = (lang: string) => {
    alert(`O idioma ${lang} será ativado na fase de internacionalização do sistema!`);
  };

  return (
    <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* 🚀 Logo Clicável (Volta pro Início) */}
        <a href="/" className="flex items-center gap-3 z-[60]">
          <img src="/logo.png" alt="Ícone Atlasum" className="h-10 w-auto object-contain" />
          <div className="text-3xl font-black tracking-tighter uppercase leading-none mt-1">
            <span className="text-slate-900">Atlas</span>
            <span className="text-cyan-600">um</span>
          </div>
        </a>

        {/* Menu Central Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#solucoes" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Soluções</a>
          <a href="#sobre" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Quem Somos</a>
          <a href="#planos" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Planos</a>
        </nav>

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-4 mr-1">
            <button className="text-xs font-black text-cyan-600">PT</button>
            <button onClick={() => handleLanguageClick('Inglês')} className="text-xs font-bold text-slate-400 hover:text-cyan-600">EN</button>
            <button onClick={() => handleLanguageClick('Espanhol')} className="text-xs font-bold text-slate-400 hover:text-cyan-600">ES</button>
          </div>
          <a href="/login" className="text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors">Acesso Cliente</a>
          <a href="#contato" className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-md hover:shadow-lg">Agendar Demonstração</a>
        </div>

        {/* 🚀 Botão Mobile (Hambúrguer) */}
        <button className="md:hidden p-2 z-[60] text-slate-700" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* 🚀 Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 w-full h-[100dvh] bg-white pt-24 px-6 flex flex-col gap-6 z-50 animate-fadeIn">
           <a href="#solucoes" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Soluções</a>
           <a href="#sobre" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Quem Somos</a>
           <a href="#planos" onClick={() => setMobileMenuOpen(false)} className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">Planos</a>
           
           <div className="mt-auto mb-10 flex flex-col gap-4">
              <a href="/login" className="w-full py-4 text-center text-lg font-bold text-cyan-600 bg-cyan-50 rounded-xl border border-cyan-100">Acesso Cliente</a>
              <a href="#contato" onClick={() => setMobileMenuOpen(false)} className="w-full py-4 text-center text-lg font-bold text-white bg-cyan-600 rounded-xl shadow-lg">Agendar Demonstração</a>
           </div>
        </div>
      )}
    </header>
  );
}