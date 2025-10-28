// ===== 道路損傷マップ（index.html用） =====

// 選択された損傷があればその位置を中心に、それ以外は相模原市中心
const selectedDamage = JSON.parse(localStorage.getItem("selectedDamage") || 'null');
const mapCenter = selectedDamage ? [selectedDamage.lat, selectedDamage.lng] : [35.5732, 139.3704];

// ===== Leaflet マップ初期化 =====
const map = L.map('map').setView(mapCenter, 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// ===== マーカー管理 =====
let markers = {};
const monthFilter = document.getElementById("month-filter");
const severityFilter = document.getElementById("severity-filter");
const typeFilter = document.getElementById("type-filter");

// ===== フィルター選択肢自動生成（年月を整形・降順ソート） =====
const monthOptions = [...new Set(damages.map(d => d.date.substr(0,7)))]
  .sort((a,b) => a < b ? 1 : a > b ? -1 : 0);
monthOptions.forEach(m => { 
  const [year, month] = m.split('-');
  const formatted = `${year}年${parseInt(month,10)}月`;
  const o = document.createElement('option');
  o.value = m;
  o.textContent = formatted;
  monthFilter.appendChild(o); 
});
[...new Set(damages.map(d => d.severity))].forEach(s => {
  const o = document.createElement('option');
  o.textContent = s;
  severityFilter.appendChild(o);
});
[...new Set(damages.map(d => d.type))].forEach(t => {
  const o = document.createElement('option');
  o.textContent = t;
  typeFilter.appendChild(o);
});

// ===== マーカーを更新する関数 =====
function updateMarkers() {
  // 既存マーカーを削除
  Object.values(markers).forEach(m => map.removeLayer(m));
  markers = {};

  const month = monthFilter.value;
  const severity = severityFilter.value;
  const type = typeFilter.value;

  // フィルターに一致する損傷のみ表示
  damages.filter(d =>
    (month === '全て' || d.date.substr(0,7) === month) &&
    (severity === '全て' || d.severity === severity) &&
    (type === '全て' || d.type === type)
  ).forEach(d => {
    const color = d.severity === '高度' ? '#ef4444' : d.severity === '中度' ? '#f59e0b' : '#10b981';
    const marker = L.circleMarker([d.lat, d.lng], {
      radius: 8,
      color,
      fillColor: color,
      fillOpacity: 0.8,
      weight: 2
    }).addTo(map);
    marker.bindPopup(`<b>${d.type}</b><br>損傷度: ${d.severity}<br>日付: ${d.date}<br>
      <button onclick="selectDamage(${d.id})">詳細を見る</button>`);
    markers[d.id] = marker;
  });
}

// ===== 詳細ページへ遷移 =====
function selectDamage(id) {
  const d = damages.find(x => x.id === id);
  if (d) {
    localStorage.setItem("selectedDamage", JSON.stringify(d));
    window.location.href = "search.html";
  }
}

// ===== フィルター変更イベント =====
[monthFilter, severityFilter, typeFilter].forEach(el => {
  el.addEventListener("change", () => {
    localStorage.setItem("filterMonth", monthFilter.value);
    localStorage.setItem("filterSeverity", severityFilter.value);
    localStorage.setItem("filterType", typeFilter.value);
    updateMarkers();
  });
});

// ===== 保存されたフィルターを復元 =====
if(localStorage.getItem("filterMonth")) monthFilter.value = localStorage.getItem("filterMonth");
if(localStorage.getItem("filterSeverity")) severityFilter.value = localStorage.getItem("filterSeverity");
if(localStorage.getItem("filterType")) typeFilter.value = localStorage.getItem("filterType");

// ===== 初期マーカー表示 =====
updateMarkers();

// ===== サイドバー折りたたみ =====
const sidebar = document.getElementById("sidebar");
const toggle = document.getElementById("toggleSidebar");
// 保存されたサイドバー状態を復元
if (localStorage.getItem('sidebarCollapsed') === '1') {
  sidebar.classList.add('sidebar-collapsed');
  document.querySelectorAll('.sidebar-text').forEach(e => e.classList.add('hidden-text'));
}
toggle.addEventListener("click", () => {
  const collapsed = sidebar.classList.toggle("sidebar-collapsed");
  document.querySelectorAll(".sidebar-text").forEach(e => e.classList.toggle("hidden-text"));
  localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
});
