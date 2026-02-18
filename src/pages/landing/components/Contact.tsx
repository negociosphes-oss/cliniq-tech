import React from 'react';
import { Send, MessageSquare } from 'lucide-react';

export function Contact() {
  return (
    <section className="py-24 bg-white" id="contato">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tighter">
            Pronto para evoluir sua <span className="text-cyan-600">operação?</span>
          </h2>
          <p className="text-lg text-slate-600">
            Fale com nossos especialistas. Entenderemos o seu cenário e apresentaremos a estrutura ideal do Atlasum para o seu negócio.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-slate-50 p-8 md:p-10 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-slate-200">
            <div className="bg-cyan-100 p-3 rounded-xl text-cyan-600">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Solicitar Contato Comercial</h3>
              <p className="text-sm text-slate-500">Retornamos em até 1 dia útil.</p>
            </div>
          </div>

          {/* FORMULÁRIO PREPARADO PARA NETLIFY FORMS */}
          <form 
            name="contato-atlasum" 
            method="POST" 
            data-netlify="true" 
            netlify-honeypot="bot-field"
            className="flex flex-col gap-6"
          >
            {/* Campos Ocultos Obrigatórios do Netlify */}
            <input type="hidden" name="form-name" value="contato-atlasum" />
            <p className="hidden">
              <label>Não preencha isso se for humano: <input name="bot-field" /></label>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  name="nome"
                  required
                  className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400 font-medium"
                  placeholder="Seu nome"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">E-mail Corporativo</label>
                <input 
                  type="email" 
                  name="email"
                  required
                  className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400 font-medium"
                  placeholder="voce@empresa.com.br"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Telefone / WhatsApp</label>
                <input 
                  type="tel" 
                  name="telefone"
                  required
                  className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 outline-none focus:border-cyan-500 transition-all placeholder:text-slate-400 font-medium"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 ml-1">Número de Técnicos</label>
                <select 
                  name="tamanho_equipe"
                  className="w-full h-12 px-4 bg-white border-2 border-slate-200 rounded-xl text-slate-800 outline-none focus:border-cyan-500 transition-all font-medium"
                >
                  <option value="1">Apenas eu (Autônomo)</option>
                  <option value="2-5">De 2 a 5 técnicos</option>
                  <option value="6-15">De 6 a 15 técnicos</option>
                  <option value="16+">Mais de 16 técnicos / Hospital</option>
                </select>
              </div>
            </div>

            <button 
              type="submit" 
              className="mt-4 w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-cyan-600/30 flex items-center justify-center gap-2"
            >
              Enviar Solicitação <Send className="h-5 w-5" />
            </button>

          </form>
        </div>
      </div>
    </section>
  );
}