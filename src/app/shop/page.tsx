
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
  featured?: boolean;
  createdAt?: string;
  variants: Variant[];
};

type BagLine = {
  variantId: string;
  quantity: number;
};

const BAG_KEY = "yusee_bag";

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

function categoryName(category?: string | null) {
  if (!category) return "Other";
  return category.split("/").filter(Boolean).join(" / ");
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sizeFilter, setSizeFilter] = useState("all");
  const [colourFilter, setColourFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [maxPrice, setMaxPrice] = useState("all");
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

        setProducts(list.filter((product: Product) => product.variants));
      } catch {
        setError("We couldn't load the products. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return Array.from(
      new Set(
        products
          .map((product) => product.category)
          .filter((category): category is string => Boolean(category))
      )
    ).sort();
  }, [products]);

  const sizes = useMemo(() => {
    return Array.from(
      new Set(
        products.flatMap((product) =>
          product.variants.map((variant) => variant.size).filter(Boolean)
        )
      )
    ).sort();
  }, [products]);

  const colours = useMemo(() => {
    return Array.from(
      new Set(
        products.flatMap((product) =>
          product.variants.map((variant) => variant.colour).filter(Boolean)
        )
      )
    ).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.category || "").toLowerCase().includes(query) ||
        (product.description || "").toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || product.category === categoryFilter;

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

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSize &&
        matchesColour &&
        matchesPrice
      );
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
  }, [
    products,
    search,
    categoryFilter,
    sizeFilter,
    colourFilter,
    maxPrice,
    sort,
  ]);

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
      setBagMessage("This option is currently out of stock.");
      return;
    }

    try {
      const stored = localStorage.getItem(BAG_KEY);
      const bag: BagLine[] = stored ? JSON.parse(stored) : [];
      const existing = bag.find(
        (line) => line.variantId === selectedVariant
      );

      if (existing) {
        if (existing.quantity >= variant.stock) {
          setBagMessage("You've reached the available stock for this option.");
          return;
        }
        existing.quantity += 1;
      } else {
        bag.push({ variantId: selectedVariant, quantity: 1 });
      }

      localStorage.setItem(BAG_KEY, JSON.stringify(bag));
      setBagMessage("Added to your bag.");
    } catch {
      setBagMessage("We couldn't update your bag. Please try again.");
    }
  }

  function resetFilters() {
    setSearch("");
    setCategoryFilter("all");
    setSizeFilter("all");
    setColourFilter("all");
    setMaxPrice("all");
    setSort("newest");
  }

  return (
    <main className="shop-page">
      <header className="shop-header">
        <Link href="/" className="brand">
          <span className="brand-mark">YUSEE PLUGS</span>
          <span className="brand-tagline">PLUG IN. STAND OUT.</span>
        </Link>

        <nav className="header-links">
          <Link href="/mens">Men</Link>
          <Link href="/womens">Women</Link>
          <Link href="/electronics">Electronics</Link>
          <Link href="/accessories">Accessories</Link>
        </nav>

        <Link href="/" className="home-link">
          Home
        </Link>
      </header>

      <section className="shop-intro">
        <p className="eyebrow">THE YUSEE COLLECTION</p>
        <h1>SHOP ALL PRODUCTS</h1>
        <p>Discover your next favourite piece.</p>
      </section>

      <section className="catalogue">
        <div className="catalogue-top">
          <div>
            <h2>All products</h2>
            <p className="result-count">
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} products`}
            </p>
          </div>

          <div className="sort-control">
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

        <div className="catalogue-layout">
          <aside className="filters">
            <div className="filter-heading">
              <h3>Filters</h3>
              <button onClick={resetFilters}>Clear all</button>
            </div>

            <label htmlFor="search">Search products</label>
            <input
              id="search"
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {categoryName(category)}
                </option>
              ))}
            </select>

            <label htmlFor="size">Size</label>
            <select
              id="size"
              value={sizeFilter}
              onChange={(event) => setSizeFilter(event.target.value)}
            >
              <option value="all">All sizes</option>
              {sizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
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
                <option key={colour} value={colour}>
                  {colour}
                </option>
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

          <div className="product-area">
            {loading && <p className="status-message">Loading products...</p>}

            {!loading && error && (
              <p className="status-message error">{error}</p>
            )}

            {!loading && !error && filteredProducts.length === 0 && (
              <div className="empty-state">
                <h3>No products found</h3>
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
                    <div className="product-image">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="image-placeholder">YUSEE PLUGS</div>
                      )}
                      {!available && (
                        <span className="sold-out">SOLD OUT</span>
                      )}
                    </div>

                    <div className="product-info">
                      <span className="product-category">
                        {categoryName(product.category)}
                      </span>
                      <h3>{product.name}</h3>
                      <p className="product-price">
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
        <div
          className="modal-backdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedProduct(null)}
              aria-label="Close product details"
            >
              ×
            </button>

            <div className="modal-image">
              {selectedProduct.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                />
              ) : (
                <div className="image-placeholder">YUSEE PLUGS</div>
              )}
            </div>

            <div className="modal-details">
              <p className="eyebrow">
                {categoryName(selectedProduct.category)}
              </p>
              <h2>{selectedProduct.name}</h2>
              <p className="modal-description">
                {selectedProduct.description || "Discover this Yusee Plugs item."}
              </p>

              <p className="modal-price">
                {(() => {
                  const variant = selectedProduct.variants.find(
                    (item) => item.id === selectedVariant
                  );
                  return variant ? formatPrice(variant.pricePence) : "Select an option";
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
                    ]
                      .filter(Boolean)
                      .join(" · ")}
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

      <footer className="shop-footer">
        <Link href="/">YUSEE PLUGS</Link>
        <p>PLUG IN. STAND OUT.</p>
      </footer>

      <style jsx>{`
        .shop-page {
          min-height: 100vh;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .shop-header {
          min-height: 76px;
          padding: 14px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid #e9e9e9;
        }

        .brand {
          display: flex;
          flex-direction: column;
          color: #111;
          text-decoration: none;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .brand-mark {
          font-size: 21px;
        }

        .brand-tagline {
          margin-top: 4px;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .header-links {
          display: flex;
          gap: 25px;
        }

        .header-links a,
        .home-link {
          color: #111;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
        }

        .shop-intro {
          padding: 58px 20px 48px;
          text-align: center;
          background: #f5f5f5;
        }

        .eyebrow {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .shop-intro h1 {
          margin: 12px 0;
          font-size: clamp(32px, 5vw, 54px);
          font-weight: 900;
          letter-spacing: -1.5px;
        }

        .shop-intro p:last-child {
          color: #666;
          font-size: 14px;
        }

        .catalogue {
          max-width: 1500px;
          margin: auto;
          padding: 42px 5% 80px;
        }

        .catalogue-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }

        .catalogue-top h2 {
          margin: 0;
          font-size: 25px;
          font-weight: 900;
        }

        .result-count {
          margin: 6px 0 0;
          color: #777;
          font-size: 12px;
        }

        .sort-control {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .sort-control label,
        .filters label {
          font-size: 11px;
          font-weight: 800;
        }

        .sort-control select,
        .filters select,
        .filters input {
          width: 100%;
          min-height: 42px;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 0;
          background: #fff;
          color: #111;
          font-size: 12px;
        }

        .sort-control select {
          width: auto;
          min-width: 165px;
        }

        .catalogue-layout {
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 34px;
        }

        .filters {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          gap: 10px;
        }

        .filter-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .filter-heading h3 {
          margin: 0;
          font-size: 17px;
          font-weight: 900;
        }

        .filter-heading button {
          border: 0;
          background: none;
          color: #666;
          text-decoration: underline;
          font-size: 11px;
          cursor: pointer;
        }

        .filters label:not(:first-child) {
          margin-top: 12px;
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

        .product-image {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          aspect-ratio: 4 / 5;
          background: #f2f2f2;
        }

        .product-image img,
        .modal-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
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
          font-weight: 800;
        }

        .product-info {
          padding-top: 13px;
        }

        .product-category {
          color: #777;
          font-size: 10px;
          text-transform: uppercase;
        }

        .product-info h3 {
          margin: 7px 0;
          font-size: 14px;
          font-weight: 800;
        }

        .product-price {
          margin: 0;
          font-size: 13px;
          font-weight: 800;
        }

        .status-message,
        .empty-state {
          padding: 35px 15px;
          color: #555;
          text-align: center;
        }

        .error {
          color: #b00020;
        }

        .empty-state h3 {
          color: #111;
        }

        .empty-state button {
          padding: 12px 20px;
          border: 0;
          background: #111;
          color: #fff;
          font-weight: 800;
          cursor: pointer;
        }

        .modal-backdrop {
          position: fixed;
          z-index: 50;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.7);
        }

        .product-modal {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
          max-width: 850px;
          max-height: 90vh;
          overflow: auto;
          background: white;
        }

        .close-modal {
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

        .modal-details {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 38px;
        }

        .modal-details h2 {
          margin: 8px 0 12px;
          font-size: 27px;
          font-weight: 900;
        }

        .modal-description {
          color: #666;
          font-size: 13px;
          line-height: 1.7;
        }

        .modal-price {
          margin: 12px 0 25px;
          font-size: 19px;
          font-weight: 900;
        }

        .modal-details label {
          margin-bottom: 8px;
          font-size: 11px;
          font-weight: 800;
        }

        .modal-details select {
          min-height: 45px;
          padding: 10px;
          border: 1px solid #ddd;
          background: white;
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

        .bag-message {
          margin: 12px 0 0;
          color: #333;
          font-size: 12px;
        }

        .shop-footer {
          padding: 35px 20px;
          background: #111;
          color: #fff;
          text-align: center;
        }

        .shop-footer a {
          color: white;
          font-size: 18px;
          font-weight: 900;
          letter-spacing: 2px;
          text-decoration: none;
        }

        .shop-footer p {
          margin: 8px 0 0;
          color: #bbb;
          font-size: 10px;
          letter-spacing: 2px;
        }

        @media (max-width: 850px) {
          .header-links {
            gap: 12px;
          }

          .header-links a {
            font-size: 10px;
          }

          .catalogue-layout {
            grid-template-columns: 180px minmax(0, 1fr);
            gap: 20px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .shop-header {
            flex-wrap: wrap;
            gap: 12px;
          }

          .brand-mark {
            font-size: 18px;
          }

          .header-links {
            order: 3;
            width: 100%;
            justify-content: space-between;
            overflow-x: auto;
          }

          .header-links a {
            white-space: nowrap;
          }

          .catalogue {
            padding: 30px 4% 55px;
          }

          .catalogue-top {
            align-items: flex-start;
            flex-direction: column;
          }

          .sort-control {
            width: 100%;
            justify-content: space-between;
          }

          .sort-control select {
            flex: 1;
          }

          .catalogue-layout {
            grid-template-columns: 1fr;
          }

          .filters {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 9px 12px;
          }

          .filter-heading {
            grid-column: 1 / -1;
          }

          .filters label {
            align-self: end;
          }

          .filters input,
          .filters select {
            min-width: 0;
          }

          .product-grid {
            gap: 22px 12px;
          }

          .product-info h3 {
            font-size: 12px;
          }

          .product-modal {
            display: block;
            max-width: 430px;
          }

          .modal-image {
            height: 260px;
            min-height: 0;
          }

          .modal-details {
            padding: 24px;
          }

          .modal-details h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}

