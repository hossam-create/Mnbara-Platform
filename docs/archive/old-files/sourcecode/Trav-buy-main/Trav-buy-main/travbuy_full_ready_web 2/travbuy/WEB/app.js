const i18n = {
  ar: {
    'nav.home':'الرئيسية','nav.privacy':'الخصوصية','nav.terms':'الشروط',
    'hero.title':'منصّة TravBuy — اشترِ بضاعة مستوردة «بصحبة راكب»',
    'hero.subtitle':'جرّب تجربة تشبه Amazon/eBay مع لمسات Grabr: طلبات ذكية، هوية رقمية للمسافر، ومزاد على المنتجات الفريدة.',
    'cta.getStarted':'ابدأ الآن','cta.explore':'استعرض المنتجات',
    'feature.auctionTitle':'مزادات ذكية','feature.auctionBody':'اضبط ميقات المزاد بما يناسب البائع والمشتري، مع تنبيهات فورية.',
    'feature.identityTitle':'هوية رقمية للمسافر','feature.identityBody':'تحقق من جواز السفر/الهوية لتأمين المجتمع ورفع الثقة.',
    'feature.safetyTitle':'أمان ودفع محلي/دولي','feature.safetyBody':'طبقات أمان وسياسات واضحة لحماية التعاملات.',
    'mock.title':'عينات منتجات',
    'consent.title':'سياسة الخصوصية واستخدام البيانات',
    'consent.body':'نستخدم بيانات الاستخدام وملفات تعريف الارتباط لتحسين التجربة. بالمتابعة، فإنك توافق على الشروط.',
    'consent.readMore':'اطّلع على التفاصيل', 'consent.accept':'موافق'
  },
  en: {
    'nav.home':'Home','nav.privacy':'Privacy','nav.terms':'Terms',
    'hero.title':'TravBuy — Shop “With Traveler” imports',
    'hero.subtitle':'Enjoy an Amazon/eBay-like experience with Grabr touches: smart requests, traveler digital ID, and auctions for unique items.',
    'cta.getStarted':'Get Started','cta.explore':'Browse Products',
    'feature.auctionTitle':'Smart Auctions','feature.auctionBody':'Schedule auctions that fit buyers & sellers with instant alerts.',
    'feature.identityTitle':'Traveler Digital Identity','feature.identityBody':'Verify passport/ID to secure the community and boost trust.',
    'feature.safetyTitle':'Security & Local/Global Payments','feature.safetyBody':'Security layers and clear policies protect your transactions.',
    'mock.title':'Sample Products',
    'consent.title':'Privacy & Data Usage',
    'consent.body':'We use usage data and cookies to improve your experience. By continuing you agree to the policy.',
    'consent.readMore':'Read details','consent.accept':'Accept'
  }
};

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];

let lang = localStorage.getItem('lang') || 'ar';
function applyI18n(){
  $$('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    el.textContent = i18n[lang][key] || el.textContent;
  });
  document.documentElement.lang = lang;
  document.documentElement.dir = (lang==='ar'?'rtl':'ltr');
  $('#langToggle').textContent = (lang==='ar'?'EN':'ع');
}

$('#langToggle')?.addEventListener('click', ()=>{
  lang = (lang==='ar'?'en':'ar');
  localStorage.setItem('lang', lang);
  applyI18n();
});

// Consent
const consentKey='travbuy-consent';
window.addEventListener('DOMContentLoaded', async ()=>{
  $('#year').textContent = new Date().getFullYear();
  if(!localStorage.getItem(consentKey)){
    $('#consent').classList.remove('hidden');
  }
  $('#acceptBtn')?.addEventListener('click', ()=>{
    localStorage.setItem(consentKey,'1');
    $('#consent').classList.add('hidden');
  });

  // Load mock products
  const res = await fetch('./DATA/mock/products.json');
  const products = await res.json();
  const wrap = $('#products');
  products.forEach(p=>{
    const card = document.createElement('div');
    card.className='product';
    card.innerHTML = `<span class="badge">${p.category}</span>
      <h4>${p.title}</h4>
      <div>${p.price} ${p.currency}</div>`;
    wrap.appendChild(card);
  });

  applyI18n();
});
