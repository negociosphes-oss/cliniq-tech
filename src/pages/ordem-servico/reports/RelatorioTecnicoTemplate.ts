export const imprimirRelatorio = (dados: any) => {
  const { 
    os, 
    apontamentos, 
    checklistData,
    logoUrl, 
    nomeEmpresa 
  } = dados;

  const win = window.open('', '_blank', 'width=1000,height=900');
  if (!win) {
    alert('Popup bloqueado. Por favor, permita popups para este site.');
    return;
  }

  // --- LÓGICA DE AUDITORIA: ACESSO AOS DADOS (SINGULAR/PLURAL) ---
  
  // Equipamento e Tecnologia (Normalização Crítica)
  const eq = os?.equipamento || os?.equipamentos || {};
  const tec = eq?.tecnologia || eq?.tecnologias || {};
  const cli = os?.cliente || os?.clientes || eq?.cliente || eq?.clientes || {};

  const equipTag = eq?.tag || 'S/ TAG';
  const equipNome = tec?.nome || 'Ativo não identificado';
  const equipModelo = tec?.modelo || '-';
  const equipSerie = eq?.serie || '-';
  const clienteNome = cli?.nome_fantasia || 'Unidade não identificada';

  // Dados da OS
  const osId = os?.id || '---';
  const dataAbertura = os?.created_at ? new Date(os.created_at).toLocaleString('pt-BR') : '-';
  const status = os?.status || 'N/A';

  // Solicitante
  const solNome = os?.solicitante_nome || '-';
  const solSetor = os?.solicitante_setor || '-';
  const solTel = os?.solicitante_telefone || '';
  const solEmail = os?.solicitante_email || '';

  // Diagnóstico Técnico
  const queixa = os?.descricao_problema || os?.descricao || 'Não informado';
  const falha = os?.falha_constatada || 'Não informada';
  const causa = os?.causa_raiz || 'Não identificada';
  const solucao = os?.solucao_aplicada || 'Serviço em andamento';

  // Assinaturas
  const signTec = os?.assinatura_tecnico;
  const signCli = os?.assinatura_cliente;

  // --- PROCESSAMENTO DE IMAGENS ---
  let imagensEvidencia = '';
  try {
    const anexosRaw = os?.anexos;
    if (anexosRaw) {
      const lista = typeof anexosRaw === 'string' ? JSON.parse(anexosRaw) : anexosRaw;
      if (Array.isArray(lista)) {
        imagensEvidencia = lista.map((img: any) => `
          <div class="evidence-item">
            <img src="${img.url}" />
            <div class="evidence-caption">${img.etapa || 'Evidência'}</div>
          </div>
        `).join('');
      }
    }
  } catch (e) { console.error("Erro no processamento de imagens do PDF:", e); }

  // --- TABELA DE MÃO DE OBRA ---
  const rowsMO = (apontamentos || []).map((apt: any) => {
    const d1 = new Date(apt.data_inicio);
    const d2 = new Date(apt.data_fim);
    const diff = d2.getTime() - d1.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    
    return `
      <tr>
        <td>${d1.toLocaleDateString('pt-BR')} ${d1.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</td>
        <td>${apt.tecnico_nome || 'Técnico'}</td>
        <td>${apt.descricao || apt.tipo}</td>
        <td style="text-align:center"><b>${h}h ${m}m</b></td>
      </tr>
    `;
  }).join('');

  // --- CHECKLIST HTML (MAPEAMENTO DE RESPOSTAS) ---
  let checklistHtml = '';
  if (checklistData && checklistData.model && checklistData.exec) {
    const model = checklistData.model;
    const items = model.perguntas || model.itens_configuracao || [];
    const answers = checklistData.exec.respostas || {}; // Ajustado para bater com ChecklistTab
    
    const itensHtml = items.map((item: any, idx: number) => {
      if (item.tipo === 'cabecalho') {
        return `<tr><td colspan="2" style="background:#f1f5f9; font-weight:bold; text-transform:uppercase; padding:8px; font-size:8pt;">${item.texto || item.titulo}</td></tr>`;
      }
      
      const resp = answers[idx] || '-';
      let respStyle = '';
      if (resp === 'Conforme') respStyle = 'color:#059669; font-weight:bold;';
      if (resp === 'Não Conforme') respStyle = 'color:#dc2626; font-weight:bold;';

      return `
        <tr>
          <td style="width:75%; font-size:9pt;">${item.texto || item.titulo}</td>
          <td style="text-align:center; ${respStyle}">${resp}</td>
        </tr>
      `;
    }).join('');

    checklistHtml = `
      <div class="box">
        <div class="box-header">3. Inspeção Técnica: ${model.nome || model.titulo}</div>
        <div class="box-body" style="padding:0;">
          <table>
            <thead><tr><th>Requisito de Avaliação</th><th width="100" style="text-align:center">Status</th></tr></thead>
            <tbody>${itensHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- ESTRUTURA HTML FINAL (PRINT READY) ---
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>OS #${osId} - Relatório Atlasum</title>
        <style>
          @page { size: A4; margin: 12mm; }
          body { font-family: 'Inter', 'Segoe UI', sans-serif; color: #1e293b; font-size: 9pt; line-height: 1.4; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #2563eb; padding-bottom: 15px; margin-bottom: 20px; }
          .logo-box { display: flex; align-items: center; gap: 12px; }
          .logo-box img { height: 50px; }
          .company-info h1 { font-size: 16pt; font-weight: 900; color: #1e3a8a; margin: 0; text-transform: uppercase; }
          .os-badge { text-align: right; }
          .os-number { font-size: 24pt; font-weight: 900; color: #2563eb; line-height: 1; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
          .box { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 15px; page-break-inside: avoid; }
          .box-header { background: #1e3a8a; color: white; padding: 7px 12px; font-weight: 800; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.5px; }
          .box-body { padding: 12px; }
          .info-row { margin-bottom: 4px; display: flex; border-bottom: 1px solid #f1f5f9; padding-bottom: 2px; }
          .info-label { width: 90px; font-weight: 700; font-size: 7.5pt; color: #64748b; text-transform: uppercase; }
          .info-value { flex: 1; font-weight: 600; font-size: 9pt; color: #0f172a; }
          .block-text { background: #f8fafc; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; margin-top: 5px; font-size: 9pt; white-space: pre-wrap; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; color: #475569; font-size: 8pt; text-transform: uppercase; }
          td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; }
          .gallery { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 5px; }
          .evidence-item { border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; text-align: center; }
          .evidence-item img { width: 100%; height: 130px; object-fit: contain; background: #fff; }
          .evidence-caption { font-size: 7pt; font-weight: 700; color: #64748b; margin-top: 4px; text-transform: uppercase; }
          .signatures { display: flex; justify-content: space-around; margin-top: 40px; page-break-inside: avoid; }
          .sig-box { width: 40%; text-align: center; }
          .sig-img { max-height: 60px; max-width: 100%; object-fit: contain; margin-bottom: 5px; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .footer { margin-top: 30px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-box">
            ${logoUrl ? `<img src="${logoUrl}" />` : ''}
            <div class="company-info">
              <h1>${nomeEmpresa}</h1>
              <span style="font-size: 8pt; color: #64748b; font-weight: 700; text-transform: uppercase;">Relatório Técnico de Engenharia Clínica</span>
            </div>
          </div>
          <div class="os-badge">
            <div class="os-number">OS #${osId}</div>
            <div style="font-weight: 700; color: #64748b; margin-top: 4px;">Emissão: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="grid-2">
          <div class="box">
            <div class="box-header">Unidade / Solicitante</div>
            <div class="box-body">
              <div class="info-row"><span class="info-label">Unidade:</span> <span class="info-value">${clienteNome}</span></div>
              <div class="info-row"><span class="info-label">Solicitante:</span> <span class="info-value">${solNome}</span></div>
              <div class="info-row"><span class="info-label">Setor:</span> <span class="info-value">${solSetor}</span></div>
              <div class="info-row"><span class="info-label">Contato:</span> <span class="info-value">${solTel || '-'}</span></div>
            </div>
          </div>
          <div class="box">
            <div class="box-header">Ativo Hospitalar</div>
            <div class="box-body">
              <div class="info-row"><span class="info-label">Equipamento:</span> <span class="info-value">${equipNome}</span></div>
              <div class="info-row"><span class="info-label">Modelo/Sér:</span> <span class="info-value">${equipModelo} | ${equipSerie}</span></div>
              <div class="info-row"><span class="info-label">TAG:</span> <span class="info-value"><b>${equipTag}</b></span></div>
              <div class="info-row"><span class="info-label">Status:</span> <span class="info-value">${status.toUpperCase()}</span></div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="box-header">1. Descritivo da Intervenção</div>
          <div class="box-body">
            <span class="info-label">Queixa Principal / Relato do Problema:</span>
            <div class="block-text">${queixa}</div>
            
            <div class="grid-2" style="margin-top: 10px;">
              <div><span class="info-label">Falha Constatada:</span><div class="block-text">${falha}</div></div>
              <div><span class="info-label">Causa Provável:</span><div class="block-text">${causa}</div></div>
            </div>

            <div style="margin-top: 10px;">
              <span class="info-label" style="color: #059669;">Solução Técnica Aplicada:</span>
              <div class="block-text" style="background: #f0fdf4; border-color: #bbf7d0; font-weight: 600;">${solucao}</div>
            </div>
          </div>
        </div>

        <div class="box">
          <div class="box-header">2. Registro de Mão de Obra e Deslocamento</div>
          <div class="box-body" style="padding:0;">
            ${rowsMO ? `<table><thead><tr><th>Data/Hora Atendimento</th><th>Técnico</th><th>Atividade</th><th style="text-align:center">Duração</th></tr></thead><tbody>${rowsMO}</tbody></table>` : '<div style="padding:20px; text-align:center; color:#94a3b8;">Nenhum apontamento registrado.</div>'}
          </div>
        </div>

        ${checklistHtml}

        ${imagensEvidencia ? `
          <div class="box">
            <div class="box-header">4. Evidências Fotográficas</div>
            <div class="box-body"><div class="gallery">${imagensEvidencia}</div></div>
          </div>
        ` : ''}

        <div class="signatures">
          <div class="sig-box">
            ${signTec ? `<img src="${signTec}" class="sig-img"/>` : '<div style="height:60px; border-bottom:1px solid #000; margin-bottom:5px;"></div>'}
            <div style="font-weight: 800; font-size: 10pt;">${os?.tecnico || 'Técnico Responsável'}</div>
            <div style="font-size: 7pt; color: #64748b; text-transform: uppercase;">Assinatura do Executor</div>
          </div>
          <div class="sig-box">
            ${signCli ? `<img src="${signCli}" class="sig-img"/>` : '<div style="height:60px; border-bottom:1px solid #000; margin-bottom:5px;"></div>'}
            <div style="font-weight: 800; font-size: 10pt;">${solNome}</div>
            <div style="font-size: 7pt; color: #64748b; text-transform: uppercase;">Aceite do Cliente / Responsável</div>
          </div>
        </div>

        <div class="footer">
          Este documento é uma representação digital da Ordem de Serviço #${osId} gerada pelo sistema <b>${nomeEmpresa}</b>.<br>
          Data de Impressão: ${new Date().toLocaleString()}
        </div>

        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); }, 500);
          };
        </script>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
};