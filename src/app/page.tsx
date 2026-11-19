"use client";

import { useMemo, useState } from "react";
import { Menu, ShoppingBag, Search, X, ArrowUpRight, Plus, Minus, ChevronDown, Heart, SlidersHorizontal } from "lucide-react";

type Product = { id: number; name: string; category: string; price: number; tag?: string; image: string; };
const products: Product[] = [
  { id: 1, name: "Essential Oversized Tee", category: "Men", price: 28, tag: "BESTSELLER", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Studio Zip Hoodie", category: "Men", price: 58, tag: "NEW IN", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Everyday Track Jacket", category: "Women", price: 64, image: "https://images.unsplash.com/photo-1551028637-0b7b6f7a7c8a?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Core Runner", category: "Footwear", price: 82, tag: "TRENDING", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Relaxed Cargo Trouser", category: "Men", price: 52, image: "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Signature Crew Sweat", category: "Women", price: 48, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85" },
  { id: 7, name: "Everyday Crossbody", category: "Accessories", price: 34, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85" },
  { id: 8, name: "Court Street Sneaker", category: "Footwear", price: 76, tag: "JUST DROPPED", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=85" }
];
const categories = ["New arrivals", "T-shirts", "Hoodies & jumpers", "Tracksuits", "Jackets", "Shoes", "Accessories", "Sale"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBag] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<"Men" | "Women" | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const visible = useMemo(() => products.filter(p => (active === "All" || p.category === active) && p.name.toLowerCase().includes(query.toLowerCase())), [active, query]);
  const bagItems = products.filter(p => bag.includes(p.id));
  const add = (id: number) => setBag(old => [...old, id]);
  const remove = (id: number) => setBag(old => { const i = old.indexOf(id); return i < 0 ? old : [...old.slice(0, i), ...old.slice(i + 1)]; });
  const total = bagItems.reduce((sum, p) => sum + p.price, 0);

  return <main>
    <div className="announcement">COMPLIMENTARY UK DELIVERY ON ORDERS OVER £100 <span>•</span> NEW SEASON. NEW ENERGY.</div>
    <header className="header">
      <button className="iconButton" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={25} strokeWidth={1.8}/></button>
      <a className="wordmark" href="#">YUSEE<span>PLUGS</span></a>
      <div className="headerActions">
        <button className="iconButton searchToggle" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}><Search size={21}/></button>
        <button className="iconButton bagButton" aria-label="Open bag" onClick={() => setBagOpen(true)}><ShoppingBag size={22} strokeWidth={1.8}/><span className="bagCount">{bag.length}</span></button>
      </div>
    </header>

    {searchOpen && <div className="searchBar"><Search size={18}/><input autoFocus placeholder="Search the collection..." value={query} onChange={e => setQuery(e.target.value)}/><button onClick={() => {setQuery(""); setSearchOpen(false);}}><X size={18}/></button></div>}

    <section className="hero">
      <div className="heroShade"/>
      <div className="heroContent">
        <p className="eyebrow light">THE NEW STANDARD</p>
        <h1>OWN YOUR<br/><i>EVERYDAY.</i></h1>
        <p className="heroCopy">The pieces you reach for. The details that set you apart.</p>
        <a className="lightButton" href="#shop">SHOP THE DROP <ArrowUpRight size={17}/></a>
      </div>
      <div className="heroMeta"><span>YUSEE PLUGS / COLLECTION 001</span><span>01 — 04</span></div>
    </section>

    <section className="benefits">
      <div><span>01</span><p>CURATED EVERYDAY STYLE</p></div><div><span>02</span><p>NEW DROPS, ALWAYS</p></div><div><span>03</span><p>UK DELIVERY AVAILABLE</p></div>
    </section>

    <section className="categoryFeature">
      <div className="sectionIntro"><div><p className="eyebrow">FIND YOUR FIT</p><h2>THE LINE-UP</h2></div><p>Built around you.<br/>Styled your way.</p></div>
      <div className="categoryTiles">
        <a className="categoryTile menTile" href="#shop" onClick={() => setActive("Men")}><span>01 / THE MENS EDIT</span><strong>MEN</strong><b>SHOP NOW <ArrowUpRight size={16}/></b></a>
        <a className="categoryTile womenTile" href="#shop" onClick={() => setActive("Women")}><span>02 / THE WOMENS EDIT</span><strong>WOMEN</strong><b>SHOP NOW <ArrowUpRight size={16}/></b></a>
      </div>
    </section>

    <section className="shopSection" id="shop">
      <div className="sectionIntro shopIntro"><div><p className="eyebrow">THE LATEST ROTATION</p><h2>NEW & NOTED</h2></div><a href="#shop" className="textLink">VIEW ALL <ArrowUpRight size={16}/></a></div>
      <div className="filterRow"><div className="filters">{["All","Men","Women","Footwear","Accessories"].map(x => <button key={x} className={active===x?"activeFilter":""} onClick={() => setActive(x)}>{x}</button>)}</div><span className="resultCount"><SlidersHorizontal size={15}/> {visible.length} PIECES</span></div>
      <div className="productGrid">
        {visible.map(p => <article className="productCard" key={p.id}>
          <div className="productImage"><img src={p.image} alt={p.name}/>{p.tag && <span className="productTag">{p.tag}</span>}<button className={`heart ${saved.includes(p.id)?"saved":""}`} aria-label="Save item" onClick={() => setSaved(old => old.includes(p.id)?old.filter(x=>x!==p.id):[...old,p.id])}><Heart size={18} fill={saved.includes(p.id)?"currentColor":"none"}/></button><button className="quickAdd" onClick={() => add(p.id)}>ADD TO BAG <Plus size={15}/></button></div>
          <div className="productInfo"><div><h3>{p.name}</h3><p>{p.category}</p></div><strong>£{p.price.toFixed(2)}</strong></div>
        </article>)}
      </div>
      {visible.length===0 && <p className="empty">No pieces found. Try another search.</p>}
    </section>

    <section className="statement"><p className="eyebrow light">NOT HERE TO BLEND IN</p><h2>YOUR STYLE.<br/><i>YOUR RULES.</i></h2><a href="#shop" className="outlineButton">EXPLORE THE COLLECTION <ArrowUpRight size={16}/></a></section>

    <footer className="footer">
      <div className="footerTop"><div><a className="wordmark footerLogo" href="#">YUSEE<span>PLUGS</span></a><p>Everyday essentials.<br/>Unmistakable energy.</p></div><div className="footerLinks"><div><b>SHOP</b><a href="#shop">New arrivals</a><a href="#shop">Men</a><a href="#shop">Women</a><a href="#shop">Accessories</a></div><div><b>HELP</b><a href="mailto:hello@yuseeplugs.com">Contact us</a><a href="#">Delivery & returns</a><a href="#">FAQs</a><a href="#">Size guide</a></div><div><b>FOLLOW</b><a href="#">Instagram ↗</a><a href="#">TikTok ↗</a></div></div></div>
      <div className="footerBottom"><span>© 2026 YUSEE PLUGS. ALL RIGHTS RESERVED.</span><span>BUILT FOR YOUR EVERYDAY.</span></div>
    </footer>

    {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)}><aside className="drawer menuDrawer" onClick={e => e.stopPropagation()}><div className="drawerHead"><a className="wordmark" href="#">YUSEE<span>PLUGS</span></a><button className="iconButton" onClick={() => setMenuOpen(false)}><X/></button></div><a className="signIn" href="mailto:hello@yuseeplugs.com">SIGN IN / REGISTER <ArrowUpRight size={16}/></a><div className="menuGroups">{(["Men","Women"] as const).map(g => <div className="menuGroup" key={g}><button className="menuHeading" onClick={() => setExpanded(expanded===g?null:g)}>{g.toUpperCase()} <ChevronDown className={expanded===g?"rotated":""}/></button>{expanded===g && <div className="subMenu">{categories.map(c => <a href="#shop" key={c} onClick={() => {setActive(g);setMenuOpen(false);}}>{c}</a>)}</div>}</div>)}</div><a className="menuSimple" href="#shop" onClick={() => setMenuOpen(false)}>NEW ARRIVALS <ArrowUpRight size={16}/></a><a className="menuSimple sale" href="#shop" onClick={() => setMenuOpen(false)}>SALE <ArrowUpRight size={16}/></a><p className="drawerNote">GOOD STYLE. NO COMPROMISE.</p></aside></div>}

    {bagOpen && <div className="overlay" onClick={() => setBagOpen(false)}><aside className="drawer bagDrawer" onClick={e => e.stopPropagation()}><div className="drawerHead"><h2>YOUR BAG <span>({bag.length})</span></h2><button className="iconButton" onClick={() => setBagOpen(false)}><X/></button></div>{bag.length===0?<div className="emptyBag"><ShoppingBag size={35}/><h3>YOUR BAG IS EMPTY</h3><p>Find your next favourite.</p><button className="blackButton" onClick={() => setBagOpen(false)}>CONTINUE SHOPPING</button></div>:<><div className="bagLines">{bagItems.map((p,i)=><div className="bagLine" key={`${p.id}-${i}`}><img src={p.image} alt=""/><div className="bagLineInfo"><b>{p.name}</b><span>£{p.price.toFixed(2)}</span><button onClick={() => remove(p.id)}>REMOVE</button></div></div>)}</div><div className="bagCheckout"><div><span>SUBTOTAL</span><b>£{total.toFixed(2)}</b></div><p>Delivery calculated at checkout.</p><button className="blackButton" onClick={() => alert("Checkout will be enabled when your Stripe account is connected.")}>CONTINUE TO CHECKOUT</button></div></>}</aside></div>}
  </main>;
}
