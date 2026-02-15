
async function loadProducts(){
  try{
    const res = await fetch('DATA/mock/products.json');
    const data = await res.json();
    const grid = document.getElementById('mock-products');
    if(!grid) return;
    grid.innerHTML = data.products.map(p => `
      <article class="card">
        <img src="${p.image}" alt="${p.title}">
        <h3>${p.title}</h3>
        <p>${p.country} • ${p.price} ${p.currency}</p>
      </article>
    `).join('');
  }catch(e){ console.error(e); }
}
function consentFlow(){
  const modal = document.getElementById('consent-modal');
  if(!modal) return;
  const accepted = localStorage.getItem('consentAccepted') === '1';
  if(!accepted){ modal.classList.remove('hidden'); }
  const acc = document.getElementById('acceptBtn');
  const deny = document.getElementById('denyBtn');
  if(acc) acc.onclick = () => {
    if(document.getElementById('acceptTerms').checked){
      localStorage.setItem('consentAccepted','1');
      modal.classList.add('hidden');
    } else {
      alert('يرجى الموافقة أولاً');
    }
  };
  if(deny) deny.onclick = () => { window.location.href = 'legal/ar/privacy.html'; };
}
document.addEventListener('DOMContentLoaded', ()=>{ loadProducts(); consentFlow(); });
