
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Menu,
  ShoppingBag,
  Search,
  X,
  ArrowUpRight,
  Heart,
  UserRound,
} from "lucide-react";

type Variant = {
  id: string;
  size: string | null;
  colour: string | null;
  delivery: string | null;
  pricePence: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  featured: boolean;
  variants: Variant[];
};

type BagLine = {
  variantId: string;
  quantity: number;
};

function normaliseDelivery(delivery: string | null | undefined) {
  const value = (delivery || "UK").trim().toLowerCase();

  if (value === "uk" || value === "gb" || value.includes("united kingdom")) {
    return "uk";
  }

  if (value === "cn" || value === "china") {
    return "china";
  }

  return value;
}

function getGender(category: string | null) {
  return category?.split("/")[0]?.trim().toLowerCase() || "";
}

function getCategory(category: string | null) {
  const parts = category?.split("/") || [];
  return parts.length > 1 ? parts.slice(1).join("/").trim() : "";
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState("All");

  const [bag, setBag] = useState<BagLine[]>([]);
  const [bagReady, setBagReady] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [customerSignedIn, setCustomerSignedIn] = useState(false);
  const [adminSignedIn, setAdminSignedIn] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Could not load products.");

        setProducts(Array.isArray(data.products) ? data.products : []);
      } catch (error) {
        setProductsError(
          error instanceof Error ? error.message : "Could not load products."
        );
      } finally {
        setProductsLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("yusee_bag");
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
    if (bagReady) localStorage.setItem("yusee_bag", JSON.stringify(bag));
  }, [bag, bagReady]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const [customerResponse, adminResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/admin/me", { cache: "no-store" }),
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
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;

    const currentId = selectedVariants[selectedProduct.id];
    const chosen =
      selectedProduct.variants.find(v => v.id === currentId && v.stock > 0) ||
      selectedProduct.variants.find(v => v.stock > 0) ||
      selectedProduct.variants[0];

    if (chosen) {
      setSelectedVariants(old => ({
        ...old,
        [selectedProduct.id]: chosen.id,
      }));
    }
  }, [selectedProduct]);

  const visible = useMemo(() => {
    return products.filter(product => {
      const gender = getGender(product.category);
      const category = getCategory(product.category);

      const matchesFilter =
        active === "All" ||
        gender === active.toLowerCase() ||
        category.toLowerCase() === active.toLowerCase();

      const matchesSearch = product.name
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [products, active, query]);

  const featuredProducts = products.filter(product => product.featured === true);

  function selectGender(gender: "men" | "women") {
    setActive(gender === "men" ? "Men" : "Women");
    setQuery("");
    setMenuOpen(false);
    setSearchOpen(false);

    setTimeout(() => {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function selectElectronics() {
    setActive("Electronics");
    setQuery("");
    setMenuOpen(false);
    setSearchOpen(false);

    setTimeout(() => {
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  function getSelectedVariant(product: Product) {
    const selectedId = selectedVariants[product.id];

    return (
      product.variants.find(v => v.id === selectedId) ||
      product.variants.find(v => v.stock > 0) ||
      product.variants[0]
    );
  }

  function changeSize(product: Product, size: string) {
    const current = getSelectedVariant(product);

    const match =
      product.variants.find(
        v =>
          v.size === size &&
          v.colour === current?.colour &&
          v.delivery === current?.delivery &&
          v.stock > 0
      ) ||
      product.variants.find(v => v.size === size && v.stock > 0) ||
      product.variants.find(v => v.size === size);

    if (match) setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
  }

  function changeColour(product: Product, colour: string) {
    const current = getSelectedVariant(product);

    const match =
      product.variants.find(
        v =>
          v.colour === colour &&
          v.size === current?.size &&
          v.delivery === current?.delivery &&
          v.stock > 0
      ) ||
      product.variants.find(v => v.colour === colour && v.stock > 0) ||
      product.variants.find(v => v.colour === colour);

    if (match) setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
  }

  function changeDelivery(product: Product, delivery: string) {
    const current = getSelectedVariant(product);

    const match =
      product.variants.find(
        v =>
          v.delivery === delivery &&
          v.size === current?.size &&
          v.colour === current?.colour &&
          v.stock > 0
      ) ||
      product.variants.find(v => v.delivery === delivery && v.stock > 0) ||
      product.variants.find(v => v.delivery === delivery);

    if (match) setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
  }

  function addToBag(variant: Variant) {
    const selectedDelivery = normaliseDelivery(variant.delivery);

    const existingDeliveries = bag
      .map(line => {
        const existingVariant = products
          .flatMap(product => product.variants)
          .find(v => v.id === line.variantId);

        return existingVariant
          ? normaliseDelivery(existingVariant.delivery)
          : null;
      })
      .filter(Boolean);

    if (existingDeliveries.some(delivery => delivery !== selectedDelivery)) {
      alert(
        "Your bag already contains a different delivery type. Please checkout or remove those items before adding this product."
      );
      return;
    }

    setBag(old => {
      const existing = old.find(item => item.variantId === variant.id);

      if (existing) {
        return old.map(item =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...old, { variantId: variant.id, quantity: 1 }];
    });

    setSelectedProduct(null);
    setBagOpen(true);
  }

  async function startCheckout(items: BagLine[]) {
    if (!items.length) return;

    const deliveries = new Set(
      items.map(item => {
        const variant = products.flatMap(p => p.variants).find(
          v => v.id === item.variantId
        );
        return normaliseDelivery(variant?.delivery);
      })
    );

    if (deliveries.size > 1) {
      alert(
        "Your bag contains mixed delivery types. Please remove items until your bag contains only UK or China delivery."
      );
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

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not start checkout.");
      setCheckoutLoading(false);
    }
  }

  const bagItems = bag
    .map(line => {
      const product = products.find(p =>
        p.variants.some(v => v.id === line.variantId)
      );
      const variant = product?.variants.find(v => v.id === line.variantId);

      if (!product || !variant) return null;
      return { ...line, product, variant };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  const total = bagItems.reduce(
    (sum, item) => sum + item.variant.pricePence * item.quantity,
    0
  );

  const modalVariant = selectedProduct
    ? getSelectedVariant(selectedProduct)
    : undefined;

  const modalSizes = selectedProduct
    ? Array.from(new Set(selectedProduct.variants.map(v => v.size).filter(Boolean))) as string[]
    : [];

  const modalColours = selectedProduct
    ? Array.from(new Set(selectedProduct.variants.map(v => v.colour).filter(Boolean))) as string[]
    : [];

  const modalDeliveries = selectedProduct
    ? Array.from(new Set(selectedProduct.variants.map(v => v.delivery).filter(Boolean))) as string[]
    : [];

  function productPrice(product: Product) {
    if (!product.variants.length) return null;
    const cheapest = Math.min(...product.variants.map(v => v.pricePence));
    return `£${(cheapest / 100).toFixed(2)}`;
  }

  return (
    <main className="site">
      <header className="header">
        <button className="headerIcon menuIcon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
          <Menu size={27} strokeWidth={1.7} />
        </button>

        <Link href="/" className="logo">YUSEE PLUGS</Link>

        <div className="headerRight">
          <button className="headerIcon" aria-label="Search" onClick={() => setSearchOpen(old => !old)}>
            <Search size={23} strokeWidth={1.7} />
          </button>

          <Link className="headerIcon" aria-label="My account" href={adminSignedIn ? "/admin" : customerSignedIn ? "/account" : "/login"}>
            <UserRound size={23} strokeWidth={1.7} />
          </Link>

          <button className="headerIcon bagIcon" aria-label="Open shopping bag" onClick={() => setBagOpen(true)}>
            <ShoppingBag size={23} strokeWidth={1.7} />
            <span className="bagCount">{bagCount}</span>
          </button>
        </div>
      </header>

      <nav className="genderNav">
        <div className="genderRow">
          <button onClick={() => selectGender("men")}>MENS</button>
          <button onClick={() => selectGender("women")}>WOMENS</button>
        </div>
        <button className="electronicsNav" onClick={selectElectronics}>ELECTRONICS</button>
      </nav>

      {searchOpen && (
        <div className="searchPanel">
          <Search size={19} />
          <input autoFocus placeholder="Search products..." value={query} onChange={e => { setQuery(e.target.value); setActive("All"); }} />
          <button aria-label="Close search" onClick={() => { setSearchOpen(false); setQuery(""); }}>
            <X size={20} />
          </button>
        </div>
      )}

      <section className="hero">
        <div className="heroImage" />
        <div className="heroOverlay" />
        <div className="heroContent">
          <p className="heroEyebrow">YUSEE PLUGS</p>
          <h1>SHOP<br />MEN</h1>
          <p className="heroSub">PREMIUM STREETWEAR. ELEVATED.</p>
          <button className="heroButton" onClick={() => selectGender("men")}>
            SHOP MEN <ArrowUpRight size={20} />
          </button>
        </div>
        <div className="heroBottom">
          <span>01 / 01</span>
          <span className="heroProgress"><i /></span>
          <span className="heroCollection">YUSEE PLUGS / NEW COLLECTION</span>
        </div>
      </section>

      <section className="featured" id="featured">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">THE LATEST ROTATION</p>
            <h2>FEATURED PRODUCTS</h2>
          </div>
          <button className="viewAll" onClick={() => { setActive("All"); document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" }); }}>
            VIEW ALL <ArrowUpRight size={17} />
          </button>
        </div>

        {productsLoading ? (
          <p className="statusMessage">LOADING PRODUCTS...</p>
        ) : productsError ? (
          <p className="statusMessage">{productsError}</p>
        ) : featuredProducts.length === 0 ? (
          <p className="statusMessage">NO FEATURED PRODUCTS SELECTED.</p>
        ) : (
          <div className="featuredGrid">
            {featuredProducts.map(product => {
              const price = productPrice(product);
              const inStock = product.variants.some(v => v.stock > 0);

              return (
                <article className="featuredCard" key={product.id}>
                  <button className="featuredImage" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.name}`}>
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span className="noImage">YUSEE PLUGS</span>}
                    {!inStock && <span className="soldOut">SOLD OUT</span>}
                  </button>
                  <button className={`saveButton ${saved.includes(product.id) ? "isSaved" : ""}`} aria-label="Save product" onClick={() => setSaved(old => old.includes(product.id) ? old.filter(id => id !== product.id) : [...old, product.id])}>
                    <Heart size={21} fill={saved.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                  <button className="featuredInfo" onClick={() => setSelectedProduct(product)}>
                    <span>{product.name}</span>
                    {price && <b>{price}</b>}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="shopSection" id="shop">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">SHOP THE COLLECTION</p>
            <h2>{active === "All" ? "ALL PRODUCTS" : `${active.toUpperCase()} COLLECTION`}</h2>
          </div>
          <span className="pieceCount">{productsLoading ? "..." : `${visible.length} ITEMS`}</span>
        </div>

        <div className="shopFilters">
          <button className={active === "All" ? "selectedFilter" : ""} onClick={() => setActive("All")}>ALL</button>
          <button className={active === "Men" ? "selectedFilter" : ""} onClick={() => setActive("Men")}>MENS</button>
          <button className={active === "Women" ? "selectedFilter" : ""} onClick={() => setActive("Women")}>WOMENS</button>
          <button className={active === "Electronics" ? "selectedFilter" : ""} onClick={() => setActive("Electronics")}>ELECTRONICS</button>
          {query && <span>SEARCH: {query}</span>}
        </div>

        {productsLoading ? (
          <p className="statusMessage">LOADING PRODUCTS...</p>
        ) : productsError ? (
          <p className="statusMessage">{productsError}</p>
        ) : visible.length === 0 ? (
          <p className="statusMessage">NO PRODUCTS FOUND.</p>
        ) : (
          <div className="shopGrid">
            {visible.map(product => {
              const price = productPrice(product);
              const inStock = product.variants.some(v => v.stock > 0);

              return (
                <article className="shopCard" key={product.id}>
                  <button className="shopImage" onClick={() => setSelectedProduct(product)} aria-label={`View ${product.name}`}>
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} /> : <span className="noImage">YUSEE PLUGS</span>}
                    {!inStock && <span className="soldOut">SOLD OUT</span>}
                  </button>
                  <button className={`saveButton ${saved.includes(product.id) ? "isSaved" : ""}`} aria-label="Save product" onClick={() => setSaved(old => old.includes(product.id) ? old.filter(id => id !== product.id) : [...old, product.id])}>
                    <Heart size={20} fill={saved.includes(product.id) ? "currentColor" : "none"} />
                  </button>
                  <button className="shopInfo" onClick={() => setSelectedProduct(product)}>
                    <span>{product.name}</span>
                    {price && <b>{price}</b>}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <div className="footerTop">
          <div className="footerBrand">
            <Link href="/" className="footerLogo">YUSEE PLUGS</Link>
            <p>YOUR STYLE. YOUR RULES.</p>
          </div>
        </div>

        <div className="footerAccordion">
          <details>
            <summary><span>CUSTOMER SERVICE</span><span className="footerPlus">+</span></summary>
            <div className="footerAccordionContent">
              <Link href="/delivery">DELIVERY INFORMATION</Link>
              <Link href="/returns">RETURNS & REFUNDS</Link>
              <a href="mailto:hello@yuseeplugs.com">CONTACT US</a>
              <Link href="/faq">FAQ</Link>
            </div>
          </details>
          <details>
            <summary><span>ELEVATE YOUR EVERYDAY</span><span className="footerPlus">+</span></summary>
            <div className="footerAccordionContent newsletterContent">
              <p>JOIN THE YUSEE PLUGS COMMUNITY FOR NEW DROPS, EXCLUSIVE UPDATES AND MORE.</p>
              <form className="newsletterForm" onSubmit={e => { e.preventDefault(); alert("Newsletter signup is not yet connected."); }}>
                <input type="email" placeholder="ENTER YOUR EMAIL ADDRESS" aria-label="Email address" required />
                <button type="submit">SIGN UP <ArrowUpRight size={18} /></button>
              </form>
              <p className="newsletterDisclaimer">BY SIGNING UP, YOU AGREE TO RECEIVE EMAIL UPDATES FROM YUSEE PLUGS.</p>
            </div>
          </details>
        </div>

        <div className="footerPayments">
          <span className="paymentLogo visa">VISA</span>
          <span className="paymentLogo mastercard">mastercard</span>
          <span className="paymentLogo amex">AMEX</span>
          <span className="paymentLogo paypal">PayPal</span>
          <span className="paymentLogo applepay">Apple Pay</span>
          <span className="paymentLogo klarna">Klarna.</span>
        </div>

        <div className="footerCountry">
          <label htmlFor="footerCountrySelect">COUNTRY / REGION</label>
          <select id="footerCountrySelect" defaultValue="uk">
            <option value="uk">United Kingdom (GBP £)</option>
          </select>
        </div>

        <div className="footerBottom">
          <p>© 2026 YUSEE PLUGS. ALL RIGHTS RESERVED.</p>
          <p>BUILT FOR YOUR EVERYDAY.</p>
        </div>
      </footer>

      {selectedProduct && (
        <div className="modalBackdrop" onClick={() => setSelectedProduct(null)}>
          <section className="productModal" role="dialog" aria-modal="true" aria-label={selectedProduct.name} onClick={e => e.stopPropagation()}>
            <button className="modalClose" aria-label="Close product" onClick={() => setSelectedProduct(null)}>
              <X />
            </button>
            <div className="modalImage">
              {selectedProduct.imageUrl ? <img src={selectedProduct.imageUrl} alt={selectedProduct.name} /> : <span className="noImage">YUSEE PLUGS</span>}
            </div>
            <div className="modalDetails">
              <p className="eyebrow">YUSEE PLUGS</p>
              <h2>{selectedProduct.name}</h2>
              {modalVariant && <strong className="modalPrice">£{(modalVariant.pricePence / 100).toFixed(2)}</strong>}
              {selectedProduct.description && <p className="modalDescription">{selectedProduct.description}</p>}

              {modalSizes.length > 0 && (
                <label className="variantLabel">
                  SIZE
                  <select value={modalVariant?.size || ""} onChange={e => changeSize(selectedProduct, e.target.value)}>
                    {modalSizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                        {!selectedProduct.variants.some(v => v.size === size && v.stock > 0) ? " — SOLD OUT" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {modalColours.length > 0 && (
                <label className="variantLabel">
                  COLOUR
                  <select value={modalVariant?.colour || ""} onChange={e => changeColour(selectedProduct, e.target.value)}>
                    {modalColours.map(colour => (
                      <option key={colour} value={colour}>
                        {colour}
                        {!selectedProduct.variants.some(v => v.colour === colour && v.stock > 0) ? " — SOLD OUT" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {modalDeliveries.length > 0 && (
                <label className="variantLabel">
                  DELIVERY
                  <select value={modalVariant?.delivery || ""} onChange={e => changeDelivery(selectedProduct, e.target.value)}>
                    {modalDeliveries.map(delivery => (
                      <option key={delivery} value={delivery}>
                        {delivery}
                        {!selectedProduct.variants.some(v => v.delivery === delivery && v.stock > 0) ? " — SOLD OUT" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <p className={`stockText ${modalVariant?.stock ? "inStock" : "outStock"}`}>
                {modalVariant ? modalVariant.stock > 0 ? `${modalVariant.stock} AVAILABLE` : "THIS OPTION IS SOLD OUT" : "NO OPTIONS AVAILABLE"}
              </p>

              <button className="modalPrimary" disabled={!modalVariant || modalVariant.stock < 1} onClick={() => modalVariant && addToBag(modalVariant)}>
                ADD TO BAG
              </button>

              <button className="modalSecondary" disabled={checkoutLoading || !modalVariant || modalVariant.stock < 1} onClick={() => modalVariant && startCheckout([{ variantId: modalVariant.id, quantity: 1 }])}>
                {checkoutLoading ? "CONNECTING..." : "BUY NOW"}
              </button>

              <p className="deliveryNote">
                {modalVariant?.delivery ? `${modalVariant.delivery.toUpperCase()} DELIVERY AVAILABLE` : "DELIVERY AVAILABLE"}
              </p>
            </div>
          </section>
        </div>
      )}

      {menuOpen && (
        <div className="drawerBackdrop" onClick={() => setMenuOpen(false)}>
          <aside className="drawer menuDrawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHeader">
              <Link href="/" className="logo">YUSEE PLUGS</Link>
              <button className="headerIcon" aria-label="Close menu" onClick={() => setMenuOpen(false)}><X /></button>
            </div>
            <div className="drawerGroup"><button onClick={() => selectGender("men")}>MENS</button></div>
            <div className="drawerGroup"><button onClick={() => selectGender("women")}>WOMENS</button></div>
            <div className="drawerGroup"><button onClick={selectElectronics}>ELECTRONICS</button></div>
          </aside>
        </div>
      )}

      {bagOpen && (
        <div className="drawerBackdrop" onClick={() => setBagOpen(false)}>
          <aside className="drawer bagDrawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHeader">
              <h2>YOUR BAG ({bagCount})</h2>
              <button className="headerIcon" aria-label="Close bag" onClick={() => setBagOpen(false)}><X /></button>
            </div>

            {bagItems.length === 0 ? (
              <div className="emptyBag">
                <ShoppingBag size={36} />
                <h3>YOUR BAG IS EMPTY</h3>
                <p>Find your next favourite.</p>
                <button className="checkoutButton" onClick={() => setBagOpen(false)}>CONTINUE SHOPPING</button>
              </div>
            ) : (
              <>
                <div className="bagLines">
                  {bagItems.map(item => (
                    <div className="bagLine" key={item.variantId}>
                      {item.product.imageUrl ? <img src={item.product.imageUrl} alt={item.product.name} /> : <div className="bagNoImage">YUSEE</div>}
                      <div className="bagLineDetails">
                        <b>{item.product.name}</b>
                        {item.variant.size && <span>Size: {item.variant.size}</span>}
                        {item.variant.colour && <span>Colour: {item.variant.colour}</span>}
                        {item.variant.delivery && <span>Delivery: {item.variant.delivery}</span>}
                        <span>£{(item.variant.pricePence / 100).toFixed(2)} × {item.quantity}</span>
                        <button onClick={() => setBag(old => old.filter(line => line.variantId !== item.variantId))}>REMOVE</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bagSummary">
                  <div>
                    <span>SUBTOTAL</span>
                    <b>£{(total / 100).toFixed(2)}</b>
                  </div>
                  <p>Delivery is included in the selected product price. Your delivery type is shown beside each item.</p>
                  <button className="checkoutButton" disabled={checkoutLoading} onClick={() => startCheckout(bagItems.map(item => ({ variantId: item.variantId, quantity: item.quantity })))}>
                    {checkoutLoading ? "CONNECTING TO STRIPE..." : "CHECKOUT"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <style jsx>{`
        .site{min-height:100vh;background:#090909;color:#f7f7f7;font-family:Arial,Helvetica,sans-serif}
        button{font:inherit}
        .header{height:66px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:0 26px;background:#050505;border-bottom:1px solid #292929;position:relative;z-index:5}
        .logo{color:#fff;text-decoration:none;font-size:clamp(19px,3vw,27px);font-weight:950;letter-spacing:-1px;white-space:nowrap}
        .headerIcon{border:0;background:transparent;color:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:8px;position:relative;text-decoration:none}
        .menuIcon{justify-self:start;padding-left:0}
        .headerRight{justify-self:end;display:flex;align-items:center;gap:13px}
        .bagCount{position:absolute;top:0;right:0;min-width:16px;height:16px;padding:0 4px;border-radius:20px;background:#fff;color:#000;font-size:10px;font-weight:800;display:grid;place-items:center}
        .genderNav{display:flex;flex-direction:column;padding:12px 18px;background:#080808;border-bottom:1px solid #333}
        .genderRow{display:grid;grid-template-columns:1fr 1fr;width:100%}
        .genderRow button{min-height:52px;background:transparent;border:0;color:#fff;font-size:16px;font-weight:900;cursor:pointer;letter-spacing:1px}
        .genderRow button+button{border-left:1px solid #333}
        .electronicsNav{display:block;width:100%;min-height:52px;padding:15px;background:#fff;color:#080808;border:0;font-size:15px;font-weight:950;letter-spacing:1.5px;cursor:pointer;transition:background .2s,color .2s}
        .electronicsNav:hover{background:#d9d9d9}
        .searchPanel{display:flex;align-items:center;gap:12px;padding:14px 24px;background:#171717;border-bottom:1px solid #333}
        .searchPanel input{flex:1;min-width:0;background:transparent;color:#fff;border:0;outline:none;font-size:15px}
        .searchPanel button{border:0;background:transparent;color:#fff;cursor:pointer}
        .hero{min-height:min(690px,76vw);height:590px;max-height:78vh;position:relative;display:flex;align-items:center;overflow:hidden;background:#171717}
        .heroImage{position:absolute;inset:0;background-image:url("/F126698D-BFBB-4540-9DFD-67723C1C9EC3.png");background-size:cover;background-position:center 38%;transform:scale(1.01)}
        .heroOverlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(0,0,0,.76) 0%,rgba(0,0,0,.48) 43%,rgba(0,0,0,.08) 100%),linear-gradient(0deg,rgba(0,0,0,.48),transparent 28%)}
        .heroContent{position:relative;z-index:1;padding:50px 5%;max-width:590px}
        .heroEyebrow{font-size:13px;letter-spacing:2.5px;margin:0 0 18px}
        .heroContent h1{font-size:clamp(66px,10vw,112px);line-height:.82;letter-spacing:-5px;font-weight:950;margin:0}
        .heroSub{font-size:11px;letter-spacing:2px;margin:22px 0 30px}
        .heroButton{min-width:220px;min-height:54px;padding:0 22px;display:inline-flex;align-items:center;justify-content:space-between;gap:28px;color:#fff;background:transparent;border:1px solid #fff;font-size:13px;font-weight:800;cursor:pointer}
        .heroButton:hover{background:#fff;color:#000}
        .heroBottom{position:absolute;z-index:1;bottom:24px;left:3.5%;right:3.5%;display:flex;align-items:center;gap:16px;font-size:11px;letter-spacing:1px}
        .heroProgress{width:150px;height:3px;background:rgba(255,255,255,.3)}
        .heroProgress i{display:block;width:33%;height:100%;background:#fff}
        .heroCollection{margin-left:auto;opacity:.8}
        .featured,.shopSection{padding:58px 3.5%}
        .featured{background:#090909}
        .sectionHeading{display:flex;justify-content:space-between;align-items:end;gap:18px;margin-bottom:26px}
        .eyebrow{color:#aaa;font-size:10px;letter-spacing:2.5px;margin:0 0 8px}
        .sectionHeading h2{font-size:clamp(25px,4vw,39px);line-height:1;letter-spacing:-1.3px;font-weight:950;margin:0}
        .viewAll{color:#fff;background:transparent;border:0;display:flex;align-items:center;gap:12px;font-size:11px;font-weight:800;cursor:pointer;white-space:nowrap}
        .featuredGrid,.shopGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}
        .featuredCard,.shopCard{position:relative;min-width:0}
        .featuredImage,.shopImage{position:relative;display:block;width:100%;aspect-ratio:1/1.08;padding:0;overflow:hidden;border:0;background:#242424;cursor:pointer;text-align:center}
        .featuredImage img,.shopImage img{display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s}
        .featuredImage:hover img,.shopImage:hover img{transform:scale(1.04)}
        .noImage{height:100%;width:100%;min-height:180px;display:grid;place-items:center;color:#777;font-weight:900;letter-spacing:2px;font-size:13px}
        .saveButton{position:absolute;right:12px;top:12px;width:36px;height:36px;display:grid;place-items:center;border:0;background:rgba(0,0,0,.2);color:white;cursor:pointer}
        .saveButton.isSaved{color:#fff}
        .soldOut{position:absolute;left:10px;bottom:10px;padding:7px 9px;background:#fff;color:#111;font-size:9px;font-weight:900;letter-spacing:1px}
        .featuredInfo,.shopInfo{width:100%;display:flex;flex-direction:column;align-items:flex-start;gap:6px;margin-top:12px;padding:0;border:0;color:#fff;background:transparent;text-align:left;cursor:pointer}
        .featuredInfo span,.shopInfo span{font-size:13px;font-weight:700;line-height:1.35}
        .featuredInfo b,.shopInfo b{font-size:13px;font-weight:500}
        .shopSection{background:#111;border-top:1px solid #252525}
        .pieceCount{color:#aaa;font-size:10px;letter-spacing:1px;white-space:nowrap}
        .shopFilters{display:flex;gap:22px;align-items:center;flex-wrap:wrap;margin:0 0 25px;padding-bottom:13px;border-bottom:1px solid #333}
        .shopFilters button{padding:0 0 8px;border:0;border-bottom:2px solid transparent;background:transparent;color:#999;font-size:10px;font-weight:800;letter-spacing:1px;cursor:pointer}
        .shopFilters button.selectedFilter{color:#fff;border-bottom-color:#fff}
        .shopFilters span{margin-left:auto;color:#999;font-size:10px;overflow:hidden;text-overflow:ellipsis}
        .statusMessage{padding:42px 10px;text-align:center;color:#aaa;font-size:12px;letter-spacing:1px}
        .footer{background:#252525;color:#fff;padding:45px 5% 22px;border-top:1px solid #333}
        .footer,.footer *{font-family:Arial,Helvetica,sans-serif;box-sizing:border-box}
        .footerTop{padding-bottom:35px}
        .footerLogo{display:inline-block;font-size:30px;font-weight:950;letter-spacing:-1.5px;color:#fff;text-decoration:none}
        .footerBrand p{font-size:12px;letter-spacing:2px;color:#aaa;margin:12px 0 0}
        .footerAccordion{border-top:1px solid #484848}
        .footerAccordion details{border-bottom:1px solid #484848}
        .footerAccordion summary{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:25px 0;list-style:none;cursor:pointer;font-size:19px;font-weight:900;letter-spacing:.5px}
        .footerAccordion summary::-webkit-details-marker{display:none}
        .footerPlus{font-size:25px;font-weight:300;transition:transform .2s}
        .footerAccordion details[open] .footerPlus{transform:rotate(45deg)}
        .footerAccordionContent{display:flex;flex-direction:column;align-items:flex-start;gap:19px;padding:0 0 28px}
        .footerAccordionContent a{color:#ccc;text-decoration:none;font-size:14px;letter-spacing:.5px;transition:color .2s}
        .footerAccordionContent a:hover{color:#fff}
        .newsletterContent>p{color:#bcbcbc;font-size:12px;line-height:1.8;letter-spacing:1px;max-width:450px;margin:0}
        .newsletterForm{display:flex;width:100%;max-width:500px;border-bottom:1px solid #fff;align-items:center}
        .newsletterForm input{flex:1;min-width:0;background:transparent;border:0;outline:none;color:#fff;padding:17px 5px;font-size:12px;letter-spacing:1px}
        .newsletterForm input::placeholder{color:#999}
        .newsletterForm button{display:flex;align-items:center;gap:10px;padding:14px 5px 14px 15px;border:0;background:transparent;color:#fff;cursor:pointer;font-size:12px;font-weight:900;letter-spacing:1px;white-space:nowrap}
        .newsletterDisclaimer{font-size:10px!important;color:#888!important;line-height:1.7;letter-spacing:.6px}
        .footerPayments{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:30px 0;border-bottom:1px solid #484848}
        .paymentLogo{display:inline-flex;align-items:center;justify-content:center;min-width:49px;height:31px;padding:5px 9px;background:#f5f5f5;color:#111;border-radius:4px;font-size:12px;font-weight:900;letter-spacing:.2px}
        .mastercard{font-size:10px;font-weight:800}.paypal{font-style:italic}.applepay{font-size:10px}.klarna{font-size:11px;font-weight:950}
        .footerCountry{display:flex;flex-direction:column;gap:12px;padding:30px 0;border-bottom:1px solid #484848}
        .footerCountry label{font-size:11px;font-weight:800;letter-spacing:1.5px}
        .footerCountry select{width:fit-content;min-width:220px;padding:14px 40px 14px 15px;background:#fff;color:#111;border:1px solid #fff;border-radius:0;font-size:13px}
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
        .inStock{color:#397348}.outStock{color:#b3261e}
        .modalPrimary,.modalSecondary{width:100%;padding:16px;font-size:11px;font-weight:900;letter-spacing:1.4px;cursor:pointer}
        .modalPrimary{background:#111;color:#fff;border:1px solid #111}
        .modalSecondary{background:transparent;color:#111;border:1px solid #111}
        .modalPrimary:disabled,.modalSecondary:disabled{opacity:.4;cursor:not-allowed}
        .deliveryNote{text-align:center;color:#777;font-size:10px;letter-spacing:1px}
        .drawerBackdrop{justify-content:flex-start;align-items:stretch;padding:0}
        .drawer{width:min(420px,90vw);height:100%;overflow-y:auto;padding:24px;background:#0b0b0b;color:#fff;box-shadow:10px 0 35px rgba(0,0,0,.35)}
        .bagDrawer{margin-left:auto;box-shadow:-10px 0 35px rgba(0,0,0,.35)}
        .drawerHeader{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-bottom:22px;border-bottom:1px solid #333}
        .drawerHeader h2{font-size:17px;letter-spacing:1px}
        .drawerGroup{border-bottom:1px solid #292929}
        .drawerGroup>button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:19px 0;background:transparent;border:0;color:#fff;font-size:13px;font-weight:900;letter-spacing:1.5px;cursor:pointer}
        .bagLines{padding:20px 0}
        .bagLine{display:flex;gap:14px;padding:15px 0;border-bottom:1px solid #292929}
        .bagLine img,.bagNoImage{width:90px;height:110px;object-fit:cover;background:#252525}
        .bagNoImage{display:grid;place-items:center;font-size:10px;font-weight:900}
        .bagLineDetails{display:flex;flex-direction:column;align-items:flex-start;gap:7px;font-size:11px}
        .bagLineDetails span{color:#aaa}
        .bagLineDetails button{padding:0;margin-top:4px;border:0;background:transparent;color:#fff;text-decoration:underline;font-size:9px;cursor:pointer}
        .bagSummary{position:sticky;bottom:0;padding:18px 0;background:#0b0b0b;border-top:1px solid #333}
        .bagSummary>div{display:flex;justify-content:space-between;font-size:13px}
        .bagSummary p,.emptyBag p{color:#999;font-size:11px;line-height:1.6}
        .checkoutButton{width:100%;padding:16px;border:0;background:#fff;color:#000;font-size:11px;font-weight:900;letter-spacing:1px;cursor:pointer}
        .checkoutButton:disabled{opacity:.5}
        .emptyBag{min-height:65vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center}
        .emptyBag h3{font-size:14px;letter-spacing:1px}
        @media(max-width:760px){
          .header{height:62px;padding:0 13px}
          .logo{font-size:19px}
          .headerRight{gap:3px}
          .headerRight .headerIcon{padding:7px}
          .genderNav{padding:10px 12px}
          .genderRow button{min-height:48px;font-size:15px}
          .electronicsNav{min-height:48px;font-size:14px}
          .hero{height:590px;min-height:590px;max-height:none}
          .heroImage{background-position:60% center}
          .heroOverlay{background:linear-gradient(90deg,rgba(0,0,0,.76),rgba(0,0,0,.12)),linear-gradient(0deg,rgba(0,0,0,.5),transparent 35%)}
          .heroContent{padding:30px 22px}
          .heroContent h1{font-size:clamp(67px,17vw,95px);letter-spacing:-4px}
          .heroSub{font-size:9px;letter-spacing:1.4px}
          .heroBottom{left:20px;right:20px;bottom:20px}
          .heroCollection{display:none}
          .featured,.shopSection{padding:38px 15px}
          .sectionHeading{align-items:end;margin-bottom:20px}
          .sectionHeading h2{font-size:clamp(22px,6vw,30px)}
          .viewAll{font-size:9px;gap:5px}
          .featuredGrid,.shopGrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:22px 12px}
          .featuredInfo span,.shopInfo span{font-size:11px}
          .featuredInfo b,.shopInfo b{font-size:11px}
          .saveButton{top:7px;right:7px;width:31px;height:31px}
          .shopFilters{gap:16px}
          .productModal{grid-template-columns:1fr;max-width:480px}
          .modalImage,.modalImage img{min-height:260px;max-height:42vh}
          .modalDetails{gap:13px;padding:22px}
          .modalDetails h2{font-size:27px}
          .footer{padding:35px 18px 18px}
          .footerLogo{font-size:25px}
          .footerAccordion summary{font-size:16px;padding:23px 0}
          .footerAccordionContent a{font-size:13px}
          .footerPayments{gap:8px;padding:25px 0}
          .paymentLogo{height:29px;min-width:43px;font-size:10px;padding:4px 7px}
          .footerCountry select{width:100%;max-width:300px}
          .footerBottom{flex-direction:column;gap:8px}
        }
        @media(min-width:761px) and (max-width:1050px){
          .featuredGrid,.shopGrid{grid-template-columns:repeat(3,minmax(0,1fr))}
        }
      `}</style>
    </main>
  );
}
