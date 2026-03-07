// src/services/RelatorioOSService.ts

export const RelatorioOSService = {
    
    // 🚀 MOTOR EXCEL (CSV Profissional com BOM)
    exportarExcel: (ordens: any[]) => {
        if (!ordens || ordens.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

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

    // 🚀 MOTOR PDF (Design Premium com Dashboard de O.S.)
    imprimirPDF: (ordens: any[], configEmpresa: any) => {
        if (!ordens || ordens.length === 0) {
            alert('Não há dados para imprimir.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor, permita pop-ups neste site para gerar o relatório.");
            return;
        }

        // Cálculos do Mini-Dashboard
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
                        body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #1e293b; background: #fff; }
                        .page { padding: 40px; max-width: 1200px; margin: auto; }
                        
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 25px; }
                        .logo { max-height: 60px; max-width: 200px; object-fit: contain; }
                        .doc-title { text-align: right; }
                        .doc-title h1 { margin: 0; font-size: 24px; color: #1e293b; font-weight: 900; text-transform: uppercase; }
                        .doc-title p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600; }
                        
                        .dashboard { display: flex; gap: 15px; margin-bottom: 30px; }
                        .dash-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
                        .dash-card h3 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
                        .dash-card p { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; }
                        .dash-card.concluida p { color: #10b981; }
                        .dash-card.aberta p { color: #3b82f6; }
                        .dash-card.aguardando p { color: #f59e0b; }
                        
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th { background-color: #f1f5f9; color: #475569; font-weight: 900; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        
                        .status-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                        .st-concluida { background: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }
                        .st-aberta { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; }
                        .st-aguardando { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
                        .st-default { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

                        .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            .page { padding: 20px; }
                        }
                    </style>
                </head>
                <body>
                    <div class="page">
                        <div class="header">
                            <div>
                                ${configEmpresa?.logo_url ? `<img src="${configEmpresa.logo_url}" class="logo" />` : `<h2 style="margin:0; color:#1e3a8a; font-weight:900;">${configEmpresa?.nome_fantasia || 'ATLAS SYSTEM'}</h2>`}
                            </div>
                            <div class="doc-title">
                                <h1>Relatório de Ordens de Serviço</h1>
                                <p>Emitido em: ${new Date().toLocaleString('pt-BR')} • Operacional</p>
                            </div>
                        </div>

                        <div class="dashboard">
                            <div class="dash-card"><h3>Total Listado</h3><p>${total}</p></div>
                            <div class="dash-card aberta"><h3>Abertas / Execução</h3><p>${abertas}</p></div>
                            <div class="dash-card aguardando"><h3>Aguardando</h3><p>${aguardando}</p></div>
                            <div class="dash-card concluida"><h3>Concluídas</h3><p>${concluidas}</p></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 10%;">OS #</th>
                                    <th style="width: 30%;">Equipamento / TAG</th>
                                    <th style="width: 25%;">Cliente / Solicitante</th>
                                    <th style="width: 15%;">Tipo</th>
                                    <th style="width: 10%;">Data</th>
                                    <th style="width: 10%;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${ordens.map(os => {
                                    const st = (os.status || '').toLowerCase();
                                    const stClass = st === 'concluída' || st === 'concluida' ? 'st-concluida' : 
                                                    (st.includes('aberta') || st.includes('execução') ? 'st-aberta' : 
                                                    (st.includes('aguardando') ? 'st-aguardando' : 'st-default'));
                                    
                                    const dataAbertura = os.created_at ? new Date(os.created_at).toLocaleDateString('pt-BR') : '-';

                                    return `
                                    <tr>
                                        <td><strong style="font-size: 13px;">#${os.id}</strong></td>
                                        <td>
                                            <strong style="color: #1e3a8a;">${os.equipamento?.nome || os.equipamento?.tecnologia?.nome || 'N/A'}</strong><br/>
                                            <span style="color:#64748b; font-size: 10px;">TAG: ${os.equipamento?.tag || '-'} | SN: ${os.equipamento?.n_serie || '-'}</span>
                                        </td>
                                        <td>
                                            <strong style="color: #0f172a;">${os.cliente?.nome_fantasia || '-'}</strong><br/>
                                            <span style="color:#64748b; font-size: 10px;">Téc: ${os.tecnico?.nome || 'Não atribuído'}</span>
                                        </td>
                                        <td><strong>${os.tipo || '-'}</strong></td>
                                        <td><span style="color:#64748b">${dataAbertura}</span></td>
                                        <td><span class="status-badge ${stClass}">${os.status || 'Aberta'}</span></td>
                                    </tr>
                                    `
                                }).join('')}
                            </tbody>
                        </table>

                        <div class="footer">
                            <strong>${configEmpresa?.nome_empresa || configEmpresa?.nome_fantasia || 'Atlas System Medical'}</strong><br/>
                            Documento gerado automaticamente pelo módulo de Gestão de Ordens de Serviço.
                        </div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 800);
    }
};