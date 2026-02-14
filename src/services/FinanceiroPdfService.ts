import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const FinanceiroPdfService = {
  async gerarRelatorio(lancamentos: any[], filtros: any) {
    try {
        const { data: config } = await supabase.from('configuracoes_empresa').select('*').eq('id', 1).maybeSingle();

        const doc = new jsPDF();
        
        // --- CABEÇALHO ---
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 58, 138); 
        doc.text(config?.nome_empresa || 'ATLAS FINANCEIRO', 14, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text("RELATÓRIO DE FLUXO DE CAIXA E RECEBIMENTOS", 14, 26);
        
        doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 196, 20, { align: 'right' });
        doc.text(`Período: ${filtros.inicio ? format(parseISO(filtros.inicio), 'dd/MM/yyyy') : 'Início'} até ${filtros.fim ? format(parseISO(filtros.fim), 'dd/MM/yyyy') : 'Hoje'}`, 196, 26, { align: 'right' });

        doc.line(14, 30, 196, 30);

        // --- RESUMO EXECUTIVO (KPIs no PDF) ---
        const totalRecebido = lancamentos.filter(l => l.status === 'PAGO').reduce((acc, l) => acc + l.valor_total, 0);
        const totalPendente = lancamentos.filter(l => l.status === 'PENDENTE').reduce((acc, l) => acc + l.valor_total, 0);
        const totalGeral = lancamentos.reduce((acc, l) => acc + l.valor_total, 0);

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(14, 35, 182, 25, 2, 2, 'F');

        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        doc.text("RECEITA REALIZADA", 20, 42);
        doc.text("RECEITA PREVISTA (PENDENTE)", 90, 42);
        doc.text("VOLUME TOTAL NO PERÍODO", 160, 42);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(5, 150, 105); // Verde
        doc.text(`R$ ${totalRecebido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 20, 50);
        
        doc.setTextColor(217, 119, 6); // Amarelo
        doc.text(`R$ ${totalPendente.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 90, 50);
        
        doc.setTextColor(30, 58, 138); // Azul
        doc.text(`R$ ${totalGeral.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 160, 50);

        // --- TABELA DETALHADA ---
        const tableData = lancamentos.map((l) => [
            format(parseISO(l.data_vencimento), 'dd/MM/yyyy'),
            l.descricao,
            l.clientes?.nome_fantasia || 'Cliente Avulso',
            l.categoria || '-',
            l.status,
            `R$ ${Number(l.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['VENCIMENTO', 'DESCRIÇÃO', 'CLIENTE', 'CATEGORIA', 'STATUS', 'VALOR']],
            body: tableData,
            theme: 'striped',
            headStyles: { fillColor: [30, 58, 138], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 40 },
                3: { cellWidth: 25 },
                4: { cellWidth: 25, fontStyle: 'bold' },
                5: { cellWidth: 30, halign: 'right' }
            },
            didParseCell: function(data) {
                // Colorir texto do status
                if (data.section === 'body' && data.column.index === 4) {
                    if (data.cell.raw === 'PAGO') data.cell.styles.textColor = [5, 150, 105]; // Verde
                    if (data.cell.raw === 'ATRASADO') data.cell.styles.textColor = [220, 38, 38]; // Vermelho
                    if (data.cell.raw === 'PENDENTE') data.cell.styles.textColor = [217, 119, 6]; // Amarelo
                }
            }
        });

        // Rodapé
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Relatório Financeiro Confidencial - ATLAS Enterprise`, 14, 290);
            doc.text(`Pág ${i}/${pageCount}`, 196, 290, { align: 'right' });
        }

        doc.save(`Relatorio_Financeiro_${format(new Date(), 'yyyyMMdd')}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Erro ao gerar relatório.");
    }
  }
};