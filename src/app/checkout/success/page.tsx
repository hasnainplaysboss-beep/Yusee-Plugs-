
"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutSuccess() {
  useEffect(() => {
    localStorage.removeItem("yusee_bag");
  }, []);

  return (
    <main className="successPage">
      <div className="successCard">
        <CheckCircle2 size={58} strokeWidth={1.4} />

        <p className="eyebrow">YUSEE PLUGS</p>

        <h1>THANK YOU<br />FOR YOUR ORDER.</h1>

        <p>
          Your payment was successful. We're getting your order ready.
          You'll receive confirmation by email shortly.
        </p>

        <Link href="/" className="successButton">
          CONTINUE SHOPPING
        </Link>
      </div>

      <style jsx>{`
        .successPage {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          background: #f7f6f2;
          color: #171717;
        }

        .successCard {
          max-width: 520px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }

        .successCard svg {
          margin-bottom: 12px;
        }

        .eyebrow {
          font-size: 11px;
          letter-spacing: 3px;
          font-weight: 700;
        }

        h1 {
          font-size: clamp(38px, 8vw, 64px);
          line-height: 0.98;
          letter-spacing: -3px;
          margin: 0;
        }

        .successCard > p:not(.eyebrow) {
          color: #686868;
          line-height: 1.8;
          max-width: 380px;
          font-size: 14px;
        }

        .successButton {
          background: #171717;
          color: white;
          padding: 17px 28px;
          text-decoration: none;
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 700;
          margin-top: 10px;
        }
      `}</style>
    </main>
  );
}
