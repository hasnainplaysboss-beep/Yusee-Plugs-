
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Variant = {
  id: string;
  size: string;
  colour: string;
  delivery: string;
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

function formatPrice(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(pence / 100);
}

function productPrice(product: Product) {
  const prices = product.variants
    .filter((variant) => variant.stock > 0)
    .map((variant) => variant.pricePence);

  return prices.length ? Math.min(...prices) : null;
}

function isWomensProduct(product: Product) {
  const category = (product.category || "").trim().toLowerCase();

  return (
    category === "women" ||
    category.startsWith("women/") ||
    category.startsWith("women /") ||
    category === "womens" ||
    category.startsWith("womens/") ||
    category.startsWith("womens /")
  );
}

function categoryName(category?: string | null) {
  return (category || "Women's collection")
    .split("/")
    .filter(Boolean)
    .join(" / ");
}

export default function WomensPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [colourFilter, setColourFilter] = useState("all");
  const [maxPrice, setMaxPrice] = useState("all");
  const [sort, setSort] = useState("newest");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [bagMessage, setBagMessage] = useState("");

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Could not load products.");
        }

        const data = await response.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        setProducts(
          list.filter(
            (product: Product) =>
              product.variants && isWomensProduct(product)
          )
        );
      } catch {
        setError("We couldn't load the women's collection. Please refresh.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const sizes = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((product) =>
            product.variants.map((variant) => variant.size).filter(Boolean)
          )
        )
      ).sort(),
    [products]
  );

  const colours = useMemo(
    () =>
      Array.from(
        new Set(
          products.flatMap((product) =>
            product.variants.map((variant) => variant.colour).filter(Boolean)
          )
        )
      ).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query);

      const matchesSize =
        sizeFilter === "all" ||
        product.variants.some(
          (variant) => variant.size === sizeFilter && variant.stock > 0
        );

      const matchesColour =
        colourFilter === "all" ||
        product.variants.some(
          (variant) => variant.colour === colourFilter && variant.stock > 0
        );

      const price = productPrice(product);

      const matchesPrice =
        maxPrice === "all" ||
        (price !== null && price <= Number(maxPrice));

      return matchesSearch && matchesSize && matchesColour && matchesPrice;
    });

    if (sort === "price-low") {
      result = [...result].sort(
        (a, b) =>
          (productPrice(a) ?? Number.MAX_SAFE_INTEGER) -
          (productPrice(b) ?? Number.MAX_SAFE_INTEGER)
      );
    } else if (sort === "price-high") {
      result = [...result].sort(
        (a, b) => (productPrice(b) ?? 0) - (productPrice(a) ?? 0)
      );
    } else {
      result = [...result].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [products, search, sizeFilter, colourFilter, maxPrice, sort]);

  function openProduct(product: Product) {
    setSelectedProduct(product);
    const firstAvailable = product.variants.find(
      (variant) => variant.stock > 0
    );
    setSelectedVariant(firstAvailable?.id || "");
    setBagMessage("");
  }

  function addToBag() {
    if (!selectedProduct || !selectedVariant) {
      setBagMessage("Please select an available option first.");
      return;
    }

    const variant = selectedProduct.variants.find(
      (item) => item.id === selectedVariant
    );

    if (!variant || variant.stock < 1) {
      setBagMessage("This option is out of stock.");
      return;
    }

    try {
      const stored = localStorage.getItem("yusee_bag");
      const bag = stored ? JSON.parse(stored) : [];
      const existing = bag.find(
        (line: { variantId: string }) =>
          line.variantId === selectedVariant
      );

      if (existing) {
        if (existing.quantity >= variant.stock) {
          setBagMessage("You've reached the available stock.");
          return;
        }
        existing.quantity += 1;
      } else {
        bag.push({ variantId: selectedVariant, quantity: 1 });
      }

      localStorage.setItem("yusee_bag", JSON.stringify(bag));
      setBagMessage("Added to your bag.");
    } catch {
      setBagMessage("Couldn't update your bag. Please try again.");
    }
  }

  function resetFilters() {
    setSearch("");
    setSizeFilter("all");
    setColourFilter("all");
    setMaxPrice("all");
    setSort("newest");
  }

  return (
    <main className="womens-page">
      <header className="header">
        <Link href="/" className="brand">
          <strong>YUSEE PLUGS</strong>
          <span>PLUG IN. STAND OUT.</span>
        </Link>

        <nav>
          <Link href="/shop">Shop all</Link>
          <Link href="/mens">Men</Link>
          <Link href="/electronics">Electronics</Link>
          <Link href="/accessories">Accessories</Link>
        </nav>

        <Link href="/" className="home-link">Home</Link>
      </header>

      <section className="hero">
        <p>THE YUSEE COLLECTION</p>
        <h1>WOMEN'S COLLECTION</h1>
        <span>Everyday essentials. Standout style.</span>
      </section>

      <section className="catalogue">
        <div className="top">
          <div>
            <h2>Shop Women's</h2>
            <p>
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} products`}
            </p>
          </div>

          <div className="sort">
            <label htmlFor="sort">Sort by</label>
            <select
              id="sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="layout">
          <aside className="filters">
            <div className="filter-title">
              <h3>Filters</h3>
              <button onClick={resetFilters}>Clear all</button>
            </div>

            <label htmlFor="search">Search</label>
            <input
              id="search"
              type="search"
              placeholder="Search women's products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <label htmlFor="size">Size</label>
            <select
              id="size"
              value={sizeFilter}
              onChange={(event) => setSizeFilter(event.target.value)}
            >
              <option value="all">All sizes</option>
              {sizes.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>

            <label htmlFor="colour">Colour</label>
            <select
              id="colour"
              value={colourFilter}
              onChange={(event) => setColourFilter(event.target.value)}
            >
              <option value="all">All colours</option>
              {colours.map((colour) => (
                <option key={colour} value={colour}>{colour}</option>
              ))}
            </select>

            <label htmlFor="price">Maximum price</label>
            <select
              id="price"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            >
              <option value="all">Any price</option>
              <option value="2500">Under £25</option>
              <option value="5000">Under £50</option>
              <option value="10000">Under £100</option>
              <option value="20000">Under £200</option>
              <option value="50000">Under £500</option>
            </select>
          </aside>

          <div className="products-area">
            {loading && <p className="message">Loading products...</p>}
            {!loading && error && <p className="message error">{error}</p>}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="empty">
                <h3>No women's products found</h3>
                <p>Try changing your search or filters.</p>
                <button onClick={resetFilters}>Clear filters</button>
              </div>
            )}

            <div className="product-grid">
              {filteredProducts.map((product) => {
                const price = productPrice(product);
                const available = product.variants.some(
                  (variant) => variant.stock > 0
                );

                return (
                  <button
                    type="button"
                    className="product-card"
                    key={product.id}
                    onClick={() => openProduct(product)}
                  >
                    <div className="image">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <span>YUSEE PLUGS</span>
                      )}
                      {!available && <b className="sold-out">SOLD OUT</b>}
                    </div>

                    <div className="info">
                      <small>{categoryName(product.category)}</small>
                      <h3>{product.name}</h3>
                      <p>
                        {price === null ? "Out of stock" : formatPrice(price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <div className="backdrop" onClick={() => setSelectedProduct(null)}>
          <section
            className="modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-image">
              {selectedProduct.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
              ) : (
                <span>YUSEE PLUGS</span>
              )}
            </div>

            <div className="modal-info">
              <small>{categoryName(selectedProduct.category)}</small>
              <h2>{selectedProduct.name}</h2>
              <p className="description">
                {selectedProduct.description || "Discover this Yusee Plugs item."}
              </p>

              <p className="price">
                {(() => {
                  const variant = selectedProduct.variants.find(
                    (item) => item.id === selectedVariant
                  );
                  return variant
                    ? formatPrice(variant.pricePence)
                    : "Select an option";
                })()}
              </p>

              <label htmlFor="variant">Choose size / colour</label>
              <select
                id="variant"
                value={selectedVariant}
                onChange={(event) => setSelectedVariant(event.target.value)}
              >
                <option value="">Select an option</option>
                {selectedProduct.variants.map((variant) => (
                  <option
                    key={variant.id}
                    value={variant.id}
                    disabled={variant.stock < 1}
                  >
                    {[
                      variant.size,
                      variant.colour,
                      formatPrice(variant.pricePence),
                      variant.stock < 1 ? "Out of stock" : `${variant.stock} available`,
                    ].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>

              {bagMessage && <p className="bag-message">{bagMessage}</p>}

              <button
                className="add-button"
                onClick={addToBag}
                disabled={
                  !selectedVariant ||
                  !selectedProduct.variants.some(
                    (variant) =>
                      variant.id === selectedVariant && variant.stock > 0
                  )
                }
              >
                ADD TO BAG
              </button>
            </div>
          </section>
        </div>
      )}

      <footer>
        <Link href="/">YUSEE PLUGS</Link>
        <p>PLUG IN. STAND OUT.</p>
      </footer>

      <style jsx>{`
        .womens-page {
          min-height: 100vh;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .header {
          min-height: 76px;
          padding: 14px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid #e9e9e9;
        }

        .brand {
          display: flex;
          flex-direction: column;
          color: #111;
          text-decoration: none;
          letter-spacing: 1.5px;
        }

        .brand strong {
          font-size: 21px;
          font-weight: 900;
        }

        .brand span {
          margin-top: 4px;
          font-size: 9px;
          letter-spacing: 2px;
        }

        nav {
          display: flex;
          gap: 22px;
        }

        nav a,
        .home-link {
          color: #111;
          font-size: 11px;
          font-weight: 800;
          text-decoration: none;
          text-transform: uppercase;
        }

        .hero {
          padding: 58px 20px;
          background: #f3f3f3;
          text-align: center;
        }

        .hero p,
        .modal-info small {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .hero h1 {
          margin: 12px 0;
          font-size: clamp(32px, 5vw, 54px);
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .hero span {
          color: #666;
          font-size: 14px;
        }

        .catalogue {
          max-width: 1500px;
          margin: auto;
          padding: 42px 5% 80px;
        }

        .top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .top h2 {
          margin: 0;
          font-size: 25px;
          font-weight: 900;
        }

        .top p {
          margin: 6px 0 0;
          color: #777;
          font-size: 12px;
        }

        .sort {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sort label,
        .filters label,
        .modal-info label {
          font-size: 11px;
          font-weight: 800;
        }

        select,
        input {
          min-height: 42px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 0;
          background: #fff;
          color: #111;
          font-size: 12px;
        }

        .layout {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 34px;
        }

        .filters {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .filter-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .filter-title h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
        }

        .filter-title button {
          border: 0;
          background: none;
          color: #666;
          font-size: 11px;
          text-decoration: underline;
          cursor: pointer;
        }

        .filters label:not(:first-child) {
          margin-top: 12px;
        }

        .filters input,
        .filters select {
          width: 100%;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 28px 18px;
        }

        .product-card {
          display: block;
          width: 100%;
          padding: 0;
          border: 0;
          background: #fff;
          color: #111;
          text-align: left;
          cursor: pointer;
        }

        .image {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          aspect-ratio: 4 / 5;
          background: #f2f2f2;
        }

        .image img,
        .modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image > span,
        .modal-image > span {
          color: #aaa;
          font-size: 17px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .sold-out {
          position: absolute;
          top: 12px;
          left: 12px;
          padding: 7px 9px;
          background: #111;
          color: white;
          font-size: 9px;
        }

        .info {
          padding-top: 13px;
        }

        .info small {
          color: #777;
          font-size: 10px;
          text-transform: uppercase;
        }

        .info h3 {
          margin: 7px 0;
          font-size: 14px;
          font-weight: 800;
        }

        .info p {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
        }

        .message,
        .empty {
          padding: 35px 15px;
          color: #555;
          text-align: center;
        }

        .error {
          color: #b00020;
        }

        .empty h3 {
          color: #111;
        }

        .empty button {
          padding: 12px 20px;
          border: 0;
          background: #111;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .backdrop {
          position: fixed;
          z-index: 50;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, .7);
        }

        .modal {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 850px;
          max-height: 90vh;
          overflow: auto;
          background: white;
        }

        .close {
          position: absolute;
          z-index: 2;
          top: 10px;
          right: 14px;
          width: 36px;
          height: 36px;
          border: 0;
          border-radius: 50%;
          background: #fff;
          color: #111;
          font-size: 27px;
          cursor: pointer;
        }

        .modal-image {
          min-height: 420px;
          background: #f2f2f2;
        }

        .modal-info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 38px;
        }

        .modal-info h2 {
          margin: 8px 0 12px;
          font-size: 27px;
          font-weight: 900;
        }

        .description {
          color: #666;
          font-size: 13px;
          line-height: 1.7;
        }

        .price {
          margin: 12px 0 25px;
          font-size: 19px;
          font-weight: 900;
        }

        .modal-info label {
          margin-bottom: 8px;
        }

        .modal-info select {
          width: 100%;
        }

        .bag-message {
          margin: 12px 0 0;
          font-size: 12px;
        }

        .add-button {
          min-height: 48px;
          margin-top: 18px;
          border: 0;
          background: #111;
          color: white;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .add-button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        footer {
          padding: 35px 20px;
          background: #111;
          color: white;
          text-align: center;
        }

        footer a {
          color: white;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 2px;
          text-decoration: none;
        }

        footer p {
          margin: 8px 0 0;
          color: #bbb;
          font-size: 10px;
          letter-spacing: 2px;
        }

        @media (max-width: 850px) {
          nav {
            gap: 12px;
          }

          nav a {
            font-size: 10px;
          }

          .layout {
            grid-template-columns: 180px minmax(0, 1fr);
            gap: 20px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .header {
            flex-wrap: wrap;
            gap: 12px;
          }

          nav {
            order: 3;
            width: 100%;
            justify-content: space-between;
            overflow-x: auto;
          }

          nav a {
            white-space: nowrap;
          }

          .catalogue {
            padding: 30px 4% 55px;
          }

          .top {
            align-items: flex-start;
            flex-direction: column;
          }

          .sort {
            width: 100%;
            justify-content: space-between;
          }

          .sort select {
            flex: 1;
          }

          .layout {
            grid-template-columns: 1fr;
          }

          .filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px 12px;
          }

          .filter-title {
            grid-column: 1 / -1;
          }

          .filters input,
          .filters select {
            min-width: 0;
          }

          .product-grid {
            gap: 22px 12px;
          }

          .info h3 {
            font-size: 12px;
          }

          .modal {
            display: block;
            max-width: 430px;
          }

          .modal-image {
            height: 260px;
            min-height: 0;
          }

          .modal-info {
            padding: 24px;
          }

          .modal-info h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}

