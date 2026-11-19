import AccountDetailsForm from "./AccountDetailsForm";
import "./account.css";
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

    <AccountDetailsForm
  name={customer.name || ""}
  email={customer.email}
  phone={customer.phone || ""}
/>

<div className="detailItem" style={{ marginTop: "20px" }}>
  <span>MEMBER SINCE</span>
  <strong>
    {new Date(customer.createdAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric"
    })}
  </strong>
</div>
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

  
    </main>
  );
}
