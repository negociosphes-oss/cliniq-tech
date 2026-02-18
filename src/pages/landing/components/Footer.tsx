import React from 'react';
import { Activity, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 text-white mb-6">
              <div className="bg-cyan-600 p-2 rounded-lg">
                <Activity size={20} strokeWidth={2.5} />
              </div>
              <span className="font-black text-xl tracking-[0.15em] uppercase">Atlasum</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              A plataforma definitiva para gestão de ativos, ordens de serviço e metrologia. Desenhada para a alta performance da engenharia clínica.
            </p>
            <div className="flex items-center gap-2 text-cyan-500/50 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck size={16} /> Data Center Seguro
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Soluções</h4>
            <ul className="space-y-4">
              <li><a href="#solucoes" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Orquestração de OS</a></li>
              <li><a href="#solucoes" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Gestão de Equipamentos</a></li>
              <li><a href="#funcionalidades" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Rastreabilidade via QR Code</a></li>
              <li><a href="#funcionalidades" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Portal do Cliente</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Institucional</h4>
            <ul className="space-y-4">
              <li><a href="#sobre" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Quem Somos</a></li>
              <li><a href="#precos" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Planos e Preços</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Política de Privacidade</a></li>
              <li><a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors text-sm">Termos de Uso</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 uppercase tracking-wider text-sm">Contato</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <Mail className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <span>contato@atlasum.com.br</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <Phone className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <span>(85) 99999-9999</span>
              </li>
              <li className="flex items-start gap-3 text-slate-400 text-sm">
                <MapPin className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <span>Eusébio, CE - Brasil<br/>Atendimento Nacional</span>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-slate-500 text-xs font-medium">
            &copy; {new Date().getFullYear()} Atlasum Tecnologia. Todos os direitos reservados.
          </p>
          <div className="flex gap-4 text-slate-600 text-xs">
            <span>CNPJ: 00.000.000/0001-00</span>
            <span className="hidden md:inline">•</span>
            <span>Feito com 💙 para a Engenharia Clínica</span>
          </div>
        </div>

      </div>
    </footer>
  );
}