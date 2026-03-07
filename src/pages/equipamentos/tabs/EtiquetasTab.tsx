import { useState, useRef } from 'react';
import { Settings, CheckCircle, Type, Printer, Building2, LayoutTemplate, Maximize, Palette, AlignLeft, ZoomIn, ArrowDownUp } from 'lucide-react';

interface Props { equipamento: any; configEmpresa: any; }

export function EtiquetasTab({ equipamento, configEmpresa }: Props) {
  // 🚀 ESTADO GIGANTE DE CUSTOMIZAÇÃO
  const [labelConfig, setLabelConfig] = useState({
      tamanho: '80x45',
      layoutPosicao: 'row', 
      distribuicao: 'espalhado', // 'espalhado' (buraco no meio) ou 'agrupado' (tudo junto)
      
      cabecalhoTipo: 'prestador', 
      cabecalhoCustomText: '',
      showLogo: true,
      
      showNome: true, 
      showModelo: true,
      showPatrimonio: true, 
      showSerial: true, 
      showRisco: false,
      showEletrica: false,
      showTelefone: true, 
      showEmail: false,
      showSetor: true, // 🚀 NOVO CAMPO PARA PREENCHER ESPAÇO

      showQrCode: true, 
      qrScale: 100, 
      dadosScale: 100, 
      
      qrText: 'BIPAR PARA ABRIR O.S.',
      qrTextScale: 100, 
      qrTextBold: true,
      qrTextInvert: true,

      zoomPreview: 85 // 🚀 NOVO: Zoom visual da tela (não afeta impressão)
  });

  const printRef = useRef<HTMLDivElement>(null);
  const linkPublicoQrCode = `${window.location.origin}/portal/novo-chamado?tag=${equipamento.tag}`;
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(linkPublicoQrCode)}`;

  // 🚀 DICIONÁRIO BASE EM MILÍMETROS
  const LABEL_SIZES: Record<string, any> = {
      '100x50': { w: '100mm', h: '50mm', qrBase: 36, titleBase: 22, subBase: 11, attrBase: 10, pad: '4mm', callBase: 10 },
      '80x45':  { w: '80mm',  h: '45mm', qrBase: 30, titleBase: 18, subBase: 9,  attrBase: 8,  pad: '3mm', callBase: 8 },
      '50x30':  { w: '50mm',  h: '30mm', qrBase: 18, titleBase: 11, subBase: 7,  attrBase: 6,  pad: '2mm', callBase: 5 },
      '30x15':  { w: '30mm',  h: '15mm', qrBase: 12, titleBase: 8,  subBase: 0,  attrBase: 0,  pad: '1mm', callBase: 0 }
  };
  const s = LABEL_SIZES[labelConfig.tamanho];

  // Cálculos dinâmicos baseados nos Sliders do usuário
  const qrDynamicSize = `${s.qrBase * (labelConfig.qrScale / 100)}mm`;
  const callDynamicSize = `${s.callBase * (labelConfig.qrTextScale / 100)}px`;
  const attrDynamicSize = `${s.attrBase * (labelConfig.dadosScale / 100)}px`;
  const subDynamicSize = `${s.subBase * (labelConfig.dadosScale / 100)}px`;

  const handlePrintLabel = () => {
      const printContents = printRef.current?.innerHTML;
      if(!printContents) return;
      const printWindow = window.open('', '_blank');
      if(printWindow) {
          printWindow.document.write(`
              <html><head><title>Imprimir Etiqueta</title>
              <style>
                  @page { size: ${s.w} ${s.h}; margin: 0; } 
                  body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; } 
                  * { box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
              </style></head>
              <body>${printContents}</body></html>
          `);
          printWindow.document.close(); printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 800);
      }
  };

  // 🚀 CABEÇALHO INTELIGENTE E ALINHADO
  const renderHeader = () => {
      if (labelConfig.cabecalhoTipo === 'nenhum') return null;
      
      const nomePrestador = configEmpresa?.nome_fantasia || 'ENG. CLÍNICA';
      const nomeCliente = equipamento?.clientes?.nome_fantasia || equipamento?.cliente?.nome_fantasia || 'CLIENTE';

      const baseStyle = { 
          fontSize: attrDynamicSize, fontWeight: 'bold', borderBottom: '1px solid #000', 
          paddingBottom: '3px', marginBottom: '3px', textTransform: 'uppercase' as any, 
          display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' 
      };

      const logoImg = labelConfig.showLogo && configEmpresa?.logo_url ? (
          <img src={configEmpresa.logo_url} style={{ maxHeight: labelConfig.tamanho === '100x50' ? '14px' : '10px', objectFit: 'contain' }} alt="Logo" />
      ) : null;

      if (labelConfig.cabecalhoTipo === 'prestador') return <div style={baseStyle}>{logoImg} <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomePrestador}</span></div>;
      if (labelConfig.cabecalhoTipo === 'cliente') return <div style={baseStyle}>{logoImg} <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeCliente}</span></div>;
      if (labelConfig.cabecalhoTipo === 'ambos') return <div style={baseStyle}>{logoImg} <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: `calc(${attrDynamicSize} - 1px)` }}>{nomePrestador} <span style={{fontWeight:'normal'}}>|</span> {nomeCliente}</span></div>;
      if (labelConfig.cabecalhoTipo === 'customizado') return <div style={baseStyle}>{logoImg} <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{labelConfig.cabecalhoCustomText || 'INFORME O TEXTO'}</span></div>;
  };

  return (
    <div className="animate-fadeIn grid grid-cols-1 xl:grid-cols-12 gap-8 h-full pb-10">
        
        {/* 🛠️ PAINEL DE CONTROLE (ESQUERDA) */}
        <div className="xl:col-span-7 bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit space-y-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2 border-b border-slate-200 pb-4">
                <Settings size={20} className="text-slate-800"/>
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Laboratório de Etiquetas</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PILAR 1: PAPEL E LAYOUT */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg"><LayoutTemplate size={14}/> 1. Papel & Layout</h4>
                    <select className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold shadow-sm outline-none focus:border-blue-500 bg-white cursor-pointer" value={labelConfig.tamanho} onChange={(e) => setLabelConfig({...labelConfig, tamanho: e.target.value})}>
                        <option value="100x50">Grande (100x50mm)</option>
                        <option value="80x45">Padrão Zebra (80x45mm)</option>
                        <option value="50x30">Pequena Argox (50x30mm)</option>
                        <option value="30x15">Mini Jóia (30x15mm)</option>
                    </select>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <select className="w-full p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold shadow-sm outline-none focus:border-blue-500 bg-white cursor-pointer" value={labelConfig.layoutPosicao} onChange={(e) => setLabelConfig({...labelConfig, layoutPosicao: e.target.value})}>
                            <option value="row">QR na Direita</option>
                            <option value="row-reverse">QR na Esquerda</option>
                        </select>
                        <select className="w-full p-2.5 rounded-lg border border-slate-300 text-[10px] font-bold shadow-sm outline-none focus:border-blue-500 bg-white cursor-pointer" value={labelConfig.distribuicao} onChange={(e) => setLabelConfig({...labelConfig, distribuicao: e.target.value})}>
                            <option value="espalhado">Espalhado</option>
                            <option value="agrupado">Agrupado (S/ Buraco)</option>
                        </select>
                    </div>
                </div>

                {/* PILAR 2: IDENTIDADE E CABEÇALHO */}
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg"><Building2 size={14}/> 2. Identidade & Cabeçalho</h4>
                    <select className="w-full p-2.5 rounded-lg border border-slate-300 text-xs font-bold outline-none focus:border-blue-500 bg-white cursor-pointer" value={labelConfig.cabecalhoTipo} onChange={(e) => setLabelConfig({...labelConfig, cabecalhoTipo: e.target.value})}>
                        <option value="prestador">Cabeçalho: Só Prestador</option>
                        <option value="ambos">Cabeçalho: Prestador + Cliente</option>
                        <option value="cliente">Cabeçalho: Só Cliente</option>
                        <option value="customizado">Cabeçalho: Texto Livre...</option>
                        <option value="nenhum">Sem Cabeçalho</option>
                    </select>
                    {labelConfig.cabecalhoTipo === 'customizado' && (
                        <input type="text" className="w-full p-2 rounded-lg border border-blue-300 text-xs font-bold" placeholder="Ex: UTI ADULTO" value={labelConfig.cabecalhoCustomText} onChange={e => setLabelConfig({...labelConfig, cabecalhoCustomText: e.target.value.toUpperCase()})} maxLength={30}/>
                    )}
                    <ToggleBtn label="Mostrar Logomarca" checked={labelConfig.showLogo} onChange={(e: boolean) => setLabelConfig({...labelConfig, showLogo: e})}/>
                </div>

                {/* PILAR 3: DADOS IMPRESSOS (GRID) */}
                <div className="space-y-4 md:col-span-2 border-t border-slate-200 pt-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center justify-between gap-1.5 bg-blue-50 p-2 rounded-lg">
                        <span className="flex items-center gap-1.5"><AlignLeft size={14}/> 3. Seleção de Dados do Equipamento</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <ToggleBtn label="Nome Equip." checked={labelConfig.showNome} onChange={(e: boolean) => setLabelConfig({...labelConfig, showNome: e})}/>
                        <ToggleBtn label="Setor" checked={labelConfig.showSetor} onChange={(e: boolean) => setLabelConfig({...labelConfig, showSetor: e})}/>
                        <ToggleBtn label="Modelo" checked={labelConfig.showModelo} onChange={(e: boolean) => setLabelConfig({...labelConfig, showModelo: e})}/>
                        <ToggleBtn label="Nº Série" checked={labelConfig.showSerial} onChange={(e: boolean) => setLabelConfig({...labelConfig, showSerial: e})}/>
                        <ToggleBtn label="Patrimônio" checked={labelConfig.showPatrimonio} onChange={(e: boolean) => setLabelConfig({...labelConfig, showPatrimonio: e})}/>
                        <ToggleBtn label="Risco (ANVISA)" checked={labelConfig.showRisco} onChange={(e: boolean) => setLabelConfig({...labelConfig, showRisco: e})}/>
                        <ToggleBtn label="Seg. Elétrica" checked={labelConfig.showEletrica} onChange={(e: boolean) => setLabelConfig({...labelConfig, showEletrica: e})}/>
                        <ToggleBtn label="Telefone/SAC" checked={labelConfig.showTelefone} onChange={(e: boolean) => setLabelConfig({...labelConfig, showTelefone: e})}/>
                    </div>

                    <div className="pt-2">
                        <label className="text-[10px] font-bold text-slate-500 flex justify-between">Escala de Tamanho dos Textos e Dados <span>{labelConfig.dadosScale}%</span></label>
                        <input type="range" min="60" max="140" value={labelConfig.dadosScale} onChange={e => setLabelConfig({...labelConfig, dadosScale: Number(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2 accent-blue-600"/>
                        <p className="text-[9px] text-slate-400 mt-1">Se os dados cortarem, reduza esta barra.</p>
                    </div>
                </div>

                {/* PILAR 4: QR CODE E CTA */}
                <div className="space-y-4 border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5"><Maximize size={14}/> 4. Tamanho do QR Code</h4>
                        <input type="checkbox" className="w-4 h-4 cursor-pointer" checked={labelConfig.showQrCode} onChange={e => setLabelConfig({...labelConfig, showQrCode: e.target.checked})}/>
                    </div>
                    {labelConfig.showQrCode && (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                            <label className="text-[10px] font-bold text-slate-500 flex justify-between">Escala do QR <span>{labelConfig.qrScale}%</span></label>
                            <input type="range" min="50" max="140" value={labelConfig.qrScale} onChange={e => setLabelConfig({...labelConfig, qrScale: Number(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-2 accent-blue-600"/>
                        </div>
                    )}
                </div>

                <div className="space-y-4 border-t border-slate-200 pt-4">
                    <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5 bg-blue-50 p-2 rounded-lg"><Palette size={14}/> 5. Call To Action (Alerta QR)</h4>
                    {labelConfig.showQrCode && s.callBase !== 0 ? (
                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
                            <input type="text" className="w-full p-2 rounded-lg border border-slate-300 text-xs font-bold uppercase" placeholder="Ex: BIPAR PARA ABRIR O.S." value={labelConfig.qrText} onChange={e => setLabelConfig({...labelConfig, qrText: e.target.value.toUpperCase()})} maxLength={30}/>
                            
                            <div className="flex gap-2">
                                <button onClick={() => setLabelConfig({...labelConfig, qrTextBold: !labelConfig.qrTextBold})} className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-all ${labelConfig.qrTextBold ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-300'}`}>NEGRITO</button>
                                <button onClick={() => setLabelConfig({...labelConfig, qrTextInvert: !labelConfig.qrTextInvert})} className={`flex-1 py-1.5 text-[10px] font-bold rounded border transition-all ${labelConfig.qrTextInvert ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-300'}`}>TARJA ESCURA</button>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-slate-500 flex justify-between">Tamanho da Fonte <span>{labelConfig.qrTextScale}%</span></label>
                                <input type="range" min="60" max="150" value={labelConfig.qrTextScale} onChange={e => setLabelConfig({...labelConfig, qrTextScale: Number(e.target.value)})} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1"/>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-slate-400 p-3">Opção indisponível (QR Code desativado ou etiqueta muito pequena).</p>
                    )}
                </div>
            </div>

            <button onClick={handlePrintLabel} className="w-full mt-6 px-6 py-4 bg-slate-800 text-white font-black rounded-xl flex items-center justify-center gap-3 shadow-xl hover:bg-slate-900 transition-all active:scale-95 uppercase tracking-widest text-sm">
                <Printer size={20}/> Disparar Impressora Térmica
            </button>
        </div>

        {/* 👁️ PREVIEW DA ETIQUETA (DIREITA) - 🚀 BLINDADO E COM ZOOM */}
        <div className="xl:col-span-5 flex flex-col bg-slate-200/60 rounded-2xl border border-slate-300 p-4 md:p-6 shadow-inner relative min-h-[500px]">
            
            <div className="flex justify-between items-center w-full mb-6 z-10 px-2">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                    Preview em Tempo Real
                </span>
                
                {/* 🚀 NOVO: ZOOM DO PREVIEW (AJUDA A NÃO QUEBRAR A TELA) */}
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                    <ZoomIn size={12} className="text-slate-400"/>
                    <input type="range" min="40" max="120" value={labelConfig.zoomPreview} onChange={e => setLabelConfig({...labelConfig, zoomPreview: Number(e.target.value)})} className="w-20 h-1 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"/>
                    <span className="text-[9px] font-bold text-slate-500 w-6">{labelConfig.zoomPreview}%</span>
                </div>
            </div>
            
            {/* 🚀 ÁREA DE RENDERIZAÇÃO SCROLLÁVEL */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden relative">
                
                {/* CONTAINER DO ZOOM VISUAL (APLICA ESCALA SÓ NA TELA) */}
                <div style={{ transform: `scale(${labelConfig.zoomPreview / 100})`, transformOrigin: 'center center', transition: 'transform 0.2s ease-out' }}>
                    
                    {/* CONTAINER FÍSICO REAL DA ETIQUETA (MM REAIS QUE VÃO PARA IMPRESSORA) */}
                    <div ref={printRef}>
                        <div style={{ 
                            width: s.w, height: s.h, display: 'flex', flexDirection: labelConfig.layoutPosicao as any, padding: s.pad, boxSizing: 'border-box', color: '#000', fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', border: '1px solid #94a3b8', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2)'
                        }}>
                            
                            {/* LADO A: DADOS DO EQUIPAMENTO */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: (labelConfig.showQrCode && labelConfig.layoutPosicao === 'row') ? '4px' : '0px', paddingLeft: (labelConfig.showQrCode && labelConfig.layoutPosicao === 'row-reverse') ? '4px' : '0px' }}>
                                
                                {s.subBase !== 0 && renderHeader()}

                                <div style={{ fontSize: `calc(${s.titleBase}px * ${labelConfig.dadosScale / 100})`, fontWeight: '900', lineHeight: '1', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden' }}>{equipamento.tag}</div>
                                
                                {labelConfig.showNome && s.subBase !== 0 && (
                                    <div style={{ fontSize: subDynamicSize, fontWeight: 'bold', lineHeight: '1.1', marginTop: '4px', maxHeight: '2.5em', overflow: 'hidden' }}>{equipamento.nome || equipamento.tecnologia?.nome}</div>
                                )}
                                
                                {/* 🚀 RODAPÉ E SOLUÇÃO DO ESPAÇO VAZIO (AGRUPADO VS ESPALHADO) */}
                                {s.attrBase !== 0 && (labelConfig.showSerial || labelConfig.showPatrimonio || labelConfig.showTelefone || labelConfig.showModelo || labelConfig.showRisco || labelConfig.showEletrica || labelConfig.showEmail || labelConfig.showSetor) && (
                                    
                                    <div style={{ marginTop: labelConfig.distribuicao === 'espalhado' ? 'auto' : '8px', borderTop: '1px dashed #999', paddingTop: '3px', display: 'flex', flexWrap: 'wrap', gap: '1px 6px', lineHeight: '1.2' }}>
                                        {labelConfig.showSetor && <div style={{ fontSize: attrDynamicSize, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>LOC:</b> <span style={{fontWeight:'normal'}}>{equipamento.setor || 'N/A'}</span></div>}
                                        {labelConfig.showModelo && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>MOD:</b> <span style={{fontWeight:'normal'}}>{equipamento.modelo || 'N/A'}</span></div>}
                                        {labelConfig.showSerial && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>SN:</b> <span style={{fontWeight:'normal'}}>{equipamento.n_serie || 'N/A'}</span></div>}
                                        {labelConfig.showPatrimonio && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>PAT:</b> <span style={{fontWeight:'normal'}}>{equipamento.patrimonio || 'N/A'}</span></div>}
                                        {labelConfig.showRisco && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>RSC:</b> <span style={{fontWeight:'normal'}}>{equipamento.classe_risco || 'N/A'}</span></div>}
                                        {labelConfig.showEletrica && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>ELT:</b> <span style={{fontWeight:'normal'}}>{equipamento.dict_modelos?.classe_protecao_eletrica || 'N/A'}</span></div>}
                                        {labelConfig.showTelefone && configEmpresa?.telefone && <div style={{ fontSize: attrDynamicSize, width: '48%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>TEL:</b> <span style={{fontWeight:'normal'}}>{configEmpresa.telefone}</span></div>}
                                        {labelConfig.showEmail && configEmpresa?.email && <div style={{ fontSize: attrDynamicSize, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden' }}><b>@:</b> <span style={{fontWeight:'normal'}}>{configEmpresa.email}</span></div>}
                                    </div>
                                )}
                            </div>

                            {/* LADO B: QR CODE E CTA */}
                            {labelConfig.showQrCode && (
                                <div style={{ width: qrDynamicSize, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', shrink: 0 }}>
                                    <div style={{ width: qrDynamicSize, height: qrDynamicSize, display: 'flex', alignItems: 'center', justifyItems: 'center' }}>
                                        <img src={qrCodeImageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="QR" />
                                    </div>
                                    
                                    {s.callBase !== 0 && labelConfig.qrText && (
                                        <div style={{ 
                                            fontSize: callDynamicSize, 
                                            marginTop: '4px', 
                                            fontWeight: labelConfig.qrTextBold ? '900' : 'normal', 
                                            textAlign: 'center', 
                                            width: '100%', 
                                            lineHeight: '1.1',
                                            backgroundColor: labelConfig.qrTextInvert ? '#000' : 'transparent',
                                            color: labelConfig.qrTextInvert ? '#fff' : '#000',
                                            padding: labelConfig.qrTextInvert ? '3px 4px' : '0', 
                                            borderRadius: labelConfig.qrTextInvert ? '3px' : '0',
                                            whiteSpace: 'normal',
                                            wordWrap: 'break-word',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center'
                                        }}>
                                            {labelConfig.qrText}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AVISO INFORMATIVO NO RODAPÉ DO PREVIEW */}
            <div className="mt-6 text-center bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200 w-full shadow-sm z-10">
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                    Impressão Física Absoluta: <span className="font-black text-blue-600 text-sm">{s.w} x {s.h}</span><br/>
                    <span className="text-[9px]">A barra de Zoom ajusta apenas a sua tela, não o tamanho da impressão.</span>
                </p>
            </div>
        </div>
    </div>
  );
}

// Micro-componente interno
const ToggleBtn = ({ label, checked, onChange }: any) => (
    <label className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-inner' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 shadow-sm'}`}>
        <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)}/>
        <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>{checked && <CheckCircle size={8}/>}</div>
        <span className="text-[9px] font-bold uppercase tracking-wide truncate">{label}</span>
    </label>
);