
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu, ShoppingBag, Search, X, ArrowUpRight, Plus,
  Heart, ChevronDown
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
  return parts.length > 1 ? parts.slice(1).join("/").trim() : parts[0]?.trim() || "Other";
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
    return product.variants.find(v => v.id === selectedId) || product.variants[0];
  }

  function changeSize(product: Product, size: string) {
    const current = getSelectedVariant(product);

    const match =
      product.variants.find(
        v => v.size === size && v.colour === current?.colour
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
        v => v.colour === colour && v.size === current?.size
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

    setBagOpen(true);
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
    if (bagItems.length === 0) return;

    setCheckoutLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: bag.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity
          }))
        })
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

        <Link className="wordmark" href="/">
          YUSEE<span>PLUGS</span>
        </Link>

        <div className="headerActions">
          <button className="iconButton" aria-label="Search" onClick={() => setSearchOpen(!searchOpen)}>
            <Search size={21}/>
          </button>

          <button className="iconButton bagButton" aria-label="Open bag" onClick={() => setBagOpen(true)}>
            <ShoppingBag size={22}/>
            <span className="bagCount">{bagCount}</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="searchBar">
          <Search size={18}/>
          <input
            autoFocus
            placeholder="Search the collection..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button onClick={() => { setQuery(""); setSearchOpen(false); }}>
            <X size={18}/>
          </button>
        </div>
      )}

      <section className="hero">
        <div className="heroShade"/>
        <div className="heroContent">
          <p className="eyebrow light">THE NEW STANDARD</p>
          <h1>OWN YOUR<br/><i>EVERYDAY.</i></h1>
          <p className="heroCopy">The pieces you reach for. The details that set you apart.</p>
          <a className="lightButton" href="#shop">
            SHOP THE DROP <ArrowUpRight size={17}/>
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
          <p>Built around you.<br/>Styled your way.</p>
        </div>

        <div className="categoryTiles">
          <a className="categoryTile menTile" href="#shop" onClick={() => setActive("Men")}>
            <span>01 / THE MENS EDIT</span>
            <strong>MEN</strong>
            <b>SHOP NOW <ArrowUpRight size={16}/></b>
          </a>

          <a className="categoryTile womenTile" href="#shop" onClick={() => setActive("Women")}>
            <span>02 / THE WOMENS EDIT</span>
            <strong>WOMEN</strong>
            <b>SHOP NOW <ArrowUpRight size={16}/></b>
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
            VIEW ALL <ArrowUpRight size={16}/>
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
              const variant = getSelectedVariant(product);

              const sizes = Array.from(
                new Set(product.variants.map(v => v.size).filter(Boolean))
              ) as string[];

              const colours = Array.from(
                new Set(product.variants.map(v => v.colour).filter(Boolean))
              ) as string[];

              const inStock = product.variants.some(v => v.stock > 0);

              return (
                <article className="productCard" key={product.id}>
                  <div className="productImage">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name}/>
                    ) : (
                      <div className="emptyProductImage">YUSEE PLUGS</div>
                    )}

                    <button
                      className={`heart ${saved.includes(product.id) ? "saved" : ""}`}
                      aria-label="Save item"
                      onClick={() => setSaved(old =>
                        old.includes(product.id)
                          ? old.filter(x => x !== product.id)
                          : [...old, product.id]
                      )}
                    >
                      <Heart
                        size={18}
                        fill={saved.includes(product.id) ? "currentColor" : "none"}
                      />
                    </button>

                    {!inStock && (
                      <span className="productTag">SOLD OUT</span>
                    )}
                  </div>

                  <div className="productInfo">
                    <div>
                      <h3>{product.name}</h3>
                      <p>{getCategory(product.category)}</p>
                    </div>

                    <strong>
                      {variant
                        ? `£${(variant.pricePence / 100).toFixed(2)}`
                        : "Unavailable"}
                    </strong>
                  </div>

                  {sizes.length > 0 && (
                    <label className="variantField">
                      SIZE
                      <select
                        value={variant?.size || ""}
                        onChange={e => changeSize(product, e.target.value)}
                      >
                        {sizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  {colours.length > 0 && (
                    <label className="variantField">
                      COLOUR
                      <select
                        value={variant?.colour || ""}
                        onChange={e => changeColour(product, e.target.value)}
                      >
                        {colours.map(colour => (
                          <option key={colour} value={colour}>{colour}</option>
                        ))}
                      </select>
                    </label>
                  )}

                  <p className="stockText">
                    {variant
                      ? variant.stock > 0
                        ? `${variant.stock} available`
                        : "Out of stock"
                      : "No variants available"}
                  </p>

                  <button
                    className="quickAdd"
                    disabled={!variant || variant.stock < 1}
                    onClick={() => variant && addToBag(variant)}
                  >
                    {variant && variant.stock > 0 ? "ADD TO BAG" : "SOLD OUT"}
                    <Plus size={15}/>
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
        <h2>YOUR STYLE.<br/><i>YOUR RULES.</i></h2>
        <a href="#shop" className="outlineButton">
          EXPLORE THE COLLECTION <ArrowUpRight size={16}/>
        </a>
      </section>

      <footer className="footer">
        <div className="footerTop">
          <div>
            <Link className="wordmark footerLogo" href="/">
              YUSEE<span>PLUGS</span>
            </Link>
            <p>Everyday essentials.<br/>Unmistakable energy.</p>
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

      {menuOpen && (
        <div className="overlay" onClick={() => setMenuOpen(false)}>
          <aside className="drawer menuDrawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <Link className="wordmark" href="/">
                YUSEE<span>PLUGS</span>
              </Link>
              <button className="iconButton" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <X/>
              </button>
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
              {(["Men", "Women"] as const).map(gender => (
                <div className="menuGroup" key={gender}>
                  <button
                    className="menuHeading"
                    onClick={() => setExpanded(expanded === gender ? null : gender)}
                  >
                    {gender.toUpperCase()}
                    <ChevronDown className={expanded === gender ? "rotated" : ""}/>
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

            <a className="menuSimple" href="#shop" onClick={() => setMenuOpen(false)}>
              NEW ARRIVALS <ArrowUpRight size={16}/>
            </a>

            <p className="drawerNote">GOOD STYLE. NO COMPROMISE.</p>
          </aside>
        </div>
      )}

      {bagOpen && (
        <div className="overlay" onClick={() => setBagOpen(false)}>
          <aside className="drawer bagDrawer" onClick={e => e.stopPropagation()}>
            <div className="drawerHead">
              <h2>YOUR BAG <span>({bagCount})</span></h2>
              <button className="iconButton" aria-label="Close bag" onClick={() => setBagOpen(false)}>
                <X/>
              </button>
            </div>

            {bagItems.length === 0 ? (
              <div className="emptyBag">
                <ShoppingBag size={35}/>
                <h3>YOUR BAG IS EMPTY</h3>
                <p>Find your next favourite.</p>
                <button className="blackButton" onClick={() => setBagOpen(false)}>
                  CONTINUE SHOPPING
                </button>
              </div>
            ) : (
              <>
                <div className="bagLines">
                  {bagItems.map(item => (
                    <div className="bagLine" key={item.variantId}>
                      {item.product.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name}/>
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
                          onClick={() => setBag(old =>
                            old.filter(line => line.variantId !== item.variantId)
                          )}
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
                    {checkoutLoading ? "CONNECTING TO STRIPE..." : "CONTINUE TO CHECKOUT"}
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
