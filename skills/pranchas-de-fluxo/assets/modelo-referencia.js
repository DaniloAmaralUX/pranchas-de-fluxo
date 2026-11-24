self.DrawingModels ??= {};
self.DrawingModels.dialogo = (_parameters, options) => {
  const G = TechnicalGeometry;
  const CAMERA = {azimuth: -76, elevation: 25, roll: 0};

  function plate(id, name, width, height, radius, z, depth, rise) {
    const part = G.part(id, name, [0, 0, rise]);
    G.box(part, [-width / 2, -height / 2, z], [width / 2, height / 2, z + depth], {radius});
    return part;
  }

  function outline(part, x, y, w, h, r, z, role = 'detail') {
    const profile = G.roundedRectangle(w, h, r, {center: [x, y]});
    G.polyline(part, profile.map(([px, py]) => [px, py, z]), {closed: true, role});
  }

  function stroke(part, x, y, width, z, role = 'detail') {
    G.line(part, [x, y, z], [x + width, y, z], role);
  }

  const page = plate('page', 'Página', 152, 86, 4, 0, 2.5, 0);
  const pageTop = 2.58;
  stroke(page, -75, 27, 150, pageTop, 'edge');
  G.line(page, [-43, 27, pageTop], [-43, -42, pageTop], 'edge');
  for (const x of [-68, -63, -58]) G.circle(page, [x, 35, pageTop], 1.05, [0, 0, 1], {segments: 16});
  for (const y of [17, 8, -1, -10]) {
    outline(page, -67, y, 4, 4, .65, pageTop);
    stroke(page, -63, y, 14, pageTop);
  }
  stroke(page, -35, 18, 33, pageTop, 'edge');
  stroke(page, -35, 12, 24, pageTop);
  for (const y of [1, -12, -25]) {
    outline(page, 16, y, 102, 10, 1.8, pageTop);
    outline(page, -29, y, 4, 4, .6, pageTop);
    stroke(page, -23, y, 21, pageTop);
    stroke(page, 44, y, 15, pageTop);
  }

  const scrim = plate('scrim', 'Scrim', 152, 86, 4, 2.8, 1.55, 51);
  scrim.transparent = true;
  outline(scrim, 0, 0, 146, 80, 3, 4.42);
  const dialog = plate('dialog', 'Diálogo', 89, 51, 4, 4.65, 2.15, 105);
  const dialogTop = 6.88;
  outline(dialog, -33, 14, 9, 9, 1.9, dialogTop, 'edge');
  outline(dialog, -33, 13.4, 4, 3, .45, dialogTop);
  stroke(dialog, -35.6, 15.4, 5.2, dialogTop);
  stroke(dialog, -24.5, 15.2, 35, dialogTop, 'edge');
  stroke(dialog, -24.5, 11.4, 24, dialogTop);
  stroke(dialog, -37, 2.5, 62, dialogTop);
  stroke(dialog, -37, -2, 53, dialogTop);
  stroke(dialog, -42, -9.5, 84, dialogTop);
  outline(dialog, -11, -17, 23, 7.5, 1.8, dialogTop);
  outline(dialog, 23, -17, 25, 7.5, 1.8, dialogTop, 'edge');
  stroke(dialog, -17, -17, 12, dialogTop);
  stroke(dialog, 16, -17, 14, dialogTop, 'edge');

  const focus = G.part('focus', 'Anel de foco', [0, 0, 151]);
  G.extrude(focus, G.roundedRectangle(30, 12.5, 3.2, {center: [23, -17]}), {
    depth: .85,
    holes: [G.roundedRectangle(27, 9.5, 2.5, {center: [23, -17]})]
  });
  G.transform(focus, {origin: [0, 0, 7.08]});

  const trails = [{
    a: [23, -17, 6.9], b: [23, -17, 7.08],
    from: 'dialog', to: 'focus'
  }, {
    a: [0, 0, 4.4], b: [0, 0, 4.65],
    from: 'scrim', to: 'dialog'
  }, {
    a: [0, 0, 2.55], b: [0, 0, 2.8],
    from: 'page', to: 'scrim'
  }];
  const result = TechnicalProjection.render([page, scrim, dialog, focus], {...options, camera: CAMERA, trails});
  const project = (point, part) => {
    const exploded = point.map((value, i) => value + part.explosion[i] * (options.explosion ?? 0));
    return TechnicalProjection.project(exploded, CAMERA).slice(0, 2)
      .map((value, i) => value * result.scale + result.offset[i]);
  };
  result.anchors = {
    focus: project([38, -17, 7.93], focus),
    dialog: project([44.5, 16, 6.8], dialog),
    scrim: project([76, 33, 4.35], scrim),
    page: project([76, 33, 2.5], page)
  };
  result.scrimFace = G.roundedRectangle(152, 86, 4).map(([x, y]) => project([x, y, 4.35], scrim));
  return result;
};
