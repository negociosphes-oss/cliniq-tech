import { useState, useRef } from 'react';
import { Settings, CheckCircle, Printer, Building2, LayoutTemplate, Maximize, Palette, AlignLeft, ZoomIn, X } from 'lucide-react';

interface Props { equipamentos?: any[]; equipamento?: any; configEmpresa: any; onClose?: () => void; }

export function BatchEtiquetasModal({ equipamentos, equipamento, configEmpresa, onClose }: Props) {
  // 🚀 ESTADO GIGANTE DE CUSTOMIZAÇÃO
  const [labelConfig, setLabelConfig] = useState({
      tamanho: '80x45', layoutPosicao: 'row', distribuicao: 'agrupado',
      cabecalhoTipo: 'ambos', cabecalhoCustomText: '', showLogo: true,
      showNome: true, showModelo: true, showPatrimonio: true, showSerial: true, showRisco: false, showEletrica: false, showTelefone: true, showSetor: true,
      showQrCode: true, qrScale: 100, dadosScale: 100,
      qrText: 'BIPAR PARA ABRIR O.S.', qrTextScale: 100, qrTextBold: true, qrTextInvert: true,
      zoomPreview: 85
  });

  const listaEquipamentos = equipamentos && equipamentos.length > 0 ? equipamentos : (equipamento ? [equipamento] : []);
  const eqPreview = listaEquipamentos[0] || {};
  
  // 🚀 BLINDAGEM DO ERRO (Garante que a imagem só carregue se existir a TAG)
  const qrCodePreviewUrl = eqPreview.tag ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/portal/novo-chamado?tag=' + eqPreview.tag)}` : '';

  // 🚀 DICIONÁRIO BASE EM MILÍMETROS
  const LABEL_SIZES: Record<string, any> = {
      '100x50': { w: '100mm', h: '50mm', qrBase: 36, titleBase: 22, subBase: 11, attrBase: 10, pad: '4mm', callBase: 10 },
      '80x45':  { w: '80mm',  h: '45mm', qrBase: 30, titleBase: 18, subBase: 9,  attrBase: 8,  pad: '3mm', callBase: 8 },
      '50x30':  { w: '50mm',  h: '30mm', qrBase: 18, titleBase: 11, subBase: 7,  attrBase: 6,  pad: '2mm', callBase: 5 },
      '30x15':  { w: '30mm',  h: '15mm', qrBase: 12, titleBase: 8,  subBase: 0,  attrBase: 0,  pad: '1mm', callBase: 0 }
  };
  const s = LABEL_SIZES[labelConfig.tamanho];

  const qrDynamicSize = `${s.qrBase * (labelConfig.qrScale / 100)}mm`;
  const callDynamicSize = `${s.callBase * (labelConfig.qrTextScale / 100)}px`;
  const attrDynamicSize = `${s.attrBase * (labelConfig.dadosScale / 100)}px`;
  const subDynamicSize = `${s.subBase * (labelConfig.dadosScale / 100)}px`;

  const handleBatchPrint = () => {
      const printWindow = window.open('', '_blank');
      if(!printWindow) return;

      const style = `
          @page { size: ${s.w} ${s.h}; margin: 0; }
          body { margin: 0; padding: 0; background: #fff; font-family: Arial, sans-serif; }
          * { box-sizing: border-box; }
          .label-page { width: ${s.w}; height: ${s.h}; display: flex; flex-direction: ${labelConfig.layoutPosicao}; padding: ${s.pad}; overflow: hidden; page-break-after: always; position: relative; }
          .content-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
          .header-line { border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; display: flex; align-items: center; width: 100%; }
          .text-fit { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .grid-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 5px; border-top: 1px dashed #999; padding-top: 4px; width: 100%; }
          .qr-container { display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
      `;

      const pagesHTML = listaEquipamentos.map(eq => {
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + '/portal/novo-chamado?tag=' + eq.tag)}`;
          const prest = configEmpresa?.nome_fantasia || 'ENG. CLÍNICA';
          const cli = eq.clienteData?.nome_fantasia || eq.clientes?.nome_fantasia || eq.cliente?.nome_fantasia || 'CLIENTE';
          
          let headerText = '';
          if(labelConfig.cabecalhoTipo === 'prestador') headerText = prest;
          else if(labelConfig.cabecalhoTipo === 'cliente') headerText = cli;
          else if(labelConfig.cabecalhoTipo === 'ambos') headerText = `${prest} <span style="font-weight:normal">|</span> ${cli}`;
          else headerText = labelConfig.cabecalhoCustomText || 'SETOR';

          const logoHtml = (labelConfig.showLogo && configEmpresa?.logo_url) ? `<img src="${configEmpresa.logo_url}" style="max-height: 12px; max-width: 30mm; object-fit: contain; margin-right: 6px;"/>` : '';

          const gridData = [
              labelConfig.showSetor && eq.setor ? `<div style="grid-column: span 2; font-size: ${attrDynamicSize};" class="text-fit"><b>LOC:</b> ${eq.setor}</div>` : '',
              labelConfig.showModelo && (eq.modelo || eq.dict_modelos?.nome) ? `<div style="font-size: ${attrDynamicSize};" class="text-fit"><b>MOD:</b> ${eq.modelo || eq.dict_modelos?.nome}</div>` : '',
              labelConfig.showSerial && eq.n_serie ? `<div style="font-size: ${attrDynamicSize};" class="text-fit"><b>SN:</b> ${eq.n_serie}</div>` : '',
              labelConfig.showPatrimonio && eq.patrimonio ? `<div style="font-size: ${attrDynamicSize};" class="text-fit"><b>PAT:</b> ${eq.patrimonio}</div>` : '',
              labelConfig.showRisco && eq.classe_risco ? `<div style="font-size: ${attrDynamicSize};" class="text-fit"><b>RSC:</b> ${eq.classe_risco}</div>` : '',
              labelConfig.showEletrica && eq.dict_modelos?.classe_protecao_eletrica ? `<div style="font-size: ${attrDynamicSize};" class="text-fit"><b>ELT:</b> ${eq.dict_modelos?.classe_protecao_eletrica}</div>` : '',
              labelConfig.showTelefone && configEmpresa?.telefone ? `<div style="grid-column: span 2; font-size: ${attrDynamicSize};" class="text-fit"><b>TEL:</b> ${configEmpresa.telefone}</div>` : '',
          ].join('');

          return `
              <div class="label-page">
                  <div class="content-area" style="padding-right: ${labelConfig.layoutPosicao === 'row' ? '4px' : '0'}; padding-left: ${labelConfig.layoutPosicao === 'row-reverse' ? '4px' : '0'};">
                      ${labelConfig.cabecalhoTipo !== 'nenhum' ? `<div class="header-line">${logoHtml}<span style="font-size: ${attrDynamicSize}; font-weight: bold; flex: 1;" class="text-fit">${headerText}</span></div>` : ''}
                      <div style="font-size: calc(${s.titleBase}px * ${labelConfig.dadosScale / 100}); font-weight: 900; line-height: 1;">${eq.tag}</div>
                      ${labelConfig.showNome ? `<div style="font-size: ${subDynamicSize}; font-weight: bold; margin-top: 2px;" class="text-fit">${eq.nome || eq.tecnologia?.nome || 'EQUIPAMENTO'}</div>` : ''}
                      <div class="grid-footer" style="margin-top: ${labelConfig.distribuicao === 'espalhado' ? 'auto' : '5px'};">${gridData}</div>
                  </div>
                  ${labelConfig.showQrCode ? `
                  <div class="qr-container" style="width: ${qrDynamicSize};">
                      <img src="${qrUrl}" style="width: ${qrDynamicSize}; height: ${qrDynamicSize}; object-fit: contain;" />
                      ${labelConfig.qrText ? `<div style="font-size: ${callDynamicSize}; width: 100%; margin-top: 2px; text-align: center; font-weight: 900; ${labelConfig.qrTextInvert ? 'background:#000; color:#fff; padding: 2px;' : ''} overflow: hidden;">${labelConfig.qrText}</div>` : ''}
                  </div>` : ''}
              </div>
          `;
      }).join('');

      printWindow.document.write(`<html><head><style>${style}</style></head><body>${pagesHTML}</body></html>`);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); printWindow.close(); }, 1200);
  };

  const getPreviewHeaderText = () => {
      const prest = configEmpresa?.nome_fantasia || 'ENG. CLÍNICA';
      const cli = eqPreview.clienteData?.nome_fantasia || eqPreview.clientes?.nome_fantasia || eqPreview.cliente?.nome_fantasia || 'HOSPITAL';
      if(labelConfig.cabecalhoTipo === 'prestador') return prest;
      if(labelConfig.cabecalhoTipo === 'cliente') return cli;
      if(labelConfig.cabecalhoTipo === 'ambos') return <>{prest} <span style={{fontWeight:'normal'}}>|</span> {cli}</>;
      return labelConfig.cabecalhoCustomText || 'SETOR';
  };

  const Content = (
      <div className={`grid grid-cols-1 xl:grid-cols-12 gap-8 ${onClose ? 'h-full' : 'pb-10 animate-fadeIn'}`}>
            
            {/* PAINEL DE CONTROLE (ESQUERDA) */}
            <div className="xl:col-span-7 bg-slate-50 p-6 rounded-3xl border border-slate-200 h-fit space-y-6 shadow-sm">
                <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-4">
                    <Settings size={20} className="text-slate-800"/>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Laboratório de Etiquetas</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* PILAR 1: PAPEL E LAYOUT */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><LayoutTemplate size={14}/> 1. Formato e Alinhamento</h4>
                        <select className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-blue-500 bg-slate-50" value={labelConfig.tamanho} onChange={(e) => setLabelConfig({...labelConfig, tamanho: e.target.value})}>
                            <option value="100x50">Grande (100x50mm)</option>
                            <option value="80x45">Padrão Zebra (80x45mm)</option>
                            <option value="50x30">Pequena Argox (50x30mm)</option>
                            <option value="30x15">Mini Jóia (30x15mm)</option>
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                            <select className="w-full p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold outline-none focus:border-blue-500 bg-slate-50" value={labelConfig.layoutPosicao} onChange={(e) => setLabelConfig({...labelConfig, layoutPosicao: e.target.value})}>
                                <option value="row">QR na Direita</option>
                                <option value="row-reverse">QR na Esquerda</option>
                            </select>
                            <select className="w-full p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold outline-none focus:border-blue-500 bg-slate-50" value={labelConfig.distribuicao} onChange={(e) => setLabelConfig({...labelConfig, distribuicao: e.target.value})}>
                                <option value="espalhado">Espalhado</option>
                                <option value="agrupado">Agrupado</option>
                            </select>
                        </div>
                    </div>

                    {/* PILAR 2: IDENTIDADE E CABEÇALHO */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Building2 size={14}/> 2. Cabeçalho Elástico</h4>
                        <select className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-blue-500 bg-slate-50" value={labelConfig.cabecalhoTipo} onChange={(e) => setLabelConfig({...labelConfig, cabecalhoTipo: e.target.value})}>
                            <option value="prestador">Só Prestador</option>
                            <option value="ambos">Prestador + Cliente</option>
                            <option value="cliente">Só Cliente</option>
                            <option value="nenhum">Sem Cabeçalho</option>
                        </select>
                        <ToggleBtn label="Mostrar Logomarca" checked={labelConfig.showLogo} onChange={(e:boolean)=>setLabelConfig({...labelConfig, showLogo:e})} />
                    </div>
                </div>

                {/* PILAR 3: SELEÇÃO DE DADOS */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><AlignLeft size={14}/> 3. Seleção de Dados do Equipamento</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <ToggleBtn label="Nome" checked={labelConfig.showNome} onChange={(v:any)=>setLabelConfig({...labelConfig, showNome:v})}/>
                        <ToggleBtn label="Modelo" checked={labelConfig.showModelo} onChange={(v:any)=>setLabelConfig({...labelConfig, showModelo:v})}/>
                        <ToggleBtn label="Série" checked={labelConfig.showSerial} onChange={(v:any)=>setLabelConfig({...labelConfig, showSerial:v})}/>
                        <ToggleBtn label="Patrimônio" checked={labelConfig.showPatrimonio} onChange={(v:any)=>setLabelConfig({...labelConfig, showPatrimonio:v})}/>
                        <ToggleBtn label="Setor" checked={labelConfig.showSetor} onChange={(v:any)=>setLabelConfig({...labelConfig, showSetor:v})}/>
                        <ToggleBtn label="Risco" checked={labelConfig.showRisco} onChange={(v:any)=>setLabelConfig({...labelConfig, showRisco:v})}/>
                        <ToggleBtn label="Elétrica" checked={labelConfig.showEletrica} onChange={(v:any)=>setLabelConfig({...labelConfig, showEletrica:v})}/>
                        <ToggleBtn label="Suporte" checked={labelConfig.showTelefone} onChange={(v:any)=>setLabelConfig({...labelConfig, showTelefone:v})}/>
                    </div>
                    <div className="pt-3 border-t border-slate-100 mt-2">
                        <label className="text-[10px] font-bold text-slate-500 flex justify-between">Escala de Tamanho dos Textos e Dados <span>{labelConfig.dadosScale}%</span></label>
                        <input type="range" min="60" max="140" value={labelConfig.dadosScale} onChange={e => setLabelConfig({...labelConfig, dadosScale: Number(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg accent-blue-600 appearance-none cursor-pointer mt-2"/>
                        <p className="text-[9px] text-slate-400 mt-1">Se os dados cortarem na visualização, reduza esta barra.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PILAR 4: TAMANHO DO QR CODE */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Maximize size={14}/> 4. Tamanho do QR Code</h4>
                            <input type="checkbox" className="w-4 h-4 cursor-pointer accent-blue-600" checked={labelConfig.showQrCode} onChange={e => setLabelConfig({...labelConfig, showQrCode: e.target.checked})}/>
                        </div>
                        {labelConfig.showQrCode && (
                            <div className="pt-2">
                                <label className="text-[10px] font-bold text-slate-500 flex justify-between">Escala do QR <span>{labelConfig.qrScale}%</span></label>
                                <input type="range" min="50" max="140" value={labelConfig.qrScale} onChange={e => setLabelConfig({...labelConfig, qrScale: Number(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg accent-blue-600 appearance-none cursor-pointer mt-2"/>
                            </div>
                        )}
                    </div>

                    {/* PILAR 5: CALL TO ACTION */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-200 transition-colors">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Palette size={14}/> 5. Call To Action (Alerta QR)</h4>
                        {labelConfig.showQrCode && s.callBase !== 0 ? (
                            <div className="space-y-4">
                                <input type="text" className="w-full p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold uppercase bg-slate-50 outline-none focus:border-blue-500" value={labelConfig.qrText} onChange={e => setLabelConfig({...labelConfig, qrText: e.target.value.toUpperCase()})} placeholder="Ex: BIPAR PARA ABRIR O.S." maxLength={30}/>
                                <div className="flex items-center gap-3">
                                    <button onClick={()=>setLabelConfig({...labelConfig, qrTextInvert: !labelConfig.qrTextInvert})} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${labelConfig.qrTextInvert ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-300 hover:bg-slate-100'}`}>TARJA ESCURA</button>
                                    <div className="flex-1">
                                        <input type="range" min="60" max="150" value={labelConfig.qrTextScale} onChange={e => setLabelConfig({...labelConfig, qrTextScale: Number(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg accent-blue-600 appearance-none cursor-pointer"/>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 mt-2">Opção indisponível (QR desativado ou etiqueta pequena).</p>
                        )}
                    </div>
                </div>

                <button onClick={handleBatchPrint} className="w-full py-5 bg-slate-800 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl hover:bg-slate-900 transition-all active:scale-95 uppercase tracking-widest text-lg">
                    <Printer size={24}/> Disparar Impressora ({listaEquipamentos.length} etiquetas)
                </button>
            </div>

            {/* PREVIEW PANEL (DIREITA) */}
            <div className="xl:col-span-5 flex flex-col bg-slate-200/60 rounded-3xl p-4 md:p-6 shadow-inner relative min-h-[550px] border border-slate-300">
                <div className="flex justify-between items-center mb-6 z-10 px-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200">Amostra em Tempo Real</span>
                    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                        <ZoomIn size={12} className="text-slate-400"/>
                        <input type="range" min="40" max="120" value={labelConfig.zoomPreview} onChange={e => setLabelConfig({...labelConfig, zoomPreview: Number(e.target.value)})} className="w-20 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                        <span className="text-[9px] font-bold text-slate-500 w-6">{labelConfig.zoomPreview}%</span>
                    </div>
                </div>
                
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative">
                    <div style={{ transform: `scale(${labelConfig.zoomPreview / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}>
                        <div style={{ width: s.w, height: s.h, display: 'flex', flexDirection: labelConfig.layoutPosicao as any, padding: s.pad, boxSizing: 'border-box', color: '#000', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', border: '1px solid #94a3b8', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)' }}>
                            
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0, paddingRight: labelConfig.layoutPosicao === 'row' ? '4px' : '0', paddingLeft: labelConfig.layoutPosicao === 'row-reverse' ? '4px' : '0' }}>
                                {labelConfig.cabecalhoTipo !== 'nenhum' && (
                                    <div style={{ borderBottom: '1px solid #000', paddingBottom: '2px', marginBottom: '3px', display: 'flex', alignItems: 'center' }}>
                                        {labelConfig.showLogo && configEmpresa?.logo_url && <img src={configEmpresa.logo_url} style={{ maxHeight: labelConfig.tamanho === '100x50' ? '14px' : '10px', maxWidth: '25mm', objectFit: 'contain', marginRight: '6px' }} />}
                                        <span style={{ fontSize: attrDynamicSize, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getPreviewHeaderText()}</span>
                                    </div>
                                )}
                                
                                <div style={{ fontSize: `calc(${s.titleBase}px * ${labelConfig.dadosScale / 100})`, fontWeight: '900', lineHeight: 1, marginTop: '2px' }}>{eqPreview.tag || 'TAG-000'}</div>
                                
                                {labelConfig.showNome && <div style={{ fontSize: subDynamicSize, fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '3px' }}>{eqPreview.nome || 'NOME DO EQUIPAMENTO'}</div>}
                                
                                <div style={{ marginTop: labelConfig.distribuicao === 'espalhado' ? 'auto' : '5px', borderTop: '1px dashed #999', paddingTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '1px 5px', lineHeight: '1.2' }}>
                                    {labelConfig.showSetor && <div style={{ fontSize: attrDynamicSize, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>LOC:</b> <span style={{fontWeight:'normal'}}>{eqPreview.setor || 'N/A'}</span></div>}
                                    {labelConfig.showModelo && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>MOD:</b> <span style={{fontWeight:'normal'}}>{eqPreview.modelo || 'N/A'}</span></div>}
                                    {labelConfig.showSerial && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>SN:</b> <span style={{fontWeight:'normal'}}>{eqPreview.n_serie || 'N/A'}</span></div>}
                                    {labelConfig.showPatrimonio && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>PAT:</b> <span style={{fontWeight:'normal'}}>{eqPreview.patrimonio || 'N/A'}</span></div>}
                                    {labelConfig.showRisco && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>RSC:</b> <span style={{fontWeight:'normal'}}>{eqPreview.classe_risco || 'N/A'}</span></div>}
                                    {labelConfig.showEletrica && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>ELT:</b> <span style={{fontWeight:'normal'}}>{eqPreview.dict_modelos?.classe_protecao_eletrica || 'N/A'}</span></div>}
                                    {labelConfig.showTelefone && configEmpresa?.telefone && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>TEL:</b> <span style={{fontWeight:'normal'}}>{configEmpresa.telefone}</span></div>}
                                </div>
                            </div>
                            
                            {labelConfig.showQrCode && (
                                <div style={{ width: qrDynamicSize, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    {qrCodePreviewUrl && <img src={qrCodePreviewUrl} style={{ width: qrDynamicSize, height: qrDynamicSize }} alt="QR"/>}
                                    {labelConfig.qrText && <div style={{ fontSize: callDynamicSize, width: '100%', marginTop: '3px', textAlign: 'center', fontWeight: 900, background: labelConfig.qrTextInvert ? '#000' : 'transparent', color: labelConfig.qrTextInvert ? '#fff' : '#000', padding: labelConfig.qrTextInvert ? '3px 0' : '0', borderRadius: '2px', lineHeight: '1.1' }}>{labelConfig.qrText}</div>}
                                </div>
                            )}
                            
                        </div>
                    </div>
                </div>
            </div>
      </div>
  );

  // Se tem onClose, o componente está sendo chamado da Tela Principal (Lote) e precisa da "casca" preta e botão de fechar
  if (onClose) {
      return (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[3000] flex justify-center p-4 py-8 overflow-y-auto">
            <div className="bg-white w-full max-w-[1400px] rounded-3xl shadow-2xl flex flex-col h-max min-h-full overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white"><Printer size={24}/></div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Motor Industrial de Etiquetas</h2>
                            <p className="text-sm text-slate-500 font-medium">Lote com {listaEquipamentos.length} unidades selecionadas.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-500 transition-colors"><X size={20}/></button>
                </div>
                <div className="flex-1 p-8">{Content}</div>
            </div>
        </div>
      );
  }
  
  // Se não tem onClose, ele está sendo renderizado dentro da aba de "Detalhes do Equipamento" e deve retornar só o miolo.
  return Content;
}

const ToggleBtn = ({ label, checked, onChange }: any) => (
    <label className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm'}`}>
        <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)}/>
        <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>{checked && <CheckCircle size={8}/>}</div>
        <span className="text-[9px] font-bold uppercase tracking-wide truncate">{label}</span>
    </label>
);