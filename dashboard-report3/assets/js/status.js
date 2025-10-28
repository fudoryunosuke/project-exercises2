// 対応状況管理（ローカルストレージに上書き保存）
(function(){
  const root = document.getElementById('status-root');
  if(!root) return;

  // ステータス候補
  const STATUS_OPTIONS = [
    { value: 'pending', label: '未対応', badge: 'bg-gray-100 text-gray-800 border-gray-200' },
    { value: 'in-progress', label: '対応中', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'completed', label: '対応完了', badge: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'cancelled', label: '対応不要', badge: 'bg-red-100 text-red-800 border-red-200' },
  ];

  // 永続化対象を取得（localStorageの上書きがあればそれを使う）
  const SAVED_KEY = 'damagesStatusOverrides';
  const overrides = JSON.parse(localStorage.getItem(SAVED_KEY) || '{}');
  const merged = damages.map(d => ({ ...d, ...(overrides[d.id] || {}) }));

  function saveOverride(id, payload){
    const next = { ...JSON.parse(localStorage.getItem(SAVED_KEY) || '{}') };
    next[id] = { ...(next[id]||{}), ...payload };
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  }

  function h(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }

  // ステータス順でグルーピング表示（未対応→対応中→完了→不要）
  const order = { 'pending': 0, 'in-progress': 1, 'completed': 2, 'cancelled': 3 };
  merged.sort((a,b) => (order[a.status]||99) - (order[b.status]||99));

  merged.forEach(d => {
    const leftBorder = d.status === 'completed' ? 'border-l-4 border-l-green-400' : d.status === 'in-progress' ? 'border-l-4 border-l-blue-400' : d.status === 'cancelled' ? 'border-l-4 border-l-red-400' : 'border-l-4 border-l-gray-300';
    const card = h(`<div class="bg-white rounded-lg p-5 border border-gray-200 ${leftBorder}"></div>`);

    // ヘッダー
    card.appendChild(h(`
      <div class="flex items-center justify-between mb-3">
        <div class="font-semibold text-gray-900">#${d.id} ${d.type}（${d.severity}）</div>
        <span class="px-2 py-1 text-xs rounded-full border ${STATUS_OPTIONS.find(o=>o.value===d.status)?.badge||'bg-gray-100 text-gray-800 border-gray-200'}">${STATUS_OPTIONS.find(o=>o.value===d.status)?.label||'未対応'}</span>
      </div>
    `));

    // 本文
    const body = h(`<div class="space-y-3"></div>`);
    body.appendChild(h(`<div class="text-sm text-gray-600">発見日: ${d.date} / パトロール班: ${d.patrolTeam||''}</div>`));

    // ステータス選択（視認性の高いボタン群）
    const statusRow = h(`<div class="grid grid-cols-2 gap-3"></div>`);
    let current = d.status;
    const buttons = STATUS_OPTIONS.map(o => {
      const b = h(`<button type="button" class="flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all"></button>`);
      b.textContent = o.label;
      const setActive = (active)=>{
        b.className = `flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${active ? `${o.badge.replace('bg-','bg-').replace('text-','text-')} border-current` : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'}`;
      };
      setActive(o.value === current);
      b.addEventListener('click', () => {
        current = o.value;
        buttons.forEach(btn => btn.__setActive(false));
        b.__setActive(true);
        // completedのみ日付入力可
        if (current === 'completed') dateInput.removeAttribute('disabled'); else { dateInput.setAttribute('disabled',''); dateInput.value = ''; }
      });
      b.__setActive = setActive;
      statusRow.appendChild(b);
      return b;
    });
    body.appendChild(statusRow);

    // 完了日の入力（completedのみ有効）
    const dateRow = h(`<div class="mt-2"></div>`);
    const dateInput = h(`<input type="date" class="w-full bg-white border border-gray-300 rounded-md px-3 py-2" value="${d.responseDate||''}" ${d.status==='completed'?'':'disabled'}>`);
    dateRow.appendChild(dateInput);
    body.appendChild(dateRow);

    // 対応詳細
    const detailsRow = h(`<div class="mt-2"></div>`);
    const ta = h(`<textarea rows="3" class="w-full bg-white border border-gray-300 rounded-md px-3 py-2" placeholder="対応内容や特記事項">${d.responseDetails||''}</textarea>`);
    detailsRow.appendChild(ta);
    body.appendChild(detailsRow);

    // 保存ボタン
    const actions = h(`<div class="pt-3 flex justify-between items-center gap-3"></div>`);
    const meta = h(`<div class="text-xs text-gray-500">ID: ${d.id} / ${d.type} / ${d.severity}</div>`);
    const saveBtn = h(`<button class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">保存</button>`);
    actions.appendChild(meta);
    actions.appendChild(saveBtn);
    body.appendChild(actions);

    // 変更ハンドラ
    saveBtn.addEventListener('click', () => {
      const payload = {
        status: current,
        responseDate: current === 'completed' ? dateInput.value : '',
        responseDetails: ta.value
      };
      saveOverride(d.id, payload);
      // バッジ更新
      const badge = card.querySelector('span');
      const opt = STATUS_OPTIONS.find(o=>o.value===payload.status);
      badge.className = `px-2 py-1 text-xs rounded-full border ${opt?.badge||'bg-gray-100 text-gray-800 border-gray-200'}`;
      badge.textContent = opt?.label || '未対応';
    });

    card.appendChild(body);
    root.appendChild(card);
  });

  // サイドバー折りたたみ保存/復元
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('toggleSidebar');
  if (localStorage.getItem('sidebarCollapsed') === '1') {
    sidebar.classList.add('sidebar-collapsed');
    document.querySelectorAll('.sidebar-text').forEach(e => e.classList.add('hidden-text'));
  }
  toggle.addEventListener('click', () => {
    const collapsed = sidebar.classList.toggle('sidebar-collapsed');
    document.querySelectorAll('.sidebar-text').forEach(e => e.classList.toggle('hidden-text'));
    localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
  });
})();


