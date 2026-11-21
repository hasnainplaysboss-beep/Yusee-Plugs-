
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  ShoppingBag,
  Search,
  X,
  ArrowUpRight,
  Heart,
  UserRound,
  ShieldCheck,
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

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

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

        if (!response.ok) {
          throw new Error(data.error || "Could not load products.");
        }

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
    if (bagReady) {
      localStorage.setItem("yusee_bag", JSON.stringify(bag));
    }
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

        // Only an authenticated admin can see the admin dashboard icon.
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

  const featuredProducts = useMemo(
    () => products.filter(product => product.featured === true),
    [products]
  );

  const searchResults = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return [];

    return products
      .filter(product => product.name.toLowerCase().includes(search))
      .slice(0, 6);
  }, [products, query]);

  function closeMenu() {
    setMenuOpen(false);
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

    if (match) {
      setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
    }
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

    if (match) {
      setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
    }
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

    if (match) {
      setSelectedVariants(old => ({ ...old, [product.id]: match.id }));
    }
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
        const variant = products
          .flatMap(p => p.variants)
          .find(v => v.id === item.variantId);

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
    ? Array.from(
        new Set(selectedProduct.variants.map(v => v.size).filter(Boolean))
      ) as string[]
    : [];

  const modalColours = selectedProduct
    ? Array.from(
        new Set(selectedProduct.variants.map(v => v.colour).filter(Boolean))
      ) as string[]
    : [];

  const modalDeliveries = selectedProduct
    ? Array.from(
        new Set(selectedProduct.variants.map(v => v.delivery).filter(Boolean))
      ) as string[]
    : [];

  function productPrice(product: Product) {
    if (!product.variants.length) return null;

    const cheapest = Math.min(...product.variants.map(v => v.pricePence));

    return `£${(cheapest / 100).toFixed(2)}`;
  }

  function openSearchProduct(product: Product) {
    setSelectedProduct(product);
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <main className="site">
      <div className="announcement">
        <span>PLUG IN. STAND OUT.</span>
        <span>DISCOVER THE COLLECTION</span>
      </div>

      <header className="header">
        <button
          className="headerIcon menuIcon"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={28} strokeWidth={2} />
        </button>

        <Link href="/" className="logo" aria-label="Yusee Plugs home">
          <Image
            src="/FAAEF0EE-B20E-425B-AC66-5DA42ADAF006.png"
            alt="Yusee Plugs"
            width={170}
            height={65}
            priority
            className="logoImage"
          />
        </Link>

        <div className="headerRight">
          <button
            className="headerIcon"
            aria-label="Search"
            onClick={() => setSearchOpen(old => !old)}
          >
            <Search size={23} strokeWidth={2} />
          </button>

          <Link
            className="headerIcon"
            aria-label="My account"
            href={customerSignedIn ? "/account" : "/login"}
          >
            <UserRound size={23} strokeWidth={2} />
          </Link>

          {adminSignedIn && (
            <Link
              className="headerIcon adminIcon"
              aria-label="Admin dashboard"
              href="/admin"
            >
              <ShieldCheck size={22} strokeWidth={2} />
            </Link>
          )}

          <button
            className="headerIcon bagIcon"
            aria-label="Open shopping bag"
            onClick={() => setBagOpen(true)}
          >
            <ShoppingBag size={23} strokeWidth={2} />
            <span className="bagCount">{bagCount}</span>
          </button>
        </div>
      </header>

      {searchOpen && (
        <div className="searchPanel">
          <div className="searchInputWrap">
            <Search size={20} />
            <input
              autoFocus
              placeholder="Search products..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button
              aria-label="Close search"
              onClick={() => {
                setSearchOpen(false);
                setQuery("");
              }}
            >
              <X size={21} />
            </button>
          </div>

          {query.trim() && (
            <div className="searchResults">
              {searchResults.length > 0 ? (
                searchResults.map(product => (
                  <button
                    key={product.id}
                    className="searchResult"
                    onClick={() => openSearchProduct(product)}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span className="searchNoImage">YP</span>
                    )}
                    <span>{product.name}</span>
                    <ArrowUpRight size={17} />
                  </button>
                ))
              ) : (
                <p className="searchEmpty">NO MATCHING PRODUCTS FOUND.</p>
              )}
            </div>
          )}

          <Link
            className="searchAllLink"
            href="/shop"
            onClick={() => setSearchOpen(false)}
          >
            SEARCH THE FULL COLLECTION <ArrowUpRight size={16} />
          </Link>
        </div>
      )}

      <nav className="quickNav">
        <Link href="/mens">MENS</Link>
        <Link href="/womens">WOMENS</Link>
        <Link href="/electronics">ELECTRONICS</Link>
        <Link href="/accessories">ACCESSORIES</Link>
        <Link href="/shop">ALL PRODUCTS</Link>
      </nav>

      {/* BANNER: displays the complete image at its natural proportions */}
      <section className="hero">
        <img
          className="heroImage"
          src="/FA104F8F-BE6B-4BFC-AEF4-8408AD0A4D6D.png"
          alt="Yusee Plugs collection banner"
        />
        <Link
          href="/shop"
          className="heroShopNowLink"
          aria-label="Shop all products"
        />
      </section>


      <section className="featured" id="featured">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">THE LATEST ROTATION</p>
            <h2>FEATURED PRODUCTS</h2>
          </div>

          <Link className="viewAll" href="/shop">
            VIEW ALL <ArrowUpRight size={18} />
          </Link>
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
                  <button
                    className="featuredImage"
                    onClick={() => setSelectedProduct(product)}
                    aria-label={`View ${product.name}`}
                  >
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span className="noImage">YUSEE PLUGS</span>
                    )}
                    {!inStock && <span className="soldOut">SOLD OUT</span>}
                  </button>

                  <button
                    className={`saveButton ${saved.includes(product.id) ? "isSaved" : ""}`}
                    aria-label="Save product"
                    onClick={() =>
                      setSaved(old =>
                        old.includes(product.id)
                          ? old.filter(id => id !== product.id)
                          : [...old, product.id]
                      )
                    }
                  >
                    <Heart
                      size={21}
                      fill={saved.includes(product.id) ? "currentColor" : "none"}
                    />
                  </button>

                  <button
                    className="featuredInfo"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <span>{product.name}</span>
                    {price && <b>{price}</b>}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="shopCallout">
        <div>
          <p className="eyebrow">FIND YOUR NEXT FAVOURITE</p>
          <h2>THE COLLECTION<br />IS YOURS TO EXPLORE.</h2>
        </div>
        <Link href="/shop">
          SHOP ALL PRODUCTS <ArrowUpRight size={20} />
        </Link>
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
            <summary>
              <span>CUSTOMER SERVICE</span>
              <span className="footerPlus">+</span>
            </summary>
            <div className="footerAccordionContent">
              <Link href="/delivery">DELIVERY INFORMATION</Link>
              <Link href="/returns">RETURNS & REFUNDS</Link>
              <a href="mailto:hello@yuseeplugs.com">CONTACT US</a>
              <Link href="/faq">FAQ</Link>
            </div>
          </details>

          <details>
            <summary>
              <span>ELEVATE YOUR EVERYDAY</span>
              <span className="footerPlus">+</span>
            </summary>
            <div className="footerAccordionContent newsletterContent">
              <p>
                JOIN THE YUSEE PLUGS COMMUNITY FOR NEW DROPS,
                EXCLUSIVE UPDATES AND MORE.
              </p>
              <form
                className="newsletterForm"
                onSubmit={e => {
                  e.preventDefault();
                  alert("Newsletter signup is not yet connected.");
                }}
              >
                <input
                  type="email"
                  placeholder="ENTER YOUR EMAIL ADDRESS"
                  aria-label="Email address"
                  required
                />
                <button type="submit">
                  SIGN UP <ArrowUpRight size={18} />
                </button>
              </form>
              <p className="newsletterDisclaimer">
                BY SIGNING UP, YOU AGREE TO RECEIVE EMAIL UPDATES FROM YUSEE PLUGS.
              </p>
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
        <div
          className="modalBackdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            className="productModal"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProduct.name}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="modalClose"
              aria-label="Close product"
              onClick={() => setSelectedProduct(null)}
            >
              <X />
            </button>

            <div className="modalImage">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                />
              ) : (
                <span className="noImage">YUSEE PLUGS</span>
              )}
            </div>

            <div className="modalDetails">
              <p className="eyebrow">YUSEE PLUGS</p>
              <h2>{selectedProduct.name}</h2>

              {modalVariant && (
                <strong className="modalPrice">
                  £{(modalVariant.pricePence / 100).toFixed(2)}
                </strong>
              )}

              {selectedProduct.description && (
                <p className="modalDescription">
                  {selectedProduct.description}
                </p>
              )}

              {modalSizes.length > 0 && (
                <label className="variantLabel">
                  SIZE
                  <select
                    value={modalVariant?.size || ""}
                    onChange={e =>
                      changeSize(selectedProduct, e.target.value)
                    }
                  >
                    {modalSizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                        {!selectedProduct.variants.some(
                          v => v.size === size && v.stock > 0
                        )
                          ? " — SOLD OUT"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {modalColours.length > 0 && (
                <label className="variantLabel">
                  COLOUR
                  <select
                    value={modalVariant?.colour || ""}
                    onChange={e =>
                      changeColour(selectedProduct, e.target.value)
                    }
                  >
                    {modalColours.map(colour => (
                      <option key={colour} value={colour}>
                        {colour}
                        {!selectedProduct.variants.some(
                          v => v.colour === colour && v.stock > 0
                        )
                          ? " — SOLD OUT"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {modalDeliveries.length > 0 && (
                <label className="variantLabel">
                  DELIVERY
                  <select
                    value={modalVariant?.delivery || ""}
                    onChange={e =>
                      changeDelivery(selectedProduct, e.target.value)
                    }
                  >
                    {modalDeliveries.map(delivery => (
                      <option key={delivery} value={delivery}>
                        {delivery}
                        {!selectedProduct.variants.some(
                          v => v.delivery === delivery && v.stock > 0
                        )
                          ? " — SOLD OUT"
                          : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <p className={`stockText ${modalVariant?.stock ? "inStock" : "outStock"}`}>
                {modalVariant
                  ? modalVariant.stock > 0
                    ? `${modalVariant.stock} AVAILABLE`
                    : "THIS OPTION IS SOLD OUT"
                  : "NO OPTIONS AVAILABLE"}
              </p>

              <button
                className="modalPrimary"
                disabled={!modalVariant || modalVariant.stock < 1}
                onClick={() => modalVariant && addToBag(modalVariant)}
              >
                ADD TO BAG
              </button>

              <button
                className="modalSecondary"
                disabled={
                  checkoutLoading ||
                  !modalVariant ||
                  modalVariant.stock < 1
                }
                onClick={() =>
                  modalVariant &&
                  startCheckout([
                    { variantId: modalVariant.id, quantity: 1 },
                  ])
                }
              >
                {checkoutLoading ? "CONNECTING..." : "BUY NOW"}
              </button>

              <p className="deliveryNote">
                {modalVariant?.delivery
                  ? `${modalVariant.delivery.toUpperCase()} DELIVERY AVAILABLE`
                  : "DELIVERY AVAILABLE"}
              </p>
            </div>
          </section>
        </div>
      )}

      {menuOpen && (
        <div className="drawerBackdrop" onClick={closeMenu}>
          <aside
            className="drawer menuDrawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawerHeader">
              <Link href="/" className="drawerLogo" onClick={closeMenu}>
                <Image
                  src="/FAAEF0EE-B20E-425B-AC66-5DA42ADAF006.png"
                  alt="Yusee Plugs"
                  width={145}
                  height={55}
                />
              </Link>
              <button
                className="headerIcon"
                aria-label="Close menu"
                onClick={closeMenu}
              >
                <X />
              </button>
            </div>

            <p className="drawerEyebrow">SHOP BY CATEGORY</p>

            <Link className="drawerLink" href="/mens" onClick={closeMenu}>
              <span>01</span> MEN'S <ArrowUpRight />
            </Link>
            <Link className="drawerLink" href="/womens" onClick={closeMenu}>
              <span>02</span> WOMEN'S <ArrowUpRight />
            </Link>
            <Link className="drawerLink" href="/electronics" onClick={closeMenu}>
              <span>03</span> ELECTRONICS <ArrowUpRight />
            </Link>
            <Link className="drawerLink" href="/accessories" onClick={closeMenu}>
              <span>04</span> ACCESSORIES <ArrowUpRight />
            </Link>
            <Link className="drawerLink" href="/shop" onClick={closeMenu}>
              <span>05</span> ALL PRODUCTS <ArrowUpRight />
            </Link>
            <Link className="drawerLink saleLink" href="/shop" onClick={closeMenu}>
              <span>06</span> SHOP THE COLLECTION <ArrowUpRight />
            </Link>

            <div className="drawerBottom">
              <p>PLUG IN. STAND OUT.</p>
              <span>YUSEE PLUGS</span>
            </div>
          </aside>
        </div>
      )}

      {bagOpen && (
        <div
          className="drawerBackdrop"
          onClick={() => setBagOpen(false)}
        >
          <aside
            className="drawer bagDrawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="drawerHeader">
              <h2>YOUR BAG ({bagCount})</h2>
              <button
                className="headerIcon"
                aria-label="Close bag"
                onClick={() => setBagOpen(false)}
              >
                <X />
              </button>
            </div>

            {bagItems.length === 0 ? (
              <div className="emptyBag">
                <ShoppingBag size={36} />
                <h3>YOUR BAG IS EMPTY</h3>
                <p>Find your next favourite.</p>
                <button
                  className="checkoutButton"
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
                        <div className="bagNoImage">YUSEE</div>
                      )}

                      <div className="bagLineDetails">
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
                          £{(item.variant.pricePence / 100).toFixed(2)} × {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            setBag(old =>
                              old.filter(
                                line => line.variantId !== item.variantId
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

                <div className="bagSummary">
                  <div>
                    <span>SUBTOTAL</span>
                    <b>£{(total / 100).toFixed(2)}</b>
                  </div>
                  <p>
                    Delivery is included in the selected product price. Your delivery
                    type is shown beside each item.
                  </p>
                  <button
                    className="checkoutButton"
                    disabled={checkoutLoading}
                    onClick={() =>
                      startCheckout(
                        bagItems.map(item => ({
                          variantId: item.variantId,
                          quantity: item.quantity,
                        }))
                      )
                    }
                  >
                    {checkoutLoading ? "CONNECTING TO STRIPE..." : "CHECKOUT"}
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      <style jsx>{`

        .site {
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

        .header {
          height: 76px;
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          padding: 0 4%;
          background: #000;
          border-bottom: 1px solid #292929;
          position: relative;
          z-index: 5;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logoImage {
          width: 155px;
          height: 58px;
          object-fit: contain;
        }

        .headerIcon {
          border: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 9px;
          position: relative;
          text-decoration: none;
        }

        .menuIcon {
          justify-self: start;
          padding-left: 0;
        }

        .headerRight {
          justify-self: end;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bagCount {
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

        .adminIcon {
          color: #fff;
        }

        .quickNav {
          height: 49px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(18px, 4vw, 55px);
          background: #000;
          border-bottom: 1px solid #303030;
        }

        .quickNav a {
          color: #fff;
          text-decoration: none;
          font-size: 11px;
          font-weight: 950;
          letter-spacing: 1.3px;
          transition: opacity .2s;
        }

        .quickNav a:hover {
          opacity: .65;
        }

        .searchPanel {
          position: absolute;
          z-index: 20;
          top: 154px;
          left: 0;
          right: 0;
          background: #080808;
          border-bottom: 1px solid #383838;
          padding: 18px 4%;
          box-shadow: 0 15px 25px rgba(0,0,0,.35);
        }

        .searchInputWrap {
          display: flex;
          align-items: center;
          gap: 13px;
          max-width: 900px;
          margin: auto;
        }

        .searchInputWrap input {
          flex: 1;
          min-width: 0;
          background: transparent;
          color: #fff;
          border: 0;
          outline: none;
          font-size: 16px;
          padding: 12px 0;
        }

        .searchInputWrap button {
          border: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
        }

        .searchResults {
          max-width: 900px;
          margin: 12px auto 0;
        }

        .searchResult {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 9px 0;
          background: transparent;
          border: 0;
          border-bottom: 1px solid #333;
          color: #fff;
          text-align: left;
          cursor: pointer;
        }

        .searchResult img,
        .searchNoImage {
          width: 48px;
          height: 52px;
          object-fit: cover;
          background: #292929;
        }

        .searchNoImage {
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .searchResult span:nth-child(2) {
          flex: 1;
          font-size: 13px;
          font-weight: 700;
        }

        .searchEmpty {
          font-size: 11px;
          color: #aaa;
          padding: 12px 0;
        }

        .searchAllLink {
          display: flex;
          align-items: center;
          gap: 9px;
          width: fit-content;
          margin: 16px auto 0;
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        /* BANNER: SHOW THE COMPLETE IMAGE WITHOUT CROPPING */

        .hero {
          position: relative;
          display: block;
          width: 100%;
          height: auto;
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
          line-height: 0;
        }

        .heroImage {
          display: block;
          width: 100%;
          height: auto;
          max-width: 100%;
          margin: 0;
          padding: 0;
          object-fit: contain;
        }

        .heroShopNowLink {
          position: absolute;
          left: 64%;
          top: 59%;
          width: 22%;
          height: 8%;
          z-index: 2;
          cursor: pointer;
        }

        .heroShopNowLink:focus-visible {
          outline: 2px solid #fff;
          outline-offset: 3px;
        }

        .featured {
          padding: 62px 4%;
          background: #000;
        }

        .sectionHeading {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 18px;
          margin-bottom: 28px;
        }

        .eyebrow {
          color: #aaa;
          font-size: 10px;
          letter-spacing: 2.5px;
          margin: 0 0 9px;
        }

        .sectionHeading h2 {
          font-size: clamp(25px, 4vw, 40px);
          line-height: 1;
          letter-spacing: -1.5px;
          font-weight: 950;
          margin: 0;
        }

        .viewAll {
          color: #fff;
          background: transparent;
          border: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1px;
          text-decoration: none;
          white-space: nowrap;
        }

        .featuredGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 20px;
        }

        .featuredCard {
          position: relative;
          min-width: 0;
        }

        .featuredImage {
          position: relative;
          display: block;
          width: 100%;
          aspect-ratio: 1 / 1.08;
          padding: 0;
          overflow: hidden;
          border: 0;
          background: #171717;
          cursor: pointer;
          text-align: center;
        }

        .featuredImage img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform .5s;
        }

        .featuredImage:hover img {
          transform: scale(1.04);
        }

        .noImage {
          height: 100%;
          width: 100%;
          min-height: 180px;
          display: grid;
          place-items: center;
          color: #777;
          font-weight: 900;
          letter-spacing: 2px;
          font-size: 13px;
        }

        .saveButton {
          position: absolute;
          right: 12px;
          top: 12px;
          width: 36px;
          height: 36px;
          display: grid;
          place-items: center;
          border: 0;
          background: rgba(0,0,0,.5);
          color: white;
          cursor: pointer;
        }

        .saveButton.isSaved {
          color: #fff;
        }

        .soldOut {
          position: absolute;
          left: 10px;
          bottom: 10px;
          padding: 7px 9px;
          background: #fff;
          color: #111;
          font-size: 9px;
          font-weight: 950;
          letter-spacing: 1px;
        }

        .featuredInfo {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          margin-top: 13px;
          padding: 0;
          border: 0;
          color: #fff;
          background: transparent;
          text-align: left;
          cursor: pointer;
        }

        .featuredInfo span {
          font-size: 13px;
          font-weight: 750;
          line-height: 1.35;
        }

        .featuredInfo b {
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }

        .statusMessage {
          padding: 42px 10px;
          text-align: center;
          color: #aaa;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .shopCallout {
          padding: 55px 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 25px;
          background: #000;
          border-top: 1px solid #333;
          border-bottom: 1px solid #333;
        }

        .shopCallout h2 {
          margin: 0;
          font-size: clamp(28px, 5vw, 53px);
          line-height: .98;
          letter-spacing: -2px;
          font-weight: 950;
        }

        .shopCallout > a {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px 20px;
          background: #fff;
          color: #000;
          text-decoration: none;
          font-size: 10px;
          font-weight: 950;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .shopCallout > a:hover {
          background: #ccc;
        }

        .footer {
          background: #000;
          color: #fff;
          padding: 45px 5% 22px;
          border-top: 1px solid #333;
        }

        .footer,
        .footer * {
          font-family: Arial, Helvetica, sans-serif;
          box-sizing: border-box;
        }

        .footerTop {
          padding-bottom: 35px;
        }

        .footerLogo {
          display: inline-block;
          font-size: 30px;
          font-weight: 950;
          letter-spacing: -1.5px;
          color: #fff;
          text-decoration: none;
        }

        .footerBrand p {
          font-size: 12px;
          letter-spacing: 2px;
          color: #aaa;
          margin: 12px 0 0;
        }

        .footerAccordion {
          border-top: 1px solid #484848;
        }

        .footerAccordion details {
          border-bottom: 1px solid #484848;
        }

        .footerAccordion summary {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 25px 0;
          list-style: none;
          cursor: pointer;
          font-size: 19px;
          font-weight: 900;
          letter-spacing: .5px;
        }

        .footerAccordion summary::-webkit-details-marker {
          display: none;
        }

        .footerPlus {
          font-size: 25px;
          font-weight: 300;
          transition: transform .2s;
        }

        .footerAccordion details[open] .footerPlus {
          transform: rotate(45deg);
        }

        .footerAccordionContent {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 19px;
          padding: 0 0 28px;
        }

        .footerAccordionContent a {
          color: #ccc;
          text-decoration: none;
          font-size: 14px;
          letter-spacing: .5px;
          transition: color .2s;
        }

        .footerAccordionContent a:hover {
          color: #fff;
        }

        .newsletterContent > p {
          color: #bcbcbc;
          font-size: 12px;
          line-height: 1.8;
          letter-spacing: 1px;
          max-width: 450px;
          margin: 0;
        }

        .newsletterForm {
          display: flex;
          width: 100%;
          max-width: 500px;
          border-bottom: 1px solid #fff;
          align-items: center;
        }

        .newsletterForm input {
          flex: 1;
          min-width: 0;
          background: transparent;
          border: 0;
          outline: none;
          color: #fff;
          padding: 17px 5px;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .newsletterForm input::placeholder {
          color: #999;
        }

        .newsletterForm button {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 5px 14px 15px;
          border: 0;
          background: transparent;
          color: #fff;
          cursor: pointer;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
          white-space: nowrap;
        }

        .newsletterDisclaimer {
          font-size: 10px !important;
          color: #888 !important;
          line-height: 1.7;
          letter-spacing: .6px;
        }

        .footerPayments {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 10px;
          padding: 30px 0;
          border-bottom: 1px solid #484848;
        }

        .paymentLogo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 49px;
          height: 31px;
          padding: 5px 9px;
          background: #f5f5f5;
          color: #111;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .2px;
        }

        .mastercard {
          font-size: 10px;
          font-weight: 800;
        }

        .paypal {
          font-style: italic;
        }

        .applepay {
          font-size: 10px;
        }

        .klarna {
          font-size: 11px;
          font-weight: 950;
        }

        .footerCountry {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 30px 0;
          border-bottom: 1px solid #484848;
        }

        .footerCountry label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .footerCountry select {
          width: fit-content;
          min-width: 220px;
          padding: 14px 40px 14px 15px;
          background: #fff;
          color: #111;
          border: 1px solid #fff;
          border-radius: 0;
          font-size: 13px;
        }

        .footerBottom {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
          padding-top: 22px;
          color: #999;
          font-size: 10px;
          letter-spacing: 1px;
          line-height: 1.7;
        }

        .footerBottom p {
          margin: 0;
        }

        .modalBackdrop,
        .drawerBackdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          background: rgba(0,0,0,.78);
          overflow-y: auto;
        }

        .productModal {
          position: relative;
          width: 100%;
          max-width: 900px;
          max-height: 92vh;
          overflow-y: auto;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #f5f5f2;
          color: #111;
        }

        .modalClose {
          position: absolute;
          z-index: 2;
          top: 12px;
          right: 12px;
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 50%;
          background: #fff;
          color: #111;
          cursor: pointer;
        }

        .modalImage {
          min-height: 420px;
          background: #e6e6e3;
        }

        .modalImage img {
          width: 100%;
          height: 100%;
          min-height: 420px;
          object-fit: cover;
        }

        .modalDetails {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
          padding: clamp(22px, 4vw, 44px);
        }

        .modalDetails h2 {
          font-size: clamp(26px, 4vw, 39px);
          line-height: 1.05;
          margin: 0;
        }

        .modalPrice {
          font-size: 19px;
        }

        .modalDescription {
          color: #666;
          font-size: 13px;
          line-height: 1.7;
          white-space: pre-wrap;
        }

        .variantLabel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .variantLabel select {
          width: 100%;
          padding: 13px;
          border: 1px solid #ccc;
          background: #fff;
          color: #111;
          font-size: 14px;
        }

        .stockText {
          font-size: 11px;
          letter-spacing: .7px;
        }

        .inStock {
          color: #333;
        }

        .outStock {
          color: #777;
        }

        .modalPrimary,
        .modalSecondary {
          width: 100%;
          padding: 16px;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1.4px;
          cursor: pointer;
        }

        .modalPrimary {
          background: #111;
          color: #fff;
          border: 1px solid #111;
        }

        .modalSecondary {
          background: transparent;
          color: #111;
          border: 1px solid #111;
        }

        .modalPrimary:disabled,
        .modalSecondary:disabled {
          opacity: .4;
          cursor: not-allowed;
        }

        .deliveryNote {
          text-align: center;
          color: #777;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .drawerBackdrop {
          justify-content: flex-start;
          align-items: stretch;
          padding: 0;
        }

        .drawer {
          width: min(420px, 90vw);
          height: 100%;
          overflow-y: auto;
          padding: 24px;
          background: #050505;
          color: #fff;
          box-shadow: 10px 0 35px rgba(0,0,0,.35);
        }

        .bagDrawer {
          margin-left: auto;
          box-shadow: -10px 0 35px rgba(0,0,0,.35);
        }

        .drawerHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 22px;
          border-bottom: 1px solid #333;
        }

        .drawerHeader h2 {
          font-size: 17px;
          letter-spacing: 1px;
        }

        .drawerLogo {
          display: flex;
          align-items: center;
        }

        .drawerLogo img {
          width: 135px;
          height: auto;
          object-fit: contain;
        }

        .drawerEyebrow {
          margin: 28px 0 12px;
          color: #999;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .drawerLink {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 20px 0;
          border-bottom: 1px solid #292929;
          color: #fff;
          text-decoration: none;
          font-size: 17px;
          font-weight: 950;
          letter-spacing: 1px;
        }

        .drawerLink span {
          color: #aaa;
          font-size: 10px;
        }

        .drawerLink svg {
          width: 18px;
          margin-left: auto;
        }

        .drawerLink:hover {
          opacity: .7;
        }

        .saleLink {
          color: #fff;
        }

        .drawerBottom {
          margin-top: 35px;
          padding-top: 22px;
          border-top: 1px solid #333;
        }

        .drawerBottom p {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        .drawerBottom span {
          font-size: 10px;
          color: #888;
          letter-spacing: 2px;
        }

        .bagLines {
          padding: 20px 0;
        }

        .bagLine {
          display: flex;
          gap: 14px;
          padding: 15px 0;
          border-bottom: 1px solid #292929;
        }

        .bagLine img,
        .bagNoImage {
          width: 90px;
          height: 110px;
          object-fit: cover;
          background: #252525;
        }

        .bagNoImage {
          display: grid;
          place-items: center;
          font-size: 10px;
          font-weight: 900;
        }

        .bagLineDetails {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 7px;
          font-size: 11px;
        }

        .bagLineDetails span {
          color: #aaa;
        }

        .bagLineDetails button {
          padding: 0;
          margin-top: 4px;
          border: 0;
          background: transparent;
          color: #fff;
          text-decoration: underline;
          font-size: 9px;
          cursor: pointer;
        }

        .bagSummary {
          position: sticky;
          bottom: 0;
          padding: 18px 0;
          background: #050505;
          border-top: 1px solid #333;
        }

        .bagSummary > div {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .bagSummary p,
        .emptyBag p {
          color: #999;
          font-size: 11px;
          line-height: 1.6;
        }

        .checkoutButton {
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

        .checkoutButton:disabled {
          opacity: .5;
        }

        .emptyBag {
          min-height: 65vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          text-align: center;
        }

        .emptyBag h3 {
          font-size: 14px;
          letter-spacing: 1px;
        }

        @media (max-width: 760px) {
          .announcement {
            padding: 0 13px;
            font-size: 8px;
            letter-spacing: 1px;
          }

          .header {
            height: 65px;
            padding: 0 13px;
          }

          .logoImage {
            width: 125px;
            height: 49px;
          }

          .headerRight {
            gap: 2px;
          }

          .headerRight .headerIcon {
            padding: 7px;
          }

          .quickNav {
            height: 43px;
            justify-content: flex-start;
            gap: 23px;
            padding: 0 15px;
            overflow-x: auto;
          }

          .quickNav a {
            font-size: 9px;
            white-space: nowrap;
          }

          .searchPanel {
            top: 137px;
            padding: 14px;
          }

          .hero {
            width: 100%;
            height: auto;
          }

          .heroImage {
            width: 100%;
            height: auto;
          }

          .heroShopNowLink {
            left: 64%;
            top: 59%;
            width: 22%;
            height: 8%;
          }

          .featured {
            padding: 40px 15px;
          }

          .sectionHeading {
            align-items: end;
            margin-bottom: 20px;
          }

          .sectionHeading h2 {
            font-size: clamp(22px, 6vw, 30px);
          }

          .viewAll {
            font-size: 9px;
            gap: 5px;
          }

          .featuredGrid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 22px 12px;
          }

          .featuredInfo span {
            font-size: 11px;
          }

          .featuredInfo b {
            font-size: 11px;
          }

          .saveButton {
            top: 7px;
            right: 7px;
            width: 31px;
            height: 31px;
          }

          .shopCallout {
            padding: 38px 18px;
            align-items: flex-start;
            flex-direction: column;
          }

          .shopCallout h2 {
            font-size: 32px;
          }

          .shopCallout > a {
            width: 100%;
            justify-content: space-between;
          }

          .productModal {
            grid-template-columns: 1fr;
            max-width: 480px;
          }

          .modalImage,
          .modalImage img {
            min-height: 260px;
            max-height: 42vh;
          }

          .modalDetails {
            gap: 13px;
            padding: 22px;
          }

          .modalDetails h2 {
            font-size: 27px;
          }

          .footer {
            padding: 35px 18px 18px;
          }

          .footerLogo {
            font-size: 25px;
          }

          .footerAccordion summary {
            font-size: 16px;
            padding: 23px 0;
          }

          .footerAccordionContent a {
            font-size: 13px;
          }

          .footerPayments {
            gap: 8px;
            padding: 25px 0;
          }

          .paymentLogo {
            height: 29px;
            min-width: 43px;
            font-size: 10px;
            padding: 4px 7px;
          }

          .footerCountry select {
            width: 100%;
            max-width: 300px;
          }

          .footerBottom {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (min-width: 761px) and (max-width: 1050px) {
          .featuredGrid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </main>
  );
}


      
