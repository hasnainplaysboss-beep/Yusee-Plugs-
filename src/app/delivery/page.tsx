
export default function DeliveryPage() {
  return (
    <main className="page">
      <header>
        <a href="/" className="logo">YUSEE PLUGS</a>
        <p className="eyebrow">CUSTOMER INFORMATION</p>
        <h1>DELIVERY INFORMATION</h1>
        <p className="intro">
          Everything you need to know about how your Yusee Plugs order gets to you.
        </p>
      </header>

      <section>
        <h2>Delivery options</h2>
        <p>
          Delivery options are selected on the product itself. Each product or
          variant will display the delivery type available before you add it to
          your bag.
        </p>
      </section>

      <section>
        <h2>UK delivery</h2>
        <p>
          Products marked for UK delivery are dispatched using the delivery
          arrangements associated with that product.
        </p>
      </section>

      <section>
        <h2>China delivery</h2>
        <p>
          Products marked for China delivery use a different fulfilment route.
          Please check the delivery option shown on the product before ordering.
        </p>
      </section>

      <section>
        <h2>Delivery costs</h2>
        <p>
          Delivery is included in the selected product price. No separate delivery
          charge is added at checkout for the delivery options currently offered.
        </p>
      </section>

      <section>
        <h2>Delivery times</h2>
        <p>
          Delivery times can vary depending on the product, fulfilment location
          and destination. Please refer to any delivery estimate provided with
          your product or order confirmation.
        </p>
      </section>

      <section>
        <h2>Tracking your order</h2>
        <p>
          Where tracking is available, tracking details will be provided once
          your order has been dispatched.
        </p>
      </section>

      <section>
        <h2>Questions about delivery?</h2>
        <p>
          If you have a question about your order or delivery, contact us at:
        </p>
        <a href="mailto:hello@yuseeplugs.com">hello@yuseeplugs.com</a>
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
        section {
          max-width: 750px;
          padding: 30px 0;
          border-bottom: 1px solid #292929;
        }
        h2 {
          font-size: 20px;
          font-weight: 900;
        }
        section p {
          color: #aaa;
          font-size: 14px;
          line-height: 1.9;
        }
        section a {
          color: #fff;
        }
        .back {
          display: inline-block;
          margin-top: 35px;
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
