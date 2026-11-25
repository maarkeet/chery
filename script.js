/* Public contact options are loaded from Supabase. */
const normalizeWhatsApp = value => {
  const digits=String(value||"").replace(/\D/g,"");
  return digits.startsWith("0")?`20${digits.slice(1)}`:digits;
};
const CONFIG = {
  whatsapp:normalizeWhatsApp(window.STORE_SETTINGS?.display?.whatsapp||"201224906360"),
  phoneShown:String(window.STORE_SETTINGS?.display?.phone||"01224906360"),
  currency:"ج.م", perPage:24
};

/* أيقونات مرسومة SVG (بدل الإيموجي) */
const IC = {
  bottle:'<rect x="21" y="24" width="22" height="32" rx="7"/><path d="M24 24v-5h16v5M28 19c0-6 8-6 8 0M21 36h22M21 44h22"/>',
  onesie:'<path d="M20 10l-12 8 6 9 6-3v26h24V24l6 3 6-9-12-8c-2 6-14 6-18 0z"/><circle cx="32" cy="46" r="2"/>',
  dress:'<path d="M24 8h16l-3 14 12 34H15l12-34z"/><path d="M26 22h12"/>',
  drop:'<path d="M32 8c10 14 16 22 16 31a16 16 0 0 1-32 0c0-9 6-17 16-31z"/><path d="M24 40a8 8 0 0 0 7 7"/>',
  diaper:'<path d="M8 18h48v12c0 14-10 24-24 24S8 44 8 30z"/><path d="M8 26h10M46 26h10M26 36l6 6 6-6"/>',
  bear:'<circle cx="14" cy="16" r="7"/><circle cx="50" cy="16" r="7"/><circle cx="32" cy="34" r="22"/><circle cx="24" cy="30" r="2"/><circle cx="40" cy="30" r="2"/><ellipse cx="32" cy="42" rx="7" ry="5"/>',
  bag:'<path d="M10 22h44l-4 34H14z"/><path d="M22 22v-4a10 10 0 0 1 20 0v4"/>',
  heart:'<path d="M32 54C10 38 6 28 6 20a12 12 0 0 1 26-3 12 12 0 0 1 26 3c0 8-4 18-26 34z"/>',
  tee:'<path d="M20 8l-14 8 6 12 8-4v28h24V24l8 4 6-12-14-8c-3 7-15 7-18 0z"/>',
  jeans:'<path d="M16 6h32l4 52H36L32 26l-4 32H12z"/><path d="M16 14h32"/>'
};
const DEFAULT_CATS = {
  "ملابس الماميز":      {ic:"dress",  c:"#ffc2dd", pat:"dots",  rot:"-8deg"},
  "ملابس الأطفال":      {ic:"onesie", c:"#bfe3ff", pat:"stripe",rot:"6deg"},
  "الرضاعة والتغذية":   {ic:"bottle", c:"#ffe58a", pat:"dots",  rot:"-5deg"},
  "العناية والاستحمام": {ic:"drop",   c:"#b7f0dc", pat:"plus",  rot:"5deg"},
  "مناديل وفوط":        {ic:"heart",  c:"#dccfff", pat:"stripe",rot:"-6deg"},
  "حفاضات":             {ic:"diaper", c:"#ffd0b8", pat:"dots",  rot:"4deg"},
  "مستلزمات وعربيات":   {ic:"bag",    c:"#bfe3ff", pat:"plus",  rot:"-4deg"},
  "ألعاب وتسلية":       {ic:"bear",   c:"#ffc2dd", pat:"stripe",rot:"7deg"},
  "إكسسوارات":          {ic:"heart",  c:"#ffe58a", pat:"plus",  rot:"-7deg"}
};
const CATEGORY_STYLES = Object.values(DEFAULT_CATS);
const CATEGORY_NAMES = Array.isArray(window.STORE_CATEGORY_NAMES)
  ? [...new Set(window.STORE_CATEGORY_NAMES)]
  : Object.keys(DEFAULT_CATS);
const CATS = Object.fromEntries(CATEGORY_NAMES.map((name,index)=>[
  name,
  DEFAULT_CATS[name] || CATEGORY_STYLES[index % CATEGORY_STYLES.length]
]));
const PAT = {
  dots:"radial-gradient(rgba(28,42,115,.22) 2px,transparent 2.4px) 0 0/18px 18px",
  stripe:"repeating-linear-gradient(135deg,rgba(255,255,255,.55) 0 8px,transparent 8px 20px)",
  plus:"radial-gradient(circle at 50% 50%,rgba(255,255,255,.7) 3px,transparent 3.5px) 0 0/22px 22px"
};
const KEYS = [[/ببرون|سكات|حلم|رضاع|اكالة|أكالة/,"bottle"],[/شياله|شنط/,"bag"],[/^بنطلون|جينز/,"jeans"],[/فستان|Dress/i,"dress"],[/بامبرز|حفاض/,"diaper"],[/شامبو|زيت|كريم|لوشن|صابون|شاور|كولونيا/,"drop"],[/عروسه|دب|قرد|كلب|شخليل/,"bear"],[/تيشرت|توب|بلوزه|Blouse/i,"tee"],[/شنط/,"bag"]];
const svg = n => `<svg viewBox="0 0 64 64">${IC[n]}</svg>`;
const iconOf = p => { for(const [r,i] of KEYS) if(r.test(p.name)) return i; return CATS[p.cat]?.ic||"heart"; };
const money = n => Number(n).toLocaleString("ar-EG");
const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const normalizeSearch = value => String(value||"")
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[\u064B-\u0652\u0670]/g,"")
  .replace(/[أإآٱ]/g,"ا")
  .replace(/ى/g,"ي")
  .replace(/ؤ/g,"و")
  .replace(/ئ/g,"ي")
  .replace(/ة/g,"ه")
  .replace(/ـ/g,"")
  .replace(/[^\p{L}\p{N}]+/gu," ")
  .trim();

let favs=[];try{favs=JSON.parse(localStorage.getItem("cm_fav")||"[]")}catch(e){}
const state = {cat:"الكل", q:"", sort:"def", max:0, shown:CONFIG.perPage, chosen:{}, variants:{}};
let cart=[]; try{cart=JSON.parse(localStorage.getItem("cm_cart_v2")||"[]").filter(item=>PRODUCTS.some(p=>p.id===Number(item.id)))}catch(e){}
const save=()=>{try{localStorage.setItem("cm_cart_v2",JSON.stringify(cart))}catch(e){}};
const counts={}; PRODUCTS.forEach(p=>counts[p.cat]=(counts[p.cat]||0)+1);
const names=CATEGORY_NAMES;
const variantsFor=p=>Array.isArray(p.variants)&&p.variants.length?p.variants:[{name:"",hex:"#F2B6C6",img:""}];
const selectedVariantFor=p=>variantsFor(p).find(v=>v.name===(state.variants[p.id]??variantsFor(p)[0].name))||variantsFor(p)[0];
const safeHex=value=>/^#[0-9a-f]{6}$/i.test(value||"")?value:"#F2B6C6";
function artwork(p,variant){
  const image=variant?.img||"./cherie-mommy-logo.jpg";
  return `<img class="product-img" src="${esc(image)}" alt="${esc(p.name)}" loading="lazy" data-fallback-applied="${variant?.img?"false":"true"}"><span class="product-fallback" hidden>${svg(iconOf(p))}</span>`;
}
function variantOptions(p,selected){
  if(!p.hasColors)return "";
  return `<div class="variants" role="group" aria-label="اختاري اللون">${variantsFor(p).map(v=>`<button type="button" data-variant="${esc(v.name||"")}" class="${v.name===selected?"on":""}" aria-pressed="${v.name===selected}" title="${esc(v.name||"اللون الأساسي")}"><span class="swatch" style="--swatch:${safeHex(v.hex)}"></span><span>${esc(v.name||"أساسي")}</span></button>`).join("")}</div>`;
}

function build(){
  const announcements=window.STORE_SETTINGS?.announcements||[];
  $("#promo").innerHTML=announcements.concat(announcements).map(t=>`<span>${esc(String(t))}</span>`).join("");
  $("#heroIcon1").innerHTML=IC.bottle;
  $("#catGrid").innerHTML=names.map(n=>{
    const image=window.STORE_CATEGORY_IMAGES?.[n]||"./cherie-mommy-logo.jpg";
    return `<a href="#shop" class="tile" data-cat="${esc(n)}" style="--c:${CATS[n].c};--rot:${CATS[n].rot}">
      <img class="tile__image" src="${esc(image)}" alt="${esc(n)}" loading="lazy" onerror="this.onerror=null;this.src='./cherie-mommy-logo.jpg'">
      <h3>${esc(n)}</h3><small>${counts[n]||0} منتج</small>
    </a>`;
  }).join("");
  $("#catList").innerHTML=["الكل",...names,"__fav"].map(n=>`<li><button data-cat="${esc(n)}" class="${n==="الكل"?"on":""}">${n==="__fav"?"♥ المفضلة":esc(n)}<small>${n==="الكل"?PRODUCTS.length:n==="__fav"?favs.length:counts[n]||0}</small></button></li>`).join("");
  $("#ranges").innerHTML=[[0,"الكل"],[50,"حتى ٥٠"],[100,"حتى ١٠٠"],[250,"حتى ٢٥٠"],[500,"حتى ٥٠٠"]].map(([v,l])=>`<button data-max="${v}" class="${v===0?"on":""}">${l}</button>`).join("");
  $("#footCats").innerHTML=names.slice(0,6).map(n=>`<li><a href="#shop" data-cat="${esc(n)}">${esc(n)}</a></li>`).join("");
  const display=window.STORE_SETTINGS?.display||{};
  if(display.shopHeading)$("#shopHeading").textContent=display.shopHeading;
  if(display.heroSubtitle)$("#heroSubtitle").textContent=display.heroSubtitle;
  $("#stCategories").dataset.count=names.length;
}
function card(p){
  const c=CATS[p.cat]||CATEGORY_STYLES[0], sizes=[...new Set(p.sizes||[])], sel=state.chosen[p.id]||"", variant=selectedVariantFor(p);
  return `<article class="card" data-id="${p.id}"><button class="heart ${favs.includes(p.id)?"on":""}" data-fav="${p.id}" aria-label="مفضلة"><svg viewBox="0 0 64 64">${IC.heart}</svg></button>
   <div class="art" style="--c:${c.c};--pat:${PAT[c.pat]};--rot:${c.rot}"><span class="tag">${esc(p.badge||p.cat)}</span>${artwork(p,variant)}</div>
   <div class="cbody"><h3>${esc(p.name)}</h3>
   ${variantOptions(p,variant.name)}
   ${sizes.length?`<div class="sizes">${sizes.map(s=>`<button data-size="${esc(s)}" class="${s===sel?"on":""}">${esc(s)}</button>`).join("")}</div>`:""}
   <div class="cfoot"><div class="price">${p.max&&p.max>p.price?"<small>ابتداءً من</small>":""}${money(p.price)}<em>${CONFIG.currency}</em></div><button class="add" data-add="${p.id}" aria-label="أضيفي للسلة">+</button></div></div></article>`;
}
function list(){
  const q=normalizeSearch(state.q);
  let l=PRODUCTS.filter(p=>{
    const searchable=normalizeSearch([
      p.name,p.nameEn||"",p.description||"",p.cat,p.badge||"",
      ...(p.sizes||[]),
      ...(Array.isArray(p.variants)?p.variants.map(v=>v.name||""):[])
    ].join(" "));
    const terms=q? q.split(/\s+/):[];
    return (state.cat==="الكل"||(state.cat==="__fav"?favs.includes(p.id):p.cat===state.cat))
      &&(!q||terms.every(term=>searchable.includes(term)))
      &&(!state.max||p.price<=state.max);
  });
  if(q){
    l.sort((a,b)=>{
      const aName=normalizeSearch(a.name),bName=normalizeSearch(b.name);
      const score=p=>{
        const name=normalizeSearch(p.name);
        return name===q?300:name.startsWith(q)?200:name.includes(q)?100:normalizeSearch(p.cat).includes(q)?50:0;
      };
      return score(b)-score(a);
    });
  }
  if(state.sort==="low")l.sort((a,b)=>a.price-b.price);
  if(state.sort==="high")l.sort((a,b)=>b.price-a.price);
  if(state.sort==="name")l.sort((a,b)=>a.name.localeCompare(b.name,"ar"));
  return l;
}
function render(){
  const l=list();
  $("#grid").innerHTML=l.length?l.slice(0,state.shown).map(card).join(""):`<div class="empty">مفيش منتجات بالشكل ده. جربي كلمة تانية أو قسم تاني.</div>`;
  $("#resultInfo").textContent=`${l.length} منتج`+(state.q.trim()?` — نتائج البحث عن «${state.q.trim()}»`:"")+(state.cat==="__fav"?" — المفضلة":state.cat!=="الكل"?` — ${state.cat}`:"");
  $("#moreBtn").parentElement.style.display=l.length>state.shown?"":"none";
  document.querySelectorAll("#catList button").forEach(b=>b.classList.toggle("on",b.dataset.cat===state.cat));
  document.querySelectorAll("#ranges button").forEach(b=>b.classList.toggle("on",+b.dataset.max===state.max));
}
function add(id,qty=1,src){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return toast("المنتج لم يعد متاحًا");
  const sizes=[...new Set(p.sizes||[])], size=state.chosen[id]||"", variant=selectedVariantFor(p);
  if(sizes.length&&!size){toast("اختاري المقاس الأول");return}
  if(p.hasColors&&!variant.name){toast("اختاري اللون الأول");return}
  const k=id+"|"+(variant.name||"")+"|"+size, ex=cart.find(i=>i.key===k);
  if(ex&&ex.qty+qty>99)return toast("الحد الأقصى للكمية 99");
  if(!ex&&cart.length>=50)return toast("السلة تسمح بحد أقصى 50 اختيارًا");
  if(ex)ex.qty+=qty;
  else cart.push({key:k,id:p.id,name:p.name,size,variantName:variant.name||"",img:variant.img||"",price:p.price,qty});
  fly(src,iconOf(p));
  save();drawCart();toast("اتضافت للسلة");
  const b=$("#cartBtn");b.classList.remove("bump");void b.offsetWidth;b.classList.add("bump");
  return true;
}
function drawCart(){
  const n=cart.reduce((s,i)=>s+i.qty,0), t=cart.reduce((s,i)=>s+i.qty*i.price,0);
  $("#cartCount").textContent=n;$("#cartTotal").textContent=money(t)+" "+CONFIG.currency;
  $("#cartItems").innerHTML=cart.length?cart.map(i=>`<div class="line"><div><b>${esc(i.name)}</b><small>${i.variantName?esc(i.variantName)+" • ":""}${i.size?"مقاس "+esc(i.size)+" • ":""}${money(i.price)} ${CONFIG.currency}</small>
   <div class="qty"><button data-q="-1" data-k="${esc(i.key)}">−</button>${i.qty}<button data-q="1" data-k="${esc(i.key)}">+</button></div></div><button class="rm" data-rm="${esc(i.key)}">حذف</button></div>`).join(""):`<div class="empty">السلة فاضية. ابدئي بإضافة منتج.</div>`;
}
const open=o=>{$("#drawer").classList.toggle("on",o);$("#overlay").classList.toggle("on",o)};
async function checkout(){
  if(!cart.length)return toast("السلة فاضية");
  const nm=$("#custName").value.trim(),ph=$("#custPhone").value.trim(),ad=$("#custAddr").value.trim();
  if(!nm||!ph||!ad)return toast("املي الاسم والموبايل والعنوان");
  if(nm.length<2||nm.length>120||ph.length<8||ph.length>32||ad.length<8||ad.length>500){
    return toast("راجعي طول الاسم ورقم الموبايل والعنوان");
  }
  if(!window.STORE_SUPABASE)return toast("الاتصال بقاعدة البيانات غير متاح");
  const orderItems=cart.map(item=>({...item}));
  const button=$("#checkout");
  button.disabled=true;
  const whatsappWindow=CONFIG.whatsapp?window.open("about:blank","_blank"):null;
  if(whatsappWindow)whatsappWindow.opener=null;
  try{
    const {data,error}=await window.STORE_SUPABASE.rpc("submit_store_order",{
      p_customer_name:nm,
      p_customer_phone:ph,
      p_customer_address:ad,
      p_items:orderItems.map(item=>({
        id:item.id,
        qty:item.qty,
        size:item.size||"",
        variantName:item.variantName||""
      }))
    });
    if(error)throw error;
    if(!data?.order_number)throw new Error("Supabase did not return an order number");
    cart=[];save();drawCart();open(false);
    toast(`تم تسجيل طلبك بنجاح — ${data.order_number}`);
    if(CONFIG.whatsapp){
      const lines=orderItems.map(item=>`${item.name}${item.variantName?" - "+item.variantName:""}${item.size?" (مقاس "+item.size+")":""} × ${item.qty}`).join("\n");
      const message=`تم تسجيل الطلب ${data.order_number} من شيري مامي.\n${lines}\nالاسم: ${nm}\nالموبايل: ${ph}\nالعنوان: ${ad}`;
      if(whatsappWindow)whatsappWindow.location.href=`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(message)}`;
    }
  }catch(error){
    if(whatsappWindow&&!whatsappWindow.closed)whatsappWindow.close();
    console.error("Failed to submit order to Supabase",error);
    toast("ماقدرناش نسجل الطلب. راجعي البيانات وحاولي تاني.");
  }finally{
    button.disabled=false;
  }
}
let tt;function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),1900)}

document.addEventListener("click",e=>{
  const c=e.target.closest("[data-cat]");if(c){state.cat=c.dataset.cat;state.shown=CONFIG.perPage;render()}
  const m=e.target.closest("[data-max]");if(m){state.max=+m.dataset.max;state.shown=CONFIG.perPage;render()}
  const a=e.target.closest("[data-add]");if(a)add(+a.dataset.add);
  const s=e.target.closest(".card .sizes button");if(s){state.chosen[+s.closest(".card").dataset.id]=s.dataset.size;s.parentElement.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b===s))}
  const q=e.target.closest("[data-q]");if(q){const it=cart.find(i=>i.key===q.dataset.k);const next=it.qty+ +q.dataset.q;if(next>99)return toast("الحد الأقصى للكمية 99");if(next<1)cart=cart.filter(i=>i!==it);else it.qty=next;save();drawCart()}
  const r=e.target.closest("[data-rm]");if(r){cart=cart.filter(i=>i.key!==r.dataset.rm);save();drawCart()}
});
$("#cartBtn").onclick=()=>open(true);$("#closeCart").onclick=()=>open(false);$("#overlay").onclick=()=>open(false);
addEventListener("keydown",e=>{if(e.key==="Escape")open(false)});
$("#clearCart").onclick=()=>{cart=[];save();drawCart()};$("#checkout").onclick=checkout;
$("#moreBtn").onclick=()=>{state.shown+=CONFIG.perPage;render()};
$("#sort").onchange=e=>{state.sort=e.target.value;render()};

$("#searchInput").oninput=e=>{
  state.q=e.target.value;
  state.cat="الكل";
  state.shown=CONFIG.perPage;
  render();
};
$("#searchInput").onkeydown=e=>{
  if(e.key==="Enter"){
    e.preventDefault();
    $("#shop").scrollIntoView({behavior:"smooth",block:"start"});
  }
};
$("#searchForm").onsubmit=e=>{
  e.preventDefault();
  $("#shop").scrollIntoView({behavior:"smooth",block:"start"});
};

build();render();drawCart();
$("#featured").innerHTML=PRODUCTS.filter(p=>p.price>=100&&p.cat!=="ملابس الأطفال").sort((a,b)=>(a.id*7919)%97-(b.id*7919)%97).slice(0,10).map(card).join("");
if(CONFIG.whatsapp){
  const wa=`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("أهلاً شيري مامي، عندي استفسار")}`;
  ["#waBanner","#waFloat","#footWa","#aboutWa"].forEach(s=>$(s).href=wa);
}else{
  ["#waBanner","#waFloat","#footWa","#aboutWa"].forEach(s=>$(s).hidden=true);
}
$("#footPhone").textContent=CONFIG.phoneShown;
const phoneDigits=CONFIG.phoneShown.replace(/\D/g,"");
if(phoneDigits){
  const telNumber=phoneDigits.startsWith("0")?`+20${phoneDigits.slice(1)}`:phoneDigits.startsWith("20")?`+${phoneDigits}`:`+${phoneDigits}`;
  $("#footPhone").href="tel:"+telNumber;
}else $("#footPhone").parentElement.hidden=true;
$("#yr").textContent=new Date().getFullYear();

/* ================= V3: wow layer ================= */
function fly(src,ic){
  const cb=$("#cartBtn").getBoundingClientRect(); const r=(src||document.body).getBoundingClientRect?.();
  if(!src||matchMedia("(prefers-reduced-motion:reduce)").matches){hearts(cb.left+26,cb.top+26);return}
  const el=document.createElement("div");el.className="fly";el.innerHTML=svg(ic);
  el.style.left=(r.left+r.width/2-25)+"px";el.style.top=(r.top+r.height/2-25)+"px";document.body.append(el);
  requestAnimationFrame(()=>{el.style.transform=`translate(${cb.left+idx(cb)-r.left-r.width/2}px,${cb.top-r.top-r.height/2}px) scale(.3) rotate(300deg)`;el.style.opacity=.3});
  setTimeout(()=>{el.remove();hearts(cb.left+26,cb.top+26)},800);
}
const idx=b=>0;
function hearts(x,y){for(let i=0;i<8;i++){const h=document.createElement("span");h.className="burst";h.textContent="♥";h.style.left=x+"px";h.style.top=y+"px";
  const a=i/8*6.28;h.style.setProperty("--x",Math.cos(a)*55+"px");h.style.setProperty("--y",Math.sin(a)*55+"px");document.body.append(h);setTimeout(()=>h.remove(),800)}}
document.addEventListener("click",e=>{const a=e.target.closest("[data-add]");if(a){/* fly handled in add via src */}},true);
/* patch: pass source element for fly */
document.addEventListener("click",e=>{
  const a=e.target.closest(".card [data-add]");
  if(a){e.stopImmediatePropagation();add(+a.dataset.add,1,a)}
  const variantButton=e.target.closest(".card [data-variant]");
  if(variantButton){
    const cardElement=variantButton.closest(".card"),id=Number(cardElement.dataset.id);
    state.variants[id]=variantButton.dataset.variant;
    cardElement.querySelectorAll("[data-variant]").forEach(button=>{
      const selected=button.dataset.variant===state.variants[id];
      button.classList.toggle("on",selected);
      button.setAttribute("aria-pressed",String(selected));
    });
    const product=PRODUCTS.find(item=>item.id===id),art=cardElement.querySelector(".art");
    const tag=art.querySelector(".tag");
    art.innerHTML=tag.outerHTML+artwork(product,selectedVariantFor(product));
    e.stopImmediatePropagation();
    return;
  }
  const f=e.target.closest("[data-fav]");
  if(f){const id=+f.dataset.fav;favs=favs.includes(id)?favs.filter(x=>x!==id):[...favs,id];try{localStorage.setItem("cm_fav",JSON.stringify(favs))}catch(_){}
    document.querySelectorAll(`[data-fav="${id}"]`).forEach(b=>b.classList.toggle("on",favs.includes(id)));
    const fb=document.querySelector('#catList [data-cat="__fav"] small');if(fb)fb.textContent=favs.length;toast(favs.includes(id)?"اتضافت للمفضلة":"اتشالت من المفضلة")}
  const q=e.target.closest(".card .art, .card h3");if(q&&!e.target.closest("button"))openModal(+q.closest(".card").dataset.id);
},true);

/* quick view */
function openModal(id){
  const p=PRODUCTS.find(x=>x.id===id);if(!p)return;
  const c=CATS[p.cat]||CATEGORY_STYLES[0],sizes=[...new Set(p.sizes||[])],variant=selectedVariantFor(p);let qty=1;
  const sim=PRODUCTS.filter(x=>x.cat===p.cat&&x.id!==id&&Math.abs(x.price-p.price)<p.price*.6).slice(0,4);
  const box=$("#modalBox");
  box.innerHTML=`<div class="m-art" style="--c:${c.c};--pat:${PAT[c.pat]};--rot:${c.rot}"><button class="x m-close" data-close>×</button>${artwork(p,variant)}</div>
  <div class="m-info"><span class="sticker sticker--yellow" style="align-self:flex-start">${esc(p.cat)}</span><h3>${esc(p.name)}</h3>
  <div class="price">${p.max&&p.max>p.price?"<small>ابتداءً من</small>":""}${money(p.price)}<em>${CONFIG.currency}</em></div>
  ${variantOptions(p,variant.name)}
  ${sizes.length?`<div><b>المقاس</b><div class="sizes" style="margin-top:6px">${sizes.map(s=>`<button data-size="${esc(s)}" class="${state.chosen[id]===s?"on":""}">${esc(s)}</button>`).join("")}</div></div>`:""}
  <div class="m-row"><div class="qty"><button data-mq="-1">−</button><b id="mq">1</b><button data-mq="1">+</button></div><button class="btn btn--pink" id="mAdd">أضيفي للسلة</button></div>
  ${sim.length?`<div><b>ممكن يعجبك كمان</b><div class="m-sim" style="margin-top:6px">${sim.map(x=>`<button data-open="${x.id}">${esc(x.name.slice(0,26))}</button>`).join("")}</div></div>`:""}</div>`;
  box.onclick=e=>{
    if(e.target.closest("[data-close]"))return closeModal();
    const m=e.target.closest("[data-mq]");if(m){qty=Math.min(99,Math.max(1,qty+ +m.dataset.mq));$("#mq").textContent=qty}
    const o=e.target.closest("[data-open]");if(o)openModal(+o.dataset.open);
    const color=e.target.closest(".variants [data-variant]");if(color){state.variants[id]=color.dataset.variant;openModal(id);return}
    const s=e.target.closest(".sizes button");if(s){state.chosen[id]=s.dataset.size;box.querySelectorAll(".sizes button").forEach(b=>b.classList.toggle("on",b===s))}
    if(e.target.closest("#mAdd")){if(add(id,qty,e.target.closest("#mAdd")))closeModal()}
  };
  $("#modal").classList.add("on");
}
const closeModal=()=>$("#modal").classList.remove("on");
$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});
addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});
document.addEventListener("error",event=>{
  if(!event.target.matches?.(".product-img"))return;
  if(event.target.dataset.fallbackApplied!=="true"){
    event.target.dataset.fallbackApplied="true";
    event.target.src="./cherie-mommy-logo.jpg";
    return;
  }
  const fallback=event.target.nextElementSibling;
  event.target.remove();
  if(fallback)fallback.hidden=false;
},true);

/* gift finder */
const WHO={mom:["ملابس الماميز","العناية والاستحمام","الرضاعة والتغذية"],baby:["ملابس الأطفال","الرضاعة والتغذية","ألعاب وتسلية","حفاضات"],gift:["ألعاب وتسلية","ملابس الأطفال","إكسسوارات","مستلزمات وعربيات"]};
let who="mom",seed=0;
function finder(){
  const b=+$("#budget").value;$("#budgetVal").textContent=money(b)+" "+CONFIG.currency;
  const pool=PRODUCTS.filter(p=>WHO[who].includes(p.cat)&&p.price<=b&&p.price>=b*.2);
  const pick=[],used={};
  pool.map((p,i)=>[p,((p.id+seed)*2654435761>>>0)%1000]).sort((a,b)=>a[1]-b[1]).forEach(([p])=>{if(pick.length<4&&(used[p.cat]||0)<2){pick.push(p);used[p.cat]=(used[p.cat]||0)+1}});
  $("#finderRes").innerHTML=pick.length?pick.map(card).join(""):`<div class="empty">زوّدي الميزانية شوية وهنلاقي حاجات حلوة.</div>`;
}
$("#who").onclick=e=>{const b=e.target.closest("button");if(!b)return;who=b.dataset.w;document.querySelectorAll("#who button").forEach(x=>x.classList.toggle("on",x===b));finder()};
$("#budget").oninput=finder;$("#shuffle").onclick=()=>{seed+=7;finder()};finder();

/* counters */
const minimumPrice=PRODUCTS.length?Math.min(...PRODUCTS.map(p=>p.price)):0;
$("#stProducts").dataset.count=PRODUCTS.length;$("#stMin").dataset.count=minimumPrice;
$("#minPriceDisplay").textContent=minimumPrice?`${money(minimumPrice)} ج`:"— ج";
const io=new IntersectionObserver(es=>es.forEach(en=>{if(!en.isIntersecting)return;io.unobserve(en.target);
  const el=en.target,to=+el.dataset.count,t0=performance.now();
  (function f(t){const k=Math.min(1,(t-t0)/1200);el.textContent=Math.round(to*(1-Math.pow(1-k,3))).toLocaleString("ar-EG");if(k<1)requestAnimationFrame(f)})(t0)}),{threshold:.6});
document.querySelectorAll("[data-count]").forEach(el=>io.observe(el));

/* splash, progress, to-top, 3D tilt */
const hideSplash=()=>setTimeout(()=>{$("#splash")?.classList.add("out");setTimeout(()=>$("#splash")?.remove(),900)},1100);
if(document.readyState==="complete")hideSplash();
else addEventListener("load",hideSplash,{once:true});
addEventListener("scroll",()=>{const h=document.documentElement;$("#progress").style.width=(scrollY/(h.scrollHeight-innerHeight)*100)+"%";$("#toTop").classList.toggle("on",scrollY>800)},{passive:true});
$("#toTop").onclick=()=>scrollTo({top:0,behavior:"smooth"});
if("serviceWorker"in navigator&&location.protocol!=="file:"){
  navigator.serviceWorker.register("./sw.js").catch(error=>console.error("Service worker registration failed",error));
}
if(matchMedia("(hover:hover)").matches&&!matchMedia("(prefers-reduced-motion:reduce)").matches){
  document.addEventListener("pointermove",e=>{const c=e.target.closest?.("#grid .card, .rail .card");
    if(!c)return;const r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    c.style.transform=`perspective(700px) rotateY(${x*-9}deg) rotateX(${y*9}deg) translateY(-4px)`});
  document.addEventListener("pointerout",e=>{const c=e.target.closest?.("#grid .card, .rail .card");if(c&&!c.contains(e.relatedTarget))c.style.transform=""});
}
