
"use client";

import { useEffect, useMemo, useState } from "react";

type Variant = {
  id: string;
  size?: string | null;
  colour?: string | null;
  delivery?: string | null;
  pricePence: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
  variants: Variant[];
};

type BagItem = {
  variantId: string;
  quantity: number;
};

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export default function ElectronicsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [colour, setColour] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [message, setMessage] = useState("");
  const [bag, setBag] = useState<BagItem[]>([]);
  const [bagReady, setBagReady] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) throw new Error("Could not load products.");

        const data = await response.json();
        const allProducts: Product[] = Array.isArray(data)
          ? data
          : data.products || [];

        setProducts(
          allProducts.filter((product) => {
            const category = (product.category || "").trim().toLowerCase();

            return (
              category === "electronics" ||
              category.startsWith("electronics/") ||
              category.startsWith("electronics /")
            );
          })
        );
      } catch {
        setError("We couldn't load electronics right now. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("yusee_bag") || "[]");
      setBag(Array.isArray(saved) ? saved : []);
    } catch {
      setBag([]);
    }
    setBagReady(true);

    const syncBag = () => {
      try {
        const saved = JSON.parse(localStorage.getItem("yusee_bag") || "[]");
        setBag(Array.isArray(saved) ? saved : []);
      } catch {
        setBag([]);
      }
    };

    window.addEventListener("storage", syncBag);
    return () => window.removeEventListener("storage", syncBag);
  }, []);

  useEffect(() => {
    if (!bagReady) return;
    localStorage.setItem("yusee_bag", JSON.stringify(bag));
  }, [bag, bagReady]);

  const colours = useMemo(() => {
    const values = products.flatMap((product) =>
      (product.variants || [])
        .map((variant) => variant.colour)
        .filter((value): value is string => Boolean(value))
    );

    return Array.from(new Set(values)).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query);

      const available = (product.variants || []).filter(
        (variant) => variant.stock > 0
      );

      const matchesColour =
        colour === "all" ||
        available.some((variant) => variant.colour === colour);

      const cheapest =
        available.length > 0
          ? Math.min(...available.map((variant) => variant.pricePence))
          : Infinity;

      const matchesPrice =
        maxPrice === "all" || cheapest <= Number(maxPrice) * 100;

      return matchesSearch && matchesColour && matchesPrice && available.length > 0;
    });

    if (sort === "price-low" || sort === "price-high") {
      result = [...result].sort((a, b) => {
        const priceA = Math.min(
          ...a.variants.filter((v) => v.stock > 0).map((v) => v.pricePence)
        );
        const priceB = Math.min(
          ...b.variants.filter((v) => v.stock > 0).map((v) => v.pricePence)
        );

        return sort === "price-low" ? priceA - priceB : priceB - priceA;
      });
    } else {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    return result;
  }, [products, search, colour, maxPrice, sort]);

  const bagProducts = useMemo(() => {
    return bag.flatMap((item) => {
      for (const product of products) {
        const variant = product.variants.find(
          (entry) => entry.id === item.variantId
        );

        if (variant) return [{ product, variant, quantity: item.quantity }];
      }

      return [];
    });
  }, [bag, products]);

  const bagCount = bag.reduce((total, item) => total + item.quantity, 0);
  const bagTotal = bagProducts.reduce(
    (total, item) => total + item.variant.pricePence * item.quantity,
    0
  );

  function saveBag(updated: BagItem[]) {
    setBag(updated);
    localStorage.setItem("yusee_bag", JSON.stringify(updated));
    window.dispatchEvent(new Event("storage"));
  }

  function openProduct(product: Product) {
    setSelected(product);
    const firstAvailable = product.variants.find((variant) => variant.stock > 0);
    setSelectedVariant(firstAvailable?.id || "");
    setMessage("");
  }

  function addToBag(product: Product, variantId: string) {
    const variant = product.variants.find((item) => item.id === variantId);

    if (!variant || variant.stock < 1) {
      setMessage("Sorry, this option is out of stock.");
      return;
    }

    const currentQuantity =
      bag.find((item) => item.variantId === variantId)?.quantity || 0;

    if (currentQuantity >= variant.stock) {
      setMessage("Sorry, there isn't enough stock available.");
      return;
    }

    const updated = bag.some((item) => item.variantId === variantId)
      ? bag.map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...bag, { variantId, quantity: 1 }];

    saveBag(updated);
    setMessage("Added to your bag!");
  }

  function changeQuantity(variantId: string, change: number) {
    const product = products.find((item) =>
      item.variants.some((variant) => variant.id === variantId)
    );
    const variant = product?.variants.find((item) => item.id === variantId);
    const current = bag.find((item) => item.variantId === variantId);

    if (!current) return;

    const nextQuantity = current.quantity + change;

    if (nextQuantity <= 0) {
      saveBag(bag.filter((item) => item.variantId !== variantId));
      return;
    }

    if (variant && nextQuantity > variant.stock) return;

    saveBag(
      bag.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
  }

  return (
    <main className="electronics-page">
      <header className="site-header">
        <a className="brand" href="/">YUSEE PLUGS</a>

        <nav className="category-nav">
          <a href="/mens">MEN</a>
          <a href="/womens">WOMEN</a>
          <a href="/electronics" className="active">ELECTRONICS</a>
          <a href="/accessories">ACCESSORIES</a>
        </nav>

        <div className="header-icons">
          <a href="/" aria-label="Home" title="Home">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9.5 20v-7h5v7" />
            </svg>
          </a>

          <button
            type="button"
            onClick={() => setBagOpen(true)}
            aria-label="Open shopping bag"
            title="Shopping bag"
            className="icon-button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 8h14l1 13H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            {bagCount > 0 && <span className="bag-count">{bagCount}</span>}
          </button>

          <a href="/account" aria-label="Account" title="Account">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
            </svg>
          </a>
        </div>
      </header>

      <section className="intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/10C02860-C206-4F1B-829F-DC2F8FA691B3.png"
          alt="Yusee Plugs Electronics Collection"
        />
      </section>

      <section className="catalogue">
        <div className="catalogue-heading">
          <div>
            <h2>SHOP ELECTRONICS</h2>
            <p>{filteredProducts.length} PRODUCTS</p>
          </div>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search electronics..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search electronics"
          />

          <select
            value={colour}
            onChange={(event) => setColour(event.target.value)}
            aria-label="Filter by colour"
          >
            <option value="all">All colours</option>
            {colours.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <select
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            aria-label="Filter by maximum price"
          >
            <option value="all">Any price</option>
            <option value="10">Under £10</option>
            <option value="25">Under £25</option>
            <option value="50">Under £50</option>
            <option value="100">Under £100</option>
            <option value="250">Under £250</option>
          </select>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
          </select>
        </div>

        {loading ? (
          <p className="status">Loading electronics...</p>
        ) : error ? (
          <p className="status">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <div className="empty">
            <h3>NO PRODUCTS FOUND</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const available = product.variants.filter((variant) => variant.stock > 0);
              const startingPrice = Math.min(
                ...available.map((variant) => variant.pricePence)
              );

              return (
                <button
                  className="product-card"
                  key={product.id}
                  onClick={() => openProduct(product)}
                >
                  <div className="product-image">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span>YUSEE PLUGS</span>
                    )}
                    <span className="view-label">VIEW PRODUCT</span>
                  </div>

                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p>{product.category || "Electronics"}</p>
                    <strong>{money(startingPrice)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <a href="/">YUSEE PLUGS</a>
        <p>PLUG IN. STAND OUT.</p>
        <div>
          <a href="/mens">Men</a>
          <a href="/womens">Women</a>
          <a href="/electronics">Electronics</a>
          <a href="/accessories">Accessories</a>
        </div>
        <small>© {new Date().getFullYear()} Yusee Plugs. All rights reserved.</small>
      </footer>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <section
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-button"
              onClick={() => setSelected(null)}
              aria-label="Close product details"
            >
              ×
            </button>

            <div className="modal-image">
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt={selected.name} />
              ) : (
                <span>YUSEE PLUGS</span>
              )}
            </div>

            <div className="modal-info">
              <p className="eyebrow">YUSEE PLUGS</p>
              <h2>{selected.name}</h2>
              <p className="description">
                {selected.description || "Explore this product from Yusee Plugs."}
              </p>

              <label htmlFor="variant">Choose an option</label>
              <select
                id="variant"
                value={selectedVariant}
                onChange={(event) => setSelectedVariant(event.target.value)}
              >
                {selected.variants.map((variant) => (
                  <option
                    key={variant.id}
                    value={variant.id}
                    disabled={variant.stock < 1}
                  >
                    {[
                      variant.colour,
                      variant.size,
                      money(variant.pricePence),
                      variant.stock < 1 ? "Out of stock" : "",
                    ].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>

              {selectedVariant && (
                <strong className="modal-price">
                  {money(
                    selected.variants.find(
                      (variant) => variant.id === selectedVariant
                    )?.pricePence || 0
                  )}
                </strong>
              )}

              <button
                className="add-button"
                disabled={
                  !selectedVariant ||
                  (selected.variants.find(
                    (variant) => variant.id === selectedVariant
                  )?.stock || 0) < 1
                }
                onClick={() => addToBag(selected, selectedVariant)}
              >
                ADD TO BAG
              </button>

              {message && <p className="message">{message}</p>}
            </div>
          </section>
        </div>
      )}

      {bagOpen && (
        <div className="drawer-backdrop" onClick={() => setBagOpen(false)}>
          <aside className="bag-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-heading">
              <h2>YOUR BAG ({bagCount})</h2>
              <button onClick={() => setBagOpen(false)} aria-label="Close bag">×</button>
            </div>

            {bagProducts.length === 0 ? (
              <div className="empty-bag">
                <p>Your bag is currently empty.</p>
                <button onClick={() => setBagOpen(false)}>CONTINUE SHOPPING</button>
              </div>
            ) : (
              <>
                <div className="bag-items">
                  {bagProducts.map(({ product, variant, quantity }) => (
                    <div className="bag-item" key={variant.id}>
                      <div className="bag-item-image">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} />
                        )}
                      </div>

                      <div className="bag-item-info">
                        <h3>{product.name}</h3>
                        <p>
                          {[variant.colour, variant.size].filter(Boolean).join(" · ")}
                        </p>
                        <strong>{money(variant.pricePence)}</strong>

                        <div className="quantity-controls">
                          <button onClick={() => changeQuantity(variant.id, -1)} aria-label="Decrease quantity">−</button>
                          <span>{quantity}</span>
                          <button
                            onClick={() => changeQuantity(variant.id, 1)}
                            disabled={quantity >= variant.stock}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          className="remove-item"
                          onClick={() => saveBag(bag.filter((item) => item.variantId !== variant.id))}
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bag-summary">
                  <div className="subtotal">
                    <span>SUBTOTAL</span>
                    <strong>{money(bagTotal)}</strong>
                  </div>
                  <p>Delivery and any applicable charges are calculated at checkout.</p>
                  <button onClick={() => setBagOpen(false)}>CONTINUE SHOPPING</button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <style jsx>{`
        * { box-sizing: border-box; }

        .electronics-page {
          min-height: 100vh;
          background: #f5f5f5;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .site-header {
          background: #080808;
          color: white;
          padding: 20px 5% 17px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 17px;
        }

        .brand {
          color: white;
          text-decoration: none;
          font-size: 27px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .category-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
          gap: 28px;
        }

        .category-nav a {
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          transition: color .2s;
        }

        .category-nav a:hover,
        .category-nav a.active {
          color: #b8ff35;
        }

        .header-icons {
          position: absolute;
          right: 5%;
          top: 23px;
          display: flex;
          align-items: center;
          gap: 17px;
        }

        .header-icons a,
        .icon-button {
          width: 25px;
          height: 27px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: none;
          border: 0;
          padding: 0;
          cursor: pointer;
        }

        .header-icons svg {
          width: 22px;
          height: 22px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .bag-count {
          position: absolute;
          top: -8px;
          right: -9px;
          background: #b8ff35;
          color: #080808;
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
        }

        .intro {
          width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: #111;
        }

        .intro img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .catalogue { padding: 48px 5% 75px; }

        .catalogue-heading { margin-bottom: 22px; }

        .catalogue-heading h2 {
          font-size: 23px;
          font-weight: 900;
          margin: 0 0 6px;
        }

        .catalogue-heading p {
          font-size: 11px;
          color: #777;
          font-weight: 800;
        }

        .filters {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 28px;
        }

        .filters input,
        .filters select,
        .modal-info select {
          min-width: 0;
          padding: 13px;
          border: 1px solid #ddd;
          background: white;
          color: #111;
          border-radius: 0;
          font-size: 13px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .product-card {
          border: 0;
          padding: 0;
          background: white;
          color: #111;
          text-align: left;
          cursor: pointer;
          min-width: 0;
        }

        .product-image {
          height: 260px;
          background: #e9e9e9;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: #888;
          font-size: 13px;
          font-weight: 900;
        }

        .product-image img,
        .modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .view-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #b8ff35;
          color: #111;
          padding: 8px 10px;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .product-info { padding: 15px; }

        .product-info h3 {
          margin: 0 0 7px;
          font-size: 14px;
          font-weight: 800;
        }

        .product-info p {
          margin: 0 0 12px;
          font-size: 11px;
          color: #777;
        }

        .product-info strong { font-size: 14px; }

        .status,
        .empty {
          padding: 50px 15px;
          text-align: center;
        }

        .empty h3 { font-size: 22px; font-weight: 900; }

        .footer {
          background: #080808;
          color: white;
          padding: 40px 5%;
          text-align: center;
        }

        .footer > a {
          color: white;
          font-size: 22px;
          font-weight: 900;
          text-decoration: none;
        }

        .footer p { color: #b8ff35; font-size: 11px; font-weight: 900; }

        .footer div {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 20px;
          margin: 22px 0;
        }

        .footer div a {
          color: white;
          text-decoration: none;
          font-size: 12px;
        }

        .footer small { color: #999; font-size: 10px; }

        .modal-backdrop,
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0,0,0,.75);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          overflow-y: auto;
        }

        .product-modal {
          background: white;
          width: 100%;
          max-width: 850px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 8px;
          right: 12px;
          border: 0;
          background: transparent;
          font-size: 32px;
          cursor: pointer;
          z-index: 2;
        }

        .modal-image {
          min-height: 380px;
          background: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #888;
          font-weight: 900;
        }

        .modal-info {
          padding: 45px 30px 30px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 14px;
        }

        .modal-info h2 {
          font-size: 26px;
          font-weight: 900;
          margin: 0;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .description {
          color: #666;
          font-size: 13px;
          line-height: 1.6;
        }

        .modal-info label { font-size: 12px; font-weight: 800; }
        .modal-info select { width: 100%; }
        .modal-price { font-size: 20px; }

        .add-button {
          width: 100%;
          padding: 16px;
          border: 0;
          background: #b8ff35;
          font-weight: 900;
          cursor: pointer;
        }

        .add-button:disabled { opacity: .45; cursor: not-allowed; }
        .message { font-size: 13px; font-weight: 700; }

        .drawer-backdrop {
          justify-content: flex-end;
          align-items: stretch;
          padding: 0;
        }

        .bag-drawer {
          width: 100%;
          max-width: 440px;
          height: 100%;
          background: white;
          color: #111;
          display: flex;
          flex-direction: column;
          padding: 25px;
          overflow-y: auto;
        }

        .drawer-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #ddd;
          padding-bottom: 18px;
        }

        .drawer-heading h2 {
          font-size: 17px;
          font-weight: 900;
          margin: 0;
        }

        .drawer-heading button {
          border: 0;
          background: none;
          font-size: 30px;
          cursor: pointer;
        }

        .empty-bag {
          margin: auto;
          text-align: center;
          font-size: 14px;
        }

        .empty-bag button,
        .bag-summary > button {
          background: #b8ff35;
          border: 0;
          padding: 15px;
          width: 100%;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }

        .bag-items { flex: 1; }

        .bag-item {
          display: grid;
          grid-template-columns: 95px 1fr;
          gap: 15px;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }

        .bag-item-image {
          height: 115px;
          background: #eee;
        }

        .bag-item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .bag-item-info h3 {
          margin: 0 0 6px;
          font-size: 13px;
          font-weight: 800;
        }

        .bag-item-info p {
          margin: 0 0 8px;
          font-size: 11px;
          color: #777;
        }

        .bag-item-info strong { font-size: 13px; }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-top: 12px;
        }

        .quantity-controls button {
          width: 25px;
          height: 25px;
          border: 1px solid #ddd;
          background: white;
          cursor: pointer;
        }

        .quantity-controls button:disabled {
          opacity: .35;
          cursor: not-allowed;
        }

        .quantity-controls span { font-size: 12px; }

        .remove-item {
          display: block;
          margin-top: 9px;
          border: 0;
          background: none;
          padding: 0;
          color: #777;
          text-decoration: underline;
          font-size: 10px;
          cursor: pointer;
        }

        .bag-summary {
          border-top: 1px solid #ddd;
          padding-top: 18px;
          margin-top: 15px;
        }

        .subtotal {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 900;
        }

        .bag-summary p {
          color: #777;
          font-size: 11px;
          line-height: 1.5;
          margin: 12px 0 18px;
        }

        @media (max-width: 850px) {
          .site-header { padding-top: 65px; }
          .header-icons { top: 20px; }
          .category-nav { gap: 17px; }
          .product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .product-image { height: 220px; }
        }

        @media (max-width: 600px) {
          .brand { font-size: 23px; }
          .category-nav { gap: 13px; }
          .category-nav a { font-size: 9px; }
          .header-icons { gap: 13px; }
          .catalogue { padding: 35px 4%; }
          .filters { grid-template-columns: 1fr 1fr; }
          .filters input { grid-column: 1 / -1; }
          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .product-image { height: 185px; }
          .product-info { padding: 11px; }
          .product-info h3 { font-size: 12px; }
          .product-modal {
            grid-template-columns: 1fr;
            max-width: 430px;
          }
          .modal-image { min-height: 230px; max-height: 260px; }
          .modal-info { padding: 25px 20px; }
        }
      `}</style>
    </main>
  );
}
