const form = document.getElementById('searchForm');
const queryInput = document.getElementById('queryInput');
const areaSelect = document.getElementById('areaSelect');
const sortSelect = document.getElementById('sortSelect');
const promoOnly = document.getElementById('promoOnly');
const resultsEl = document.getElementById('results');
const statsGrid = document.getElementById('statsGrid');
const emptyState = document.getElementById('emptyState');
const seedBtn = document.getElementById('seedBtn');

const stores = ['Walmart', 'Best Buy', 'Canadian Tire', 'Costco', 'Amazon', 'Pharmaprix'];
const areas = ['Ottawa', 'Orléans', 'Kanata', 'Gatineau'];

function hashCode(str){ return [...str].reduce((a,c)=>((a<<5)-a)+c.charCodeAt(0),0); }
function money(v){ return `${Number(v).toFixed(2)} CAD`; }

function generateDeals(query, area){
  const seed = Math.abs(hashCode(query + area));
  return stores.map((store, i) => {
    const base = ((seed % 90) + 10 + i * 3);
    const promo = (seed + i) % 3 !== 0;
    const discount = promo ? [10,15,20,25,30][(seed + i) % 5] : 0;
    const oldPrice = base + ((seed + i) % 20);
    const price = promo ? (oldPrice * (100 - discount) / 100) : base;
    const localArea = areas[(seed + i) % areas.length];
    return {
      store,
      title: `${query.charAt(0).toUpperCase() + query.slice(1)} — ${store}`,
      area: localArea,
      price: price.toFixed(2),
      oldPrice: promo ? oldPrice.toFixed(2) : null,
      promo,
      discount,
      note: promo ? `Promo repérée • économie de ${discount}%` : 'Prix standard détecté',
      link: '#'
    };
  }).filter(d => area === 'Ottawa' ? true : d.area === area);
}

function renderStats(deals){
  if(!deals.length){ statsGrid.innerHTML = ''; return; }
  const promoCount = deals.filter(d => d.promo).length;
  const lowest = Math.min(...deals.map(d => Number(d.price)));
  const avg = deals.reduce((a,b)=>a+Number(b.price),0)/deals.length;
  const best = deals.find(d => Number(d.price) === lowest);
  statsGrid.innerHTML = `
    <div class="stat"><div class="label">Résultats</div><div class="value">${deals.length}</div></div>
    <div class="stat"><div class="label">Promos</div><div class="value">${promoCount}</div></div>
    <div class="stat"><div class="label">Meilleur prix</div><div class="value">${money(lowest)}</div></div>
    <div class="stat"><div class="label">Meilleur magasin</div><div class="value">${best?.store || '—'}</div></div>`;
}

function renderDeals(deals){
  emptyState.style.display = deals.length ? 'none' : 'block';
  resultsEl.innerHTML = deals.map(d => `
    <div class="deal">
      <div>
        <div class="deal-title">${d.title}</div>
        <div class="deal-sub">${d.note}</div>
      </div>
      <div><div class="store">${d.store}</div><div class="deal-sub">${d.area}</div></div>
      <div><span class="pill ${d.promo ? 'promo' : 'normal'}">${d.promo ? 'PROMO' : 'STANDARD'}</span></div>
      <div>
        <div class="price">${money(d.price)}</div>
        ${d.oldPrice ? `<div class="old-price">${money(d.oldPrice)}</div><div class="save">-${d.discount}%</div>` : ''}
      </div>
      <div><a href="${d.link}">Voir</a></div>
    </div>`).join('');
}

function runSearch(query){
  let deals = generateDeals(query, areaSelect.value);
  if(promoOnly.checked) deals = deals.filter(d => d.promo);
  if(sortSelect.value === 'price') deals.sort((a,b) => Number(a.price) - Number(b.price));
  else if(sortSelect.value === 'store') deals.sort((a,b) => a.store.localeCompare(b.store));
  else deals.sort((a,b) => (b.discount||0) - (a.discount||0) || Number(a.price)-Number(b.price));
  renderStats(deals);
  renderDeals(deals);
}

form.addEventListener('submit', e => { e.preventDefault(); runSearch(queryInput.value.trim()); });
seedBtn.addEventListener('click', () => { queryInput.value = 'lait'; runSearch('lait'); });
