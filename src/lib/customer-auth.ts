
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const key = () => {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters");
  }
  return new TextEncoder().encode(secret);
};

export async function signCustomer(id: string, email: string) {
  return new SignJWT({ email, role: "CUSTOMER" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(key());
}

export async function requireCustomer() {
  const token = (await cookies()).get("yusee_customer")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, key());
    return payload.role === "CUSTOMER" && payload.sub
      ? { id: payload.sub, email: String(payload.email || "") }
      : null;
  } catch {
    return null;
  }
}
