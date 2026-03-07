import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    if (!imageUrl) return '';
    try {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(''); 
            reader.readAsDataURL(blob);
        });
    } catch { return ''; }
};

export const OrcamentoPdfService = {
  async gerar(orcamentoId: number, acao: 'view' | 'download' = 'view') {
    try {
        const { data: orc } = await supabase.from('orçamentos').select('*, clientes(*)').eq('id', orcamentoId).single();
        if (!orc) throw new Error("Orçamento não encontrado");

        const { data: itens, error: itensError } = await supabase
            .from('orcamento_itens')
            .select('*, estoque_itens(imagem_url)')
            .eq('orcamento_id', orcamentoId)
            .order('id');
            
        if (itensError) console.error("Erro ao buscar itens:", itensError);

        let config: any = {};
        const { data: tenantData } = await supabase.from('empresas_inquilinas').select('*').eq('id', orc.tenant_id || 1).maybeSingle();
        const { data: confData } = await supabase.from('configuracoes_empresa').select('*').limit(1).maybeSingle();
        config = { ...(tenantData || {}), ...(confData || {}) };

        const itensComFotos = [];
        for (const item of (itens || [])) {
            let fotoBase64 = '';
            if (item.estoque_itens?.imagem_url) {
                fotoBase64 = await getBase64ImageFromUrl(item.estoque_itens.imagem_url);
            }
            itensComFotos.push({ ...item, fotoBase64 });
        }

        const doc = new jsPDF();
        
        const colorPrimary: [number, number, number] = [30, 58, 138]; 
        const colorSecondary: [number, number, number] = [100, 116, 139]; 
        
        doc.setFillColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.rect(0, 0, 210, 6, 'F'); 

        if (config?.logo_url) {
            try {
                const logoBase64 = await getBase64ImageFromUrl(config.logo_url);
                const imgProps = doc.getImageProperties(logoBase64);
                const targetHeight = 12;
                const targetWidth = (imgProps.width * targetHeight) / imgProps.height;
                const finalWidth = targetWidth > 50 ? 50 : targetWidth; 
                const finalHeight = targetWidth > 50 ? (imgProps.height * 50) / imgProps.width : targetHeight;
                doc.addImage(logoBase64, 'PNG', 14, 10, finalWidth, finalHeight, '', 'FAST');
            } catch (e) { console.warn("Erro logo", e); }
        } else {
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]); 
            doc.text(config?.nome_empresa || 'ATLAS SYSTEM', 14, 22);
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); 
        doc.text(config?.nome_empresa || 'ATLAS SYSTEM MEDICAL', 196, 16, { align: 'right' });
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]); 
        doc.text(`CNPJ: ${config?.cnpj || '-'}`, 196, 21, { align: 'right' });
        doc.text(config?.endereco_completo || config?.endereco || '', 196, 25, { align: 'right' });
        if(config?.telefone) doc.text(`Tel: ${config.telefone}`, 196, 29, { align: 'right' });
        if(config?.email) doc.text(config.email, 196, 33, { align: 'right' });
        
        doc.setDrawColor(226, 232, 240); 
        doc.setLineWidth(0.5);
        doc.line(14, 40, 196, 40);

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]); 
        doc.text(`PROPOSTA COMERCIAL Nº ${orc.numero_orcamento}`, 14, 50);

        doc.setFillColor(248, 250, 252); 
        doc.setDrawColor(226, 232, 240); 
        doc.roundedRect(14, 55, 182, 36, 3, 3, 'FD'); 

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Cliente:", 18, 63); doc.text("CNPJ/CPF:", 18, 70); doc.text("A/C (Aos cuidados):", 18, 77); doc.text("Contato:", 18, 84);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${orc.clientes?.nome_fantasia || orc.clientes?.razao_social || '-'}`, 48, 63);
        doc.text(`${orc.clientes?.doc_id || '-'}`, 48, 70);
        doc.text(`${orc.solicitante || orc.clientes?.responsavel || '-'}`, 48, 77);
        doc.text(`${orc.telefone_contato || orc.clientes?.telefone || '-'} ${orc.email_contato ? ` |  ${orc.email_contato}` : ''}`, 48, 84);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Emissão:", 140, 63); doc.text("Validade:", 140, 70); doc.text("Status:", 140, 77);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${format(parseISO(orc.data_emissao), 'dd/MM/yyyy')}`, 155, 63);
        doc.text(`${orc.validade ? format(parseISO(orc.validade), 'dd/MM/yyyy') : '-'}`, 155, 70);
        
        doc.setTextColor(orc.status === 'APROVADO' ? 22 : 202, orc.status === 'APROVADO' ? 163 : 138, orc.status === 'APROVADO' ? 74 : 4);
        doc.text(`${orc.status}`, 155, 77);

        const tableData = itensComFotos.map((i: any, index: number) => [
            (index + 1).toString().padStart(2, '0'), 
            '', 
            i.descricao || '-',
            i.quantidade?.toString() || '0',
            `R$ ${Number(i.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `R$ ${Number(i.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: 98,
            head: [['#', 'FOTO', 'DESCRIÇÃO DO SERVIÇO / MATERIAL', 'QTD', 'VALOR UNIT.', 'VALOR TOTAL']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: colorPrimary, textColor: 255, fontStyle: 'bold', fontSize: 8, halign: 'center' }, 
            bodyStyles: { fontSize: 8, textColor: 50, cellPadding: { top: 6, bottom: 6, left: 2, right: 2 }, minCellHeight: 14 }, 
            alternateRowStyles: { fillColor: [248, 250, 252] }, 
            columnStyles: {
                0: { halign: 'center', cellWidth: 8 },
                1: { halign: 'center', cellWidth: 16 }, 
                2: { cellWidth: 'auto' },
                3: { halign: 'center', cellWidth: 12 },
                4: { halign: 'right', cellWidth: 28 },
                5: { halign: 'right', cellWidth: 30 }
            },
            didDrawCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const rowData = itensComFotos[data.row.index];
                    if (rowData.fotoBase64) {
                        try {
                            doc.addImage(rowData.fotoBase64, 'JPEG', data.cell.x + 2, data.cell.y + 1, 12, 12, '', 'FAST');
                        } catch (e) { console.warn("Erro rendering foto item") }
                    } else {
                        doc.setFontSize(6);
                        doc.setTextColor(200, 200, 200);
                        doc.text("S/ FOTO", data.cell.x + 8, data.cell.y + 8, { align: 'center' });
                    }
                }
            }
        });

        let finalY = (doc as any).lastAutoTable.finalY || 100;
        if (finalY > 210) { doc.addPage(); finalY = 20; }

        doc.setFillColor(241, 245, 249); 
        doc.roundedRect(136, finalY + 5, 60, 15, 2, 2, 'F');
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.text(`TOTAL: R$ ${Number(orc.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 192, finalY + 15, { align: 'right' });

        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("Condições de Pagamento:", 14, finalY + 10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${orc.metodo_pagamento || '-'}   |   Prazo: ${orc.prazo_pagamento || '-'}`, 14, finalY + 15);

        finalY += 35;
        
        if (orc.observacoes) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
            doc.text("Observações Extras:", 14, finalY);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(71, 85, 105);
            const splitObs = doc.splitTextToSize(orc.observacoes, 180);
            doc.text(splitObs, 14, finalY + 5);
            finalY += (splitObs.length * 4) + 10;
        }

        if (finalY > 230) { doc.addPage(); finalY = 20; }
        
        doc.setDrawColor(226, 232, 240);
        doc.line(14, finalY, 196, finalY);
        finalY += 6;

        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "bold");
        doc.text("TERMOS E CONDIÇÕES DE FORNECIMENTO:", 14, finalY);
        
        doc.setFont("helvetica", "normal");
        
        // 🚀 O MOTOR DE TERMOS: Usa o que o vendedor digitou na tela!
        const termosTexto = orc.termos_condicoes || "Sem termos informados para esta proposta.";
        
        const termosLinhas = doc.splitTextToSize(termosTexto, 182);
        doc.text(termosLinhas, 14, finalY + 4);
        
        finalY += (termosLinhas.length * 3.5) + 10;

        if (finalY > 260) { doc.addPage(); finalY = 40; } 

        const assinaturaY = Math.max(finalY + 10, 260); 
        doc.setDrawColor(150, 150, 150);
        doc.line(14, assinaturaY, 90, assinaturaY); 
        doc.line(110, assinaturaY, 196, assinaturaY); 

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("DE ACORDO (CLIENTE)", 14, assinaturaY + 4);
        doc.setFont("helvetica", "normal");
        doc.text("DATA: ____/____/_______", 14, assinaturaY + 8);

        doc.setFont("helvetica", "bold");
        doc.text(config?.nome_empresa?.toUpperCase() || 'ATLAS SYSTEM MEDICAL', 110, assinaturaY + 4);
        doc.setFont("helvetica", "normal");
        doc.text("Departamento Técnico / Comercial", 110, assinaturaY + 8);

        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(6);
            doc.setTextColor(150, 150, 150);
            doc.text(`Proposta Comercial #${orc.numero_orcamento} - Gerado digitalmente em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 290);
            doc.text(`Página ${i} de ${pageCount}`, 196, 290, { align: 'right' });
        }

        if (acao === 'download') {
            doc.save(`Proposta_Comercial_${orc.numero_orcamento}.pdf`);
        } else {
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
        }

    } catch (error) {
        console.error("Erro PDF:", error);
        alert("Erro ao gerar PDF.");
    }
  }
};