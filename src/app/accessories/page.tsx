
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

export default function AccessoriesPage() {
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
              category === "accessories" ||
              category.startsWith("accessories/") ||
              category.startsWith("accessories /")
            );
          })
        );
      } catch {
        setError("We couldn't load accessories right now. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

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

      return (
        matchesSearch &&
        matchesColour &&
        matchesPrice &&
        available.length > 0
      );
    });

    if (sort === "price-low") {
      result = [...result].sort(
        (a, b) =>
          Math.min(...a.variants.map((v) => v.pricePence)) -
          Math.min(...b.variants.map((v) => v.pricePence))
      );
    } else if (sort === "price-high") {
      result = [...result].sort(
        (a, b) =>
          Math.min(...b.variants.map((v) => v.pricePence)) -
          Math.min(...a.variants.map((v) => v.pricePence))
      );
    } else {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    return result;
  }, [products, search, colour, maxPrice, sort]);

  function openProduct(product: Product) {
    setSelected(product);
    const firstAvailable = product.variants.find(
      (variant) => variant.stock > 0
    );
    setSelectedVariant(firstAvailable?.id || "");
    setMessage("");
  }

  function addToBag(product: Product, variantId: string) {
    const variant = product.variants.find((item) => item.id === variantId);

    if (!variant || variant.stock < 1) {
      setMessage("Sorry, this option is out of stock.");
      return;
    }

    try {
      const existing: BagItem[] = JSON.parse(
        localStorage.getItem("yusee_bag") || "[]"
      );

      const currentQuantity =
        existing.find((item) => item.variantId === variantId)?.quantity || 0;

      if (currentQuantity >= variant.stock) {
        setMessage("Sorry, there isn't enough stock available.");
        return;
      }

      const updated = existing.some((item) => item.variantId === variantId)
        ? existing.map((item) =>
            item.variantId === variantId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        : [...existing, { variantId, quantity: 1 }];

      localStorage.setItem("yusee_bag", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      setMessage("Added to your bag!");
    } catch {
      setMessage("Couldn't update your bag. Please try again.");
    }
  }

  return (
    <main className="accessories-page">
      <header className="site-header">
        <div className="header-top">
          <a className="brand" href="/">
            YUSEE PLUGS
            <span>PLUG IN. STAND OUT.</span>
          </a>

          <div className="header-icons">
            <a href="/" aria-label="Home" title="Home">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" />
              </svg>
            </a>

            <a href="/cart" aria-label="Shopping cart" title="Shopping cart">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 2-1.6L21 8H6" />
                <circle cx="10" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </a>

            <a href="/account" aria-label="Account" title="Account">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </a>
          </div>
        </div>

        <nav className="category-nav">
          <a href="/mens">MEN</a>
          <a href="/womens">WOMEN</a>
          <a href="/electronics">ELECTRONICS</a>
          <a href="/accessories" className="active">ACCESSORIES</a>
          <a href="/shop">ALL PRODUCTS</a>
        </nav>
      </header>

      <section className="intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/4F99E17E-317D-4FB1-AF4D-B80C938AD09D.png"
          alt="Yusee Plugs Accessories Collection"
        />
      </section>

      <section className="catalogue">
        <div className="catalogue-heading">
          <div>
            <p className="eyebrow">THE YUSEE COLLECTION</p>
            <h2>SHOP ACCESSORIES</h2>
            <p className="product-count">
              {filteredProducts.length} PRODUCTS
            </p>
          </div>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search accessories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search accessories"
          />

          <select
            value={colour}
            onChange={(event) => setColour(event.target.value)}
            aria-label="Filter by colour"
          >
            <option value="all">All colours</option>
            {colours.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
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
          <p className="status">Loading accessories...</p>
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
              const available = product.variants.filter((v) => v.stock > 0);
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
                    <p>{product.category || "Accessories"}</p>
                    <strong>{money(startingPrice)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <a href="/" className="footer-brand">YUSEE PLUGS</a>
        <p>PLUG IN. STAND OUT.</p>

        <div>
          <a href="/shop">ALL PRODUCTS</a>
          <a href="/mens">MEN</a>
          <a href="/womens">WOMEN</a>
          <a href="/electronics">ELECTRONICS</a>
          <a href="/accessories">ACCESSORIES</a>
        </div>

        <small>
          © {new Date().getFullYear()} Yusee Plugs. All rights reserved.
        </small>
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
              <p>
                {selected.description ||
                  "Explore this product from Yusee Plugs."}
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
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </select>

              {selectedVariant && (
                <strong className="modal-price">
                  {money(
                    selected.variants.find((v) => v.id === selectedVariant)
                      ?.pricePence || 0
                  )}
                </strong>
              )}

              <button
                className="add-button"
                disabled={
                  !selectedVariant ||
                  (selected.variants.find((v) => v.id === selectedVariant)
                    ?.stock || 0) < 1
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

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .accessories-page {
          min-height: 100vh;
          background: #f5f5f5;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .site-header {
          background: #080808;
          color: white;
          padding: 22px 5% 0;
          position: relative;
          z-index: 5;
        }

        .header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding-bottom: 22px;
        }

        .brand {
          color: white;
          text-decoration: none;
          font-size: 27px;
          font-weight: 900;
          letter-spacing: -1.3px;
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .brand span {
          margin-top: 7px;
          font-size: 9px;
          letter-spacing: 3px;
          font-weight: 600;
          color: #aaa;
        }

        .header-icons {
          display: flex;
          align-items: center;
          gap: 22px;
        }

        .header-icons a {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .header-icons svg {
          width: 25px;
          height: 25px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .category-nav {
          display: flex;
          align-items: center;
          gap: 28px;
          min-height: 55px;
          overflow-x: auto;
          white-space: nowrap;
          border-top: 1px solid #292929;
          scrollbar-width: none;
        }

        .category-nav::-webkit-scrollbar {
          display: none;
        }

        .category-nav a {
          color: white;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
          flex-shrink: 0;
          padding: 18px 0;
        }

        .category-nav a:hover,
        .category-nav a.active {
          color: #b8ff35;
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

        .catalogue {
          padding: 55px 5% 85px;
        }

        .eyebrow {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #888;
        }

        .catalogue-heading h2 {
          font-size: clamp(25px, 4vw, 38px);
          font-weight: 900;
          letter-spacing: -1.5px;
          margin: 0 0 8px;
        }

        .product-count {
          font-size: 12px;
          color: #777;
          font-weight: 800;
        }

        .filters {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 10px;
          margin: 28px 0 35px;
        }

        .filters input,
        .filters select,
        .modal-info select {
          min-width: 0;
          padding: 15px;
          border: 1px solid #ddd;
          background: white;
          color: #111;
          border-radius: 0;
          font-size: 14px;
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
          height: 280px;
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

        .product-info {
          padding: 15px;
        }

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

        .product-info strong {
          font-size: 14px;
        }

        .status,
        .empty {
          padding: 65px 15px;
          text-align: center;
        }

        .empty h3 {
          font-size: 24px;
          font-weight: 900;
        }

        .empty p {
          color: #777;
        }

        .footer {
          background: #080808;
          color: white;
          padding: 45px 5%;
          text-align: center;
        }

        .footer-brand {
          color: white;
          font-size: 25px;
          font-weight: 900;
          text-decoration: none;
        }

        .footer p {
          color: #aaa;
          font-size: 11px;
          letter-spacing: 3px;
        }

        .footer div {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 22px;
          margin: 25px 0;
        }

        .footer div a {
          color: white;
          text-decoration: none;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .footer small {
          color: #999;
          font-size: 10px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.75);
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

        .modal-info > p:not(.eyebrow):not(.message) {
          color: #666;
          font-size: 13px;
          line-height: 1.6;
        }

        .modal-info label {
          font-size: 12px;
          font-weight: 800;
        }

        .modal-info select {
          width: 100%;
        }

        .modal-price {
          font-size: 20px;
        }

        .add-button {
          width: 100%;
          padding: 16px;
          border: 0;
          background: #b8ff35;
          font-weight: 900;
          cursor: pointer;
        }

        .add-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .message {
          font-size: 13px;
          font-weight: 700;
        }

        @media (max-width: 850px) {
          .product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .product-image {
            height: 220px;
          }

          .filters {
            grid-template-columns: 1fr 1fr;
          }

          .filters input {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 600px) {
          .site-header {
            padding: 22px 5% 0;
          }

          .brand {
            font-size: 24px;
          }

          .header-icons {
            gap: 17px;
          }

          .header-icons svg {
            width: 23px;
            height: 23px;
          }

          .category-nav {
            gap: 23px;
            min-height: 52px;
          }

          .category-nav a {
            font-size: 10px;
            letter-spacing: 1.2px;
          }

          .catalogue {
            padding: 38px 4% 60px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }

          .product-image {
            height: 185px;
          }

          .product-info {
            padding: 11px;
          }

          .product-info h3 {
            font-size: 12px;
          }

          .product-modal {
            grid-template-columns: 1fr;
            max-width: 430px;
          }

          .modal-image {
            min-height: 230px;
            max-height: 260px;
          }

          .modal-info {
            padding: 25px 20px;
          }
        }
      `}</style>
    </main>
  );
}
