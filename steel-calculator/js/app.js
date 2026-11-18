/* UI: sinh form từ registry CALCS, kết nối engine, yêu thích, gần đây, bảng vật tư (lưu localStorage). */
(function () {
  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* bỏ qua */ } }
  };
  let favs = store.get('fav', []), recent = store.get('recent', []), bom = store.get('bom', []), last = null;
  const state = {};   // giá trị đang nhập theo từng calculator
  const fmt = (v, d) => v.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d });
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const group = (list) => list.reduce((o, c) => ((o[c.group] = o[c.group] || []).push(c), o), {});

  function navItem(c, cur) {
    const f = favs.includes(c.id);
    return `<div class="nav ${c.id === cur ? 'on' : ''}"><a href="#${c.id}">${c.name}</a><button class="${f ? 'fav' : ''}" data-fav="${c.id}" aria-label="Yêu thích">${f ? '★' : '☆'}</button></div>`;
  }
  function renderNav(cur) {
    const q = norm($('#q').value.trim());
    const list = CALCS.filter(c => !q || norm(c.name + ' ' + c.keys + ' ' + c.group).includes(q));
    let h = '';
    const fl = list.filter(c => favs.includes(c.id));
    if (fl.length) h += '<h3>★ Yêu thích</h3>' + fl.map(c => navItem(c, cur)).join('');
    const rl = recent.map(id => list.find(c => c.id === id)).filter(Boolean).slice(0, 4);
    if (rl.length && !q) h += '<h3>Đã dùng gần đây</h3>' + rl.map(c => navItem(c, cur)).join('');
    const g = group(list);
    for (const k in g) h += `<h3>${k}</h3>` + g[k].map(c => navItem(c, cur)).join('');
    $('#nav').innerHTML = h || '<p>Không tìm thấy calculator.</p>';
  }

  function home() {
    $('#main').innerHTML = `<h2 class="title">Tính nhanh khối lượng thép và chi tiết gia công</h2>
      <p>Chọn một calculator ở thanh bên hoặc bên dưới. Kết quả cập nhật ngay khi bạn nhập.</p>
      <div class="cards">${CALCS.map(c => `<a href="#${c.id}"><b>${c.name}</b><br><small>${c.group}</small></a>`).join('')}</div>`;
  }

  function calcPage(c) {
    const s = state[c.id] = state[c.id] || Object.assign({ mat: 'carbon', custom: 7850 }, ...c.fields.map(f => ({ [f.k]: f.def })));
    recent = [c.id, ...recent.filter(x => x !== c.id)].slice(0, 6); store.set('recent', recent);
    const inp = (f) => `<div class="row"><label for="f_${f.k}">${f.label}</label><input id="f_${f.k}" data-k="${f.k}" type="number" step="any" min="0" inputmode="decimal" value="${s[f.k]}"><span class="u">${f.unit}</span></div>`;
    $('#main').innerHTML = `<h2 class="title">Tính khối lượng: ${c.name}</h2><div class="grid">
      <div class="card"><h2>Nhập thông số</h2><div class="draw">${c.svg}</div>${c.fields.map(inp).join('')}
        <div class="row"><label for="mat">Vật liệu</label><select id="mat">${MATERIALS.map(m => `<option value="${m.id}" ${m.id === s.mat ? 'selected' : ''}>${m.name}${m.rho ? ' – ' + m.rho + ' kg/m³' : ''}</option>`).join('')}</select><span></span></div>
        <div class="row" id="customRow" ${s.mat === 'custom' ? '' : 'hidden'}><label for="rho">Khối lượng riêng ρ</label><input id="rho" type="number" step="any" min="0" value="${s.custom}"><span class="u">kg/m³</span></div>
        <div class="actions"><button class="btn primary" id="go">TÍNH TOÁN</button></div></div>
      <div class="card" id="out"></div></div>
      <details><summary>Công thức và giải thích</summary><p>${c.formula}</p><p><small>Tham khảo: ${c.ref}</small></p></details>`;
    const run = () => {
      const v = { rho: s.mat === 'custom' ? +s.custom : MATERIALS.find(m => m.id === s.mat).rho };
      const errs = [];
      c.fields.forEach(f => {
        const raw = s[f.k];
        if (f.opt && raw === '') { v[f.k] = ''; return; }
        v[f.k] = +raw;
        if (f.opt ? v[f.k] < 0 : !(v[f.k] > 0)) errs.push(`${f.label.split(' (')[0]} phải lớn hơn 0.`);
      });
      if (!(v.rho > 0)) errs.push('Khối lượng riêng phải lớn hơn 0.');
      if (!errs.length && c.check) { const m = c.check(v); if (m) errs.push(m); }
      if (errs.length) { last = null; $('#out').innerHTML = `<h2>Kết quả</h2>${errs.map(e => `<div class="err">${e}</div>`).join('')}`; return; }
      const r = c.calc(v); last = { c, r, v };
      $('#out').innerHTML = `<h2>Kết quả</h2>${r.items.map(i => `<div class="res ${i.big ? 'big' : ''}"><span>${i.label}</span><b>${fmt(i.v, i.d)} ${i.u}</b></div>`).join('')}
        <div class="actions"><button class="btn" id="add">+ Thêm vào bảng vật tư</button><button class="btn" onclick="print()">In</button></div>`;
      $('#add').onclick = () => { bom.push({ type: c.name.split(' (')[0], size: r.bom.size, len: r.bom.len, qty: r.bom.qty, kgPc: r.bom.kgPc }); saveBom(); $('#add').textContent = 'Đã thêm ✓'; };
    };
    $('#main').oninput = (e) => {
      if (e.target.dataset.k) s[e.target.dataset.k] = e.target.value;
      else if (e.target.id === 'mat') { s.mat = e.target.value; $('#customRow').hidden = s.mat !== 'custom'; }
      else if (e.target.id === 'rho') s.custom = e.target.value;
      run();
    };
    $('#go').onclick = run; run();
  }

  function saveBom() { store.set('bom', bom); $('#bomCount').textContent = bom.length ? `(${bom.length})` : ''; }
  function bomPage() {
    const tot = bom.reduce((a, r) => a + r.kgPc * r.qty, 0);
    $('#main').innerHTML = `<h2 class="title">Bảng tính vật tư</h2><div class="card">${bom.length ? `<table><tr><th>STT</th><th>Loại</th><th>Kích thước</th><th class="n">Dài (m)</th><th>SL</th><th class="n">kg/pcs</th><th class="n">Tổng kg</th><th></th></tr>
      ${bom.map((r, i) => `<tr><td>${i + 1}</td><td>${r.type}</td><td>${r.size}</td><td class="n">${fmt(r.len, 2)}</td><td><input type="number" min="0" step="any" value="${r.qty}" data-q="${i}"></td><td class="n">${fmt(r.kgPc, 2)}</td><td class="n">${fmt(r.kgPc * r.qty, 2)}</td><td><button class="btn" data-dup="${i}">Nhân đôi</button> <button class="btn" data-del="${i}">Xóa</button></td></tr>`).join('')}
      <tr><th colspan="6">TỔNG KHỐI LƯỢNG</th><th class="n">${fmt(tot, 2)} kg</th><th>${fmt(tot / 1000, 3)} tấn</th></tr></table>
      <div class="actions"><button class="btn" id="csv">Xuất Excel (CSV)</button><button class="btn" onclick="print()">In</button><button class="btn" id="clr">Xóa tất cả</button></div>` : '<p>Chưa có dòng nào. Mở một calculator và bấm "Thêm vào bảng vật tư".</p>'}</div>`;
    const m = $('#main');
    m.onclick = (e) => {
      const d = e.target.dataset;
      if (d.del) bom.splice(+d.del, 1); else if (d.dup) bom.splice(+d.dup + 1, 0, { ...bom[+d.dup] });
      else if (e.target.id === 'clr') { if (!confirm('Xóa toàn bộ bảng vật tư?')) return; bom = []; }
      else if (e.target.id === 'csv') return exportCsv(); else return;
      saveBom(); bomPage();
    };
    m.onchange = (e) => { if (e.target.dataset.q !== undefined) { bom[+e.target.dataset.q].qty = Math.max(0, +e.target.value); saveBom(); bomPage(); } };
  }
  function exportCsv() {
    const rows = [['STT', 'Loai', 'Kich thuoc', 'Dai (m)', 'SL', 'kg/pcs', 'Tong kg']].concat(bom.map((r, i) => [i + 1, r.type, r.size, r.len, r.qty, r.kgPc.toFixed(3), (r.kgPc * r.qty).toFixed(2)]));
    rows.push(['', '', '', '', '', 'TONG', bom.reduce((a, r) => a + r.kgPc * r.qty, 0).toFixed(2)]);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.join(';')).join('\n')], { type: 'text/csv' }));
    a.download = 'bang-vat-tu.csv'; a.click();
  }
  function testsPage() {
    const r = runTests();
    $('#main').innerHTML = `<h2 class="title">Kết quả kiểm thử</h2><div class="card"><table><tr><th>Calculator</th><th>Đầu vào</th><th class="n">Kỳ vọng</th><th class="n">Thực tế</th><th>Trạng thái</th></tr>
      ${r.map(x => `<tr><td>${x.n}</td><td>${x.i}</td><td class="n">${fmt(x.e, 4)}</td><td class="n">${fmt(x.a, 4)}</td><td class="${x.ok ? 'pass' : 'fail'}">${x.ok ? 'PASS' : 'FAIL'}</td></tr>`).join('')}</table></div>`;
  }

  function route() {
    const id = location.hash.slice(1), c = CALCS.find(x => x.id === id);
    $('#main').oninput = $('#main').onclick = $('#main').onchange = null;
    if (c) calcPage(c); else if (id === 'bom') bomPage(); else if (id === 'tests') testsPage(); else home();
    renderNav(c ? c.id : ''); $('#side').classList.remove('open'); scrollTo(0, 0);
  }
  $('#nav').onclick = (e) => { const id = e.target.dataset.fav; if (!id) return;
    favs = favs.includes(id) ? favs.filter(x => x !== id) : [id, ...favs]; store.set('fav', favs); renderNav(location.hash.slice(1)); };
  $('#q').oninput = () => renderNav(location.hash.slice(1));
  $('#menuBtn').onclick = () => $('#side').classList.toggle('open');
  addEventListener('hashchange', route); saveBom(); route();
})();
