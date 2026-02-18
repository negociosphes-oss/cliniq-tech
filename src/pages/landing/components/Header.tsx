import React from 'react';

export function Header() {
  // Função temporária para os botões de idioma
  const handleLanguageClick = (lang: string) => {
    alert(`O idioma ${lang} será ativado na fase de internacionalização do sistema!`);
  };

  return (
    <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Bicolor */}
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Ícone Atlasum" className="h-10 w-auto object-contain" />
          <div className="text-3xl font-black tracking-tighter uppercase leading-none mt-1">
            <span className="text-slate-900">Atlas</span>
            <span className="text-cyan-600">um</span>
          </div>
        </div>

        {/* Menu Central */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#solucoes" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Soluções</a>
          <a href="#sobre" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Quem Somos</a>
          <a href="#planos" className="text-sm font-bold text-slate-600 hover:text-cyan-600 transition-colors">Planos</a>
        </nav>

        {/* Ações, Idiomas e Botões de Venda */}
        <div className="flex items-center gap-4">
          
          {/* Seletor de Idioma */}
          <div className="hidden lg:flex items-center gap-2 border-r border-slate-200 pr-4 mr-1">
            <button className="text-xs font-black text-cyan-600 hover:text-cyan-700 transition-colors">PT</button>
            <button onClick={() => handleLanguageClick('Inglês')} className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors">EN</button>
            <button onClick={() => handleLanguageClick('Espanhol')} className="text-xs font-bold text-slate-400 hover:text-cyan-600 transition-colors">ES</button>
          </div>

          {/* Link discreto para quem já é cliente */}
          <a 
            href="/login" 
            className="hidden sm:block text-sm font-bold text-slate-500 hover:text-cyan-600 transition-colors"
          >
            Acesso Cliente
          </a>

          {/* BOTÃO PRINCIPAL DE VENDAS */}
          <a 
            href="#contato" 
            className="px-6 py-2.5 text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-md hover:shadow-lg"
          >
            Agendar Demonstração
          </a>
          
        </div>
      </div>
    </header>
  );
}