
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { House, ShoppingBag, UserRound, X } from "lucide-react";

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

function normaliseDelivery(delivery?: string | null) {
  const value = (delivery || "").trim().toLowerCase();

  if (value.includes("uk")) return "uk";
  if (value.includes("china")) return "china";

  return value;
}

function money(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

export default function MensPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [size, setSize] = useState("all");
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
        const allProducts = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
            ? data.products
            : [];

        const mensProducts = allProducts.filter((product: Product) => {
          const category = (product.category || "")
            .trim()
            .toLowerCase()
            .replace("’", "'");

          return (
            category === "men" ||
            category === "mens" ||
            category === "men's" ||
            category.startsWith("men/") ||
            category.startsWith("men /") ||
            category.startsWith("mens/") ||
            category.startsWith("mens /") ||
            category.startsWith("men's/") ||
            category.startsWith("men's ") ||
            category.startsWith("mens ")
          );
        });

        setProducts(mensProducts);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yusee_bag");

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setBag(parsed);
        }
      }
    } catch {
      setBag([]);
    }

    setBagReady(true);

    async function checkAccount() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        setCustomerSignedIn(data.signedIn === true);
      } catch {
        setCustomerSignedIn(false);
      }
    }

    checkAccount();

    function syncBag(event: StorageEvent) {
      if (event.key !== "yusee_bag") return;

      try {
        setBag(event.newValue ? JSON.parse(event.newValue) : []);
      } catch {
        setBag([]);
      }
    }

    window.addEventListener("storage", syncBag);

    return () => {
      window.removeEventListener("storage", syncBag);
    };
  }, []);

  useEffect(() => {
    if (!bagReady) return;

    localStorage.setItem("yusee_bag", JSON.stringify(bag));
  }, [bag, bagReady]);

  const sizes = useMemo(() => {
    const values = products.flatMap((product) =>
      product.variants.map((variant) => variant.size).filter(Boolean)
    );

    return Array.from(new Set(values as string[])).sort();
  }, [products]);

  const colours = useMemo(() => {
    const values = products.flatMap((product) =>
      product.variants.map((variant) => variant.colour).filter(Boolean)
    );

    return Array.from(new Set(values as string[])).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const query = search.toLowerCase();

      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.description || "").toLowerCase().includes(query)
      );
    }

    if (size !== "all") {
      result = result.filter((product) =>
        product.variants.some(
          (variant) => variant.size === size && variant.stock > 0
        )
      );
    }

    if (colour !== "all") {
      result = result.filter((product) =>
        product.variants.some(
          (variant) => variant.colour === colour && variant.stock > 0
        )
      );
    }

    if (maxPrice !== "all") {
      const maximum = Number(maxPrice) * 100;

      result = result.filter((product) =>
        product.variants.some(
          (variant) => variant.pricePence <= maximum && variant.stock > 0
        )
      );
    }

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          Math.min(...a.variants.map((v) => v.pricePence)) -
          Math.min(...b.variants.map((v) => v.pricePence))
      );
    } else if (sort === "price-high") {
      result.sort(
        (a, b) =>
          Math.min(...b.variants.map((v) => v.pricePence)) -
          Math.min(...a.variants.map((v) => v.pricePence))
      );
    } else {
      result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }

    return result;
  }, [products, search, size, colour, maxPrice, sort]);

  const bagItems = useMemo(() => {
    return bag
      .map((item) => {
        for (const product of products) {
          const variant = product.variants.find(
            (v) => v.id === item.variantId
          );

          if (variant) {
            return {
              ...item,
              product,
              variant,
            };
          }
        }

        return null;
      })
      .filter((item) => item !== null);
  }, [bag, products]);

  const bagCount = bag.reduce((total, item) => total + item.quantity, 0);

  const bagTotal = bagItems.reduce(
    (total, item) =>
      total + item.variant.pricePence * item.quantity,
    0
  );

  function openProduct(product: Product) {
    setSelected(product);
    setSelectedVariant("");
    setMessage("");
  }

  function addToBag() {
    if (!selected || !selectedVariant) {
      setMessage("Please select a size and option first.");
      return;
    }

    const variant = selected.variants.find(
      (item) => item.id === selectedVariant
    );

    if (!variant || variant.stock <= 0) {
      setMessage("This option is sold out.");
      return;
    }

    const newDelivery = normaliseDelivery(variant.delivery);

    const existingDeliveries = bagItems
      .map((item) => normaliseDelivery(item.variant.delivery))
      .filter(Boolean);

    if (
      existingDeliveries.length > 0 &&
      existingDeliveries.some((delivery) => delivery !== newDelivery)
    ) {
      setMessage(
        "Your bag contains items with a different delivery type. Please checkout separately."
      );
      return;
    }

    setBag((current) => {
      const existing = current.find(
        (item) => item.variantId === selectedVariant
      );

      if (existing) {
        return current.map((item) =>
          item.variantId === selectedVariant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          variantId: selectedVariant,
          quantity: 1,
        },
      ];
    });

    setSelected(null);
    setBagOpen(true);
  }

  function updateQuantity(variantId: string, quantity: number) {
    if (quantity <= 0) {
      setBag((current) =>
        current.filter((item) => item.variantId !== variantId)
      );
      return;
    }

    setBag((current) =>
      current.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity }
          : item
      )
    );
  }

  async function checkout() {
    if (bagItems.length === 0) return;

    const deliveryTypes = Array.from(
      new Set(
        bagItems
          .map((item) => normaliseDelivery(item.variant.delivery))
          .filter(Boolean)
      )
    );

    if (deliveryTypes.length > 1) {
      alert(
        "Your bag contains different delivery types. Please checkout separately."
      );
      return;
    }

    try {
      setCheckoutLoading(true);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: bag.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout could not be started.");
      }

      window.location.href = data.url;
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Something went wrong during checkout."
      );
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <main className="mens-page">
      <div className="announcement">
        <span>PLUG IN. STAND OUT.</span>
        <span>DISCOVER THE COLLECTION</span>
      </div>

      <header className="site-header">
        <div className="header-icons">
          <Link href="/" aria-label="Home">
            <House size={21} />
          </Link>
        </div>

        <Link href="/" className="logo">
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
          <button
            type="button"
            onClick={() => setBagOpen(true)}
            aria-label="Shopping bag"
            className="icon-button"
          >
            <ShoppingBag size={21} />
            {bagCount > 0 && <span className="bag-count">{bagCount}</span>}
          </button>

          <Link
            href={customerSignedIn ? "/account" : "/login"}
            aria-label="Account"
          >
            <UserRound size={21} />
          </Link>
        </div>
      </header>

      <nav className="category-nav">
        <Link href="/mens" className="active">
          MEN
        </Link>
        <Link href="/womens">WOMEN</Link>
        <Link href="/electronics">ELECTRONICS</Link>
        <Link href="/accessories">ACCESSORIES</Link>
      </nav>

      <section className="banner">
        <Image
          src="/4A72528E-A9E4-4604-BBFD-28C98BD71CB1.png"
          alt="Shop men's collection"
          width={2000}
          height={700}
          priority
          className="banner-image"
        />
      </section>

      <section className="catalogue">
        <div className="catalogue-heading">
          <p className="eyebrow">THE YUSEE COLLECTION</p>
          <h1>SHOP MEN</h1>
          <p className="catalogue-description">
            Discover the latest styles from Yusee.
          </p>
        </div>

        <div className="filters">
          <input
            type="search"
            placeholder="Search menswear..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search menswear"
          />

          <select
            value={size}
            onChange={(event) => setSize(event.target.value)}
            aria-label="Filter by size"
          >
            <option value="all">All sizes</option>
            {sizes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

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
            <option value="20">Under £20</option>
            <option value="40">Under £40</option>
            <option value="60">Under £60</option>
            <option value="100">Under £100</option>
            <option value="150">Under £150</option>
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
          <p className="status-message">LOADING MENSWEAR...</p>
        ) : error ? (
          <p className="status-message">{error}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="status-message">
            No menswear products found.
          </p>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const availableVariants = product.variants.filter(
                (variant) => variant.stock > 0
              );

              const lowestPrice =
                product.variants.length > 0
                  ? Math.min(
                      ...product.variants.map(
                        (variant) => variant.pricePence
                      )
                    )
                  : 0;

              return (
                <button
                  type="button"
                  className="product-card"
                  key={product.id}
                  onClick={() => openProduct(product)}
                >
                  <div className="product-image-wrap">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 600px) 50vw, (max-width: 850px) 33vw, 25vw"
                        className="product-image"
                      />
                    ) : (
                      <div className="image-placeholder">
                        YUSEE
                      </div>
                    )}

                    {availableVariants.length === 0 && (
                      <span className="sold-out-label">SOLD OUT</span>
                    )}
                  </div>

                  <div className="product-details">
                    <h2>{product.name}</h2>
                    <p>From {money(lowestPrice)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selected && (
        <div
          className="modal-backdrop"
          onClick={() => setSelected(null)}
        >
          <div
            className="product-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="close-button"
              onClick={() => setSelected(null)}
              aria-label="Close product"
            >
              <X size={22} />
            </button>

            <div className="modal-image">
              {selected.imageUrl ? (
                <Image
                  src={selected.imageUrl}
                  alt={selected.name}
                  fill
                  sizes="(max-width: 700px) 100vw, 50vw"
                  className="product-image"
                />
              ) : (
                <div className="image-placeholder">YUSEE</div>
              )}
            </div>

            <div className="modal-details">
              <p className="eyebrow">YUSEE COLLECTION</p>
              <h2>{selected.name}</h2>

              {selected.description && (
                <p className="modal-description">
                  {selected.description}
                </p>
              )}

              <h3>SELECT YOUR OPTION</h3>

              <div className="variant-list">
                {selected.variants.map((variant) => {
                  const soldOut = variant.stock <= 0;

                  return (
                    <button
                      type="button"
                      key={variant.id}
                      disabled={soldOut}
                      className={`variant-option ${
                        selectedVariant === variant.id ? "chosen" : ""
                      }`}
                      onClick={() => {
                        setSelectedVariant(variant.id);
                        setMessage("");
                      }}
                    >
                      <span>
                        {variant.size || "One size"}
                        {variant.colour ? ` · ${variant.colour}` : ""}
                        {variant.delivery
                          ? ` · ${variant.delivery}`
                          : ""}
                      </span>

                      <span>
                        {money(variant.pricePence)}
                        {soldOut ? " · SOLD OUT" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>

              {message && <p className="form-message">{message}</p>}

              <button
                type="button"
                className="add-button"
                onClick={addToBag}
                disabled={
                  selected.variants.length === 0 ||
                  selected.variants.every((variant) => variant.stock <= 0)
                }
              >
                ADD TO BAG
              </button>
            </div>
          </div>
        </div>
      )}

      {bagOpen && (
        <div
          className="drawer-backdrop"
          onClick={() => setBagOpen(false)}
        >
          <aside
            className="bag-drawer"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-heading">
              <h2>YOUR BAG ({bagCount})</h2>

              <button
                type="button"
                onClick={() => setBagOpen(false)}
                aria-label="Close bag"
                className="icon-button"
              >
                <X size={23} />
              </button>
            </div>

            {bagItems.length === 0 ? (
              <div className="empty-bag">
                <p>Your bag is currently empty.</p>
                <button
                  type="button"
                  className="add-button"
                  onClick={() => setBagOpen(false)}
                >
                  CONTINUE SHOPPING
                </button>
              </div>
            ) : (
              <>
                <div className="bag-products">
                  {bagItems.map((item) => (
                    <div
                      className="bag-item"
                      key={item.variantId}
                    >
                      <div className="bag-item-image">
                        {item.product.imageUrl ? (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            sizes="90px"
                            className="product-image"
                          />
                        ) : (
                          <div className="image-placeholder">YUSEE</div>
                        )}
                      </div>

                      <div className="bag-item-info">
                        <h3>{item.product.name}</h3>

                        <p>
                          {item.variant.size || "One size"}
                          {item.variant.colour
                            ? ` · ${item.variant.colour}`
                            : ""}
                        </p>

                        <p>{money(item.variant.pricePence)}</p>

                        <div className="quantity-controls">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.variantId,
                                item.quantity - 1
                              )
                            }
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.variantId,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          className="remove-item"
                          onClick={() =>
                            updateQuantity(item.variantId, 0)
                          }
                        >
                          REMOVE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bag-footer">
                  <div className="subtotal">
                    <span>SUBTOTAL</span>
                    <strong>{money(bagTotal)}</strong>
                  </div>

                  <p className="delivery-note">
                    Shipping and taxes are calculated at checkout.
                  </p>

                  <button
                    type="button"
                    className="add-button checkout-button"
                    onClick={checkout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading
                      ? "PLEASE WAIT..."
                      : "PROCEED TO CHECKOUT"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <footer className="site-footer">
        <div className="footer-top">
          <div className="footer-brand">
            <Image
              src="/FAAEF0EE-B20E-425B-AC66-5DA42ADAF006.png"
              alt="Yusee Plugs"
              width={145}
              height={55}
              className="footer-logo"
            />
            <p>PLUG IN. STAND OUT.</p>
          </div>

          <div className="footer-links">
            <h3>SHOP</h3>
            <Link href="/mens">Men</Link>
            <Link href="/womens">Women</Link>
            <Link href="/electronics">Electronics</Link>
            <Link href="/accessories">Accessories</Link>
          </div>

          <div className="footer-links">
            <h3>HELP</h3>
            <Link href="/contact">Contact</Link>
            <Link href="/delivery">Delivery</Link>
            <Link href="/returns">Returns</Link>
            <Link href="/account">My account</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} YUSEE PLUGS. ALL RIGHTS RESERVED.</p>
        </div>
      </footer>

      <style jsx>{`
        .mens-page {
          min-height: 100vh;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .announcement {
          min-height: 29px;
          background: #111;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 5%;
          font-size: 9px;
          letter-spacing: 1.5px;
          font-weight: 600;
        }

        .site-header {
          height: 82px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 5%;
          border-bottom: 1px solid #eee;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-image {
          width: 170px;
          height: 65px;
          object-fit: contain;
        }

        .header-icons {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .header-icons:last-child {
          justify-content: flex-end;
        }

        .header-icons a,
        .icon-button {
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: 0;
          padding: 4px;
          cursor: pointer;
          position: relative;
        }

        .bag-count {
          position: absolute;
          top: -5px;
          right: -7px;
          background: #111;
          color: #fff;
          border-radius: 50%;
          min-width: 16px;
          height: 16px;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .category-nav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 42px;
          height: 48px;
          border-bottom: 1px solid #eee;
        }

        .category-nav a {
          color: #111;
          text-decoration: none;
          font-size: 10px;
          letter-spacing: 1.3px;
          font-weight: 600;
        }

        .category-nav a.active {
          opacity: 0.65;
        }

        .banner {
          width: 100%;
          line-height: 0;
          overflow: hidden;
        }

        .banner-image {
          width: 100%;
          height: auto;
          object-fit: contain;
        }

        .catalogue {
          padding: 55px 5% 85px;
          max-width: 1600px;
          margin: 0 auto;
        }

        .catalogue-heading {
          text-align: center;
          margin-bottom: 35px;
        }

        .eyebrow {
          font-size: 9px;
          letter-spacing: 2px;
          color: #777;
          margin: 0 0 12px;
        }

        .catalogue-heading h1 {
          font-size: 29px;
          letter-spacing: 2px;
          margin: 0;
          font-weight: 600;
        }

        .catalogue-description {
          font-size: 12px;
          color: #777;
          margin-top: 12px;
        }

        .filters {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 30px;
        }

        .filters input,
        .filters select {
          width: 100%;
          min-width: 0;
          height: 42px;
          border: 1px solid #ddd;
          border-radius: 0;
          background: #fff;
          padding: 0 12px;
          color: #222;
          font-size: 11px;
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 30px 17px;
        }

        .product-card {
          border: 0;
          padding: 0;
          background: #fff;
          text-align: left;
          color: #111;
          cursor: pointer;
          min-width: 0;
        }

        .product-image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 3 / 4;
          background: #f5f5f5;
          overflow: hidden;
        }

        .product-image {
          object-fit: cover;
        }

        .image-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f3f3;
          color: #999;
          font-size: 13px;
          letter-spacing: 3px;
        }

        .sold-out-label {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: #fff;
          padding: 7px 10px;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .product-details {
          padding-top: 12px;
        }

        .product-details h2 {
          font-size: 12px;
          font-weight: 500;
          margin: 0 0 7px;
        }

        .product-details p {
          font-size: 11px;
          color: #555;
          margin: 0;
        }

        .status-message {
          text-align: center;
          padding: 50px 10px;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .modal-backdrop,
        .drawer-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          background: rgba(0, 0, 0, 0.55);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .product-modal {
          background: #fff;
          width: min(850px, 100%);
          max-height: 90vh;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
        }

        .close-button {
          position: absolute;
          top: 13px;
          right: 13px;
          z-index: 2;
          border: 0;
          background: #fff;
          width: 35px;
          height: 35px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .modal-image {
          position: relative;
          min-height: 450px;
          background: #f5f5f5;
        }

        .modal-details {
          padding: 55px 35px 35px;
        }

        .modal-details h2 {
          font-size: 23px;
          font-weight: 500;
          margin: 0 0 15px;
        }

        .modal-description {
          font-size: 12px;
          line-height: 1.7;
          color: #666;
          margin-bottom: 25px;
        }

        .modal-details h3 {
          font-size: 10px;
          letter-spacing: 1.5px;
          margin: 25px 0 12px;
        }

        .variant-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .variant-option {
          width: 100%;
          min-height: 42px;
          padding: 10px;
          border: 1px solid #ddd;
          background: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          text-align: left;
          font-size: 10px;
          cursor: pointer;
        }

        .variant-option.chosen {
          border-color: #111;
          background: #f8f8f8;
        }

        .variant-option:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .form-message {
          font-size: 11px;
          color: #b00020;
          line-height: 1.5;
          margin-top: 12px;
        }

        .add-button {
          width: 100%;
          height: 47px;
          background: #111;
          color: #fff;
          border: 1px solid #111;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
        }

        .add-button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .drawer-backdrop {
          justify-content: flex-end;
          padding: 0;
        }

        .bag-drawer {
          width: min(430px, 100%);
          height: 100%;
          background: #fff;
          display: flex;
          flex-direction: column;
          padding: 25px;
        }

        .drawer-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 18px;
        }

        .drawer-heading h2 {
          font-size: 13px;
          letter-spacing: 1.5px;
          margin: 0;
        }

        .empty-bag {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          font-size: 12px;
          color: #666;
        }

        .bag-products {
          flex: 1;
          overflow-y: auto;
        }

        .bag-item {
          display: grid;
          grid-template-columns: 90px 1fr;
          gap: 15px;
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }

        .bag-item-image {
          position: relative;
          width: 90px;
          height: 115px;
          background: #f5f5f5;
        }

        .bag-item-info h3 {
          font-size: 12px;
          font-weight: 500;
          margin: 0 0 7px;
        }

        .bag-item-info p {
          font-size: 10px;
          color: #666;
          margin: 5px 0;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-top: 10px;
          font-size: 11px;
        }

        .quantity-controls button {
          width: 23px;
          height: 23px;
          background: #fff;
          border: 1px solid #ddd;
          cursor: pointer;
        }

        .remove-item {
          background: none;
          border: 0;
          padding: 0;
          margin-top: 10px;
          font-size: 9px;
          letter-spacing: 1px;
          text-decoration: underline;
          cursor: pointer;
        }

        .bag-footer {
          border-top: 1px solid #eee;
          padding-top: 20px;
        }

        .subtotal {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .delivery-note {
          font-size: 10px;
          color: #777;
          margin-top: 10px;
        }

        .checkout-button {
          margin-top: 15px;
        }

        .site-footer {
          background: #111;
          color: #fff;
          padding: 50px 7% 20px;
        }

        .footer-top {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 40px;
          padding-bottom: 45px;
        }

        .footer-logo {
          width: 145px;
          height: 55px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }

        .footer-brand p {
          font-size: 9px;
          letter-spacing: 2px;
          color: #aaa;
        }

        .footer-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .footer-links h3 {
          font-size: 10px;
          letter-spacing: 1.5px;
          margin: 0 0 7px;
        }

        .footer-links a {
          color: #aaa;
          text-decoration: none;
          font-size: 11px;
        }

        .footer-links a:hover {
          color: #fff;
        }

        .footer-bottom {
          border-top: 1px solid #333;
          padding-top: 20px;
          color: #888;
          font-size: 9px;
          letter-spacing: 1px;
          text-align: center;
        }

        @media (max-width: 850px) {
          .product-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .filters {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .filters input {
            grid-column: 1 / -1;
          }

          .product-modal {
            max-width: 650px;
          }

          .modal-image {
            min-height: 350px;
          }
        }

        @media (max-width: 600px) {
          .announcement {
            font-size: 8px;
            padding: 7px 4%;
          }

          .site-header {
            height: 70px;
            padding: 0 4%;
          }

          .logo-image {
            width: 135px;
            height: 55px;
          }

          .header-icons {
            gap: 10px;
          }

          .header-icons svg {
            width: 19px;
            height: 19px;
          }

          .category-nav {
            height: 43px;
            gap: 19px;
          }

          .category-nav a {
            font-size: 8px;
            letter-spacing: 0.7px;
          }

          .catalogue {
            padding: 38px 4% 60px;
          }

          .catalogue-heading h1 {
            font-size: 24px;
          }

          .product-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 25px 10px;
          }

          .product-details h2 {
            font-size: 11px;
          }

          .product-modal {
            display: block;
            width: 100%;
            max-height: 92vh;
          }

          .modal-image {
            min-height: 0;
            height: 300px;
          }

          .modal-details {
            padding: 25px 20px;
          }

          .modal-details h2 {
            font-size: 20px;
          }

          .footer-top {
            grid-template-columns: 1fr 1fr;
            gap: 30px 20px;
          }

          .footer-brand {
            grid-column: 1 / -1;
          }

          .site-footer {
            padding: 40px 6% 20px;
          }

          .bag-drawer {
            padding: 20px;
          }
        }
      `}</style>
    </main>
  );
}
