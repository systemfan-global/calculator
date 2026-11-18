/* Kiểm thử độc lập: giá trị kỳ vọng tính tay. Chạy: node js/tests.js, hoặc nút "Kiểm thử" trên web. */
(function (root) {
  const F = root.SteelFormulas || require('./formulas.js'), C = root.CALCS || require('./calculators.js');
  const get = (id, v) => C.find(c => c.id === id).calc(Object.assign({ rho: 7850, qty: 1, L: 1 }, v)).items;
  const T = [
    ['Thép tấm', '1000×1000×10', 78.5, () => get('plate', { L: 1000, W: 1000, t: 10 }).pop().v, 1e-9],
    ['Thép tròn', 'Ø100, 1 m (kg)', 61.6537558, () => get('round', { D: 100 })[2].v, 1e-6],
    ['Ống', 'Ø100×3 (mm²)', 914.2034, () => get('pipe', { OD: 100, t: 3 })[0].v, 1e-3],
    ['Ống', 'Ø100×3 (kg/m)', 7.176497, () => get('pipe', { OD: 100, t: 3 })[1].v, 1e-4],
    ['Hộp vuông góc vuông', '100×100×3 (mm²)', 1164, () => F.tubeA(100, 100, 3, 0), 1e-9],
    ['Hộp vuông góc bo', '100×100×3, ro 6 (mm²)', 1140.8, () => F.tubeA(100, 100, 3, 6), 0.05],
    ['Hộp chữ nhật', '200×100×5, vuông (mm²)', 0, () => F.tubeA(200, 100, 5, 0), 1e-9],
    ['Thép V đều', 'L50×50×5 r1=0 (mm²)', 475, () => F.angleA(50, 50, 5, 0), 1e-9],
    ['Thép V đều', 'L50×50×5 r1=7 (mm²)', 480.26, () => F.angleA(50, 50, 5, 7), 0.01],
    ['Thép dẹt', '50×5 (mm²)', 250, () => F.flatBarA(50, 5), 1e-9],
    ['Thép vuông', '20×20 (mm²)', 400, () => F.squareBarA(20), 1e-9]
  ];
  // 200×100×5 góc vuông: 2·5·300 − 4·25 = 2900
  T[6][2] = 2900;
  function run() { return T.map(([n, i, e, f, tol]) => { const a = f(); return { n, i, e, a, ok: Math.abs(a - e) <= tol }; }); }
  if (typeof module !== 'undefined') {
    if (require.main === module) { const r = run(); r.forEach(x => console.log(x.ok ? 'PASS' : 'FAIL', x.n, x.i, x.e, x.a)); process.exit(r.every(x => x.ok) ? 0 : 1); }
    module.exports = run;
  } else root.runTests = run;
})(this);
