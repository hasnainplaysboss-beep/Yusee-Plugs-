
"use client";

import { useEffect, useState } from "react";
import "./admin.css";

const cash = (p: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format((p || 0) / 100);

type Variant = {
  size: string;
  colour: string;
  price: string;
  stock: string;
};

const emptyVariant = (): Variant => ({
  size: "",
  colour: "",
  price: "35",
  stock: "10"
});

const emptyProduct = () => ({
  name: "",
  gender: "Men",
  category: "",
  description: "",
  imageUrl: "",
  featured: false
});

export default function Admin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ok, setOk] = useState(false);
  const [data, setData] = useState<any>({
    products: [],
    orders: [],
    customers: [],
    revenue: 0
  });

  const [tab, setTab] = useState("Overview");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [f, setF] = useState(emptyProduct());
  const [variants, setVariants] = useState<Variant[]>([emptyVariant()]);

  async function load() {
    const r = await fetch("/api/admin/data");

    if (r.ok) {
      setData(await r.json());
    }
  }

  useEffect(() => {
    if (ok) load();
  }, [ok]);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    if (r.ok) {
      setOk(true);
      setMsg("");
    } else {
      setMsg("Login failed. Check your admin account.");
    }
  }

  async function action(body: any) {
    const r = await fetch("/api/admin/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (!r.ok) {
      const x = await r.json();
      alert(x.error || "Request failed");
      return false;
    }

    await load();
    return true;
  }

  function resetProductForm() {
    setF(emptyProduct());
    setVariants([emptyVariant()]);
    setSelectedFile(null);
    setPreview("");
    setEditingId(null);
  }

  function chooseImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image.");
      e.target.value = "";
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Please choose an image smaller than 8MB.");
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  function updateVariant(
    index: number,
    field: keyof Variant,
    value: string
  ) {
    setVariants(current =>
      current.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  }

  function editProduct(product: any) {
    const parts = String(product.category || "").split(" / ");
    const productType = parts[0];

    const selectedType =
      productType === "Women" ||
      productType === "Electronics"
        ? productType
        : "Men";

    setF({
      name: product.name || "",
      gender: selectedType,
      category: parts.length > 1 ? parts.slice(1).join(" / ") : "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      featured: product.featured === true
    });

    setVariants(
      product.variants?.length
        ? product.variants.map((v: any) => ({
            size: v.size || "",
            colour: v.colour || "",
            price: (v.pricePence / 100).toFixed(2),
            stock: String(v.stock ?? 0)
          }))
        : [emptyVariant()]
    );

    setSelectedFile(null);
    setPreview(product.imageUrl || "");
    setEditingId(product.id);
    setTab("Products");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!f.name.trim() || !f.category.trim()) {
      alert("Enter a product name and category.");
      return;
    }

    if (
      variants.some(
        v => !v.size.trim() || !v.colour.trim() || !v.price || !v.stock
      )
    ) {
      alert("Please complete every field for each variant.");
      return;
    }

    if (
      variants.some(
        v =>
          !Number.isFinite(Number(v.price)) ||
          !Number.isFinite(Number(v.stock)) ||
          Number(v.price) < 0 ||
          Number(v.stock) < 0
      )
    ) {
      alert("Enter valid prices and stock quantities.");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = f.imageUrl;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadData
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          alert(uploadResult.error || "Image upload failed.");
          return;
        }

        imageUrl = uploadResult.imageUrl;
      }

      const wasEditing = Boolean(editingId);

      const saved = await action({
        action: "product",
        id: editingId,
        name: f.name,
        category: `${f.gender} / ${f.category}`,
        description: f.description,
        imageUrl,
        featured: f.featured,
        variants: variants.map(v => ({
          size: v.size,
          colour: v.colour,
          price: v.price,
          stock: v.stock
        }))
      });

      if (saved) {
        resetProductForm();
        alert(
          wasEditing
            ? "Product updated successfully."
            : "Product saved successfully."
        );
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong while saving the product.");
    } finally {
      setUploading(false);
    }
  }

  if (!ok) {
    return (
      <main className="login">
        <form onSubmit={login}>
          <h1>YUSEE PLUGS</h1>
          <p>ADMIN ACCESS</p>

          <input
            placeholder="Admin email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          <button type="submit">Sign in</button>
          <small>{msg}</small>
        </form>
      </main>
    );
  }

  return (
    <main className="shell">
      <aside>
        <h2>YUSEE PLUGS</h2>
        <p>CONTROL CENTRE</p>

        {["Overview", "Products", "Orders", "Revenue", "Customers"].map(x => (
          <button
            key={x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </aside>

      <section className="content">
        <header>
          <div>
            <small>YUSEE PLUGS / ADMIN</small>
            <h1>{tab}</h1>
          </div>

          <button onClick={load}>Refresh</button>
        </header>

        {tab === "Overview" && (
          <>
            <div className="stats">
              <article>
                <small>Net revenue</small>
                <b>{cash(data.revenue * 100)}</b>
              </article>

              <article>
                <small>Orders</small>
                <b>{data.orders.length}</b>
              </article>

              <article>
                <small>Products</small>
                <b>{data.products.length}</b>
              </article>

              <article>
                <small>Customers</small>
                <b>
                  {data.customers.filter((c: any) => c.role === "CUSTOMER").length}
                </b>
              </article>
            </div>

            <p className="note">
              Figures are calculated from records currently stored in your database.
            </p>
          </>
        )}

        {tab === "Revenue" && (
          <article>
            <h2>Revenue</h2>
            <strong className="big">{cash(data.revenue * 100)}</strong>
            <p className="note">
              Net total of paid orders less successful refunds.
            </p>
          </article>
        )}

        {tab === "Products" && (
          <>
            <article>
              <h2>{editingId ? "Edit product" : "Add a product"}</h2>

              <form className="productForm" onSubmit={saveProduct}>
                <label>Product name</label>
                <input
                  placeholder="Enter product name"
                  value={f.name}
                  onChange={e => setF({ ...f, name: e.target.value })}
                  required
                />

                <label>Product type</label>
                <select
                  value={f.gender}
                  onChange={e =>
                    setF({ ...f, gender: e.target.value })
                  }
                >
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Electronics">Electronics</option>
                </select>

                <label>Category</label>
                <input
                  placeholder={
                    f.gender === "Electronics"
                      ? "e.g. Phones, Accessories, Audio"
                      : "e.g. Hoodies & jumpers, Shoes, Leggings"
                  }
                  value={f.category}
                  onChange={e => setF({ ...f, category: e.target.value })}
                  required
                />

                <label>Product image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={chooseImage}
                />

                {preview && (
                  <div style={{ margin: "12px 0" }}>
                    <img
                      src={preview}
                      alt="Product preview"
                      style={{
                        width: "180px",
                        height: "180px",
                        objectFit: "cover",
                        borderRadius: "8px"
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview("");
                        setF({ ...f, imageUrl: "" });
                      }}
                    >
                      Remove image
                    </button>
                  </div>
                )}

                <p className="note">
                  Choose a photo from your iPhone library or Files. Maximum 8MB.
                </p>

                <label>Or enter an image URL</label>
                <input
                  placeholder="Image URL (optional)"
                  value={f.imageUrl}
                  onChange={e => setF({ ...f, imageUrl: e.target.value })}
                />

                <label>Description</label>
                <textarea
                  placeholder="Describe your product"
                  value={f.description}
                  onChange={e => setF({ ...f, description: e.target.value })}
                />

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    margin: "18px 0",
                    cursor: "pointer"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={f.featured}
                    onChange={e =>
                      setF({ ...f, featured: e.target.checked })
                    }
                    style={{ width: "18px", height: "18px" }}
                  />
                  Show on Featured
                </label>

                <p className="note">
                  Tick this box to show this product in the Featured section on your homepage.
                </p>

                <h3>Product variants</h3>

                <p className="note">
                  Add each size and colour combination separately. Set the price
                  and stock for each combination.
                </p>

                {variants.map((variant, index) => (
                  <div
                    key={index}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "14px",
                      marginBottom: "14px"
                    }}
                  >
                    <h3>Variant {index + 1}</h3>

                    <label>Size</label>
                    <input
                      placeholder="e.g. Small, Medium, UK 9"
                      value={variant.size}
                      onChange={e =>
                        updateVariant(index, "size", e.target.value)
                      }
                      required
                    />

                    <label>Colour</label>
                    <input
                      placeholder="e.g. Black, White, Grey"
                      value={variant.colour}
                      onChange={e =>
                        updateVariant(index, "colour", e.target.value)
                      }
                      required
                    />

                    <label>Price (£)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Enter price in pounds"
                      value={variant.price}
                      onChange={e =>
                        updateVariant(index, "price", e.target.value)
                      }
                      required
                    />

                    <label>Stock quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="How many are available?"
                      value={variant.stock}
                      onChange={e =>
                        updateVariant(index, "stock", e.target.value)
                      }
                      required
                    />

                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setVariants(current =>
                            current.filter((_, i) => i !== index)
                          )
                        }
                      >
                        Remove this variant
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setVariants(current => [...current, emptyVariant()])
                  }
                >
                  + Add another variant
                </button>

                <button type="submit" disabled={uploading}>
                  {uploading
                    ? "Uploading and saving..."
                    : editingId
                      ? "Update product"
                      : "Save product"}
                </button>

                {editingId && (
                  <button type="button" onClick={resetProductForm}>
                    Cancel editing
                  </button>
                )}
              </form>
            </article>

            <article>
              <h2>Catalogue</h2>

              {data.products.map((p: any) => (
                <div className="line" key={p.id}>
                  <p>
                    <b>{p.name}</b>
                    {" · "}
                    {p.category || "Uncategorised"}
                    {" · "}
                    {p.variants.length} variants
                    {" · "}
                    {p.variants.reduce(
                      (s: number, v: any) => s + v.stock,
                      0
                    )}{" "}
                    in stock
                  </p>

                  <p>
                    <b>{p.featured ? "FEATURED" : "Not featured"}</b>
                  </p>

                  <button type="button" onClick={() => editProduct(p)}>
                    Edit product
                  </button>
                </div>
              ))}

              {data.products.length === 0 && (
                <p className="note">No products have been added yet.</p>
              )}
            </article>
          </>
        )}

        {tab === "Orders" && (
          <article>
            <h2>Orders</h2>

            {data.orders.map((o: any) => (
              <details key={o.id}>
                <summary>
                  {o.orderNumber} · {o.customerName} · {cash(o.totalPence)}
                </summary>

                <p>
                  {o.customerEmail} · {o.customerPhone || "No phone"}
                </p>

                <p>
                  {[
                    o.addressLine1,
                    o.addressLine2,
                    o.city,
                    o.county,
                    o.postcode,
                    o.country
                  ].filter(Boolean).join(", ")}
                </p>

                <p>
                  {o.items.map((i: any) =>
                    `${i.productName} ${i.size || ""} ${i.colour || ""} ×${i.quantity}`
                  ).join(", ")}
                </p>

                <div className="row">
                  <select
                    defaultValue={o.status}
                    onChange={e =>
                      action({
                        action: "order",
                        id: o.id,
                        status: e.target.value,
                        trackingNumber: o.trackingNumber,
                        courier: o.courier
                      })
                    }
                  >
                    {[
                      "PENDING",
                      "PROCESSING",
                      "PACKED",
                      "SHIPPED",
                      "DELIVERED",
                      "CANCELLED"
                    ].map(x => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>

                  <input placeholder="Courier" id={"c" + o.id} />
                  <input placeholder="Tracking number" id={"t" + o.id} />

                  <button
                    onClick={() =>
                      action({
                        action: "order",
                        id: o.id,
                        status: o.status,
                        courier: (
                          document.getElementById("c" + o.id) as HTMLInputElement
                        ).value,
                        trackingNumber: (
                          document.getElementById("t" + o.id) as HTMLInputElement
                        ).value
                      })
                    }
                  >
                    Save tracking
                  </button>

                  <button
                    onClick={async () => {
                      const amount = prompt("Refund amount in pounds");

                      if (amount) {
                        const r = await fetch("/api/admin/refund", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ orderId: o.id, amount })
                        });

                        const x = await r.json();
                        alert(r.ok ? "Refund status: " + x.status : x.error);
                        load();
                      }
                    }}
                  >
                    Refund
                  </button>
                </div>
              </details>
            ))}
          </article>
        )}

        {tab === "Customers" && (
          <article>
            <h2>Customer accounts and admin access</h2>

            {data.customers.map((c: any) => (
              <p className="line" key={c.id}>
                {c.name || "Customer"} · {c.email} · {c.phone || "No phone"} ·{" "}
                <b>{c.role}</b>{" "}

                <button
                  onClick={() =>
                    action({
                      action: "role",
                      id: c.id,
                      role: c.role === "ADMIN" ? "CUSTOMER" : "ADMIN"
                    })
                  }
                >
                  {c.role === "ADMIN" ? "Remove admin" : "Make admin"}
                </button>
              </p>
            ))}
          </article>
        )}
      </section>
    </main>
  );
}
