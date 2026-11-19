
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function money(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function pretty(value: string) {
  return value.replaceAll("_", " ");
}

export default async function AccountPage() {
  const session = await requireCustomer();

  if (!session) {
    redirect("/login");
  }

  const customer = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: { items: true }
      }
    }
  });

  if (!customer) {
    redirect("/login");
  }

  const orders = customer.orders;

  return (
    <main className="accountPage">
      <header className="accountHeader">
        <Link href="/" className="accountLogo">
          YUSEE<span>PLUGS</span>
        </Link>
        <Link href="/" className="backShop">CONTINUE SHOPPING ↗</Link>
      </header>

      <section className="accountWelcome">
        <p className="accountEyebrow">YOUR PERSONAL SPACE</p>
        <h1>MY ACCOUNT<span>.</span></h1>
        <p>Welcome back{customer.name ? `, ${customer.name}` : ""}.</p>
      </section>

      <nav className="accountNav">
        <a href="#details">MY DETAILS</a>
        <a href="#orders">MY ORDERS</a>
        <a href="#rewards">MY REWARDS</a>
        <a href="#wishlist">MY WISHLIST</a>
      </nav>

      <div className="accountContent">
        <section className="accountPanel" id="details">
          <div className="panelHeading">
            <div>
              <p className="accountEyebrow">YOUR INFORMATION</p>
              <h2>MY DETAILS</h2>
            </div>
            <span className="panelNumber">01</span>
          </div>

          <div className="detailGrid">
            <div className="detailItem">
              <span>FULL NAME</span>
              <strong>{customer.name || "Not added"}</strong>
            </div>
            <div className="detailItem">
              <span>EMAIL ADDRESS</span>
              <strong>{customer.email}</strong>
            </div>
            <div className="detailItem">
              <span>PHONE NUMBER</span>
              <strong>{customer.phone || "Not added"}</strong>
            </div>
            <div className="detailItem">
              <span>MEMBER SINCE</span>
              <strong>
                {new Date(customer.createdAt).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric"
                })}
              </strong>
            </div>
          </div>
          <p className="accountNote">
            Need to change your details? Account editing will be added next.
          </p>
        </section>

        <section className="accountPanel" id="orders">
          <div className="panelHeading">
            <div>
              <p className="accountEyebrow">YOUR PURCHASE HISTORY</p>
              <h2>MY ORDERS</h2>
            </div>
            <span className="panelNumber">02</span>
          </div>

          {orders.length === 0 ? (
            <div className="accountEmpty">
              <h3>NOTHING HERE YET.</h3>
              <p>Your orders will appear here when you shop with us.</p>
              <Link href="/" className="accountButton">START SHOPPING ↗</Link>
            </div>
          ) : (
            <div className="orderList">
              {orders.map(order => (
                <article className="orderCard" key={order.id}>
                  <div className="orderTop">
                    <div>
                      <span>ORDER NUMBER</span>
                      <strong>{order.orderNumber}</strong>
                    </div>
                    <div className="orderStatus">
                      {pretty(order.status)}
                    </div>
                  </div>

                  <div className="orderMeta">
                    <span>
                      {new Date(order.createdAt).toLocaleDateString("en-GB")}
                    </span>
                    <span>{money(order.totalPence)}</span>
                    <span>Payment: {pretty(order.paymentStatus)}</span>
                  </div>

                  <div className="orderProducts">
                    {order.items.map(item => (
                      <p key={item.id}>
                        {item.productName} × {item.quantity}
                        {item.size ? ` · ${item.size}` : ""}
                        {item.colour ? ` · ${item.colour}` : ""}
                      </p>
                    ))}
                  </div>

                  {order.trackingNumber && (
                    <p className="trackingInfo">
                      {order.courier ? `${order.courier}: ` : "Tracking: "}
                      {order.trackingNumber}
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="accountPanel" id="rewards">
          <div className="panelHeading">
            <div>
              <p className="accountEyebrow">EXCLUSIVE MEMBER BENEFITS</p>
              <h2>MY REWARDS</h2>
            </div>
            <span className="panelNumber">03</span>
          </div>

          <div className="rewardsCard">
            <p>YUSEE REWARDS</p>
            <strong>0 <span>POINTS</span></strong>
            <span className="rewardsMessage">
              Your rewards journey starts here.
            </span>
          </div>
          <p className="accountNote">
            Rewards points and benefits are not active yet. We'll add them when
            the rewards programme is connected.
          </p>
        </section>

        <section className="accountPanel" id="wishlist">
          <div className="panelHeading">
            <div>
              <p className="accountEyebrow">THE PIECES YOU LOVE</p>
              <h2>MY WISHLIST</h2>
            </div>
            <span className="panelNumber">04</span>
          </div>

          <div className="accountEmpty">
            <h3>YOUR WISHLIST IS WAITING.</h3>
            <p>
              Your saved items will appear here once wishlist saving is
              connected to your account.
            </p>
            <Link href="/" className="accountButton">EXPLORE THE COLLECTION ↗</Link>
          </div>
        </section>
      </div>

      <footer className="accountFooter">
        <Link href="/">YUSEE PLUGS</Link>
        <span>BUILT FOR YOUR EVERYDAY.</span>
      </footer>

      <style jsx>{`
        .accountPage {
          min-height: 100vh;
          background: #f6f5f1;
          color: #171717;
          padding: 0 6%;
          font-family: Arial, sans-serif;
        }
        .accountHeader {
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #deddd8;
        }
        .accountLogo {
          color: #171717;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: -1px;
          text-decoration: none;
        }
        .accountLogo span { color: #999; }
        .backShop {
          color: #171717;
          font-size: 11px;
          font-weight: bold;
          text-decoration: none;
          letter-spacing: 1px;
        }
        .accountWelcome { padding: 65px 0 38px; }
        .accountEyebrow {
          font-size: 10px;
          letter-spacing: 2px;
          font-weight: bold;
          color: #888;
        }
        .accountWelcome h1 {
          font-size: clamp(38px, 7vw, 68px);
          letter-spacing: -3px;
          margin: 12px 0;
          font-weight: 900;
        }
        .accountWelcome h1 span { color: #999; }
        .accountWelcome > p:last-child { color: #666; }
        .accountNav {
          display: flex;
          flex-wrap: wrap;
          gap: 28px;
          border-top: 1px solid #deddd8;
          border-bottom: 1px solid #deddd8;
          padding: 20px 0;
        }
        .accountNav a {
          color: #333;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 1px;
          text-decoration: none;
        }
        .accountContent {
          max-width: 1000px;
          margin: 35px auto 80px;
          display: grid;
          gap: 22px;
        }
        .accountPanel {
          background: #fff;
          padding: 30px;
          border: 1px solid #e9e8e3;
          scroll-margin-top: 20px;
        }
        .panelHeading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #eee;
          padding-bottom: 20px;
          margin-bottom: 25px;
        }
        .panelHeading h2 {
          font-size: 23px;
          letter-spacing: -1px;
          margin: 7px 0 0;
        }
        .panelNumber { color: #aaa; font-size: 12px; }
        .detailGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
        }
        .detailItem { display: grid; gap: 9px; min-width: 0; }
        .detailItem span, .orderTop span {
          color: #999;
          font-size: 9px;
          letter-spacing: 1.5px;
        }
        .detailItem strong {
          font-size: 14px;
          overflow-wrap: anywhere;
        }
        .accountNote {
          margin-top: 25px;
          color: #888;
          font-size: 11px;
          line-height: 1.6;
        }
        .accountEmpty {
          text-align: center;
          padding: 35px 10px;
        }
        .accountEmpty h3 { font-size: 19px; }
        .accountEmpty p {
          color: #888;
          font-size: 12px;
          line-height: 1.7;
          margin: 12px auto 22px;
          max-width: 420px;
        }
        .accountButton {
          display: inline-block;
          background: #171717;
          color: white;
          text-decoration: none;
          padding: 15px 22px;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .orderList { display: grid; gap: 15px; }
        .orderCard {
          border: 1px solid #e9e8e3;
          padding: 20px;
        }
        .orderTop {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          align-items: center;
        }
        .orderTop div:first-child { display: grid; gap: 7px; }
        .orderTop strong { font-size: 13px; }
        .orderStatus {
          background: #f1f0ec;
          padding: 8px 11px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .orderMeta {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin: 18px 0;
          color: #777;
          font-size: 11px;
        }
        .orderProducts {
          border-top: 1px solid #eee;
          padding-top: 12px;
          font-size: 12px;
          line-height: 1.7;
        }
        .orderProducts p { margin: 4px 0; }
        .trackingInfo {
          font-size: 11px;
          font-weight: bold;
          margin-top: 15px;
        }
        .rewardsCard {
          background: #171717;
          color: white;
          padding: 30px;
          display: grid;
          gap: 15px;
        }
        .rewardsCard > p {
          font-size: 10px;
          letter-spacing: 2px;
        }
        .rewardsCard strong {
          font-size: 48px;
          letter-spacing: -2px;
        }
        .rewardsCard strong span {
          font-size: 11px;
          letter-spacing: 2px;
        }
        .rewardsMessage { color: #bbb; font-size: 12px; }
        .accountFooter {
          border-top: 1px solid #deddd8;
          padding: 25px 0;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          font-size: 10px;
          letter-spacing: 1px;
        }
        .accountFooter a {
          color: #171717;
          font-weight: bold;
          text-decoration: none;
        }
        .accountFooter span { color: #888; }
        @media (max-width: 600px) {
          .accountPage { padding: 0 5%; }
          .accountHeader { height: 68px; }
          .accountWelcome { padding: 45px 0 28px; }
          .accountNav { gap: 17px; }
          .accountNav a { font-size: 9px; }
          .accountPanel { padding: 20px 16px; }
          .detailGrid { grid-template-columns: 1fr; gap: 22px; }
          .orderCard { padding: 15px; }
          .accountFooter { flex-direction: column; }
        }
      `}</style>
    </main>
  );
}
