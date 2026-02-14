import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react'
import type { Cronograma } from '../../types'

interface CronogramaCalendarProps {
  data: Cronograma[];
  onRefresh: () => void;
}

export function CronogramaCalendar({ data }: CronogramaCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- LÓGICA DE DATAS ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, i) => i + 1);
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 = Domingo
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const days = getDaysInMonth(currentDate);
  const firstDayIndex = getFirstDayOfMonth(currentDate); // Espaços vazios no início
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // --- RENDERIZAÇÃO ---
  return (
    <div className="flex flex-col h-full animate-fadeIn">
      
      {/* CABEÇALHO DO CALENDÁRIO */}
      <div className="flex justify-between items-center mb-6 px-2">
        <h2 className="text-xl font-bold capitalize text-slate-700 dark:text-white flex items-center gap-2">
          <CalIcon className="text-blue-600"/> {monthName}
        </h2>
        <div className="flex gap-2">
          <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <ChevronLeft size={24}/>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition">
            Hoje
          </button>
          <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <ChevronRight size={24}/>
          </button>
        </div>
      </div>

      {/* GRID DO CALENDÁRIO */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        
        {/* DIAS DA SEMANA */}
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
          <div key={day} className="bg-slate-50 dark:bg-slate-900 p-3 text-center text-xs font-bold uppercase text-slate-500">
            {day}
          </div>
        ))}

        {/* ESPAÇOS VAZIOS (INÍCIO DO MÊS) */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-white dark:bg-slate-800 min-h-[120px]"></div>
        ))}

        {/* DIAS DO MÊS */}
        {days.map(day => {
          // Filtra eventos deste dia
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const eventosDoDia = data.filter(item => item.data_programada === dateStr);
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

          return (
            <div key={day} className={`bg-white dark:bg-slate-800 p-2 min-h-[120px] transition hover:bg-slate-50 dark:hover:bg-slate-700/50 flex flex-col gap-1 group ${isToday ? 'bg-blue-50/30' : ''}`}>
              
              <div className="flex justify-between items-start">
                <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-300'}`}>
                  {day}
                </span>
                {eventosDoDia.length > 0 && (
                   <span className="text-[10px] font-bold text-slate-400">{eventosDoDia.length} itens</span>
                )}
              </div>

              {/* LISTA DE EVENTOS (LIMITADA A 3 PARA NÃO QUEBRAR O LAYOUT) */}
              <div className="flex-1 flex flex-col gap-1 mt-1 overflow-hidden">
                {eventosDoDia.slice(0, 4).map(ev => {
                   // Cor baseada no status
                   let colorClass = 'bg-blue-100 text-blue-700 border-blue-200';
                   if (ev.status === 'Realizada') colorClass = 'bg-green-100 text-green-700 border-green-200';
                   if (ev.status === 'Atrasada') colorClass = 'bg-red-100 text-red-700 border-red-200';
                   
                   return (
                    <div 
                      key={ev.id} 
                      className={`text-[10px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${colorClass}`}
                      title={`${ev.equipamentos?.tag} - ${ev.tipo_servico}`}
                    >
                      <strong>{ev.equipamentos?.tag}</strong>
                    </div>
                   )
                })}
                {eventosDoDia.length > 4 && (
                  <span className="text-[9px] text-center text-slate-400 italic">+ {eventosDoDia.length - 4} outros...</span>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  )
}