const form = document.getElementById('searchForm');
const queryInput = document.getElementById('queryInput');
const areaSelect = document.getElementById('areaSelect');
const sortSelect = document.getElementById('sortSelect');
const promoOnly = document.getElementById('promoOnly');
const resultsEl = document.getElementById('results');
const statsGrid = document.getElementById('statsGrid');
const emptyState = document.getElementById('emptyState');
const seedBtn = document.getElementById('seedBtn');

function money(v){ return `${Number(v).toFixed(2)} CAD`; }

function renderStats(deals){
  if(!deals.length){ statsGrid.innerHTML = ''; return; }
  const promoCount = deals.filter(d => d.promo).length;
  const lowest = Math.min(...deals.map(d => Number(d.price)));
  const avg = deals.reduce((a,b)=>a+Number(b.price),0)/deals.length;
  const best = deals.find(d => Number(d.price) === lowest);
  statsGrid.innerHTML = `
    <div class="stat"><div class="label">Résultats</div><div class="value">${deals.length}</div></div>
    <div class="stat"><div class="label">Promos réelles</div><div class="value">${promoCount}</div></div>
    <div class="stat"><div class="label">Meilleur prix</div><div class="value">${money(lowest)}</div></div>
    <div class="stat"><div class="label">Source</div><div class="value">Walmart</div></div>`;
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
        ${d.oldPrice ? `<div class="old-price">${money(d.oldPrice)}</div><div class="save">-${d.discountText}</div>` : ''}
      </div>
      <div><a href="${d.link}" target="_blank">Voir</a></div>
    </div>`).join('');
}

async function fetchWalmartDeals(query){
  const url = `https://r.jina.ai/http://https://www.walmart.ca/en/search?q=${encodeURIComponent(query + ' ottawa')}`;
  const text = await fetch(url).then(r => r.text());
  const lines = text.split('\n');
  const deals = [];
  for(let i=0;i<lines.length;i++){
    const line = lines[i].trim();
    const linkMatch = line.match(/^\[(.+?)\]\((https:\/\/www\.walmart\.ca\/en\/ip\/[^)]+)\)$/);
    if(!linkMatch) continue;
    const title = linkMatch[1].trim();
    const link = linkMatch[2];
    const block = lines.slice(i, i+22).join(' ');
    const nowMatch = block.match(/Now \$(\d+[.]\d{2}).*?Was \$(\d+[.]\d{2})/i);
    const currentMatch = block.match(/current price(?: Now)? \$(\d+[.]\d{2})/i) || block.match(/\$(\d+[.]\d{2})/);
    if(!currentMatch) continue;
    const price = parseFloat(currentMatch[1]);
    let oldPrice = null, promo = false, discountText = '';
    if(nowMatch){
      promo = true;
      oldPrice = parseFloat(nowMatch[2]);
      const pct = Math.round((1 - price/oldPrice) * 100);
      discountText = `${pct}%`;
    } else if(/rollback|save with|you save/i.test(block)) {
      promo = true;
      discountText = 'deal';
    }
    deals.push({
      title,
      store:'Walmart',
      area:areaSelect.value,
      price,
      oldPrice,
      promo,
      discountText,
      note: promo ? 'Promo réelle détectée sur la source Walmart' : 'Résultat réel Walmart',
      link
    });
    if(deals.length >= 12) break;
  }
  return deals;
}

async function runSearch(query){
  resultsEl.innerHTML = '<div class="empty">Recherche réelle en cours…</div>';
  statsGrid.innerHTML = '';
  try {
    let deals = await fetchWalmartDeals(query);
    if(promoOnly.checked) deals = deals.filter(d => d.promo);
    if(sortSelect.value === 'price') deals.sort((a,b) => Number(a.price) - Number(b.price));
    else if(sortSelect.value === 'store') deals.sort((a,b) => a.store.localeCompare(b.store));
    else deals.sort((a,b) => Number(!!b.promo) - Number(!!a.promo) || Number(a.price)-Number(b.price));
    renderStats(deals);
    renderDeals(deals);
    if(!deals.length){
      emptyState.textContent = 'Aucun résultat fiable trouvé pour cette recherche.';
    }
  } catch (e) {
    emptyState.style.display = 'block';
    emptyState.textContent = 'Échec de la recherche réelle pour le moment.';
    resultsEl.innerHTML = '';
  }
}

form.addEventListener('submit', e => { e.preventDefault(); runSearch(queryInput.value.trim()); });
seedBtn.addEventListener('click', () => { queryInput.value = 'lait'; runSearch('lait'); });
