
export default function FAQPage() {
  const questions = [
    {
      question: "How do I place an order?",
      answer:
        "Browse our collection, select your product and available variant, choose the delivery option where available, and add it to your bag. You can then proceed to checkout.",
    },
    {
      question: "What delivery options do you offer?",
      answer:
        "We currently offer variants marked for UK delivery and variants marked for China delivery. The delivery type is displayed on the product before you purchase.",
    },
    {
      question: "Can I mix UK and China delivery products in one order?",
      answer:
        "No. Your bag can only contain products using the same delivery type. You will need to complete one order before placing an order using the other delivery type.",
    },
    {
      question: "Is delivery charged separately?",
      answer:
        "Delivery is included in the selected product price. A separate delivery charge is not currently added at checkout.",
    },
    {
      question: "How long will my order take to arrive?",
      answer:
        "Delivery times vary depending on the product and fulfilment route. Please check the delivery information provided for your selected product or your order confirmation.",
    },
    {
      question: "How can I track my order?",
      answer:
        "If tracking is available for your order, tracking details will be provided after dispatch.",
    },
    {
      question: "Can I return an item?",
      answer:
        "Please contact us within 14 days of receiving your order if you wish to return an item. We will provide instructions on how to proceed.",
    },
    {
      question: "What should I do if my item arrives damaged?",
      answer:
        "Contact us as soon as possible and provide your order number and details of the damage. Photographs can help us investigate and resolve the issue.",
    },
    {
      question: "How can I contact Yusee Plugs?",
      answer:
        "You can contact our customer service team by emailing hello@yuseeplugs.com.",
    },
    {
      question: "What payment methods can I use?",
      answer:
        "Available payment methods are displayed at checkout. Your payment is processed securely through our checkout provider.",
    },
  ];

  return (
    <main className="page">
      <header>
        <a href="/" className="logo">YUSEE PLUGS</a>
        <p className="eyebrow">WE ARE HERE TO HELP</p>
        <h1>FREQUENTLY ASKED QUESTIONS</h1>
        <p className="intro">
          Find answers to the most common questions about shopping with Yusee Plugs.
        </p>
      </header>

      <div className="questions">
        {questions.map((item, index) => (
          <details key={index}>
            <summary>
              <span>{item.question}</span>
              <span className="plus">+</span>
            </summary>
            <div className="answer">
              <p>{item.answer}</p>
            </div>
          </details>
        ))}
      </div>

      <section className="contact">
        <h2>STILL NEED HELP?</h2>
        <p>
          If you cannot find the answer you are looking for, get in touch with us.
        </p>
        <a href="mailto:hello@yuseeplugs.com">CONTACT US</a>
      </section>

      <a className="back" href="/">← BACK TO SHOP</a>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #090909;
          color: #fff;
          padding: 40px 7%;
          font-family: Arial, Helvetica, sans-serif;
        }
        .logo {
          color: #fff;
          text-decoration: none;
          font-size: 26px;
          font-weight: 950;
          letter-spacing: -1px;
        }
        header {
          padding: 50px 0 35px;
          border-bottom: 1px solid #333;
        }
        .eyebrow {
          margin-top: 45px;
          color: #aaa;
          font-size: 11px;
          letter-spacing: 2px;
        }
        h1 {
          font-size: clamp(35px, 8vw, 65px);
          font-weight: 950;
          letter-spacing: -2px;
          line-height: 1;
        }
        .intro {
          color: #aaa;
          max-width: 600px;
          line-height: 1.8;
        }
        .questions {
          max-width: 850px;
        }
        .questions details {
          border-bottom: 1px solid #333;
        }
        .questions summary {
          list-style: none;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 25px 0;
          cursor: pointer;
          font-size: 15px;
          font-weight: 800;
        }
        .questions summary::-webkit-details-marker {
          display: none;
        }
        .plus {
          font-size: 25px;
          font-weight: 300;
          transition: transform .2s;
        }
        .questions details[open] .plus {
          transform: rotate(45deg);
        }
        .answer {
          padding: 0 0 22px;
        }
        .answer p {
          margin: 0;
          color: #aaa;
          font-size: 14px;
          line-height: 1.9;
          max-width: 700px;
        }
        .contact {
          padding: 40px 0;
          margin-top: 20px;
          border-top: 1px solid #333;
          max-width: 850px;
        }
        .contact h2 {
          font-size: 24px;
          font-weight: 950;
        }
        .contact p {
          color: #aaa;
          font-size: 14px;
          line-height: 1.8;
        }
        .contact a {
          display: inline-block;
          margin-top: 10px;
          padding: 15px 25px;
          background: #fff;
          color: #000;
          text-decoration: none;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
        }
        .back {
          display: inline-block;
          margin-top: 20px;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 1px;
        }
      `}</style>
    </main>
  );
}
