import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
const secret = process.env.AUTH_SECRET;
const key = () => {
 if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be at least 32 characters");
 return new TextEncoder().encode(secret);
};
export async function signAdmin(id:string,email:string) {
 return new SignJWT({email,role:"ADMIN"}).setProtectedHeader({alg:"HS256"}).setSubject(id).setIssuedAt().setExpirationTime("8h").sign(key());
}
export async function requireAdmin() {
 const token=(await cookies()).get("yusee_admin")?.value;
 if(!token) return null;
 try { const {payload}=await jwtVerify(token,key()); return payload.role==="ADMIN" && payload.sub ? {id:payload.sub,email:String(payload.email||"")} : null; } catch { return null; }
}
