import { differenceInHours, parseISO, differenceInDays } from 'date-fns';

export const BiService = {
  calcularIndicadores(ordens: any[]) {
    const total = ordens.length;
    
    // Se não houver dados, retorna zerado para não quebrar a tela
    if (total === 0) return {
        total: 0, concluidas: 0, pendentes: 0, mttr: '0h', mtbf: '0d',
        custoTotal: 0, taxaSucesso: '0%', custoPecas: 0, custoMaoObra: 0
    };

    const concluidas = ordens.filter(o => o.status === 'Concluída');
    const abertas = ordens.filter(o => o.status === 'Aberta' || o.status === 'Em Execução');
    
    // 1. CÁLCULO DE MTTR (Tempo Médio de Reparo em Horas)
    let somaHorasReparo = 0;
    let countComDatas = 0;
    concluidas.forEach(o => {
        if(o.data_conclusao && o.data_abertura) {
            const inicio = parseISO(o.data_abertura);
            const fim = parseISO(o.data_conclusao);
            const diff = differenceInHours(fim, inicio);
            if (diff >= 0) {
                somaHorasReparo += diff;
                countComDatas++;
            }
        }
    });
    const mttr = countComDatas > 0 ? (somaHorasReparo / countComDatas).toFixed(1) : '0';

    // 2. CÁLCULO DE MTBF (Tempo Médio Entre Falhas em Dias)
    // Simplificação: (Periodo total de análise / Numero de falhas)
    // Para um cálculo exato, precisaríamos do histórico de cada máquina, 
    // mas aqui faremos uma média global do parque.
    const mtbf = concluidas.length > 0 ? (120 / concluidas.length).toFixed(0) : '0'; // Base 120 dias (mock de janela)

    // 3. CUSTOS
    // Assumindo que você pode ter campos 'custo_pecas' e 'custo_servico' no futuro.
    // Por enquanto, usaremos custo_total.
    const custoTotal = concluidas.reduce((acc, curr) => acc + (Number(curr.custo_total) || 0), 0);

    return {
        total,
        concluidas: concluidas.length,
        pendentes: total - concluidas.length,
        mttr: `${mttr}h`,
        mtbf: `${mtbf}d`, // Estimado
        custoTotal: custoTotal,
        taxaSucesso: ((concluidas.length / total) * 100).toFixed(0) + '%'
    };
  }
};