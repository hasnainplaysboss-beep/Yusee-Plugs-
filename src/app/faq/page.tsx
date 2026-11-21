"use client";

import { useState } from "react";

export default function FAQPage() {
  const questions = [
    {
      q: "Where do you ship from?",
      a: "Orders may be fulfilled from the UK or China depending on the product.",
    },
    {
      q: "Is delivery included in the price?",
      a: "Yes. Delivery is included in the price displayed for each product.",
    },
    {
      q: "How long does delivery take?",
      a: "Delivery times vary depending on the product and fulfilment location. Estimated delivery details are shown where available.",
    },
    {
      q: "Can I order products with different delivery types together?",
      a: "Currently, products with different delivery types cannot be purchased together in the same checkout.",
    },
    {
      q: "Can I return an item?",
      a: "Please contact us within 14 days of receiving your order to discuss a return. Items must meet our return conditions. Your statutory rights are not affected.",
    },
    {
      q: "What if my item arrives damaged or faulty?",
      a: "Contact us as soon as possible at hello@yuseeplugs.com and we'll help you resolve the issue.",
    },
    {
      q: "How can I contact Yusee Plugs?",
      a: "Email us at hello@yuseeplugs.com and we'll get back to you.",
    },
  ];

  const [open, setOpen] = useState<number | null>(null);

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
        }}>
          ← Back to Yusee Plugs
        </a>

        <h1 style={{
          fontSize: "40px",
          marginTop: "40px",
          marginBottom: "15px",
        }}>
          Frequently Asked Questions
        </h1>

        <p style={{ color: "#aaa", lineHeight: 1.7, marginBottom: "35px" }}>
          Everything you need to know about shopping with Yusee Plugs.
        </p>

        {questions.map((item, index) => (
          <div key={index} style={{
            borderBottom: "1px solid #333",
            padding: "22px 0",
          }}>
            <button
              onClick={() => setOpen(open === index ? null : index)}
              style={{
                width: "100%",
                background: "transparent",
                color: "#fff",
                border: "none",
                textAlign: "left",
                fontSize: "17px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              {item.q}
              <span>{open === index ? "−" : "+"}</span>
            </button>

            {open === index && (
              <p style={{
                color: "#aaa",
                lineHeight: 1.8,
                marginTop: "18px",
              }}>
                {item.a}
              </p>
            )}
          </div>
        ))}

        <div style={{ marginTop: "40px" }}>
          <p style={{ color: "#aaa" }}>Still need help?</p>
          <a href="mailto:hello@yuseeplugs.com" style={{
            color: "#fff",
            textDecoration: "underline",
          }}>
            hello@yuseeplugs.com
          </a>
        </div>
      </div>
    </main>
  );
}
