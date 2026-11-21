export default function DeliveryPage() {
  return (
    <main style={{
      minHeight: "100vh",
      background: "#0a0a0a",
      color: "#fff",
      padding: "60px 24px",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <a href="/" style={{
          color: "#aaa",
          textDecoration: "none",
          fontSize: "14px",
        }}>
          ← Back to Yusee Plugs
        </a>

        <h1 style={{
          fontSize: "40px",
          marginTop: "40px",
          marginBottom: "20px",
        }}>
          Delivery Information
        </h1>

        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          At Yusee Plugs, we aim to get your order to you as smoothly
          as possible. Delivery is included in the displayed price
          of our products.
        </p>

        <h2 style={{ marginTop: "35px" }}>Where We Ship From</h2>

        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          Products may be dispatched from the UK or China depending
          on the product you order. The delivery type is shown
          alongside the relevant product.
        </p>

        <h2 style={{ marginTop: "35px" }}>Delivery Times</h2>

        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          Delivery times can vary depending on the product,
          fulfilment location and courier. Any estimated delivery
          information provided with a product should be used as
          a guide.
        </p>

        <h2 style={{ marginTop: "35px" }}>Tracking</h2>

        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          Where tracking is available, tracking information will
          be provided after your order has been dispatched.
        </p>

        <h2 style={{ marginTop: "35px" }}>Questions About Delivery?</h2>

        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          If you have questions about your order or delivery,
          contact us at:
        </p>

        <a href="mailto:hello@yuseeplugs.com" style={{
          color: "#fff",
          textDecoration: "underline",
        }}>
          hello@yuseeplugs.com
        </a>
      </div>
    </main>
  );
}
