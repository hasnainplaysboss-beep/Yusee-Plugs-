export default function ReturnsPage() {
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
          fontSize: "14px"
        }}>
          ← Back to Yusee Plugs
        </a>

        <h1 style={{
          fontSize: "38px",
          marginTop: "40px",
          marginBottom: "20px"
        }}>
          Returns & Refunds
        </h1>

        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          At Yusee Plugs, customer satisfaction matters to us.
          If you need to return an item, please contact us within
          14 days of receiving your order.
        </p>

        <h2 style={{ marginTop: "35px" }}>Return Conditions</h2>
        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          Items must be unused and returned in their original condition
          and packaging where applicable. Certain hygiene-related items
          may not be eligible for return once unsealed, where permitted by law.
        </p>

        <h2 style={{ marginTop: "35px" }}>Faulty or Damaged Items</h2>
        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          If your item arrives faulty, damaged or incorrect, contact us
          as soon as possible so we can help resolve the issue.
        </p>

        <h2 style={{ marginTop: "35px" }}>Refunds</h2>
        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          Approved refunds will be issued to your original payment method.
          Processing times may depend on your bank or payment provider.
        </p>

        <h2 style={{ marginTop: "35px" }}>Contact Us</h2>
        <p style={{ color: "#bbb", lineHeight: 1.8 }}>
          For returns, refunds or any questions, email us at:
        </p>

        <a href="mailto:hello@yuseeplugs.com" style={{
          color: "#fff",
          textDecoration: "underline"
        }}>
          hello@yuseeplugs.com
        </a>

        <p style={{
          color: "#888",
          lineHeight: 1.8,
          marginTop: "35px"
        }}>
          Nothing in this policy affects your statutory consumer rights.
        </p>
      </div>
    </main>
  );
}
