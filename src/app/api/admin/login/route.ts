import {NextResponse} from "next/server";
import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";
import {signAdmin} from "@/lib/admin-auth";
export async function POST(req:Request){
 const {email,password}=await req.json();
 const user=await prisma.user.findUnique({where:{email:String(email||"").toLowerCase().trim()}});
 if(!user || user.role!=="ADMIN" || !user.passwordHash || !(await bcrypt.compare(password,user.passwordHash))) return NextResponse.json({error:"Invalid admin login"},{status:401});
 const token=await signAdmin(user.id,user.email);
 const res=NextResponse.json({ok:true});
 res.cookies.set("yusee_admin",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:28800});
 return res;
}
