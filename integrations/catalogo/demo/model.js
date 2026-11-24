/* Conceito de interface, medidas ilustrativas. Um modelo para as duas vistas. */
(() => {
 const G=TechnicalGeometry, models=self.DrawingModels??={};
 const camera={azimuth:-76,elevation:25,roll:0};
 const states={analise:['ANÁLISE DO GERENTE','AGUARDANDO','review'],devolucao:['DEVOLVER PEDIDO','AGUARDANDO','reason'],'motivo-vazio':['REVISAR O MOTIVO','AGUARDANDO','error'],correcao:['CORRIGIR PEDIDO','DEVOLVIDO','edit'],reenviado:['PEDIDO REENVIADO','AGUARDANDO','sent'],aprovado:['PEDIDO APROVADO','APROVADO','approved'],emissao:['ACESSO À EMISSÃO','APROVADO','contract']};
 const line=(p,coords,z=2.65,role='detail')=>G.polyline(p,coords.map(([x,y])=>[x,y,z]),{role});
 const word=(p,t,x,y,h=2.6,z=2.65)=>G.surfaceLabel(p,t,[x,y,z],{height:h,role:'edge'});
 function frame(p,x,y,w,h,z=2.65,r=1){G.polyline(p,G.roundedRectangle(w,h,r,{center:[x,y]}).map(([a,b])=>[a,b,z]),{closed:true,role:'edge'});}
 function plate(id,name,x0,y0,x1,y1,rise,z=1.5){const p=G.part(id,name,[0,0,rise]);G.box(p,[x0,y0,z],[x1,y1,z+1],{radius:1});return p;}
 function shell(title){
  const p=plate('estrutura','Estrutura do pedido',-92,-59,92,59,0,0);
  line(p,[[-90,43],[90,43]],1.12,'edge');
  for(const x of [-84,-79,-74]) G.circle(p,[x,51,1.12],1,[0,0,1],{segments:24});
  word(p,title,-66,49,3.2,1.12);word(p,'PEDIDO 024 / ILUSTRATIVO',-83,-55,2.2,1.12);return p;
 }
 function document(mode){
  const p=G.part('pedido','Documento do pedido',[0,0,24]);
  G.extrude(p,[[-84,-44],[-18,-44],[-18,29],[-26,37],[-84,37]],{depth:1});G.transform(p,{origin:[0,0,1.5]});
  line(p,[[-26,37],[-26,29],[-18,29]],2.65,'edge');word(p,'PEDIDO 024',-79,28,3.4);word(p,'DADOS ILUSTRATIVOS',-79,21,2.2);
  line(p,[[-79,17],[-23,17]],2.65,'edge');word(p,'OBJETO',-79,11,2.4);word(p,'SERVIÇO',-79,5,3);
  for(const y of [-2,-12,-22]){line(p,[[-79,y],[-23,y]]);line(p,[[-48,y],[-48,y-9]]);}
  word(p,'ITEM',-77,-8,2.3);word(p,'01',-43,-8,2.3);word(p,'VERSÃO',-77,-18,2.3);word(p,'01',-43,-18,2.3);
  word(p,'ANÁLISE DO GERENTE',-79,-36,2.45);return p;
 }
 function status(text,mode){
  const p=plate('situacao','Situação persistente do pedido',-9,23,83,37,96);frame(p,0,30,10,9);
  if(['approved','contract'].includes(mode))line(p,[[-3,30],[0,27],[4,33]],2.65,'edge');
  else if(mode==='edit'){line(p,[[0,33],[0,29]],2.65,'edge');G.circle(p,[0,26.8,2.65],.35,[0,0,1]);}
  else G.circle(p,[0,30,2.65],2.4,[0,0,1]);
  word(p,text,10,28,2.9);return p;
 }
 function gate(open){
  const p=plate('emissao','Condição de emissão do contrato',-9,-44,83,-26,24);frame(p,0,-35,9,7);
  line(p,open?[[0,-31],[0,-28],[4,-28],[4,-30]]:[[-3,-31],[-3,-28],[3,-28],[3,-31]],2.65,'edge');
  word(p,open?'APROVAÇÃO ATENDIDA':'EMISSÃO BLOQUEADA',10,-33,2.6);word(p,open?'EMISSÃO É OUTRA ETAPA':'AGUARDA O GERENTE',10,-40,2.1);return p;
 }
 function reason(mode){
  const p=plate('motivo','Motivo da devolução',-9,0,83,18,72);word(p,'MOTIVO DA DEVOLUÇÃO',-5,12,2.55);frame(p,37,5,81,7);
  if(mode!=='error')word(p,'REVISE O OBJETO.',-2,3.8,2.5);else line(p,[[-2,3],[-2,7]],2.65,'edge');
  line(p,[[74,2.4],[77,4.4]]);return p;
 }
 function correction(){
  const p=plate('campos','Dados corrigíveis do pedido',-9,-22,83,-3,48);word(p,'OBJETO / EXEMPLO',-5,-8,2.3);frame(p,37,-15,81,8);
  word(p,'SERVIÇO REVISADO',-2,-16.2,2.5);line(p,[[74,-12],[77,-15],[72,-19]],2.65,'edge');return p;
 }
 function actions(mode){
  const p=G.part('acoes','Ações da etapa',[0,0,144]);
  const btn=(t,x,y,w)=>{G.box(p,[x,y-4,2.8],[x+w,y+4,3.8],{radius:1.5});word(p,t,x+3,y-1.2,2.4,3.9);};
  if(mode==='review'){btn('APROVAR PEDIDO',-7,10,87);btn('DEVOLVER PEDIDO',-7,-4,87);}
  if(mode==='reason')btn('DEVOLVER PEDIDO',-7,-8,87);
  if(mode==='error')btn('DEVOLVER PEDIDO',-7,-18,87);
  if(mode==='edit')btn('REENVIAR PEDIDO',-7,-50,87);
  if(mode==='sent')btn('REABRIR ANÁLISE',-7,-14,87);
  if(mode==='approved')btn('ACESSAR EMISSÃO',-7,-14,87);
  if(mode==='contract')btn('CONFERIR PEDIDO',-7,-50,87);return p;
 }
 function feedback(mode){
  const p=plate('retorno','Retorno textual da operação',-9,-6,83,18,72);
  const texts=mode==='sent'?['PEDIDO REENVIADO','NOVA ANÁLISE','HIPÓTESE A VALIDAR']:['PEDIDO APROVADO','CONTRATO AINDA','NÃO EMITIDO'];
  texts.forEach((t,i)=>word(p,t,-5,11-i*6,2.6));return p;
 }
 function errorNote(){const p=G.part('erro','Erro associado ao motivo',[0,0,96]);frame(p,37,5,83,9,2.8,1.2);word(p,'INFORME O MOTIVO.',-5,-5,2.6,2.8);return p;}
 function contract(){
  const p=G.part('contrato','Contrato separado da aprovação',[0,0,72]);G.extrude(p,[[-5,-20],[78,-20],[78,10],[70,18],[-5,18]],{depth:1});G.transform(p,{origin:[0,0,1.5]});
  word(p,'CONTRATO',0,9,3.3);line(p,[[0,4],[71,4]]);word(p,'NÃO EMITIDO',0,-4,3);word(p,'OUTRAS CONDIÇÕES?',0,-13,2.5);return p;
 }
 function parts(id){
  const [title,text,mode]=states[id];const ps=[shell(title),document(mode),status(text,mode),gate(['approved','contract'].includes(mode))];
  if(['reason','error','edit'].includes(mode))ps.push(reason(mode));
  if(mode==='edit')ps.push(correction());if(mode==='error')ps.push(errorNote());
  if(['sent','approved'].includes(mode))ps.push(feedback(mode));if(mode==='contract')ps.push(contract());ps.push(actions(mode));return ps;
 }
 self.ApprovalDrawing={parts,camera,states};
 for(const id of Object.keys(states))models[id]=(_,options)=>TechnicalProjection.render(parts(id),{...options,camera});
})();
