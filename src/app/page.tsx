
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu, ShoppingBag, Search, X, ArrowUpRight, Plus,
  Heart, ChevronDown
} from "lucide-react";

const products = [
  { id: 1, name: "Essential Oversized Tee", category: "Men", price: 28, tag: "BESTSELLER", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Studio Zip Hoodie", category: "Men", price: 58, tag: "NEW IN", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Everyday Track Jacket", category: "Women", price: 64, image: "https://images.unsplash.com/photo-1551028637-0b7b6f7a7c8a?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Core Runner", category: "Footwear", price: 82, tag: "TRENDING", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Relaxed Cargo Trouser", category: "Men", price: 52, image: "https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Signature Crew Sweat", category: "Women", price: 48, image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85" },
  { id: 7, name: "Everyday Crossbody", category: "Accessories", price: 34, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85" },
  { id: 8, name: "Court Street Sneaker", category: "Footwear", price: 76, tag: "JUST DROPPED", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=85" }
];

const categories = {
  Men: ["All men's clothing", "T-shirts", "Hoodies & jumpers", "Tracksuits", "Jackets", "Shoes", "Accessories"],
  Women: ["All women's clothing", "Tops & T-shirts", "Hoodies & jumpers", "Tracksuits", "Leggings", "Shoes", "Accessories"]
};

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBag] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<"Men" | "Women" | null>(null);
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);
  const [customerSignedIn, setCustomerSignedIn] = useState(false);
  const [adminSignedIn, setAdminSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  async function checkAuth() {
    try {
      const [customerResponse, adminResponse] = await Promise.all([
        fetch("/api/auth/me", { cache: "no-store" }),
        fetch("/api/admin/me", { cache: "no-store" })
      ]);

      const customerData = customerResponse.ok
        ? await customerResponse.json()
        : { signedIn: false };

      const adminData = adminResponse.ok
        ? await adminResponse.json()
        : { signedIn: false };

      setCustomerSignedIn(customerData.signedIn === true);
      setAdminSignedIn(adminData.signedIn === true);
    } catch {
      setCustomerSignedIn(false);
      setAdminSignedIn(false);
    } finally {
      setAuthChecked(true);
    }
  }

  useEffect(() => {
    checkAuth();
  }, []);

  const visible = useMemo(() => products.filter(p =>
    (active === "All" || p.category === active) &&
    p.name.toLowerCase().includes(query.toLowerCase())
  ), [active, query]);

  const bagItems = bag.map(id => products.find(p => p.id === id)).filter(Boolean);
  const total = bagItems.reduce((sum, p) => sum + (p?.price ?? 0), 0);

  async function handleSignOut() {
    try {
      const responses = await Promise.all([
        fetch("/api/auth/logout", { method: "POST" }),
        fetch("/api/admin/logout", { method: "POST" })
      ]);

      if (responses.some(response => !response.ok)) {
        throw new Error("Sign out failed");
      }

      setCustomerSignedIn(false);
      setAdminSignedIn(false);
      setMenuOpen(false);
      window.location.reload();
    } catch {
      alert("Could not sign out. Please try again.");
    }
  }

  return (
    <main>
      <div className="announcement">
        COMPLIMENTARY UK DELIVERY OVER £100 <span>•</span> NEW SEASON. NEW ENERGY.
      </div>

      <header className="header">
        <button className="iconButton" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu size={25}/>
        </button>
        <Link className="wordmark" href="/">YUSEE<span>PLUGS</span></Link>
        <div className="headerActions">
          <button className="iconButton" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={21}/>
          </button>
          <button className="iconButton bagButton" aria-label="Open bag" onClick={() => setBagOpen(true)}>
            <ShoppingBag size={22}/>
            <span className="bagCount">{bag.length}</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="searchBar">
          <Search size={18}/>
          <input autoFocus placeholder="Search the collection..." value={query} onChange={e => setQuery(e.target.value)}/>
          <button onClick={() => { setQuery(""); setSearchOpen(false); }}><X size={18}/></button>
        </div>
      )}

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
        <div><span>01</span><p>CURATED EVERYDAY STYLE</p></div>
        <div><span>02</span><p>NEW DROPS, ALWAYS</p></div>
        <div><span>03</span><p>UK DELIVERY AVAILABLE</p></div>
      </section>

      <section className="categoryFeature">
        <div className="sectionIntro">
          <div><p className="eyebrow">FIND YOUR FIT</p><h2>THE LINE-UP</h2></div>
          <p>Built around you.<br/>Styled your way.</p>
        </div>
        <div className="categoryTiles">
          <a className="categoryTile menTile" href="#shop" onClick={() => setActive("Men")}>
            <span>01 / THE MENS EDIT</span><strong>MEN</strong><b>SHOP NOW <ArrowUpRight size={16}/></b>
          </a>
          <a className="categoryTile womenTile" href="#shop" onClick={() => setActive("Women")}>
            <span>02 / THE WOMENS EDIT</span><strong>WOMEN</strong><b>SHOP NOW <ArrowUpRight size={16}/></b>
          </a>
        </div>
      </section>

      <section className="shopSection" id="shop">
        <div className="sectionIntro shopIntro">
          <div><p className="eyebrow">THE LATEST ROTATION</p><h2>NEW & NOTED</h2></div>
          <button className="textLink" onClick={() => setActive("All")}>VIEW ALL <ArrowUpRight size={16}/></button>
        </div>

        <div className="filterRow">
          <div className="filters">
            {["All", "Men", "Women", "Footwear", "Accessories"].map(x => (
              <button key={x} className={active === x ? "activeFilter" : ""} onClick={() => setActive(x)}>{x}</button>
            ))}
          </div>
          <span className="resultCount">{visible.length} PIECES</span>
        </div>

        <div className="productGrid">
          {visible.map(p => (
            <article className="productCard" key={p.id}>
              <div className="productImage">
                <img src={p.image} alt={p.name}/>
                {p.tag && <span className="productTag">{p.tag}</span>}
                <button className={`heart ${saved.includes(p.id) ? "saved" : ""}`} aria-label="Save item" onClick={() => setSaved(old => old.includes(p.id) ? old.filter(x => x !== p.id) : [...old, p.id])}>
                  <Heart size={18} fill={saved.includes(p.id) ? "currentColor" : "none"}/>
                </button>
                <button className="quickAdd" onClick={() => setBag(old => [...old, p.id])}>ADD TO BAG <Plus size={15}/></button>
              </div>
              <div className="productInfo">
                <div><h3>{p.name}</h3><p>{p.category}</p></div>
                <strong>£{p.price.toFixed(2)}</strong>
              </div>
            </article>
          ))}
        </div>
        {visible.length === 0 && <p className="empty">No pieces found. Try another search.</p>}
      </section>

      <section className="statement">
        <p className="eyebrow light">NOT HERE TO BLEND IN</p>
        <h2>YOUR STYLE.<br/><i>YOUR RULES.</i></h2>
        <a href="#shop" className="outlineButton">EXPLORE THE COLLECTION <ArrowUpRight size={16}/></a>
      </section>

      <footer className="footer">
        <div className="footerTop">
          <div>
            <Link className="wordmark footerLogo" href="/">YUSEE<span>PLUGS</span></Link>
            <p>Everyday essentials.<br/>Unmistakable energy.</p>
          </div>
          <div className="footerLinks">
            <div><b>SHOP</b><a href="#shop">New arrivals</a><a href="#shop">Men</a><a href="#shop">Women</a><a href="#shop">Accessories</a></div>
            <div>
              <b>ACCOUNT</b>
              {adminSignedIn ? (
                <Link href="/admin">Admin dashboard</Link>
              ) : customerSignedIn ? (
                <Link href="/account">My account</Link>
              ) : (
                <>
                  <Link href="/login">Sign in</Link>
                  <Link href="/register">Create account</Link>
                </>
              )}
            </div>
            <div><b>HELP</b><a href="mailto:hello@yuseeplugs.com">Contact us</a><a href="#">Delivery & returns</a><a href="#">FAQs</a></div>
          </div>
        </div>
        <div className="footerBottom"><span>© 2026 YUSEE PLUGS. ALL RIGHTS RESERVED.</span><span>BUILT FOR YOUR EVERYDAY.</span></div>
      </footer>

      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}>
          <aside className="drawer menuDrawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <Link className="wordmark" href="/">YUSEE<span>PLUGS</span></Link>
              <button className="iconButton" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X/></button>
            </div>

            {!authChecked ? (
              <p className="signIn">CHECKING ACCOUNT...</p>
            ) : adminSignedIn ? (
              <>
                <Link className="signIn" href="/admin" onClick={() => setMenuOpen(false)}>
                  ADMIN DASHBOARD <ArrowUpRight size={16}/>
                </Link>
                <button className="signIn" onClick={handleSignOut}>
                  SIGN OUT <ArrowUpRight size={16}/>
                </button>
              </>
            ) : customerSignedIn ? (
              <>
                <Link className="signIn" href="/account" onClick={() => setMenuOpen(false)}>
                  MY ACCOUNT <ArrowUpRight size={16}/>
                </Link>
                <button className="signIn" onClick={handleSignOut}>
                  SIGN OUT <ArrowUpRight size={16}/>
                </button>
              </>
            ) : (
              <>
                <Link className="signIn" href="/login" onClick={() => setMenuOpen(false)}>
                  SIGN IN <ArrowUpRight size={16}/>
                </Link>
                <Link className="signIn" href="/register" onClick={() => setMenuOpen(false)}>
                  CREATE ACCOUNT <ArrowUpRight size={16}/>
                </Link>
              </>
            )}

            <div className="menuGroups">
              {(["Men", "Women"] as const).map(g => (
                <div className="menuGroup" key={g}>
                  <button className="menuHeading" onClick={() => setExpanded(expanded === g ? null : g)}>
                    {g.toUpperCase()} <ChevronDown className={expanded === g ? "rotated" : ""}/>
                  </button>
                  {expanded === g && (
                    <div className="subMenu">
                      {categories[g].map(c => (
                        <a href="#shop" key={c} onClick={() => { setActive(g); setMenuOpen(false); }}>
                          {c}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <a className="menuSimple" href="#shop" onClick={() => setMenuOpen(false)}>NEW ARRIVALS <ArrowUpRight size={16}/></a>
            <p className="drawerNote">GOOD STYLE. NO COMPROMISE.</p>
          </aside>
        </div>
      )}

      {bagOpen && (
        <div className="overlay" onClick={() => setBagOpen(false)}>
          <aside className="drawer bagDrawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <h2>YOUR BAG <span>({bag.length})</span></h2>
              <button className="iconButton" aria-label="Close bag" onClick={() => setBagOpen(false)}><X/></button>
            </div>
            {bag.length === 0 ? (
              <div className="emptyBag">
                <ShoppingBag size={35}/><h3>YOUR BAG IS EMPTY</h3><p>Find your next favourite.</p>
                <button className="blackButton" onClick={() => setBagOpen(false)}>CONTINUE SHOPPING</button>
              </div>
            ) : (
              <>
                <div className="bagLines">
                  {bagItems.map((p, i) => p && (
                    <div className="bagLine" key={`${p.id}-${i}`}>
                      <img src={p.image} alt={p.name}/>
                      <div className="bagLineInfo">
                        <b>{p.name}</b><span>£{p.price.toFixed(2)}</span>
                        <button onClick={() => setBag(old => { const copy = [...old]; copy.splice(i, 1); return copy; })}>REMOVE</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bagCheckout">
                  <div><span>SUBTOTAL</span><b>£{total.toFixed(2)}</b></div>
                  <p>Delivery calculated at checkout.</p>
                  <button className="blackButton" onClick={() => alert("Checkout will be enabled when Stripe is connected.")}>CONTINUE TO CHECKOUT</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
