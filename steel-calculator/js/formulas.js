/* Engine tính toán thuần (không đụng DOM). Đơn vị đầu vào: mm; rho: kg/m³.
   Chuyển đổi: mm² -> m² = 1e-6; mm -> m = 1e-3. Chỉ làm tròn ở bước hiển thị. */
(function (root) {
  const MM2_TO_M2 = 1e-6, MM_TO_M = 1e-3, PI = Math.PI;
  const CORNER_FACTOR = 0.2146;           // hệ số trong công thức diện tích EN 10056-1

  const F = {
    PI,
    // Thép tấm: V = L·W·t ; M = V·ρ
    plate(L, W, t, qty, rho) {
      const area = L * W * MM2_TO_M2, vol = area * t * MM_TO_M, m1 = vol * rho;
      return { area, vol, m1, total: m1 * qty, kgm2: t * MM_TO_M * rho };
    },
    // Diện tích tiết diện (mm²) của từng loại
    roundBarA: D => PI * D * D / 4,
    squareBarA: a => a * a,
    flatBarA: (B, t) => B * t,
    roundPipeA: (OD, t) => PI / 4 * (OD * OD - (OD - 2 * t) ** 2),
    // Bán kính ngoài góc hộp (EN 10219, cần đối chiếu bản gốc): t<=6: 2t; 6<t<=10: 2.5t; t>10: 3t
    tubeOuterRadius: t => (t <= 6 ? 2 * t : t <= 10 ? 2.5 * t : 3 * t),
    // Hộp: A = 2t(B+H) - 4t² - (4-π)(ro² - ri²), ri = ro - t. ro = 0 -> góc vuông.
    tubeA(B, H, t, ro) {
      let A = 2 * t * (B + H) - 4 * t * t;
      if (ro > 0) { const ri = Math.max(ro - t, 0); A -= (4 - PI) * (ro * ro - ri * ri); }
      return A;
    },
    // Thép V (EN 10056-1): A = t(a+b-t) + 0.2146(r1² - 2·r2²), r2 = r1/2
    angleA(a, b, t, r1) { const r2 = r1 / 2; return t * (a + b - t) + CORNER_FACTOR * (r1 * r1 - 2 * r2 * r2); },
    // Thanh định hình: từ diện tích (mm²) -> kg/m, kg/cây, tổng
    linear(A, Lm, qty, rho) {
      const kgm = A * MM2_TO_M2 * rho, kgPc = kgm * Lm;
      return { A, kgm, kgPc, total: kgPc * qty };
    }
  };
  if (typeof module !== 'undefined') module.exports = F; else root.SteelFormulas = F;
})(this);
