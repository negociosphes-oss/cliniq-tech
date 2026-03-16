// src/services/RelatorioOSService.ts

export const RelatorioOSService = {
    
    // 🚀 MOTOR EXCEL (CSV Profissional com BOM)
    exportarExcel: (ordens: any[]) => {
        if (!ordens || ordens.length === 0) return alert('Não há dados para exportar.');

        const headers = ['OS #', 'Status', 'Tipo', 'Equipamento', 'Nº Série', 'TAG', 'Cliente/Hospital', 'Técnico', 'Data Abertura', 'Data Conclusão', 'Prioridade'];
        
        const rows = ordens.map(os => {
            const numOs = `#${os.id}`;
            const equipamento = os.equipamento?.nome || os.equipamento?.tecnologia?.nome || 'N/A';
            const serie = os.equipamento?.n_serie || '-';
            const tag = os.equipamento?.tag || '-';
            const cliente = os.cliente?.nome_fantasia || 'Sem Cliente';
            const tecnico = os.tecnico?.nome || 'Não Atribuído';
            const dataAbertura = os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '-';
            const dataConclusao = os.data_conclusao ? new Date(os.data_conclusao).toLocaleDateString('pt-BR') : '-';

            return [
                numOs, os.status || 'Aberta', os.tipo || '-', equipamento, serie, tag, 
                cliente, tecnico, dataAbertura, dataConclusao, os.prioridade || 'Normal'
            ];
        });

        const csvContent = '\ufeff' + [
            headers.join(';'),
            ...rows.map(r => r.map(item => `"${String(item).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Relatorio_OS_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    // 🚀 MOTOR PDF 1: RELATÓRIO GERENCIAL (Dashboard em Lista)
    imprimirPDF: (ordens: any[], configEmpresa: any) => {
        // ... (MANTIVE O SEU CÓDIGO ORIGINAL DE RELATÓRIO AQUI PARA VOCÊ NÃO PERDER) ...
        if (!ordens || ordens.length === 0) return alert('Não há dados para imprimir.');
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Por favor, permita pop-ups neste site.");

        const total = ordens.length;
        const concluidas = ordens.filter(o => (o.status || '').toLowerCase() === 'concluída').length;
        const abertas = ordens.filter(o => (o.status || '').toLowerCase() === 'aberta' || (o.status || '').toLowerCase() === 'em execução').length;
        const aguardando = ordens.filter(o => (o.status || '').toLowerCase() === 'aguardando peça' || (o.status || '').toLowerCase() === 'aguardando aprovação').length;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Relatório de Ordens de Serviço</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; }
                        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px;}
                        th { background-color: #f1f5f9; padding: 12px; text-align: left; }
                        td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                    </style>
                </head>
                <body>
                    <h2>Relatório Gerencial de O.S.</h2>
                    <p>Total: ${total} | Concluídas: ${concluidas} | Abertas: ${abertas}</p>
                    <table>
                        <tr><th>OS #</th><th>Equipamento</th><th>Tipo</th><th>Status</th></tr>
                        ${ordens.map(os => `<tr><td>${os.id}</td><td>${os.equipamento?.nome || 'N/A'}</td><td>${os.tipo}</td><td>${os.status}</td></tr>`).join('')}
                    </table>
                </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 800);
    },

    // 🚀 MOTOR PDF 2: FICHA DA ORDEM DE SERVIÇO (INDIVIDUAL E EM LOTE)
    imprimirFichaOS: (ordens: any[], configEmpresa: any) => {
        if (!ordens || ordens.length === 0) return alert('Nenhuma O.S. selecionada para impressão.');
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Por favor, permita pop-ups neste site para gerar a O.S.");

        const logoHtml = configEmpresa?.logo_url 
            ? `<img src="${configEmpresa.logo_url}" style="max-height: 60px; max-width: 200px; object-fit: contain;" />` 
            : `<h2 style="margin:0; color:#1e3a8a; font-weight:900;">${configEmpresa?.nome_fantasia || 'ATLAS SYSTEM'}</h2>`;

        // Gera uma folha de O.S. para CADA ordem selecionada (com quebra de página)
        const paginasHtml = ordens.map((os, index) => {
            const dataAbertura = os.created_at ? new Date(os.created_at).toLocaleString('pt-BR') : '-';
            const dataFechamento = os.data_fechamento ? new Date(os.data_fechamento).toLocaleString('pt-BR') : '-';
            const isLast = index === ordens.length - 1;

            return `
                <div class="page" style="${!isLast ? 'page-break-after: always;' : ''}">
                    <table class="header-table">
                        <tr>
                            <td style="width: 50%;">${logoHtml}</td>
                            <td style="width: 50%; text-align: right;">
                                <h1 style="margin:0; color:#1e293b; font-size:22px;">ORDEM DE SERVIÇO</h1>
                                <p style="margin:4px 0 0 0; color:#dc2626; font-weight:900; font-size:18px;">Nº ${String(os.id).padStart(5, '0')}</p>
                                <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Status: <strong style="color:#0f172a;">${os.status || 'Aberta'}</strong></p>
                            </td>
                        </tr>
                    </table>

                    <div class="section">
                        <div class="section-title">1. DADOS DO CLIENTE / SOLICITANTE</div>
                        <table class="info-table">
                            <tr>
                                <td style="width: 70%;"><strong>Cliente/Unidade:</strong> ${os.cliente?.nome_fantasia || os.cliente?.razao_social || 'Não informado'}</td>
                                <td style="width: 30%;"><strong>CNPJ:</strong> ${os.cliente?.cnpj || 'Não informado'}</td>
                            </tr>
                            <tr>
                                <td><strong>Endereço:</strong> ${os.cliente?.endereco || 'Não informado'}</td>
                                <td><strong>Telefone:</strong> ${os.cliente?.telefone || 'Não informado'}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">2. DADOS DO EQUIPAMENTO</div>
                        <table class="info-table">
                            <tr>
                                <td style="width: 50%;"><strong>Equipamento:</strong> ${os.equipamento?.nome || os.equipamento?.tecnologia?.nome || 'N/A'}</td>
                                <td style="width: 50%;"><strong>Fabricante/Modelo:</strong> ${os.equipamento?.fabricante || '-'} / ${os.equipamento?.modelo || '-'}</td>
                            </tr>
                            <tr>
                                <td><strong>Nº de Série:</strong> ${os.equipamento?.n_serie || '-'}</td>
                                <td><strong>TAG / Patrimônio:</strong> ${os.equipamento?.tag || '-'} / ${os.equipamento?.patrimonio || '-'}</td>
                            </tr>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">3. DETALHES DA SOLICITAÇÃO</div>
                        <table class="info-table">
                            <tr>
                                <td style="width: 33%;"><strong>Tipo de Serviço:</strong> ${os.tipo || '-'}</td>
                                <td style="width: 33%;"><strong>Abertura:</strong> ${dataAbertura}</td>
                                <td style="width: 34%;"><strong>Fechamento:</strong> ${dataFechamento}</td>
                            </tr>
                            <tr>
                                <td colspan="3">
                                    <strong>Defeito Relatado / Motivo:</strong><br/>
                                    <div style="margin-top:6px; min-height:40px; color:#334155;">${os.defeito_relatado || 'Manutenção Programada / Sem defeito relatado.'}</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="section">
                        <div class="section-title">4. LAUDO TÉCNICO E SERVIÇOS EXECUTADOS</div>
                        <table class="info-table">
                            <tr>
                                <td>
                                    <strong>Descrição dos Serviços:</strong><br/>
                                    <div style="margin-top:6px; min-height:100px; color:#334155;">${os.laudo_tecnico || 'Nenhum laudo técnico preenchido até o momento.'}</div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="signatures">
                        <div class="sign-box">
                            <div class="sign-line"></div>
                            <strong>Assinatura do Técnico</strong><br/>
                            <span style="font-size:10px; color:#64748b;">${os.tecnico?.nome || 'Técnico Responsável'}</span>
                        </div>
                        <div class="sign-box">
                            <div class="sign-line"></div>
                            <strong>Assinatura do Cliente</strong><br/>
                            <span style="font-size:10px; color:#64748b;">Nome legível / Carimbo</span>
                        </div>
                    </div>
                    
                    <div style="text-align:center; font-size:9px; color:#94a3b8; margin-top:30px;">
                        Documento gerado eletronicamente por ${configEmpresa?.nome_fantasia || 'Atlas System'} em ${new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            `;
        }).join('');

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Impressão de O.S.</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; background: #e2e8f0; }
                        .page { background: #fff; max-width: 800px; margin: 20px auto; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                        .header-table { width: 100%; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 20px; }
                        
                        .section { margin-bottom: 20px; }
                        .section-title { background: #f1f5f9; color: #1e3a8a; padding: 8px 12px; font-size: 12px; font-weight: 900; text-transform: uppercase; border-left: 3px solid #1e3a8a; margin-bottom: 2px;}
                        .info-table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        .info-table td { border: 1px solid #cbd5e1; padding: 8px 12px; vertical-align: top; }
                        
                        .signatures { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 20px; }
                        .sign-box { width: 40%; text-align: center; font-size: 11px; color: #1e293b; }
                        .sign-line { border-top: 1px solid #000; margin-bottom: 8px; width: 100%; }

                        @media print {
                            body { background: #fff; }
                            .page { margin: 0; box-shadow: none; padding: 15px; max-width: 100%; }
                        }
                    </style>
                </head>
                <body>
                    ${paginasHtml}
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 800);
    }
};