
export default function ReturnsPage() {
  return (
    <main className="page">
      <header>
        <a href="/" className="logo">YUSEE PLUGS</a>
        <p className="eyebrow">CUSTOMER INFORMATION</p>
        <h1>RETURNS & REFUNDS</h1>
        <p className="intro">
          We want you to be happy with your purchase. Here is how to contact us
          about a return or refund.
        </p>
      </header>

      <section>
        <h2>Returning an order</h2>
        <p>
          If you wish to return an item, please contact us within 14 days of
          receiving your order. Please include your order number and the item you
          wish to return.
        </p>
        <p>
          We will provide instructions on how to proceed with your return.
        </p>
      </section>

      <section>
        <h2>Return conditions</h2>
        <p>
          Items should be returned unused, in their original condition and with
          their original packaging where possible. Please ensure items are
          securely packaged before sending them back.
        </p>
        <p>
          Your statutory rights remain unaffected, including rights relating to
          faulty, damaged or misdescribed goods.
        </p>
      </section>

      <section>
        <h2>Refunds</h2>
        <p>
          Once your return has been approved and processed, refunds will be issued
          to the original payment method where possible.
        </p>
        <p>
          Refund processing times may vary depending on your payment provider.
        </p>
      </section>

      <section>
        <h2>Faulty or damaged items</h2>
        <p>
          If your item arrives damaged, faulty or incorrect, please contact us as
          soon as possible with your order number and details of the issue.
          Photographs may help us resolve the problem more quickly.
        </p>
      </section>

      <section>
        <h2>Items that cannot be returned</h2>
        <p>
          Certain goods may be excluded from the usual cancellation rights where
          permitted by law, including qualifying sealed goods that are unsuitable
          for return for health protection or hygiene reasons once unsealed.
        </p>
        <p>
          Any applicable exception will be considered in accordance with
          consumer law.
        </p>
      </section>

      <section>
        <h2>Contact us about a return</h2>
        <p>
          Please email us before sending any items back:
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
