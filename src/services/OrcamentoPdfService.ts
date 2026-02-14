import { supabase } from '../supabaseClient';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Função auxiliar para converter a Logo (URL) em Base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result as string), false);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(blob);
    });
};

export const OrcamentoPdfService = {
  async gerar(orcamentoId: number) {
    try {
        // 1. Busca os dados
        const { data: orc } = await supabase.from('orçamentos').select('*, clientes(*)').eq('id', orcamentoId).single();
        const { data: itens } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', orcamentoId);
        const { data: config } = await supabase.from('configuracoes_empresa').select('*').eq('id', 1).maybeSingle();

        if (!orc) throw new Error("Orçamento não encontrado");

        const doc = new jsPDF();
        
        // Cores da Marca (Padronizadas)
        const colorPrimary = [30, 58, 138]; // Indigo 900
        const colorSecondary = [71, 85, 105]; // Slate 600
        
        // ==========================================
        // 1. CABEÇALHO
        // ==========================================
        if (config?.logo_url) {
            try {
                const logoBase64 = await getBase64ImageFromUrl(config.logo_url);
                doc.addImage(logoBase64, 'PNG', 14, 15, 35, 15, '', 'FAST');
            } catch (e) {
                console.warn("Logo error", e);
            }
        } else {
            doc.setFontSize(20);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]); 
            doc.text(config?.nome_empresa || 'ATLAS SYSTEM', 14, 25);
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); 
        doc.text(config?.nome_empresa || 'ATLAS SYSTEM', 196, 18, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colorSecondary[0], colorSecondary[1], colorSecondary[2]); 
        doc.text(`CNPJ: ${config?.cnpj || 'Não informado'}`, 196, 23, { align: 'right' });
        doc.text(config?.endereco_completo || 'Endereço não cadastrado', 196, 28, { align: 'right' });
        
        let headerY = 33;
        if(config?.telefone) { doc.text(`Tel: ${config.telefone}`, 196, headerY, { align: 'right' }); headerY += 5; }
        if(config?.email) { doc.text(config.email, 196, headerY, { align: 'right' }); }
        
        doc.setDrawColor(226, 232, 240); 
        doc.setLineWidth(0.5);
        doc.line(14, 45, 196, 45);

        // ==========================================
        // 2. DADOS DO CLIENTE (COM EMAIL E CONTATO)
        // ==========================================
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]); 
        doc.text(`ORÇAMENTO TÉCNICO Nº ${orc.numero_orcamento}`, 14, 57);

        // Caixa Cinza (Aumentada para 4 linhas de info)
        doc.setFillColor(248, 250, 252); 
        doc.setDrawColor(226, 232, 240); 
        doc.roundedRect(14, 62, 182, 45, 3, 3, 'FD'); 

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Label color
        
        // Coluna 1 Labels
        doc.text("Cliente:", 18, 70);
        doc.text("CNPJ/CPF:", 18, 78);
        doc.text("Solicitante:", 18, 86);
        doc.text("E-mail:", 18, 94); // Nova Linha
        doc.text("Telefone:", 18, 102); // Nova Linha

        // Coluna 1 Dados
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42); // Data color
        doc.text(`${orc.clientes?.nome_fantasia || 'Cliente não identificado'}`, 40, 70);
        doc.text(`${orc.clientes?.doc_id || '-'}`, 40, 78);
        doc.text(`${orc.solicitante || 'Responsável Técnico'}`, 40, 86);
        doc.text(`${orc.email_contato || orc.clientes?.email || '-'}`, 40, 94); // Puxa do orçamento ou do cadastro
        doc.text(`${orc.telefone_contato || orc.clientes?.telefone || '-'}`, 40, 102);

        // Coluna 2 (Datas)
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text("Emissão:", 130, 70);
        doc.text("Validade:", 130, 78);
        doc.text("Status:", 130, 86);

        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`${format(parseISO(orc.data_emissao), 'dd/MM/yyyy')}`, 155, 70);
        doc.text(`${orc.validade ? format(parseISO(orc.validade), 'dd/MM/yyyy') : '15 dias'}`, 155, 78);
        
        // Status com cor dinâmica (simulação visual)
        doc.setTextColor(orc.status === 'APROVADO' ? 22 : 202, orc.status === 'APROVADO' ? 163 : 138, orc.status === 'APROVADO' ? 74 : 4);
        doc.text(`${orc.status}`, 155, 86);

        // ==========================================
        // 3. TABELA DE ITENS
        // ==========================================
        const tableData = itens?.map((i: any, index: number) => [
            (index + 1).toString().padStart(2, '0'), 
            i.descricao,
            i.quantidade.toString(),
            `R$ ${Number(i.valor_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            `R$ ${Number(i.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        ]) || [];

        autoTable(doc, {
            startY: 115,
            head: [['#', 'DESCRIÇÃO DO SERVIÇO / PRODUTO', 'QTD', 'VALOR UNIT.', 'VALOR TOTAL']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
                fillColor: colorPrimary, 
                textColor: 255, 
                fontStyle: 'bold', 
                fontSize: 8,
                halign: 'center'
            }, 
            bodyStyles: { 
                fontSize: 9, 
                textColor: 50,
                cellPadding: 4 
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { cellWidth: 'auto' },
                2: { halign: 'center', cellWidth: 15 },
                3: { halign: 'right', cellWidth: 35 },
                4: { halign: 'right', cellWidth: 35 }
            }
        });

        // ==========================================
        // 4. TOTAIS E PAGAMENTO
        // ==========================================
        let finalY = (doc as any).lastAutoTable.finalY || 115;
        if (finalY > 210) { doc.addPage(); finalY = 20; }

        // Box Total
        doc.setFillColor(241, 245, 249); 
        doc.roundedRect(120, finalY + 5, 76, 14, 1, 1, 'F');
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colorPrimary[0], colorPrimary[1], colorPrimary[2]);
        doc.text(`TOTAL: R$ ${Number(orc.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 192, finalY + 14, { align: 'right' });

        // Informações de Pagamento
        doc.setFontSize(9);
        doc.setTextColor(15, 23, 42);
        doc.text("Condições de Pagamento:", 14, finalY + 12);
        doc.setFont("helvetica", "normal");
        doc.text(`${orc.metodo_pagamento || 'Boleto Bancário'} - ${orc.prazo_pagamento || 'À vista'}`, 14, finalY + 17);

        // ==========================================
        // 5. OBSERVAÇÕES E TERMOS JURÍDICOS (PROFISSIONALIZAÇÃO)
        // ==========================================
        finalY += 30;
        
        // Observações Específicas
        if (orc.observacoes) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.text("Observações Específicas:", 14, finalY);
            doc.setFont("helvetica", "normal");
            const splitObs = doc.splitTextToSize(orc.observacoes, 180);
            doc.text(splitObs, 14, finalY + 5);
            finalY += (splitObs.length * 5) + 10;
        }

        // --- BLOCO JURÍDICO PADRÃO (Termos de Serviço) ---
        if (finalY > 240) { doc.addPage(); finalY = 20; }
        
        doc.setDrawColor(200, 200, 200);
        doc.line(14, finalY, 196, finalY);
        finalY += 5;

        doc.setFontSize(7); // Fonte pequena para termos legais
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "bold");
        doc.text("TERMOS E CONDIÇÕES GERAIS DE FORNECIMENTO:", 14, finalY);
        
        doc.setFont("helvetica", "normal");
        const termos = [
            "1. VALIDADE: Esta proposta é válida pelo prazo estipulado no cabeçalho. Após este período, os valores e disponibilidade estão sujeitos a reajuste.",
            "2. GARANTIA: Garantia legal de 90 (noventa) dias sobre serviços prestados e peças substituídas, conforme Art. 26 do Código de Defesa do Consumidor (Lei 8.078/90), exceto quando estipulado prazo maior em contrato específico.",
            "3. PAGAMENTO: O não pagamento na data de vencimento acarretará multa de 2% e juros de mora de 1% ao mês pro rata die.",
            "4. APROVAÇÃO: A aprovação deste orçamento, seja por assinatura, e-mail ou ordem de compra, implica na aceitação integral destes termos.",
            "5. EXECUÇÃO: O prazo de execução inicia-se após a aprovação formal e liberação do equipamento/local pelo cliente."
        ];
        
        let termY = finalY + 4;
        termos.forEach(termo => {
            doc.text(termo, 14, termY);
            termY += 3.5;
        });

        // ==========================================
        // 6. ÁREA DE ASSINATURA (Aceite)
        // ==========================================
        const assinaturaY = 265; // Perto do rodapé
        doc.setDrawColor(150, 150, 150);
        doc.line(14, assinaturaY, 90, assinaturaY); // Linha Cliente
        doc.line(110, assinaturaY, 186, assinaturaY); // Linha Empresa

        doc.setFontSize(7);
        doc.text("DE ACORDO (CLIENTE)", 14, assinaturaY + 4);
        doc.text("DATA: ____/____/_______", 14, assinaturaY + 8);

        doc.text("ATLAS SYSTEM - TÉCNICO RESPONSÁVEL", 110, assinaturaY + 4);

        // ==========================================
        // 7. RODAPÉ
        // ==========================================
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Orçamento #${orc.numero_orcamento} - Documento gerado eletronicamente em ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 290);
            doc.text(`Pág ${i}/${pageCount}`, 196, 290, { align: 'right' });
        }

        doc.save(`Orcamento_${orc.numero_orcamento}.pdf`);

    } catch (error) {
        console.error("Erro PDF:", error);
        alert("Erro ao gerar PDF.");
    }
  }
};