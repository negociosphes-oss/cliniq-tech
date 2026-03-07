// src/services/RelatorioInventarioService.ts

export const RelatorioInventarioService = {
    
    // 🚀 MOTOR EXCEL (CSV Profissional com BOM para não bugar acentos)
    exportarExcel: (equipamentos: any[]) => {
        if (!equipamentos || equipamentos.length === 0) {
            alert('Não há dados para exportar.');
            return;
        }

        const headers = ['Status', 'TAG', 'Nº Série', 'Patrimônio', 'Equipamento', 'Fabricante', 'Modelo', 'Cliente/Hospital', 'Setor', 'Classe de Risco', 'Data Cadastro'];
        
        const rows = equipamentos.map(eq => {
            const nomeEquip = eq.nome || eq.dict_modelos?.nome || eq.tecnologias?.nome || 'N/A';
            const fabricante = eq.fabricante || eq.dict_modelos?.dict_fabricantes?.nome || eq.tecnologias?.fabricante || '-';
            const modelo = eq.modelo || eq.dict_modelos?.nome || eq.tecnologias?.modelo || '-';
            const cliente = eq.clientes?.nome_fantasia || eq.cliente?.nome_fantasia || 'Sem Cliente';
            const dataCad = eq.created_at ? new Date(eq.created_at).toLocaleDateString('pt-BR') : '-';

            return [
                eq.status || 'OPERACIONAL', eq.tag, eq.n_serie || '-', eq.patrimonio || '-',
                nomeEquip, fabricante, modelo, cliente, eq.setor || '-', eq.classe_risco || '-', dataCad
            ];
        });

        const csvContent = '\ufeff' + [
            headers.join(';'),
            ...rows.map(r => r.map(item => `"${String(item).replace(/"/g, '""')}"`).join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Inventario_Engenharia_Clinica_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    },

    // 🚀 MOTOR PDF (Design Premium com Mini-Dashboard)
    imprimirPDF: (equipamentos: any[], configEmpresa: any) => {
        if (!equipamentos || equipamentos.length === 0) {
            alert('Não há dados para imprimir.');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Por favor, permita pop-ups neste site para gerar o relatório.");
            return;
        }

        // Cálculos para o Mini-Dashboard do PDF
        const total = equipamentos.length;
        const operacionais = equipamentos.filter(e => (e.status || 'Operacional').toLowerCase() === 'operacional').length;
        const manutencao = equipamentos.filter(e => (e.status || '').toLowerCase() === 'manutenção').length;
        const inativos = equipamentos.filter(e => (e.status || '').toLowerCase() === 'inativo').length;

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Relatório de Inventário Oficial</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #1e293b; background: #fff; }
                        .page { padding: 40px; max-width: 1200px; margin: auto; }
                        
                        /* Header Premium */
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 25px; }
                        .logo { max-height: 60px; max-width: 200px; object-fit: contain; }
                        .doc-title { text-align: right; }
                        .doc-title h1 { margin: 0; font-size: 24px; color: #1e3a8a; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }
                        .doc-title p { margin: 5px 0 0 0; font-size: 12px; color: #64748b; font-weight: 600; }
                        
                        /* Mini Dashboard */
                        .dashboard { display: flex; gap: 15px; margin-bottom: 30px; }
                        .dash-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
                        .dash-card h3 { margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; color: #64748b; letter-spacing: 1px; }
                        .dash-card p { margin: 0; font-size: 24px; font-weight: 900; color: #0f172a; }
                        .dash-card.operacional p { color: #10b981; }
                        .dash-card.manutencao p { color: #f59e0b; }
                        
                        /* Tabela Profissional */
                        table { width: 100%; border-collapse: collapse; font-size: 11px; }
                        th { background-color: #f1f5f9; color: #475569; font-weight: 900; text-transform: uppercase; padding: 12px; text-align: left; border-bottom: 2px solid #cbd5e1; }
                        td { padding: 12px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                        tr:nth-child(even) { background-color: #f8fafc; }
                        .tag-status { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
                        .st-operacional { background: #d1fae5; color: #047857; border: 1px solid #a7f3d0; }
                        .st-manutencao { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
                        .st-inativo { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

                        /* Footer e Impressão */
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
                                <h1>Inventário de Ativos</h1>
                                <p>Emitido em: ${new Date().toLocaleString('pt-BR')} • Documento Oficial</p>
                            </div>
                        </div>

                        <div class="dashboard">
                            <div class="dash-card"><h3>Total Listado</h3><p>${total}</p></div>
                            <div class="dash-card operacional"><h3>Operacionais</h3><p>${operacionais}</p></div>
                            <div class="dash-card manutencao"><h3>Em Manutenção</h3><p>${manutencao}</p></div>
                            <div class="dash-card"><h3>Inativos</h3><p>${inativos}</p></div>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 15%;">Identificação</th>
                                    <th style="width: 35%;">Equipamento / Modelo</th>
                                    <th style="width: 25%;">Cliente / Setor</th>
                                    <th style="width: 15%;">Risco Anvisa</th>
                                    <th style="width: 10%;">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${equipamentos.map(eq => {
                                    const st = (eq.status || 'Operacional').toLowerCase();
                                    const stClass = st === 'operacional' ? 'st-operacional' : (st === 'manutenção' || st === 'manutencao' ? 'st-manutencao' : 'st-inativo');
                                    
                                    return `
                                    <tr>
                                        <td>
                                            <strong style="color: #0f172a; font-size: 12px;">${eq.tag}</strong><br/>
                                            <span style="color:#64748b">S/N: ${eq.n_serie || '-'}</span><br/>
                                            <span style="color:#64748b">Pat: ${eq.patrimonio || '-'}</span>
                                        </td>
                                        <td>
                                            <strong style="color: #1e3a8a; font-size: 12px;">${eq.nome || eq.dict_modelos?.nome || eq.tecnologias?.nome || 'N/A'}</strong><br/>
                                            <span style="color:#475569">${eq.fabricante || eq.dict_modelos?.dict_fabricantes?.nome || '-'}</span><br/>
                                            <span style="color:#64748b; font-size: 10px;">Mod: ${eq.modelo || eq.dict_modelos?.nome || '-'}</span>
                                        </td>
                                        <td>
                                            <strong style="color: #0f172a;">${eq.clientes?.nome_fantasia || eq.cliente?.nome_fantasia || '-'}</strong><br/>
                                            <span style="color:#64748b">${eq.setor || 'Setor não informado'}</span>
                                        </td>
                                        <td><strong>${eq.classe_risco || '-'}</strong></td>
                                        <td><span class="tag-status ${stClass}">${eq.status || 'OPERACIONAL'}</span></td>
                                    </tr>
                                    `
                                }).join('')}
                            </tbody>
                        </table>

                        <div class="footer">
                            <strong>${configEmpresa?.nome_empresa || configEmpresa?.nome_fantasia || 'Atlas System Medical'}</strong><br/>
                            ${configEmpresa?.cnpj ? `CNPJ: ${configEmpresa.cnpj} • ` : ''} ${configEmpresa?.telefone ? `Tel: ${configEmpresa.telefone}` : ''}<br/>
                            Documento gerado automaticamente pelo sistema de Engenharia Clínica e Rastreabilidade.
                        </div>
                    </div>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
        
        // Aguarda as imagens carregarem antes de acionar a impressão
        setTimeout(() => {
            printWindow.print();
        }, 800);
    }
};