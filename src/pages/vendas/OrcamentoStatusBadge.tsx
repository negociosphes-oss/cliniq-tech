import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export function OrcamentoStatusBadge({ status }: { status: string }) {
  const styles: any = {
    'PENDENTE': 'bg-amber-50 text-amber-700 border-amber-200',
    'APROVADO': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'REPROVADO': 'bg-rose-50 text-rose-700 border-rose-200'
  };
  
  const icons: any = {
    'PENDENTE': <Clock size={12}/>,
    'APROVADO': <CheckCircle2 size={12}/>,
    'REPROVADO': <XCircle size={12}/>
  };

  return (
    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black flex items-center gap-1.5 w-max uppercase tracking-wider ${styles[status] || styles['PENDENTE']}`}>
      {icons[status] || icons['PENDENTE']} {status}
    </span>
  );
}