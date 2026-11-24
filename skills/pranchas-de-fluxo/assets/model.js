(() => {
  const G = TechnicalGeometry;
  const camera = {azimuth: -76, elevation: 25, roll: 0};
  const z = 2.57;

  function frame(part, x, y, width, height, radius, top = z, role = 'detail') {
    const points = G.roundedRectangle(width, height, radius, {center: [x, y]});
    G.polyline(part, points.map(([px, py]) => [px, py, top]), {closed: true, role});
  }

  function ink(part, x, y, length, top = z, role = 'detail') {
    G.line(part, [x, y, top], [x + length, y, top], role);
  }

  function list(archived) {
    const page = G.part('page', 'Lista de projetos');
    G.box(page, [-76, -43, 0], [76, 43, 2.5], {radius: 4});
    ink(page, -75, 27, 150, z, 'edge');
    G.line(page, [-43, 27, z], [-43, -42, z], 'edge');
    for (const x of [-68, -63, -58]) G.circle(page, [x, 35, z], 1.05, [0, 0, 1], {segments: 16});
    for (const y of [17, 8, -1, -10]) {
      frame(page, -67, y, 4, 4, .65);
      ink(page, -63, y, 14);
    }
    ink(page, -35, 18, 33, z, 'edge');
    ink(page, -35, 12, 24);
    const rows = archived ? [-12, -25] : [1, -12, -25];
    for (const y of rows) {
      frame(page, 16, y, 102, 10, 1.8);
      frame(page, -29, y, 4, 4, .6);
      ink(page, -23, y, 21);
      if (y !== 1) ink(page, 45, y, 14);
    }
    return page;
  }

  function action() {
    const button = G.part('trigger', 'Ação Arquivar', [0, 0, 27]);
    G.box(button, [39, -2.35, 2.75], [63, 4.35, 3.8], {radius: 1.5});
    ink(button, 44, 1, 14, 3.89, 'edge');
    return button;
  }

  function ring(x, y, width, height, top, name) {
    const part = G.part('focus', name, [0, 0, 51]);
    const center = [x, y];
    G.extrude(part, G.roundedRectangle(width, height, 2.3, {center}), {
      depth: .64, holes: [G.roundedRectangle(width - 2.4, height - 2.4, 1.35, {center})]
    });
    G.transform(part, {origin: [0, 0, top]});
    return part;
  }

  function feedback() {
    const banner = G.part('feedback', 'Mensagem de sucesso', [0, 0, 28]);
    G.box(banner, [-35, -5, 2.8], [67, 7, 4], {radius: 2});
    G.polyline(banner, [[-30, .6, 4.08], [-28, -1, 4.08], [-25, 2.3, 4.08]], {role: 'edge'});
    ink(banner, -21, 2.5, 42, 4.08, 'edge');
    ink(banner, -21, -.7, 30, 4.08);
    return banner;
  }

  function compose(options, components) {
    return TechnicalProjection.render(components, {...options, camera});
  }

  const models = self.DrawingModels;
  models.confirmacao = models.dialogo;
  models.lista = (_parameters, options) => compose(options, [list(false), action()]);
  models.cancelamento = (_parameters, options) => compose(options, [
    list(false), action(), ring(51, 1, 27, 9.6, 4.05, 'Foco no acionador')
  ]);
  models.resultado = (_parameters, options) => compose(options, [
    list(true), feedback(), ring(-18.5, 18, 36, 5.8, 2.73, 'Foco no título')
  ]);
})();

