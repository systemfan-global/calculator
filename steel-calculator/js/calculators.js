/* Registry calculator: khai báo input, kiểm tra, hàm tính, hình SVG, công thức. UI tự sinh từ đây. */
(function (root) {
  const F = root.SteelFormulas || require('./formulas.js');
  const S = (inner) => `<svg viewBox="0 0 160 120" fill="none" stroke="currentColor" stroke-width="2">${inner}</svg>`;
  const TX = (x, y, s) => `<text x="${x}" y="${y}" font-size="10" fill="currentColor" stroke="none" text-anchor="middle">${s}</text>`;
  const SVG = {
    plate: S(`<rect x="25" y="35" width="110" height="55" fill="#dbeafe"/>${TX(80,108,'L')}${TX(14,66,'W')}${TX(80,28,'dày t')}`),
    round: S(`<circle cx="80" cy="60" r="38" fill="#dbeafe"/>${TX(80,64,'D')}`),
    pipe: S(`<circle cx="80" cy="60" r="40" fill="#dbeafe"/><circle cx="80" cy="60" r="30" fill="#fff"/>${TX(80,114,'OD, t')}`),
    square: S(`<rect x="42" y="22" width="76" height="76" fill="#dbeafe"/>${TX(80,64,'a')}`),
    flat: S(`<rect x="25" y="45" width="110" height="26" fill="#dbeafe"/>${TX(80,92,'B')}${TX(14,62,'t')}`),
    tube: S(`<rect x="30" y="22" width="100" height="76" rx="10" fill="#dbeafe"/><rect x="40" y="32" width="80" height="56" rx="5" fill="#fff"/>${TX(80,114,'B × H × t')}`),
    angle: S(`<path d="M35 20h20v60h50v20H35z" fill="#dbeafe"/>${TX(80,114,'a × b × t')}`)
  };
  const common = [
    { k: 'L', label: 'Chiều dài L', unit: 'm', def: 6 },
    { k: 'qty', label: 'Số lượng', unit: 'cây', def: 1 }
  ];
  // Calculator thanh định hình: mỗi loại chỉ cần hàm diện tích + mô tả kích thước
  function linearCalc(o) {
    return {
      id: o.id, group: o.group, name: o.name, keys: o.keys || '', svg: SVG[o.svg], formula: o.formula, ref: o.ref,
      fields: o.dims.concat(common), check: o.check,
      calc(v) {
        const A = o.area(v), r = F.linear(A, v.L, v.qty, v.rho);
        return {
          items: [
            { label: 'Diện tích tiết diện', v: r.A, d: 1, u: 'mm²' },
            { label: 'Khối lượng trên mét', v: r.kgm, d: 3, u: 'kg/m' },
            { label: 'Khối lượng / cây', v: r.kgPc, d: 2, u: 'kg' },
            { label: 'Tổng khối lượng', v: r.total, d: 2, u: 'kg', big: true }],
          bom: { size: o.size(v), len: v.L, qty: v.qty, kgPc: r.kgPc }
        };
      }
    };
  }
  const NOTE = 'M = A × L × ρ, trong đó A (mm²) × 10⁻⁶ = m², ρ = khối lượng riêng (kg/m³).';
  const tubes = [['sqtube', 'Hộp vuông (Square Hollow Section)', true], ['rectube', 'Hộp chữ nhật (Rectangular Hollow Section)', false]]
    .map(([id, name, sq]) => linearCalc({ id, group: 'Thép hộp', name, svg: 'tube', keys: 'hộp ống vuông chữ nhật shs rhs',
      dims: [{ k: 'B', label: sq ? 'Cạnh A' : 'Chiều rộng B', unit: 'mm', def: sq ? 100 : 200 }]
        .concat(sq ? [] : [{ k: 'H', label: 'Chiều cao H', unit: 'mm', def: 100 }])
        .concat([{ k: 't', label: 'Chiều dày t', unit: 'mm', def: 3 },
                 { k: 'ro', label: 'Bán kính ngoài góc ro (0 = góc vuông, trống = theo EN 10219)', unit: 'mm', def: '', opt: true }]),
      check: v => (v.t >= Math.min(v.B, sq ? v.B : v.H) / 2 ? 'Chiều dày phải nhỏ hơn một nửa cạnh nhỏ.' : null),
      area: v => F.tubeA(v.B, sq ? v.B : v.H, v.t, v.ro === '' || v.ro == null ? F.tubeOuterRadius(v.t) : v.ro),
      size: v => `${v.B}×${sq ? v.B : v.H}×${v.t}`,
      formula: 'A = 2t(B+H) − 4t² − (4−π)(ro² − ri²), ri = ro − t<br>Góc vuông (ro = 0): A = 2t(B+H) − 4t².<br>Quy tắc ro theo t (t≤6: 2t; ≤10: 2,5t; &gt;10: 3t) lấy theo EN 10219, cần đối chiếu bản tiêu chuẩn gốc.<br>Ví dụ 100×100×3: góc vuông 1164 mm² (9,137 kg/m); ro = 6 → 1140,8 mm² (8,955 kg/m).',
      ref: 'EN 10219 (hộp tạo hình nguội); hình học bo góc.' }));
  const CALCS = [
    { id: 'plate', group: 'Thép tấm', name: 'Thép tấm', keys: 'tôn lá inox tấm', svg: SVG.plate,
      fields: [{ k: 'L', label: 'Chiều dài L', unit: 'mm', def: 1000 }, { k: 'W', label: 'Chiều rộng W', unit: 'mm', def: 1000 },
               { k: 't', label: 'Chiều dày t', unit: 'mm', def: 10 }, { k: 'qty', label: 'Số lượng', unit: 'tấm', def: 1 }],
      formula: 'V = L × W × t (đổi mm → m)<br>M = V × ρ<br>Khối lượng/m² = t × ρ<br>Ví dụ: 1000×1000×10, ρ = 7850 → 78,50 kg.',
      ref: 'Khối lượng = thể tích × khối lượng riêng.',
      calc(v) {
        const r = F.plate(v.L, v.W, v.t, v.qty, v.rho);
        return { items: [
          { label: 'Diện tích 1 tấm', v: r.area, d: 4, u: 'm²' }, { label: 'Thể tích 1 tấm', v: r.vol, d: 6, u: 'm³' },
          { label: 'Khối lượng/m²', v: r.kgm2, d: 3, u: 'kg/m²' }, { label: 'Khối lượng 1 tấm', v: r.m1, d: 2, u: 'kg' },
          { label: 'Tổng khối lượng', v: r.total, d: 2, u: 'kg', big: true }],
          bom: { size: `${v.L}×${v.W}×${v.t}`, len: 1, qty: v.qty, kgPc: r.m1 } };
      } },
    linearCalc({ id: 'pipe', group: 'Thép ống', name: 'Ống tròn (Pipe)', svg: 'pipe', keys: 'ống thép tròn',
      dims: [{ k: 'OD', label: 'Đường kính ngoài OD', unit: 'mm', def: 100 }, { k: 't', label: 'Chiều dày t', unit: 'mm', def: 3 }],
      check: v => (v.t >= v.OD / 2 ? 'Chiều dày phải nhỏ hơn bán kính ngoài.' : null),
      area: v => F.roundPipeA(v.OD, v.t), size: v => `Ø${v.OD}×${v.t}`,
      formula: 'ID = OD − 2t<br>A = π/4 × (OD² − ID²)<br>' + NOTE + '<br>Ví dụ: Ø100×3 → A = 914,2 mm², 7,176 kg/m.', ref: 'Hình học hình vành khuyên.' }),
    ...tubes,
    linearCalc({ id: 'eqangle', group: 'Thép hình', name: 'Thép V đều (Equal Angle)', svg: 'angle', keys: 'góc l',
      dims: [{ k: 'a', label: 'Cạnh a', unit: 'mm', def: 50 }, { k: 't', label: 'Chiều dày t', unit: 'mm', def: 5 },
             { k: 'r1', label: 'Bán kính góc trong r1 (0 = bỏ qua)', unit: 'mm', def: 7, opt: true }],
      check: v => (v.t >= v.a ? 'Chiều dày phải nhỏ hơn cạnh a.' : null),
      area: v => F.angleA(v.a, v.a, v.t, v.r1 || 0), size: v => `L${v.a}×${v.a}×${v.t}`,
      formula: 'A = t(a + b − t) + 0,2146(r1² − 2·r2²), r2 = r1/2 (EN 10056-1)<br>r1 = 0 cho kết quả đơn giản 2at − t², thấp hơn bảng tra (L50×50×5: 475 so với 480,3 mm²).<br>Nhập r1 theo bảng tra của nhà sản xuất (L50×50×5: r1 = 7).',
      ref: 'EN 10056-1; roymech.org Steel Section Index.' }),
    linearCalc({ id: 'uneqangle', group: 'Thép hình', name: 'Thép V không đều (Unequal Angle)', svg: 'angle', keys: 'góc l',
      dims: [{ k: 'a', label: 'Cạnh dài a', unit: 'mm', def: 75 }, { k: 'b', label: 'Cạnh ngắn b', unit: 'mm', def: 50 },
             { k: 't', label: 'Chiều dày t', unit: 'mm', def: 5 }, { k: 'r1', label: 'Bán kính góc trong r1 (0 = bỏ qua)', unit: 'mm', def: 7, opt: true }],
      check: v => (v.t >= Math.min(v.a, v.b) ? 'Chiều dày phải nhỏ hơn cạnh nhỏ.' : null),
      area: v => F.angleA(v.a, v.b, v.t, v.r1 || 0), size: v => `L${v.a}×${v.b}×${v.t}`,
      formula: 'A = t(a + b − t) + 0,2146(r1² − 2·r2²), r2 = r1/2 (EN 10056-1)<br>' + NOTE, ref: 'EN 10056-1.' }),
    linearCalc({ id: 'flat', group: 'Thép thanh', name: 'Thép dẹt (Flat Bar)', svg: 'flat', keys: 'flat bar',
      dims: [{ k: 'B', label: 'Bản rộng B', unit: 'mm', def: 50 }, { k: 't', label: 'Chiều dày t', unit: 'mm', def: 5 }],
      area: v => F.flatBarA(v.B, v.t), size: v => `${v.B}×${v.t}`, formula: 'A = B × t<br>' + NOTE, ref: 'Bỏ qua bo cạnh của thép cán thực tế.' }),
    linearCalc({ id: 'round', group: 'Thép thanh', name: 'Thép tròn đặc (Round Bar)', svg: 'round', keys: 'láp tròn',
      dims: [{ k: 'D', label: 'Đường kính D', unit: 'mm', def: 100 }], area: v => F.roundBarA(v.D), size: v => `Ø${v.D}`,
      formula: 'A = π·D²/4<br>' + NOTE + '<br>Ví dụ: Ø100 → 61,65 kg/m.', ref: 'Hình học hình tròn.' }),
    linearCalc({ id: 'squarebar', group: 'Thép thanh', name: 'Thép vuông đặc (Square Bar)', svg: 'square', keys: 'vuông đặc',
      dims: [{ k: 'a', label: 'Cạnh a', unit: 'mm', def: 20 }], area: v => F.squareBarA(v.a), size: v => `□${v.a}`,
      formula: 'A = a²<br>' + NOTE, ref: 'Bỏ qua bo cạnh.' })
  ];
  if (typeof module !== 'undefined') module.exports = CALCS; else root.CALCS = CALCS;
})(this);
