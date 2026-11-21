
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  House,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";

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

const money = (pence: number) => `£${(pence / 100).toFixed(2)}`;

export default function WomensPage() {
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [customerSignedIn, setCustomerSignedIn] = useState(false);

  // Load women's products
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/products", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load products.");
        }

        const allProducts: Product[] = Array.isArray(data)
          ? data
          : data.products || [];

        setProducts(
          allProducts.filter((product) => {
            const category = (product.category || "").trim().toLowerCase();

            return (
              category === "women" ||
              category === "womens" ||
              category === "women's" ||
              category.startsWith("women/") ||
              category.startsWith("womens/") ||
              category.startsWith("women's/") ||
              category.startsWith("women /") ||
              category.startsWith("womens /") ||
              category.startsWith("women's /")
            );
          })
        );
      } catch {
        setError("We couldn't load women's products right now. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // Load the same saved bag used by the homepage
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

  // Keep the saved bag updated
  useEffect(() => {
    if (bagReady) {
      localStorage.setItem("yusee_bag", JSON.stringify(bag));
    }
  }, [bag, bagReady]);

  // Keep the bag in sync if it changes in another browser tab
  useEffect(() => {
    function syncBag() {
      try {
        const stored = localStorage.getItem("yusee_bag");
        const parsed = stored ? JSON.parse(stored) : [];

        if (Array.isArray(parsed)) {
          setBag(parsed);
        }
      } catch {
        setBag([]);
      }
    }

    window.addEventListener("storage", syncBag);

    return () => window.removeEventListener("storage", syncBag);
  }, []);

  // Check customer sign-in
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = response.ok
          ? await response.json()
          : { signedIn: false };

        setCustomerSignedIn(data.signedIn === true);
      } catch {
        setCustomerSignedIn(false);
      }
    }

    checkAuth();
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

    const selectedDelivery = normaliseDelivery(variant.delivery);

    const existingDeliveries = bag
      .map((line) => {
        const existingVariant = products
          .flatMap((item) => item.variants)
          .find((item) => item.id === line.variantId);

        return existingVariant
          ? normaliseDelivery(existingVariant.delivery)
          : null;
      })
      .filter(Boolean);

    if (
      existingDeliveries.some(
        (delivery) => delivery !== selectedDelivery
      )
    ) {
      setMessage(
        "Your bag already contains a different delivery type. Please checkout or remove those items before adding this product."
      );
      return;
    }

    setBag((old) => {
      const existing = old.find((item) => item.variantId === variant.id);

      if (existing) {
        return old.map((item) =>
          item.variantId === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...old, { variantId: variant.id, quantity: 1 }];
    });

    setSelected(null);
    setMessage("");
    setBagOpen(true);
  }

  async function startCheckout(items: BagItem[]) {
    if (!items.length) return;

    const deliveries = new Set(
      items.map((item) => {
        const variant = products
          .flatMap((product) => product.variants)
          .find((variant) => variant.id === item.variantId);

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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
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

  const bagItems = bag
    .map((line) => {
      const product = products.find((item) =>
        item.variants.some((variant) => variant.id === line.variantId)
      );

      const variant = product?.variants.find(
        (item) => item.id === line.variantId
      );

      if (!product || !variant) return null;

      return {
        ...line,
        product,
        variant,
      };
    })
    .filter(
      (item): item is NonNullable<typeof item> => item !== null
    );

  const bagCount = bag.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = bagItems.reduce(
    (sum, item) => sum + item.variant.pricePence * item.quantity,
    0
  );

  const modalVariant = selected?.variants.find(
    (variant) => variant.id === selectedVariant
  );

  return (
    <main className="accessories-page">
      <div className="announcement">
        <span>PLUG IN. STAND OUT.</span>
        <span>DISCOVER THE COLLECTION</span>
      </div>

      <header className="site-header">
        <div className="header-top">
          <Link href="/" className="logo" aria-label="Yusee Plugs home">
            <Image
              src="/FAAEF0EE-B20E-425B-AC66-5DA42ADAF006.png"
              alt="Yusee Plugs"
              width={170}
              height={65}
              priority
              className="logo-image"
            />
          </Link>

          <div className="header-icons">
            <Link href="/" aria-label="Home" title="Home">
              <House size={23} strokeWidth={2} />
            </Link>

            <button
              className="header-icon bag-icon"
              aria-label="Open shopping bag"
              title="Shopping bag"
              onClick={() => setBagOpen(true)}
            >
              <ShoppingBag size={23} strokeWidth={2} />
              <span className="bag-count">{bagCount}</span>
            </button>

            <Link
              href={customerSignedIn ? "/account" : "/login"}
              aria-label="My account"
              title="My account"
            >
              <UserRound size={23} strokeWidth={2} />
            </Link>
          </div>
        </div>

        <nav className="category-nav">
          <Link href="/mens">MEN</Link>
          <Link href="/womens" className="active">
            WOMEN
          </Link>
          <Link href="/electronics">ELECTRONICS</Link>
          <Link href="/accessories">ACCESSORIES</Link>
          <Link href="/shop">ALL PRODUCTS</Link>
        </nav>
      </header>

      <section className="intro">
        <img
          src="/175AA31F-54FB-4E70-A53F-4CE6FB09324F.png"
          alt="Yusee Plugs Women's Collection"
        />
      </section>

      <section className="catalogue">
        <div className="catalogue-heading">
          <div>
            <p className="eyebrow">THE YUSEE COLLECTION</p>
            <h2>SHOP WOMEN</h2>
            <p className="product-count">
              {filteredProducts.length} PRODUCTS
            </p>
          </div>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search women's products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search women's products"
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
          <p className="status">LOADING WOMEN'S PRODUCTS...</p>
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
              const available = product.variants.filter(
                (variant) => variant.stock > 0
              );

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
                    <p>{product.category || "Women"}</p>
                    <strong>{money(startingPrice)}</strong>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <footer className="footer">
        <Link href="/" className="footer-brand">
          YUSEE PLUGS
        </Link>
        <p>PLUG IN. STAND OUT.</p>

        <div>
          <Link href="/shop">ALL PRODUCTS</Link>
          <Link href="/mens">MEN</Link>
          <Link href="/womens">WOMEN</Link>
          <Link href="/electronics">ELECTRONICS</Link>
          <Link href="/accessories">ACCESSORIES</Link>
        </div>

        <small>
          © {new Date().getFullYear()} YUSEE PLUGS. ALL RIGHTS RESERVED.
        </small>
      </footer>

      {/* PRODUCT DETAILS */}
      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <section
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={selected.name}
          >
            <button
              className="close-button"
              onClick={() => setSelected(null)}
              aria-label="Close product details"
            >
              <X />
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

              <p className="modal-description">
                {selected.description ||
                  "Explore this product from Yusee Plugs."}
              </p>

              <label htmlFor="variant">CHOOSE AN OPTION</label>

              <select
                id="variant"
                value={selectedVariant}
                onChange={(event) =>
                  setSelectedVariant(event.target.value)
                }
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
                      variant.delivery,
                      money(variant.pricePence),
                      variant.stock < 1 ? "SOLD OUT" : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </select>

              {modalVariant && (
                <strong className="modal-price">
                  {money(modalVariant.pricePence)}
                </strong>
              )}

              <p
                className={`stock-text ${
                  modalVariant?.stock ? "in-stock" : "out-stock"
                }`}
              >
                {modalVariant
                  ? modalVariant.stock > 0
                    ? `${modalVariant.stock} AVAILABLE`
                    : "THIS OPTION IS SOLD OUT"
                  : "NO OPTIONS AVAILABLE"}
              </p>

              <button
                className="add-button"
                disabled={!modalVariant || modalVariant.stock < 1}
                onClick={() =>
                  addToBag(selected, selectedVariant)
                }
              >
                ADD TO BAG
              </button>

              {message && <p className="message">{message}</p>}
            </div>
          </section>
        </div>
      )}

      {/* SHOPPING BAG DRAWER - SAME FUNCTIONALITY AS HOMEPAGE */}
      {bagOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setBagOpen(false)}
        >
          <aside
            className="bag-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <h2>YOUR BAG ({bagCount})</h2>

              <button
                className="drawer-close"
                aria-label="Close bag"
                onClick={() => setBagOpen(false)}
              >
                <X />
              </button>
            </div>

            {bagItems.length === 0 ? (
              <div className="empty-bag">
                <ShoppingBag size={36} />
                <h3>YOUR BAG IS EMPTY</h3>
                <p>Find your next favourite.</p>

                <button
                  className="checkout-button"
                  onClick={() => setBagOpen(false)}
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            ) : (
              <>
                <div className="bag-lines">
                  {bagItems.map((item) => (
                    <div className="bag-line" key={item.variantId}>
                      {item.product.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                        />
                      ) : (
                        <div className="bag-no-image">YUSEE</div>
                      )}

                      <div className="bag-line-details">
                        <b>{item.product.name}</b>

                        {item.variant.size && (
                          <span>Size: {item.variant.size}</span>
                        )}

                        {item.variant.colour && (
                          <span>Colour: {item.variant.colour}</span>
                        )}

                        {item.variant.delivery && (
                          <span>Delivery: {item.variant.delivery}</span>
                        )}

                        <span>
                          {money(item.variant.pricePence)} × {item.quantity}
                        </span>

                        <button
                          onClick={() =>
                            setBag((old) =>
                              old.filter(
                                (line) =>
                                  line.variantId !== item.variantId
                              )
                            )
                          }
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
                    <b>{money(total)}</b>
                  </div>

                  <p>
                    Delivery is included in the selected product price. Your
                    delivery type is shown beside each item.
                  </p>

                  <button
                    className="checkout-button"
                    disabled={checkoutLoading}
                    onClick={() =>
                      startCheckout(
                        bagItems.map((item) => ({
                          variantId: item.variantId,
                          quantity: item.quantity,
                        }))
                      )
                    }
                  >
                    {checkoutLoading
                      ? "CONNECTING TO STRIPE..."
                      : "CHECKOUT"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .accessories-page {
          min-height: 100vh;
          background: #000;
          color: #fff;
          font-family: Arial, Helvetica, sans-serif;
        }

        button {
          font: inherit;
        }

        .announcement {
          height: 29px;
          background: #000;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4%;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1.5px;
          border-bottom: 1px solid #292929;
        }

        .site-header {
          background: #000;
          color: white;
          padding: 0 4%;
          position: relative;
          z-index: 5;
          border-bottom: 1px solid #303030;
        }

        .header-top {
          height: 76px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
        }

        .logo {
          grid-column: 2;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-image {
          width: 155px;
          height: 58px;
          object-fit: contain;
        }

        .header-icons {
          grid-column: 3;
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icons a,
        .header-icon {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          text-decoration: none;
          background: transparent;
          border: 0;
          padding: 9px;
          cursor: pointer;
        }

        .header-icons a:hover,
        .header-icon:hover {
          opacity: 0.7;
        }

        .bag-count {
          position: absolute;
          top: 0;
          right: 0;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 20px;
          background: #fff;
          color: #000;
          font-size: 10px;
          font-weight: 900;
          display: grid;
          place-items: center;
        }

        .category-nav {
          height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(18px, 4vw, 55px);
          background: #000;
          border-top: 1px solid #292929;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .category-nav::-webkit-scrollbar {
          display: none;
        }

        .category-nav a {
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1.3px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .category-nav a:hover,
        .category-nav a.active {
          opacity: 0.65;
        }

        .intro {
          width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: #000;
        }

        .intro img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .catalogue {
          padding: 55px 5% 85px;
          background: #000;
        }

        .eyebrow {
          margin: 0 0 12px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 3px;
          color: #999;
        }

        .catalogue-heading h2 {
          font-size: clamp(25px, 4vw, 38px);
          font-weight: 900;
          letter-spacing: -1.5px;
          margin: 0 0 8px;
        }

        .product-count {
          font-size: 12px;
          color: #999;
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
          border: 1px solid #444;
          background: #111;
          color: #fff;
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
          background: #111;
          color: #fff;
          text-align: left;
          cursor: pointer;
          min-width: 0;
        }

        .product-image {
          height: 280px;
          background: #191919;
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

        .product-image img {
          transition: transform 0.4s;
        }

        .product-card:hover .product-image img {
          transform: scale(1.04);
        }

        .view-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #fff;
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
          color: #999;
        }

        .product-info strong {
          font-size: 14px;
        }

        .status,
        .empty {
          padding: 65px 15px;
          text-align: center;
          color: #aaa;
        }

        .empty h3 {
          font-size: 24px;
          font-weight: 900;
          color: #fff;
        }

        .footer {
          background: #000;
          color: white;
          padding: 45px 5%;
          text-align: center;
          border-top: 1px solid #333;
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

        /* PRODUCT MODAL */

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.78);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          overflow-y: auto;
        }

        .product-modal {
          background: #f5f5f2;
          color: #111;
          width: 100%;
          max-width: 850px;
          max-height: 92vh;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 10px;
          right: 12px;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 50%;
          background: #fff;
          color: #111;
          cursor: pointer;
          z-index: 2;
        }

        .modal-image {
          min-height: 380px;
          background: #e6e6e3;
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

        .modal-info .eyebrow {
          color: #777;
        }

        .modal-info h2 {
          font-size: 26px;
          font-weight: 900;
          margin: 0;
        }

        .modal-description {
          color: #666;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .modal-info label {
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .modal-info select {
          width: 100%;
          background: #fff;
          color: #111;
          border-color: #ccc;
        }

        .modal-price {
          font-size: 20px;
        }

        .stock-text {
          font-size: 11px;
          letter-spacing: 0.7px;
        }

        .in-stock {
          color: #333;
        }

        .out-stock {
          color: #777;
        }

        .add-button {
          width: 100%;
          padding: 16px;
          border: 1px solid #111;
          background: #111;
          color: #fff;
          font-weight: 900;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .add-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .message {
          font-size: 12px;
          line-height: 1.5;
          font-weight: 700;
        }

        /* SHOPPING BAG DRAWER */

        .drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 60;
          display: flex;
          justify-content: flex-start;
          align-items: stretch;
          padding: 0;
          background: rgba(0, 0, 0, 0.78);
        }

        .bag-drawer {
          width: min(420px, 90vw);
          height: 100%;
          margin-left: auto;
          overflow-y: auto;
          padding: 24px;
          background: #050505;
          color: #fff;
          box-shadow: -10px 0 35px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
        }

        .drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 22px;
          border-bottom: 1px solid #333;
        }

        .drawer-header h2 {
          font-size: 17px;
          letter-spacing: 1px;
          margin: 0;
        }

        .drawer-close {
          display: grid;
          place-items: center;
          padding: 8px;
          border: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
        }

        .bag-lines {
          padding: 20px 0;
          flex: 1;
        }

        .bag-line {
          display: flex;
          gap: 14px;
          padding: 15px 0;
          border-bottom: 1px solid #292929;
        }

        .bag-line img,
        .bag-no-image {
          width: 90px;
          height: 110px;
          object-fit: cover;
          background: #252525;
          flex-shrink: 0;
        }

        .bag-no-image {
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 900;
        }

        .bag-line-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          font-size: 11px;
          min-width: 0;
        }

        .bag-line-details b {
          line-height: 1.4;
        }

        .bag-line-details span {
          color: #aaa;
        }

        .bag-line-details button {
          padding: 0;
          margin-top: 4px;
          border: 0;
          background: transparent;
          color: #fff;
          text-decoration: underline;
          font-size: 9px;
          cursor: pointer;
        }

        .bag-summary {
          position: sticky;
          bottom: 0;
          padding: 18px 0;
          background: #050505;
          border-top: 1px solid #333;
        }

        .subtotal {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .bag-summary p,
        .empty-bag p {
          color: #999;
          font-size: 11px;
          line-height: 1.6;
        }

        .checkout-button {
          width: 100%;
          padding: 16px;
          border: 0;
          background: #fff;
          color: #000;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .checkout-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .empty-bag {
          min-height: 65vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
        }

        .empty-bag h3 {
          font-size: 14px;
          letter-spacing: 1px;
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

        @media (max-width: 760px) {
          .announcement {
            padding: 0 13px;
            font-size: 8px;
            letter-spacing: 1px;
          }

          .header-top {
            height: 65px;
          }

          .logo-image {
            width: 125px;
            height: 49px;
          }

          .header-icons {
            gap: 2px;
          }

          .header-icons a,
          .header-icon {
            padding: 7px;
          }

          .category-nav {
            height: 43px;
            justify-content: flex-start;
            gap: 23px;
            padding: 0 2px;
          }

          .category-nav a {
            font-size: 9px;
            white-space: nowrap;
          }

          .catalogue {
            padding: 40px 15px 60px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 12px;
          }

          .product-image {
            height: auto;
            aspect-ratio: 1 / 1.08;
          }

          .product-info {
            padding: 11px;
          }

          .product-info h3 {
            font-size: 12px;
          }

          .product-info p {
            font-size: 10px;
          }

          .product-info strong {
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

          .footer {
            padding: 35px 18px;
          }

          .footer div {
            gap: 15px;
          }
        }
      `}</style>
    </main>
  );
}
