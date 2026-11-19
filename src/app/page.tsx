
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  ShoppingBag,
  Search,
  X,
  ArrowUpRight,
  Plus,
  Heart,
  ChevronDown
} from "lucide-react";

type Variant = {
  id: string;
  size: string | null;
  colour: string | null;
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
  variants: Variant[];
};

type BagLine = {
  variantId: string;
  quantity: number;
};

function getGender(category: string | null) {
  return category?.split("/")[0]?.trim() || "Other";
}

function getCategory(category: string | null) {
  const parts = category?.split("/") || [];
  return parts.length > 1
    ? parts.slice(1).join("/").trim()
    : parts[0]?.trim() || "Other";
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [bag, setBag] = useState<BagLine[]>([]);
  const [bagReady, setBagReady] = useState(false);
  const [expanded, setExpanded] = useState<"Men" | "Women" | null>(null);
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customerSignedIn, setCustomerSignedIn] = useState(false);
  const [adminSignedIn, setAdminSignedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store"
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load products.");
        }

        setProducts(data.products || []);
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

        if (Array.isArray(parsed)) {
          setBag(parsed);
        }
      }
    } catch {
      localStorage.removeItem("yusee_bag");
    } finally {
      setBagReady(true);
    }
  }, []);

  useEffect(() => {
    if (bagReady) {
      localStorage.setItem("yusee_bag", JSON.stringify(bag));
    }
  }, [bag, bagReady]);

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

  useEffect(() => {
    if (!selectedProduct) return;

    const original = selectedVariants[selectedProduct.id];

    const available =
      selectedProduct.variants.find(
        variant => variant.id === original && variant.stock > 0
      ) ||
      selectedProduct.variants.find(variant => variant.stock > 0) ||
      selectedProduct.variants[0];

    if (available) {
      setSelectedVariants(old => ({
        ...old,
        [selectedProduct.id]: available.id
      }));
    }
  }, [selectedProduct]);

  const filters = useMemo(() => {
    const genders = products
      .map(p => getGender(p.category))
      .filter(g => g !== "Other");

    const subcategories = products
      .map(p => getCategory(p.category))
      .filter(Boolean);

    return [
      "All",
      ...Array.from(new Set(genders)),
      ...Array.from(new Set(subcategories))
    ];
  }, [products]);

  const visible = useMemo(() => {
    return products.filter(p => {
      const matchesFilter =
        active === "All" ||
        getGender(p.category) === active ||
        getCategory(p.category) === active;

      const matchesSearch = p.name
        .toLowerCase()
        .includes(query.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [products, active, query]);

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
          v.stock > 0
      ) ||
      product.variants.find(
        v => v.size === size && v.stock > 0
      ) ||
      product.variants.find(v => v.size === size);

    if (match) {
      setSelectedVariants(old => ({
        ...old,
        [product.id]: match.id
      }));
    }
  }

  function changeColour(product: Product, colour: string) {
    const current = getSelectedVariant(product);

    const match =
      product.variants.find(
        v =>
          v.colour === colour &&
          v.size === current?.size &&
          v.stock > 0
      ) ||
      product.variants.find(
        v => v.colour === colour && v.stock > 0
      ) ||
      product.variants.find(v => v.colour === colour);

    if (match) {
      setSelectedVariants(old => ({
        ...old,
        [product.id]: match.id
      }));
    }
  }

  function addToBag(variant: Variant) {
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
    if (items.length === 0) return;

    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ items })
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Could not start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not start checkout."
      );

      setCheckoutLoading(false);
    }
  }

  async function buyNow(variant: Variant) {
    if (variant.stock < 1) return;

    await startCheckout([
      {
        variantId: variant.id,
        quantity: 1
      }
    ]);
  }

  const bagItems = bag
    .map(line => {
      const product = products.find(p =>
        p.variants.some(v => v.id === line.variantId)
      );

      const variant = product?.variants.find(
        v => v.id === line.variantId
      );

      if (!product || !variant) return null;

      return { ...line, product, variant };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  const total = bagItems.reduce(
    (sum, item) => sum + item.variant.pricePence * item.quantity,
    0
  );

  async function handleCheckout() {
    await startCheckout(
      bagItems.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity
      }))
    );
  }

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

  const modalVariant = selectedProduct
    ? getSelectedVariant(selectedProduct)
    : undefined;

  const modalSizes = selectedProduct
    ? Array.from(
        new Set(
          selectedProduct.variants
            .map(v => v.size)
            .filter((v): v is string => Boolean(v))
        )
      )
    : [];

  const modalColours = selectedProduct
    ? Array.from(
        new Set(
          selectedProduct.variants
            .map(v => v.colour)
            .filter((v): v is string => Boolean(v))
        )
      )
    : [];

  return (
    <main>
      <div className="announcement">
        COMPLIMENTARY UK DELIVERY OVER £100 <span>•</span> NEW SEASON. NEW ENERGY.
      </div>

      <header className="header">
        <button
          className="iconButton"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={25} />
        </button>

        <Link className="wordmark" href="/">
          YUSEE<span>PLUGS</span>
        </Link>

        <div className="headerActions">
          <button
            className="iconButton"
            aria-label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={21} />
          </button>

          <button
            className="iconButton bagButton"
            aria-label="Open bag"
            onClick={() => setBagOpen(true)}
          >
            <ShoppingBag size={22} />
            <span className="bagCount">{bagCount}</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="searchBar">
          <Search size={18} />
          <input
            autoFocus
            placeholder="Search the collection..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button
            onClick={() => {
              setQuery("");
              setSearchOpen(false);
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <section className="hero">
        <div className="heroShade" />
        <div className="heroContent">
          <p className="eyebrow light">THE NEW STANDARD</p>
          <h1>OWN YOUR<br /><i>EVERYDAY.</i></h1>
          <p className="heroCopy">
            The pieces you reach for. The details that set you apart.
          </p>
          <a className="lightButton" href="#shop">
            SHOP THE DROP <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="heroMeta">
          <span>YUSEE PLUGS / COLLECTION 001</span>
          <span>01 — 04</span>
        </div>
      </section>

      <section className="benefits">
        <div><span>01</span><p>CURATED EVERYDAY STYLE</p></div>
        <div><span>02</span><p>NEW DROPS, ALWAYS</p></div>
        <div><span>03</span><p>UK DELIVERY AVAILABLE</p></div>
      </section>

      <section className="categoryFeature">
        <div className="sectionIntro">
          <div>
            <p className="eyebrow">FIND YOUR FIT</p>
            <h2>THE LINE-UP</h2>
          </div>
          <p>Built around you.<br />Styled your way.</p>
        </div>

        <div className="categoryTiles">
          <a
            className="categoryTile menTile"
            href="#shop"
            onClick={() => setActive("Men")}
          >
            <span>01 / THE MENS EDIT</span>
            <strong>MEN</strong>
            <b>SHOP NOW <ArrowUpRight size={16} /></b>
          </a>

          <a
            className="categoryTile womenTile"
            href="#shop"
            onClick={() => setActive("Women")}
          >
            <span>02 / THE WOMENS EDIT</span>
            <strong>WOMEN</strong>
            <b>SHOP NOW <ArrowUpRight size={16} /></b>
          </a>
        </div>
      </section>

      <section className="shopSection" id="shop">
        <div className="sectionIntro shopIntro">
          <div>
            <p className="eyebrow">THE LATEST ROTATION</p>
            <h2>NEW & NOTED</h2>
          </div>

          <button className="textLink" onClick={() => setActive("All")}>
            VIEW ALL <ArrowUpRight size={16} />
          </button>
        </div>

        <div className="filterRow">
          <div className="filters">
            {filters.map(filter => (
              <button
                key={filter}
                className={active === filter ? "activeFilter" : ""}
                onClick={() => setActive(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <span className="resultCount">
            {productsLoading ? "LOADING..." : `${visible.length} PIECES`}
          </span>
        </div>

        {productsLoading && (
          <p className="empty">Loading the collection...</p>
        )}

        {!productsLoading && productsError && (
          <p className="empty">{productsError}</p>
        )}

        {!productsLoading && !productsError && (
          <div className="productGrid">
            {visible.map(product => {
              const inStock = product.variants.some(v => v.stock > 0);

              return (
                <article className="productCard" key={product.id}>
                  <button
                    type="button"
                    className="productImage"
                    onClick={() => setSelectedProduct(product)}
                    aria-label={`View ${product.name}`}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: 0,
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                      position: "relative",
                      textAlign: "left"
                    }}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <div className="emptyProductImage">YUSEE PLUGS</div>
                    )}

                    {!inStock && (
                      <span className="productTag">SOLD OUT</span>
                    )}
                  </button>

                  <div
                    className="productInfo"
                    style={{
                      display: "block",
                      paddingTop: "12px"
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(product)}
                      style={{
                        border: 0,
                        padding: 0,
                        background: "transparent",
                        color: "inherit",
                        textAlign: "left",
                        cursor: "pointer",
                        font: "inherit"
                      }}
                    >
                      <h3 style={{ margin: 0 }}>{product.name}</h3>
                    </button>
                  </div>

                  <button
                    className={`heart ${saved.includes(product.id) ? "saved" : ""}`}
                    aria-label="Save item"
                    onClick={() =>
                      setSaved(old =>
                        old.includes(product.id)
                          ? old.filter(x => x !== product.id)
                          : [...old, product.id]
                      )
                    }
                  >
                    <Heart
                      size={18}
                      fill={saved.includes(product.id) ? "currentColor" : "none"}
                    />
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {!productsLoading && !productsError && visible.length === 0 && (
          <p className="empty">No pieces found. Try another search.</p>
        )}
      </section>

      <section className="statement">
        <p className="eyebrow light">NOT HERE TO BLEND IN</p>
        <h2>YOUR STYLE.<br /><i>YOUR RULES.</i></h2>
        <a href="#shop" className="outlineButton">
          EXPLORE THE COLLECTION <ArrowUpRight size={16} />
        </a>
      </section>

      <footer className="footer">
        <div className="footerTop">
          <div>
            <Link className="wordmark footerLogo" href="/">
              YUSEE<span>PLUGS</span>
            </Link>
            <p>Everyday essentials.<br />Unmistakable energy.</p>
          </div>

          <div className="footerLinks">
            <div>
              <b>SHOP</b>
              <a href="#shop">New arrivals</a>
              <a href="#shop" onClick={() => setActive("Men")}>Men</a>
              <a href="#shop" onClick={() => setActive("Women")}>Women</a>
            </div>

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

            <div>
              <b>HELP</b>
              <a href="mailto:hello@yuseeplugs.com">Contact us</a>
              <a href="#">Delivery & returns</a>
              <a href="#">FAQs</a>
            </div>
          </div>
        </div>

        <div className="footerBottom">
          <span>© 2026 YUSEE PLUGS. ALL RIGHTS RESERVED.</span>
          <span>BUILT FOR YOUR EVERYDAY.</span>
        </div>
      </footer>

      {selectedProduct && (
        <div
          role="presentation"
          onClick={() => setSelectedProduct(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "18px",
            overflowY: "auto"
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
            onClick={e => e.stopPropagation()}
            style={{
              background: "#f7f6f2",
              color: "#171717",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "92vh",
              overflowY: "auto",
              position: "relative",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))"
            }}
          >
            <button
              type="button"
              aria-label="Close product"
              onClick={() => setSelectedProduct(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 2,
                border: 0,
                background: "#fff",
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                cursor: "pointer"
              }}
            >
              <X size={21} />
            </button>

            <div style={{ background: "#e9e7e1", minHeight: "300px" }}>
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    minHeight: "300px",
                    maxHeight: "650px",
                    objectFit: "cover",
                    display: "block"
                  }}
                />
              ) : (
                <div
                  className="emptyProductImage"
                  style={{
                    minHeight: "350px",
                    display: "grid",
                    placeItems: "center"
                  }}
                >
                  YUSEE PLUGS
                </div>
              )}
            </div>

            <div
              style={{
                padding: "clamp(24px, 5vw, 48px)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "22px"
              }}
            >
              <div>
                <p className="eyebrow">YUSEE PLUGS / COLLECTION 001</p>
                <h2 style={{
                  fontSize: "clamp(28px, 5vw, 42px)",
                  lineHeight: 1.05,
                  margin: "12px 0"
                }}>
                  {selectedProduct.name}
                </h2>

                {modalVariant && (
                  <strong style={{ fontSize: "20px" }}>
                    £{(modalVariant.pricePence / 100).toFixed(2)}
                  </strong>
                )}
              </div>

              {selectedProduct.description && (
                <p style={{
                  lineHeight: 1.7,
                  color: "#666",
                  fontSize: "14px",
                  whiteSpace: "pre-wrap"
                }}>
                  {selectedProduct.description}
                </p>
              )}

              {modalSizes.length > 0 && (
                <div>
                  <label
                    htmlFor="product-size"
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      marginBottom: "9px"
                    }}
                  >
                    SIZE
                  </label>

                  <select
                    id="product-size"
                    value={modalVariant?.size || ""}
                    onChange={e => changeSize(selectedProduct, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "white",
                      border: "1px solid #ccc",
                      fontSize: "14px"
                    }}
                  >
                    {modalSizes.map(size => {
                      const hasStock = selectedProduct.variants.some(
                        v => v.size === size && v.stock > 0
                      );

                      return (
                        <option
                          key={size}
                          value={size}
                          disabled={!hasStock}
                        >
                          {size}{!hasStock ? " — SOLD OUT" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {modalColours.length > 0 && (
                <div>
                  <label
                    htmlFor="product-colour"
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      marginBottom: "9px"
                    }}
                  >
                    COLOUR
                  </label>

                  <select
                    id="product-colour"
                    value={modalVariant?.colour || ""}
                    onChange={e => changeColour(selectedProduct, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: "white",
                      border: "1px solid #ccc",
                      fontSize: "14px"
                    }}
                  >
                    {modalColours.map(colour => {
                      const hasStock = selectedProduct.variants.some(
                        v => v.colour === colour && v.stock > 0
                      );

                      return (
                        <option
                          key={colour}
                          value={colour}
                          disabled={!hasStock}
                        >
                          {colour}{!hasStock ? " — SOLD OUT" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              <p style={{
                fontSize: "12px",
                color: modalVariant && modalVariant.stock > 0
                  ? "#397348"
                  : "#b3261e"
              }}>
                {modalVariant
                  ? modalVariant.stock > 0
                    ? `${modalVariant.stock} available`
                    : "This option is sold out"
                  : "No variants available"}
              </p>

              <button
                type="button"
                disabled={!modalVariant || modalVariant.stock < 1}
                onClick={() => modalVariant && addToBag(modalVariant)}
                style={{
                  width: "100%",
                  padding: "17px",
                  border: 0,
                  background: "#171717",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  cursor: "pointer",
                  opacity: !modalVariant || modalVariant.stock < 1 ? 0.45 : 1
                }}
              >
                ADD TO BAG
              </button>

              <button
                type="button"
                disabled={
                  checkoutLoading ||
                  !modalVariant ||
                  modalVariant.stock < 1
                }
                onClick={() => modalVariant && buyNow(modalVariant)}
                style={{
                  width: "100%",
                  padding: "17px",
                  border: "1px solid #171717",
                  background: "transparent",
                  color: "#171717",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "1.5px",
                  cursor: "pointer",
                  opacity: !modalVariant || modalVariant.stock < 1 ? 0.45 : 1
                }}
              >
                {checkoutLoading ? "CONNECTING TO CHECKOUT..." : "BUY NOW"}
              </button>

              <p style={{
                textAlign: "center",
                fontSize: "11px",
                color: "#777",
                letterSpacing: "0.5px"
              }}>
                FREE UK DELIVERY OVER £100
              </p>
            </div>
          </section>
        </div>
      )}

      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}>
          <aside
            className="drawer menuDrawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawerHead">
              <Link className="wordmark" href="/">
                YUSEE<span>PLUGS</span>
              </Link>
              <button
                className="iconButton"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <X />
              </button>
            </div>

            {!authChecked ? (
              <p className="signIn">CHECKING ACCOUNT...</p>
            ) : adminSignedIn ? (
              <>
                <Link
                  className="signIn"
                  href="/admin"
                  onClick={() => setMenuOpen(false)}
                >
                  ADMIN DASHBOARD <ArrowUpRight size={16} />
                </Link>
                <button className="signIn" onClick={handleSignOut}>
                  SIGN OUT <ArrowUpRight size={16} />
                </button>
              </>
            ) : customerSignedIn ? (
              <>
                <Link
                  className="signIn"
                  href="/account"
                  onClick={() => setMenuOpen(false)}
                >
                  MY ACCOUNT <ArrowUpRight size={16} />
                </Link>
                <button className="signIn" onClick={handleSignOut}>
                  SIGN OUT <ArrowUpRight size={16} />
                </button>
              </>
            ) : (
              <>
                <Link
                  className="signIn"
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  SIGN IN <ArrowUpRight size={16} />
                </Link>
                <Link
                  className="signIn"
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                >
                  CREATE ACCOUNT <ArrowUpRight size={16} />
                </Link>
              </>
            )}

            <div className="menuGroups">
              {(["Men", "Women"] as const).map(gender => (
                <div className="menuGroup" key={gender}>
                  <button
                    className="menuHeading"
                    onClick={() =>
                      setExpanded(expanded === gender ? null : gender)
                    }
                  >
                    {gender.toUpperCase()}
                    <ChevronDown
                      className={expanded === gender ? "rotated" : ""}
                    />
                  </button>

                  {expanded === gender && (
                    <div className="subMenu">
                      {Array.from(new Set(
                        products
                          .filter(p => getGender(p.category) === gender)
                          .map(p => getCategory(p.category))
                      )).map(category => (
                        <a
                          href="#shop"
                          key={category}
                          onClick={() => {
                            setActive(category);
                            setMenuOpen(false);
                          }}
                        >
                          {category}
                        </a>
                      ))}

                      <a
                        href="#shop"
                        onClick={() => {
                          setActive(gender);
                          setMenuOpen(false);
                        }}
                      >
                        View all {gender.toLowerCase()}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <a
              className="menuSimple"
              href="#shop"
              onClick={() => setMenuOpen(false)}
            >
              NEW ARRIVALS <ArrowUpRight size={16} />
            </a>

            <p className="drawerNote">GOOD STYLE. NO COMPROMISE.</p>
          </aside>
        </div>
      )}

      {bagOpen && (
        <div className="overlay" onClick={() => setBagOpen(false)}>
          <aside
            className="drawer bagDrawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawerHead">
              <h2>YOUR BAG <span>({bagCount})</span></h2>
              <button
                className="iconButton"
                aria-label="Close bag"
                onClick={() => setBagOpen(false)}
              >
                <X />
              </button>
            </div>

            {bagItems.length === 0 ? (
              <div className="emptyBag">
                <ShoppingBag size={35} />
                <h3>YOUR BAG IS EMPTY</h3>
                <p>Find your next favourite.</p>
                <button
                  className="blackButton"
                  onClick={() => setBagOpen(false)}
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            ) : (
              <>
                <div className="bagLines">
                  {bagItems.map(item => (
                    <div className="bagLine" key={item.variantId}>
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                        />
                      ) : (
                        <div className="emptyBagImage">YUSEE</div>
                      )}

                      <div className="bagLineInfo">
                        <b>{item.product.name}</b>

                        {item.variant.size && (
                          <span>Size: {item.variant.size}</span>
                        )}

                        {item.variant.colour && (
                          <span>Colour: {item.variant.colour}</span>
                        )}

                        <span>
                          £{(item.variant.pricePence / 100).toFixed(2)} × {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            setBag(old =>
                              old.filter(line => line.variantId !== item.variantId)
                            )
                          }
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bagCheckout">
                  <div>
                    <span>SUBTOTAL</span>
                    <b>£{(total / 100).toFixed(2)}</b>
                  </div>

                  <p>
                    {total >= 10000
                      ? "Complimentary UK delivery."
                      : "UK delivery is £4.99. Free delivery over £100."}
                  </p>

                  <button
                    className="blackButton"
                    disabled={checkoutLoading}
                    onClick={handleCheckout}
                  >
                    {checkoutLoading
                      ? "CONNECTING TO STRIPE..."
                      : "CONTINUE TO CHECKOUT"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
