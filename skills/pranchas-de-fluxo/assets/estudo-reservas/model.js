(() => {
  const G = TechnicalGeometry;
  const registry = self.DrawingModels ??= {};
  const camera = { azimuth: -76, elevation: 30, roll: 0 };
  function stroke(part, points, z, role='edge') {
    G.polyline(part, points.map(([x,y])=>[x,y,z]), {role});
  }
  function word(p, content, x, y, size, z) {
    G.surfaceLabel(p, content, [x,y,z], {height:size});
  }
  function frame(p,x,y,w,h,z,r=.8,role='detail'){
    const points = G.roundedRectangle(w,h,r,{center:[x,y]});
    G.polyline(p,points.map(([a,b])=>[a,b,z]),{closed:true,role});
  }
  function plate(id,name,l,b,r,t,z,rise){
    const p = G.part(id,name,[0,0,rise]);
    G.box(p,[l,b,z],[r,t,z+1.15],{radius:1.6});
    return p;
  }
  function ring(p,x,y,r,z){
    G.circle(p,[x,y,z],r,[0,0,1],{segments:24});
  }
  function shell(title){
    const p=plate('shell','Estrutura da agenda',-77,-44,77,44,0,0);
    const z=1.24;
    stroke(p,[[-75,29],[75,29]],z);
    frame(p,-68,36,8,7,z);
    stroke(p,[[-72,35],[-64,35]],z);
    stroke(p,[[-68,32.7],[-68,35]],z);
    word(p,title,-60,34.1,3.6,z);
    word(p,'MANUTENÇÃO',37,34.7,2.8,z);
    stroke(p,[[-73,-36],[73,-36]],z,'detail');
    word(p,'AGENDA',-70,-41,2.3,z);
    return p;
  }
  function furniture(p,x,y,z){
    frame(p,x,y,13,6,z,1);
    for(const dx of [-4,4]) for(const dy of [-4.6,4.6]) frame(p,x+dx,y+dy,2.5,1.6,z,.4);
  }
  function arc(p,x,y,r,z){
    const path=Array.from({length:12},(_,i)=>{
      const a=i/11*Math.PI/2;
      return [x+r*Math.cos(a),y+r*Math.sin(a)];
    });
    stroke(p,path,z,'detail');
    stroke(p,[[x,y],[x,y+r]],z,'detail');
  }
  function plan(id,name,room,occupied){
    const p=plate(id,name,-71,-30,17,23,1.5,23);
    const z=2.72;
    stroke(p,[[-66,18],[12,18],[12,-23],[-66,-23],[-66,18]],z);
    stroke(p,[[-27,18],[-27,-11]],z);
    stroke(p,[[-66,-11],[-59,-11]],z);
    stroke(p,[[-51,-11],[-21,-11]],z);
    stroke(p,[[-13,-11],[12,-11]],z);
    arc(p,-59,-11,8,z); arc(p,-21,-11,8,z);
    furniture(p,-47,6,z); furniture(p,-6.5,6,z);
    word(p,'IPÊ',-51,-7,3.2,z);
    word(p,'BURITI',-9,-7,3.2,z);
    word(p,'ACESSO',-65,-20,2.6,z);
    if(room){
      const x=room==='IPE'?-47:-6.5;
      frame(p,x,3,34,26,z,1.3,'edge');
      if(occupied) for(let i=0;i<3;i++) stroke(p,[[x+8+i*2,13],[x+11+i*2,16]],z);
    }
    return p;
  }
  function sidebar(id,name,room,mode,slot) {
    const p=plate(id,name,22,-30,71,23,1.7,45);
    const z=2.92;
    word(p,mode==='map'?'SALAS':room==='IPE'?'IPÊ':room,27,14.8,3.7,z);
    stroke(p,[[26,10],[66,10]],z,'detail');
    if(mode==='map'){
      for(const [y,t] of [[2,'IPÊ'],[-14,'BURITI']]){
        ring(p,29,y+1.2,1.65,z); word(p,t,33,y,2.8,z);
        stroke(p,[[27,y-5],[65,y-5]],z,'detail');
      }
    } else {
      word(p,slot+'H',27,2.6,4.1,z);
      const label = mode==='conflict'?'CONFLITO': mode==='done'?'OCUPADA':'LIVRE';
      frame(p,45.5,-8.5,36,8,z,1.7);
      word(p,label,30,-9.8,3,z);
      if(mode==='conflict') word(p,'VER BURITI',27,-23,2.7,z);
      if(mode==='free') word(p,'CONFIRMAR',27,-23,2.7,z);
      if(mode==='done') stroke(p,[[29,-23],[32,-25],[38,-18]],z);
    }
    return p;
  }
  function timeline(room,mode,slot){
    const p=plate('agenda','Grade de horários',-71,-30,17,23,1.5,23);
    const z=2.72;
    word(p,'HORÁRIO',-65,15,3.25,z);
    const ys=[7,-5,-17];
    ys.forEach((y,i)=>{
      const h=14+i;
      word(p,String(h)+'H',-65,y-2,3,z);
      frame(p,-18,y,55,8,z,.7,'edge');
      const busy=(room==='IPE'&&h===15)||(mode==='done'&&String(h)===slot);
      if(busy){
        for(let x=-43;x<-27;x+=3) stroke(p,[[x,y-2],[x+3,y+2]],z);
        word(p,'OCUPADA',-22,y-1.35,2.4,z);
      }else{
        ring(p,-40,y,1.2,z);
        word(p,'LIVRE',-33,y-1.35,2.4,z);
      }
    });
    return p;
  }
  function assemble(options,parts){return TechnicalProjection.render(parts,{...options,camera});}
  registry.mapa=(_,options)=>assemble(options,[shell('PLANTA DAS SALAS'),plan('planta','Planta das salas',null,false),sidebar('salas','Lista das salas','', 'map','')]);
  registry.horarios=(_,options)=>assemble(options,[shell('AGENDA DA SALA IPÊ'),timeline('IPE','schedule',''),sidebar('escolha','Horário em consulta','IPE','free','14')]);
  registry.conflito=(_,options)=>assemble(options,[shell('ALTERNATIVA DE SALA'),plan('planta','Localização da Sala Buriti','BURITI',false),sidebar('alerta','Conflito e alternativa','IPE','conflict','15')]);
  const versions = [
    ['revisar-ipe','IPE','14','free'],['ocupada-ipe','IPE','14','done'],
    ['revisar-buriti','BURITI','15','free'],['ocupada-buriti','BURITI','15','done']
  ];
  for(const [id,room,slot,mode] of versions){
    registry[id]=(_,options)=>assemble(options,[shell(mode==='done'?'RESERVA CONFIRMADA':'REVISAR RESERVA'),timeline(room,mode,slot),sidebar('reserva','Situação da reserva',room,mode,slot)]);
  }
})();
