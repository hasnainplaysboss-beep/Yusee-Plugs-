
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Menu, ShoppingBag, Search, X, ArrowUpRight, Heart, UserRound,
  ShieldCheck, MessageCircle, Send, Instagram, Facebook,
} from "lucide-react";

type Variant = {
  id: string; size: string | null; colour: string | null;
  delivery: string | null; pricePence: number; stock: number;
};
type Product = {
  id: string; name: string; slug: string; description: string | null;
  category: string | null; imageUrl: string | null; featured: boolean;
  variants: Variant[];
};
type BagLine = { variantId: string; quantity: number };
type ChatMessage = { role: "user" | "assistant"; content: string };

function normaliseDelivery(delivery: string | null | undefined) {
  const value = (delivery || "UK").trim().toLowerCase();
  if (value === "uk" || value === "gb" || value.includes("united kingdom")) return "uk";
  if (value === "cn" || value === "china") return "china";
  return value;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [bag, setBag] = useState<BagLine[]>([]);
  const [bagReady, setBagReady] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerSignedIn, setCustomerSignedIn] = useState(false);
  const [adminSignedIn, setAdminSignedIn] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Welcome to Drip District. What are you looking for today?" },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load products.");
        if (active) setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        if (active) setProductsError(error instanceof Error ? error.message : "Could not load products.");
      } finally {
        if (active) setProductsLoading(false);
      }
    }
    loadProducts();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("yusee_bag") || localStorage.getItem("drip_district_bag");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setBag(parsed);
      }
    } catch {
      localStorage.removeItem("yusee_bag");
    } finally {
      setBagReady(true);
    }
  }, []);

  useEffect(() => {
    if (bagReady) {
      localStorage.setItem("drip_district_bag", JSON.stringify(bag));
      localStorage.setItem("yusee_bag", JSON.stringify(bag));
    }
  }, [bag, bagReady]);

  useEffect(() => {
    let active = true;
    async function checkAuth() {
      try {
        const [customerResponse, adminResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store", credentials: "include" }),
          fetch("/api/admin/me", { cache: "no-store", credentials: "include" }),
        ]);
        const customerData = customerResponse.ok ? await customerResponse.json() : { signedIn: false };
        const adminData = adminResponse.ok ? await adminResponse.json() : { signedIn: false };
        if (!active) return;
        setCustomerSignedIn(customerData.signedIn === true);
        setAdminSignedIn(adminData.signedIn === true);
      } catch {
        if (active) {
          setCustomerSignedIn(false);
          setAdminSignedIn(false);
        }
      }
    }
    checkAuth();
    const handleFocus = () => checkAuth();
    const handleVisibility = () => { if (document.visibilityState === "visible") checkAuth(); };
    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    const currentId = selectedVariants[selectedProduct.id];
    const chosen = selectedProduct.variants.find(v => v.id === currentId && v.stock > 0)
      || selectedProduct.variants.find(v => v.stock > 0)
      || selectedProduct.variants[0];
    if (chosen) setSelectedVariants(old => ({ ...old, [selectedProduct.id]: chosen.id }));
  }, [selectedProduct]);

  const featuredProducts = useMemo(() => products.filter(p => p.featured), [products]);
  const searchResults = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return [];
    return products.filter(p => p.name.toLowerCase().includes(search)).slice(0, 6);
  }, [products, query]);

  function getSelectedVariant(product: Product) {
    return product.variants.find(v => v.id === selectedVariants[product.id])
      || product.variants.find(v => v.stock > 0)
      || product.variants[0];
  }

  function changeVariant(product: Product, field: "size" | "colour" | "delivery", value: string) {
    const current = getSelectedVariant(product);
    const match = product.variants.find(v => v[field] === value && v.size === current?.size && v.colour === current?.colour && v.delivery === current?.delivery && v.stock > 0)
      || product.variants.find(v => v[field] === value && v.stock > 0)
      || product.variants.find(v => v[field] === value);
    if (match) setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
  }

  function addToBag(variant: Variant) {
    const delivery = normaliseDelivery(variant.delivery);
    const existingDeliveries = bag.map(line => {
      const v = products.flatMap(p => p.variants).find(v => v.id === line.variantId);
      return v ? normaliseDelivery(v.delivery) : null;
    }).filter(Boolean);

    if (existingDeliveries.some(d => d !== delivery)) {
      alert("Your bag already contains a different delivery type. Please checkout or remove those items first.");
      return;
    }
    setBag(old => {
      const existing = old.find(item => item.variantId === variant.id);
      return existing
        ? old.map(item => item.variantId === variant.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...old, { variantId: variant.id, quantity: 1 }];
    });
    setSelectedProduct(null);
    setBagOpen(true);
  }

  async function startCheckout(items: BagLine[]) {
    if (!items.length) return;
    const deliveries = new Set(items.map(item => {
      const v = products.flatMap(p => p.variants).find(v => v.id === item.variantId);
      return normaliseDelivery(v?.delivery);
    }));
    if (deliveries.size > 1) {
      alert("Your bag contains mixed delivery types. Please remove items until your bag contains only one delivery type.");
      return;
    }
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Could not start checkout.");
      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not start checkout.");
      setCheckoutLoading(false);
    }
  }

  const bagItems = bag.map(line => {
    const product = products.find(p => p.variants.some(v => v.id === line.variantId));
    const variant = product?.variants.find(v => v.id === line.variantId);
    if (!product || !variant) return null;
    return { ...line, product, variant };
  }).filter((item): item is NonNullable<typeof item> => item !== null);

  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);
  const total = bagItems.reduce((sum, item) => sum + item.variant.pricePence * item.quantity, 0);
  const modalVariant = selectedProduct ? getSelectedVariant(selectedProduct) : undefined;

  const modalSizes = selectedProduct ? Array.from(new Set(selectedProduct.variants.map(v => v.size).filter(Boolean))) as string[] : [];
  const modalColours = selectedProduct ? Array.from(new Set(selectedProduct.variants.map(v => v.colour).filter(Boolean))) as string[] : [];
  const modalDeliveries = selectedProduct ? Array.from(new Set(selectedProduct.variants.map(v => v.delivery).filter(Boolean))) as string[] : [];

  function productPrice(product: Product) {
    if (!product.variants.length) return null;
    return `£${(Math.min(...product.variants.map(v => v.pricePence)) / 100).toFixed(2)}`;
  }

  function openSearchProduct(product: Product) {
    setSelectedProduct(product);
    setSearchOpen(false);
    setQuery("");
  }

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const nextMessages: ChatMessage[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, products }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chat is not connected yet.");
      setChatMessages(old => [...old, { role: "assistant", content: data.message || data.reply || "I couldn't find an answer." }]);
    } catch {
      setChatMessages(old => [...old, { role: "assistant", content: "I'm being set up right now. Please contact our customer support team for assistance." }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <main className="site">
      <div className="announcement">
        <span>DRIP DISTRICT — THE DISTRICT OF WHAT'S NEXT.</span>
        <span>FREE UK DELIVERY ON ORDERS OVER £75</span>
      </div>

      <header className="header">
        <button className="headerIcon" aria-label="Open menu" onClick={() => setMenuOpen(true)}><Menu size={26}/></button>
        <Link href="/" className="logo" aria-label="Drip District home">
          <span className="crown">♛</span>
          <span className="logoText">DRIP DISTRICT</span>
        </Link>
        <div className="headerRight">
          <button className="headerIcon" aria-label="Search" onClick={() => setSearchOpen(v => !v)}><Search size={22}/></button>
          <Link className="headerIcon" aria-label="My account" href={customerSignedIn ? "/account" : "/login"}><UserRound size={22}/></Link>
          {adminSignedIn && <Link className="headerIcon" aria-label="Admin dashboard" href="/admin"><ShieldCheck size={21}/></Link>}
          <button className="headerIcon bagIcon" aria-label="Open bag" onClick={() => setBagOpen(true)}><ShoppingBag size={22}/><span className="bagCount">{bagCount}</span></button>
        </div>
      </header>

      {searchOpen && <div className="searchPanel">
        <div className="searchInputWrap"><Search size={19}/><input autoFocus placeholder="Search the district..." value={query} onChange={e => setQuery(e.target.value)}/><button onClick={() => {setSearchOpen(false);setQuery("");}}><X/></button></div>
        {query.trim() && <div className="searchResults">{searchResults.length ? searchResults.map(p => <button key={p.id} className="searchResult" onClick={() => openSearchProduct(p)}>{p.imageUrl ? <img src={p.imageUrl} alt={p.name}/> : <span className="searchNoImage">DD</span>}<span>{p.name}</span><ArrowUpRight size={17}/></button>) : <p className="searchEmpty">NO MATCHING PRODUCTS FOUND.</p>}</div>}
        <Link className="searchAllLink" href="/shop" onClick={() => setSearchOpen(false)}>EXPLORE ALL PRODUCTS <ArrowUpRight size={16}/></Link>
      </div>}

      <nav className="quickNav">
        <Link href="/mens">CLOTHING</Link><Link href="/womens">WOMENS</Link><Link href="/electronics">TECH</Link><Link href="/accessories">ACCESSORIES</Link><Link href="/shop">ALL PRODUCTS</Link>
      </nav>

      <section className="hero">
        <img className="heroImage" src="/FA104F8F-BE6B-4BFC-AEF4-8408AD0A4D6D.png" alt="Drip District collection"/>
        <div className="heroOverlay">
          <p>WELCOME TO THE DISTRICT</p>
          <h1>THE DISTRICT<br/>OF WHAT&apos;S NEXT.</h1>
          <Link href="/shop" className="heroCTA">DISCOVER THE COLLECTION <ArrowUpRight size={18}/></Link>
        </div>
      </section>

      <section className="trustStrip">
        <div>✦ PREMIUM BRANDS</div><div>✦ SECURE CHECKOUT</div><div>✦ DELIVERY OPTIONS</div><div>✦ CUSTOMER SUPPORT</div>
      </section>

      <section className="categories">
        <div className="sectionHeading"><div><p className="eyebrow">EXPLORE THE DISTRICT</p><h2>SHOP BY CATEGORY</h2></div></div>
        <div className="categoryGrid">
          <Link href="/mens" className="categoryCard"><div className="categoryVisual clothingVisual"><span>01</span><h3>CLOTHING</h3></div><p>THE EVERYDAY ROTATION <ArrowUpRight/></p></Link>
          <Link href="/electronics" className="categoryCard"><div className="categoryVisual techVisual"><span>02</span><h3>TECH</h3></div><p>TECH THAT MOVES <ArrowUpRight/></p></Link>
          <Link href="/accessories" className="categoryCard"><div className="categoryVisual accessoriesVisual"><span>03</span><h3>ACCESSORIES</h3></div><p>THE FINISHING TOUCH <ArrowUpRight/></p></Link>
          <Link href="/shop" className="categoryCard"><div className="categoryVisual brandsVisual"><span>04</span><h3>THE DROP</h3></div><p>EXPLORE EVERYTHING <ArrowUpRight/></p></Link>
        </div>
      </section>

      <section className="featured" id="featured">
        <div className="sectionHeading"><div><p className="eyebrow">CURATED FOR THE DISTRICT</p><h2>FEATURED PRODUCTS</h2></div><Link className="viewAll" href="/shop">VIEW ALL <ArrowUpRight/></Link></div>
        {productsLoading ? <p className="statusMessage">LOADING PRODUCTS...</p> : productsError ? <p className="statusMessage">{productsError}</p> : featuredProducts.length === 0 ? <p className="statusMessage">NO FEATURED PRODUCTS SELECTED.</p> : <div className="featuredGrid">{featuredProducts.map(product => {
          const price = productPrice(product);
          const inStock = product.variants.some(v => v.stock > 0);
          return <article className="featuredCard" key={product.id}>
            <button className="featuredImage" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.name}`}>{product.imageUrl ? <img src={product.imageUrl} alt={product.name}/> : <span className="noImage">DRIP DISTRICT</span>}{!inStock && <span className="soldOut">SOLD OUT</span>}</button>
            <button className={`saveButton ${saved.includes(product.id) ? "isSaved" : ""}`} aria-label="Save product" onClick={() => setSaved(old => old.includes(product.id) ? old.filter(id => id !== product.id) : [...old, product.id])}><Heart size={20} fill={saved.includes(product.id) ? "currentColor" : "none"}/></button>
            <button className="featuredInfo" onClick={() => setSelectedProduct(product)}><span>{product.name}</span>{price && <b>{price}</b>}</button>
          </article>;
        })}</div>}
      </section>

      <section className="shopCallout"><div><p className="eyebrow">YOUR NEXT MOVE STARTS HERE</p><h2>FIND YOUR<br/>NEXT FAVOURITE.</h2></div><Link href="/shop">EXPLORE THE DISTRICT <ArrowUpRight/></Link></section>

      <footer className="footer">
        <div className="footerTop"><div className="footerBrand"><Link href="/" className="footerLogo"><span>♛</span> DRIP DISTRICT</Link><p>THE DISTRICT OF WHAT&apos;S NEXT.</p></div></div>
        <div className="socials">
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram/></a>
          <a href="https://www.tiktok.com/" target="_blank" rel="noreferrer" aria-label="TikTok"><span className="socialTikTok">♪</span></a>
          <a href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook"><Facebook/></a>
          <a href="https://www.snapchat.com/" target="_blank" rel="noreferrer" aria-label="Snapchat"><span className="socialSnap">S</span></a>
        </div>
        <div className="footerAccordion">
          <details><summary><span>CUSTOMER SERVICE</span><span className="footerPlus">+</span></summary><div className="footerAccordionContent"><Link href="/delivery">DELIVERY INFORMATION</Link><Link href="/returns">RETURNS & REFUNDS</Link><a href="mailto:hello@dripdistrict.co.uk">CONTACT US</a><Link href="/faq">FAQ</Link></div></details>
          <details><summary><span>JOIN THE DISTRICT</span><span className="footerPlus">+</span></summary><div className="footerAccordionContent newsletterContent"><p>GET THE LATEST DROPS, EXCLUSIVE UPDATES AND MORE.</p><form className="newsletterForm" onSubmit={e => {e.preventDefault();alert("Newsletter signup is not yet connected.");}}><input type="email" placeholder="ENTER YOUR EMAIL ADDRESS" required/><button type="submit">SIGN UP <ArrowUpRight/></button></form><p className="newsletterDisclaimer">BY SIGNING UP, YOU AGREE TO RECEIVE EMAIL UPDATES.</p></div></details>
        </div>
        <div className="footerPayments"><span className="paymentLogo">VISA</span><span className="paymentLogo">mastercard</span><span className="paymentLogo">AMEX</span><span className="paymentLogo">PayPal</span><span className="paymentLogo">Apple Pay</span><span className="paymentLogo">Klarna.</span></div>
        <div className="footerCountry"><label htmlFor="footerCountrySelect">COUNTRY / REGION</label><select id="footerCountrySelect" defaultValue="uk"><option value="uk">United Kingdom (GBP £)</option></select></div>
        <div className="footerBottom"><p>© 2026 DRIP DISTRICT. ALL RIGHTS RESERVED.</p><p>THE DISTRICT OF WHAT&apos;S NEXT.</p></div>
      </footer>

      {selectedProduct && <div className="modalBackdrop" onClick={() => setSelectedProduct(null)}><section className="productModal" role="dialog" aria-modal="true" aria-label={selectedProduct.name} onClick={e => e.stopPropagation()}>
        <button className="modalClose" onClick={() => setSelectedProduct(null)} aria-label="Close product"><X/></button>
        <div className="modalImage">{selectedProduct.imageUrl ? <img src={selectedProduct.imageUrl} alt={selectedProduct.name}/> : <span className="noImage">DRIP DISTRICT</span>}</div>
        <div className="modalDetails"><p className="eyebrow">DRIP DISTRICT</p><h2>{selectedProduct.name}</h2>{modalVariant && <strong className="modalPrice">£{(modalVariant.pricePence/100).toFixed(2)}</strong>}{selectedProduct.description && <p className="modalDescription">{selectedProduct.description}</p>}
          {modalSizes.length > 0 && <label className="variantLabel">SIZE<select value={modalVariant?.size || ""} onChange={e => changeVariant(selectedProduct,"size",e.target.value)}>{modalSizes.map(s => <option key={s} value={s}>{s}{!selectedProduct.variants.some(v => v.size === s && v.stock > 0) ? " — SOLD OUT" : ""}</option>)}</select></label>}
          {modalColours.length > 0 && <label className="variantLabel">COLOUR<select value={modalVariant?.colour || ""} onChange={e => changeVariant(selectedProduct,"colour",e.target.value)}>{modalColours.map(c => <option key={c} value={c}>{c}{!selectedProduct.variants.some(v => v.colour === c && v.stock > 0) ? " — SOLD OUT" : ""}</option>)}</select></label>}
          {modalDeliveries.length > 0 && <label className="variantLabel">DELIVERY<select value={modalVariant?.delivery || ""} onChange={e => changeVariant(selectedProduct,"delivery",e.target.value)}>{modalDeliveries.map(d => <option key={d} value={d}>{d}{!selectedProduct.variants.some(v => v.delivery === d && v.stock > 0) ? " — SOLD OUT" : ""}</option>)}</select></label>}
          <p className={`stockText ${modalVariant?.stock ? "inStock" : "outStock"}`}>{modalVariant ? modalVariant.stock > 0 ? `${modalVariant.stock} AVAILABLE` : "THIS OPTION IS SOLD OUT" : "NO OPTIONS AVAILABLE"}</p>
          <button className="modalPrimary" disabled={!modalVariant || modalVariant.stock < 1} onClick={() => modalVariant && addToBag(modalVariant)}>ADD TO BAG</button>
          <button className="modalSecondary" disabled={checkoutLoading || !modalVariant || modalVariant.stock < 1} onClick={() => modalVariant && startCheckout([{variantId:modalVariant.id,quantity:1}])}>{checkoutLoading ? "CONNECTING..." : "BUY NOW"}</button>
          <p className="deliveryNote">{modalVariant?.delivery ? `${modalVariant.delivery.toUpperCase()} DELIVERY AVAILABLE` : "DELIVERY AVAILABLE"}</p>
        </div>
      </section></div>}

      {menuOpen && <div className="drawerBackdrop" onClick={() => setMenuOpen(false)}><aside className="drawer menuDrawer" onClick={e => e.stopPropagation()}>
        <div className="drawerHeader"><Link href="/" className="drawerLogo" onClick={() => setMenuOpen(false)}>♛ DRIP DISTRICT</Link><button className="headerIcon" onClick={() => setMenuOpen(false)}><X/></button></div>
        <p className="drawerEyebrow">SHOP THE DISTRICT</p>
        {[["01","CLOTHING","/mens"],["02","WOMENS","/womens"],["03","TECH","/electronics"],["04","ACCESSORIES","/accessories"],["05","ALL PRODUCTS","/shop"]].map(([n,label,href])=><Link key={n} className="drawerLink" href={href} onClick={() => setMenuOpen(false)}><span>{n}</span>{label}<ArrowUpRight/></Link>)}
        <div className="drawerBottom"><p>THE DISTRICT OF WHAT&apos;S NEXT.</p><span>DRIP DISTRICT</span></div>
      </aside></div>}

      {bagOpen && <div className="drawerBackdrop" onClick={() => setBagOpen(false)}><aside className="drawer bagDrawer" onClick={e => e.stopPropagation()}>
        <div className="drawerHeader"><h2>YOUR BAG ({bagCount})</h2><button className="headerIcon" onClick={() => setBagOpen(false)}><X/></button></div>
        {bagItems.length === 0 ? <div className="emptyBag"><ShoppingBag size={36}/><h3>YOUR BAG IS EMPTY</h3><p>Find your next favourite.</p><button className="checkoutButton" onClick={() => setBagOpen(false)}>CONTINUE SHOPPING</button></div> : <>
          <div className="bagLines">{bagItems.map(item => <div className="bagLine" key={item.variantId}>{item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name}/> : <div className="bagNoImage">DD</div>}<div className="bagLineDetails"><b>{item.product.name}</b>{item.variant.size && <span>Size: {item.variant.size}</span>}{item.variant.colour && <span>Colour: {item.variant.colour}</span>}{item.variant.delivery && <span>Delivery: {item.variant.delivery}</span>}<span>£{(item.variant.pricePence/100).toFixed(2)} × {item.quantity}</span><button onClick={() => setBag(old => old.filter(line => line.variantId !== item.variantId))}>REMOVE</button></div></div>)}</div>
          <div className="bagSummary"><div><span>SUBTOTAL</span><b>£{(total/100).toFixed(2)}</b></div><p>Delivery is included in the selected product price.</p><button className="checkoutButton" disabled={checkoutLoading} onClick={() => startCheckout(bagItems.map(item => ({variantId:item.variantId,quantity:item.quantity})))}>{checkoutLoading ? "CONNECTING TO STRIPE..." : "CHECKOUT"}</button></div>
        </>}
      </aside></div>}

      <button className={`chatBubble ${chatOpen ? "chatBubbleOpen" : ""}`} aria-label="Chat with Drip District AI" onClick={() => setChatOpen(v => !v)}>{chatOpen ? <X/> : <MessageCircle/>}<span>DRIP AI</span></button>
      {chatOpen && <section className="chatWindow">
        <div className="chatHeader"><div><span className="chatAvatar">♛</span><div><b>DRIP DISTRICT AI</b><small>YOUR PERSONAL SHOPPING ASSISTANT</small></div></div><button onClick={() => setChatOpen(false)}><X/></button></div>
        <div className="chatMessages">{chatMessages.map((m,i)=><div key={i} className={`chatMessage ${m.role}`}>{m.content}</div>)}{chatLoading && <div className="chatMessage assistant">THINKING...</div>}</div>
        <form className="chatForm" onSubmit={e => {e.preventDefault();sendChat();}}><input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Ask about products..." disabled={chatLoading}/><button disabled={chatLoading || !chatInput.trim()} aria-label="Send message"><Send size={18}/></button></form>
        <p className="chatDisclaimer">AI responses may be imperfect. Check product details before ordering.</p>
      </section>}

      <style jsx>{`
        * {box-sizing:border-box}
        .site{min-height:100vh;background:#050505;color:#fff;font-family:Arial,Helvetica,sans-serif}
        button{font:inherit}
        a{color:inherit}
        .announcement{min-height:30px;display:flex;justify-content:space-between;align-items:center;padding:7px 4%;font-size:9px;font-weight:900;letter-spacing:1.4px;border-bottom:1px solid #292929;gap:12px}
        .header{height:78px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 4%;border-bottom:1px solid #292929;position:relative;z-index:5}
        .logo{text-decoration:none;display:flex;align-items:center;gap:5px;flex-direction:column;line-height:1}
        .crown{font-size:20px}
        .logoText{font-size:22px;font-weight:1000;letter-spacing:2px}
        .headerIcon{border:0;background:transparent;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:9px;position:relative;text-decoration:none}
        .headerRight{justify-self:end;display:flex;align-items:center;gap:10px}
        .bagCount{position:absolute;top:0;right:0;min-width:17px;height:17px;padding:0 4px;border-radius:20px;background:#fff;color:#000;font-size:10px;font-weight:900;display:grid;place-items:center}
        .quickNav{height:48px;display:flex;align-items:center;justify-content:center;gap:clamp(18px,4vw,55px);border-bottom:1px solid #303030}
        .quickNav a{font-size:10px;font-weight:950;letter-spacing:1.3px;text-decoration:none}
        .quickNav a:hover{opacity:.6}
        .searchPanel{position:absolute;z-index:20;top:156px;left:0;right:0;background:#080808;border-bottom:1px solid #383838;padding:18px 4%;box-shadow:0 15px 25px rgba(0,0,0,.35)}
        .searchInputWrap{display:flex;align-items:center;gap:13px;max-width:900px;margin:auto}
        .searchInputWrap input{flex:1;min-width:0;background:transparent;color:#fff;border:0;outline:none;font-size:16px;padding:12px 0}
        .searchInputWrap button{border:0;background:transparent;color:#fff;cursor:pointer}
        .searchResults{max-width:900px;margin:12px auto 0}
        .searchResult{width:100%;display:flex;align-items:center;gap:14px;padding:9px 0;background:transparent;border:0;border-bottom:1px solid #333;color:#fff;text-align:left;cursor:pointer}
        .searchResult img,.searchNoImage{width:48px;height:52px;object-fit:cover;background:#292929}
        .searchNoImage{display:grid;place-items:center;font-weight:900}
        .searchResult span:nth-child(2){flex:1;font-size:13px;font-weight:700}
        .searchEmpty{font-size:11px;color:#aaa;padding:12px 0}
        .searchAllLink{display:flex;align-items:center;gap:9px;width:fit-content;margin:16px auto 0;text-decoration:none;font-size:10px;font-weight:900;letter-spacing:1px}
        .hero{position:relative;overflow:hidden;background:#111;line-height:0}
        .heroImage{display:block;width:100%;height:auto;object-fit:cover}
        .heroOverlay{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;padding:6%;background:linear-gradient(90deg,rgba(0,0,0,.65),transparent 75%);line-height:1.2}
        .heroOverlay p{font-size:10px;letter-spacing:3px;font-weight:900}
        .heroOverlay h1{font-size:clamp(32px,7vw,90px);font-weight:1000;line-height:.95;letter-spacing:-3px;margin:15px 0 25px;max-width:800px}
        .heroCTA{display:flex;align-items:center;gap:12px;padding:15px 20px;background:#fff;color:#000;text-decoration:none;font-size:10px;font-weight:950;letter-spacing:1px}
        .trustStrip{display:flex;justify-content:space-around;flex-wrap:wrap;gap:15px;padding:22px 4%;border-bottom:1px solid #333;border-top:1px solid #333;font-size:10px;font-weight:900;letter-spacing:1px}
        .categories{padding:60px 4% 25px}
        .sectionHeading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:28px}
        .eyebrow{color:#aaa;font-size:10px;letter-spacing:2.5px;margin:0 0 9px}
        .sectionHeading h2{font-size:clamp(25px,4vw,40px);line-height:1;letter-spacing:-1.5px;font-weight:950;margin:0}
        .categoryGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .categoryCard{text-decoration:none;min-width:0}
        .categoryVisual{height:260px;background:#171717;border:1px solid #333;display:flex;flex-direction:column;justify-content:space-between;padding:20px;transition:background .2s}
        .categoryVisual:hover{background:#292929}
        .categoryVisual span{font-size:11px;color:#aaa}
        .categoryVisual h3{font-size:clamp(20px,3vw,35px);font-weight:1000;letter-spacing:-1px;margin:0}
        .clothingVisual{background:linear-gradient(145deg,#252525,#050505)}
        .techVisual{background:linear-gradient(145deg,#111,#383838)}
        .accessoriesVisual{background:linear-gradient(145deg,#393939,#101010)}
        .brandsVisual{background:linear-gradient(145deg,#111,#292929)}
        .categoryCard>p{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:900;letter-spacing:1px;margin-top:13px}
        .categoryCard>p svg{width:17px}
        .featured{padding:55px 4%;background:#000}
        .viewAll{display:flex;align-items:center;gap:10px;font-size:10px;font-weight:950;letter-spacing:1px;text-decoration:none;white-space:nowrap}
        .featuredGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .featuredCard{position:relative;min-width:0}
        .featuredImage{position:relative;display:block;width:100%;aspect-ratio:1/1.08;padding:0;overflow:hidden;border:0;background:#171717;cursor:pointer;text-align:center}
        .featuredImage img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .featuredImage:hover img{transform:scale(1.04)}
        .noImage{height:100%;width:100%;min-height:180px;display:grid;place-items:center;color:#777;font-weight:900;letter-spacing:2px;font-size:13px}
        .saveButton{position:absolute;right:12px;top:12px;width:36px;height:36px;display:grid;place-items:center;border:0;background:rgba(0,0,0,.5);color:white;cursor:pointer}
        .soldOut{position:absolute;left:10px;bottom:10px;padding:7px 9px;background:#fff;color:#111;font-size:9px;font-weight:950;letter-spacing:1px}
        .featuredInfo{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:7px;margin-top:13px;padding:0;border:0;color:#fff;background:transparent;text-align:left;cursor:pointer}
        .featuredInfo span{font-size:13px;font-weight:750;line-height:1.35}
        .featuredInfo b{font-size:13px;font-weight:500}
        .statusMessage{padding:42px 10px;text-align:center;color:#aaa;font-size:12px;letter-spacing:1px}
        .shopCallout{padding:55px 5%;display:flex;align-items:center;justify-content:space-between;gap:25px;border-top:1px solid #333;border-bottom:1px solid #333}
        .shopCallout h2{margin:0;font-size:clamp(28px,5vw,53px);line-height:.98;letter-spacing:-2px;font-weight:950}
        .shopCallout>a{display:flex;align-items:center;gap:15px;padding:17px 20px;background:#fff;color:#000;text-decoration:none;font-size:10px;font-weight:950;letter-spacing:1px;white-space:nowrap}
        .footer{background:#000;color:#fff;padding:45px 5% 22px;border-top:1px solid #333}
        .footer,.footer *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
        .footerTop{padding-bottom:30px}
        .footerLogo{display:inline-block;font-size:29px;font-weight:1000;letter-spacing:-1px;color:#fff;text-decoration:none}
        .footerBrand p{font-size:12px;letter-spacing:2px;color:#aaa;margin:12px 0 0}
        .socials{display:flex;gap:15px;padding:5px 0 30px}
        .socials a{display:grid;place-items:center;width:42px;height:42px;border:1px solid #444;color:#fff;text-decoration:none}
        .socialTikTok,.socialSnap{font-weight:900;font-size:19px}
        .footerAccordion{border-top:1px solid #484848}
        .footerAccordion details{border-bottom:1px solid #484848}
        .footerAccordion summary{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:25px 0;list-style:none;cursor:pointer;font-size:19px;font-weight:900;letter-spacing:.5px}
        .footerAccordion summary::-webkit-details-marker{display:none}
        .footerPlus{font-size:25px;font-weight:300;transition:transform .2s}
        .footerAccordion details[open] .footerPlus{transform:rotate(45deg)}
        .footerAccordionContent{display:flex;flex-direction:column;align-items:flex-start;gap:19px;padding:0 0 28px}
        .footerAccordionContent a{color:#ccc;text-decoration:none;font-size:14px;letter-spacing:.5px}
        .newsletterContent>p{color:#bcbcbc;font-size:12px;line-height:1.8;letter-spacing:1px;max-width:450px;margin:0}
        .newsletterForm{display:flex;width:100%;max-width:500px;border-bottom:1px solid #fff;align-items:center}
        .newsletterForm input{flex:1;min-width:0;background:transparent;border:0;outline:none;color:#fff;padding:17px 5px;font-size:12px;letter-spacing:1px}
        .newsletterForm button{display:flex;align-items:center;gap:10px;padding:14px 5px 14px 15px;border:0;background:transparent;color:#fff;cursor:pointer;font-size:12px;font-weight:900;letter-spacing:1px}
        .newsletterDisclaimer{font-size:10px!important;color:#888!important;line-height:1.7;letter-spacing:.6px}
        .footerPayments{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:30px 0;border-bottom:1px solid #484848}
        .paymentLogo{display:inline-flex;align-items:center;justify-content:center;min-width:49px;height:31px;padding:5px 9px;background:#f5f5f5;color:#111;border-radius:4px;font-size:12px;font-weight:900}
        .footerCountry{display:flex;flex-direction:column;gap:12px;padding:30px 0;border-bottom:1px solid #484848}
        .footerCountry label{font-size:11px;font-weight:800;letter-spacing:1.5px}
        .footerCountry select{width:fit-content;min-width:220px;padding:14px 40px 14px 15px;background:#fff;color:#111;border:1px solid #fff;font-size:13px}
        .footerBottom{display:flex;justify-content:space-between;flex-wrap:wrap;gap:15px;padding-top:22px;color:#999;font-size:10px;letter-spacing:1px;line-height:1.7}
        .footerBottom p{margin:0}
        .modalBackdrop,.drawerBackdrop{position:fixed;inset:0;z-index:50;display:flex;justify-content:center;align-items:center;padding:18px;background:rgba(0,0,0,.78);overflow-y:auto}
        .productModal{position:relative;width:100%;max-width:900px;max-height:92vh;overflow-y:auto;display:grid;grid-template-columns:1fr 1fr;background:#f5f5f2;color:#111}
        .modalClose{position:absolute;z-index:2;top:12px;right:12px;width:40px;height:40px;border:0;border-radius:50%;background:#fff;color:#111;cursor:pointer}
        .modalImage{min-height:420px;background:#e6e6e3}
        .modalImage img{width:100%;height:100%;min-height:420px;object-fit:cover}
        .modalDetails{display:flex;flex-direction:column;justify-content:center;gap:18px;padding:clamp(22px,4vw,44px)}
        .modalDetails h2{font-size:clamp(26px,4vw,39px);line-height:1.05;margin:0}
        .modalPrice{font-size:19px}
        .modalDescription{color:#666;font-size:13px;line-height:1.7;white-space:pre-wrap}
        .variantLabel{display:flex;flex-direction:column;gap:8px;font-size:10px;font-weight:800;letter-spacing:1.5px}
        .variantLabel select{width:100%;padding:13px;border:1px solid #ccc;background:#fff;color:#111;font-size:14px}
        .stockText{font-size:11px;letter-spacing:.7px}
        .inStock{color:#333}.outStock{color:#777}
        .modalPrimary,.modalSecondary{width:100%;padding:16px;font-size:11px;font-weight:900;letter-spacing:1.4px;cursor:pointer}
        .modalPrimary{background:#111;color:#fff;border:1px solid #111}
        .modalSecondary{background:transparent;color:#111;border:1px solid #111}
        .modalPrimary:disabled,.modalSecondary:disabled{opacity:.4;cursor:not-allowed}
        .deliveryNote{text-align:center;color:#777;font-size:10px;letter-spacing:1px}
        .drawerBackdrop{justify-content:flex-start;align-items:stretch;padding:0}
        .drawer{width:min(420px,90vw);height:100%;overflow-y:auto;padding:24px;background:#050505;color:#fff;box-shadow:10px 0 35px rgba(0,0,0,.35)}
        .bagDrawer{margin-left:auto;box-shadow:-10px 0 35px rgba(0,0,0,.35)}
        .drawerHeader{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-bottom:22px;border-bottom:1px solid #333}
        .drawerHeader h2{font-size:17px;letter-spacing:1px}
        .drawerLogo{font-size:20px;font-weight:1000;text-decoration:none}
        .drawerEyebrow{margin:28px 0 12px;color:#999;font-size:10px;font-weight:800;letter-spacing:2px}
        .drawerLink{display:flex;align-items:center;gap:13px;padding:20px 0;border-bottom:1px solid #292929;color:#fff;text-decoration:none;font-size:17px;font-weight:950;letter-spacing:1px}
        .drawerLink span{color:#aaa;font-size:10px}.drawerLink svg{width:18px;margin-left:auto}
        .drawerLink:hover{opacity:.7}
        .drawerBottom{margin-top:35px;padding-top:22px;border-top:1px solid #333}
        .drawerBottom p{font-size:11px;font-weight:900;letter-spacing:2px}
        .drawerBottom span{font-size:10px;color:#888;letter-spacing:2px}
        .bagLines{padding:20px 0}
        .bagLine{display:flex;gap:14px;padding:15px 0;border-bottom:1px solid #292929}
        .bagLine img,.bagNoImage{width:90px;height:110px;object-fit:cover;background:#252525}
        .bagNoImage{display:grid;place-items:center;font-size:10px;font-weight:900}
        .bagLineDetails{display:flex;flex-direction:column;align-items:flex-start;gap:7px;font-size:11px}
        .bagLineDetails span{color:#aaa}
        .bagLineDetails button{padding:0;margin-top:4px;border:0;background:transparent;color:#fff;text-decoration:underline;font-size:9px;cursor:pointer}
        .bagSummary{position:sticky;bottom:0;padding:18px 0;background:#050505;border-top:1px solid #333}
        .bagSummary>div{display:flex;justify-content:space-between;font-size:13px}
        .bagSummary p,.emptyBag p{color:#999;font-size:11px;line-height:1.6}
        .checkoutButton{width:100%;padding:16px;border:0;background:#fff;color:#000;font-size:11px;font-weight:950;letter-spacing:1px;cursor:pointer}
        .checkoutButton:disabled{opacity:.5}
        .emptyBag{min-height:65vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
        .emptyBag h3{font-size:14px;letter-spacing:1px}
        .chatBubble{position:fixed;right:24px;bottom:24px;z-index:60;display:flex;align-items:center;gap:10px;background:#fff;color:#000;border:0;padding:15px 19px;font-size:11px;font-weight:950;letter-spacing:1px;cursor:pointer;box-shadow:0 5px 30px rgba(0,0,0,.4)}
        .chatBubbleOpen{background:#111;color:#fff;border:1px solid #444}
        .chatWindow{position:fixed;right:24px;bottom:90px;z-index:60;width:min(390px,calc(100vw - 30px));height:min(550px,calc(100vh - 120px));display:flex;flex-direction:column;background:#090909;border:1px solid #333;box-shadow:0 15px 50px rgba(0,0,0,.6)}
        .chatHeader{display:flex;justify-content:space-between;align-items:center;padding:17px;border-bottom:1px solid #333}
        .chatHeader>div{display:flex;align-items:center;gap:12px}
        .chatHeader button{background:transparent;color:#fff;border:0;cursor:pointer}
        .chatAvatar{width:38px;height:38px;display:grid;place-items:center;background:#fff;color:#000;font-size:21px}
        .chatHeader b{display:block;font-size:11px;letter-spacing:1px}
        .chatHeader small{display:block;font-size:8px;color:#999;margin-top:5px;letter-spacing:.7px}
        .chatMessages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
        .chatMessage{max-width:85%;padding:12px 14px;font-size:12px;line-height:1.6;white-space:pre-wrap}
        .chatMessage.assistant{align-self:flex-start;background:#202020;color:#fff}
        .chatMessage.user{align-self:flex-end;background:#fff;color:#000}
        .chatForm{display:flex;gap:8px;padding:12px;border-top:1px solid #333}
        .chatForm input{flex:1;min-width:0;background:#111;border:1px solid #333;padding:12px;color:#fff;outline:none;font-size:12px}
        .chatForm button{width:44px;background:#fff;color:#000;border:0;display:grid;place-items:center;cursor:pointer}
        .chatForm button:disabled{opacity:.5}
        .chatDisclaimer{font-size:8px;color:#777;text-align:center;margin:0;padding:0 12px 10px}
        @media(max-width:760px){
          .announcement{padding:7px 13px;font-size:7px;letter-spacing:.7px}
          .header{height:65px;padding:0 13px}
          .logoText{font-size:17px;letter-spacing:1px}
          .crown{font-size:16px}
          .headerRight{gap:2px}
          .headerRight .headerIcon{padding:7px}
          .quickNav{height:43px;justify-content:flex-start;gap:23px;padding:0 15px;overflow-x:auto}
          .quickNav a{font-size:9px;white-space:nowrap}
          .searchPanel{top:138px;padding:14px}
          .heroOverlay h1{font-size:clamp(30px,9vw,55px);letter-spacing:-1.5px}
          .heroOverlay p{font-size:8px}
          .heroCTA{font-size:8px;padding:12px}
          .trustStrip{font-size:8px;gap:12px;padding:18px 10px}
          .categories{padding:40px 15px 15px}
          .categoryGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
          .categoryVisual{height:180px;padding:15px}
          .categoryVisual h3{font-size:25px}
          .categoryCard>p{font-size:8px}
          .featured{padding:40px 15px}
          .sectionHeading{align-items:end;margin-bottom:20px}
          .sectionHeading h2{font-size:clamp(22px,6vw,30px)}
          .viewAll{font-size:9px;gap:5px}
          .featuredGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 12px}
          .featuredInfo span,.featuredInfo b{font-size:11px}
          .saveButton{top:7px;right:7px;width:31px;height:31px}
          .shopCallout{padding:38px 18px;align-items:flex-start;flex-direction:column}
          .shopCallout h2{font-size:32px}
          .shopCallout>a{width:100%;justify-content:space-between}
          .productModal{grid-template-columns:1fr;max-width:480px}
          .modalImage,.modalImage img{min-height:260px;max-height:42vh}
          .modalDetails{gap:13px;padding:22px}
          .modalDetails h2{font-size:27px}
          .footer{padding:35px 18px 18px}
          .footerLogo{font-size:24px}
          .footerAccordion summary{font-size:16px;padding:23px 0}
          .footerAccordionContent a{font-size:13px}
          .footerPayments{gap:8px;padding:25px 0}
          .paymentLogo{height:29px;min-width:43px;font-size:10px;padding:4px 7px}
          .footerCountry select{width:100%;max-width:300px}
          .footerBottom{flex-direction:column;gap:8px}
          .chatBubble{right:15px;bottom:15px;padding:13px 15px}
          .chatWindow{right:15px;bottom:75px}
        }
        @media(min-width:761px) and (max-width:1050px){.featuredGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.categoryVisual{height:210px}}
      `}</style>
    </main>
  );
}
