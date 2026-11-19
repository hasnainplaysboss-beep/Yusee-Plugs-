import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/admin-auth";
export async function GET(){
 if(!await requireAdmin()) return NextResponse.json({error:"Unauthorized"},{status:401});
 const [products,orders,customers]=await Promise.all([
  prisma.product.findMany({include:{variants:true},orderBy:{createdAt:"desc"}}),
  prisma.order.findMany({include:{items:true,refunds:true},orderBy:{createdAt:"desc"}}),
  prisma.user.findMany({select:{id:true,name:true,email:true,phone:true,role:true},orderBy:{createdAt:"desc"}})
 ]);
 const paid=orders.filter(o=>["PAID","PARTIALLY_REFUNDED"].includes(o.paymentStatus));
 const revenue=paid.reduce((s,o)=>s+o.totalPence-o.refunds.filter(r=>r.status==="SUCCEEDED").reduce((a,r)=>a+r.amountPence,0),0);
 return NextResponse.json({products,orders,customers,revenue:revenue/100});
}
export async function POST(req:Request){
 if(!await requireAdmin()) return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await req.json();
 if(b.action==="role") return NextResponse.json(await prisma.user.update({where:{id:b.id},data:{role:b.role}}));
 if(b.action==="order") return NextResponse.json(await prisma.order.update({where:{id:b.id},data:{status:b.status,trackingNumber:b.trackingNumber||null,courier:b.courier||null}}));
 if(b.action==="product"){
  const slug=String(b.name).toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+Date.now().toString(36);
  const p=await prisma.product.create({data:{name:b.name,slug,category:b.category||null,description:b.description||null,imageUrl:b.imageUrl||null,variants:{create:b.variants.map((v:any)=>({size:v.size||null,colour:v.colour||null,pricePence:Math.round(Number(v.price)*100),stock:Number(v.stock)||0}))}},include:{variants:true}});
  return NextResponse.json(p,{status:201});
 }
 return NextResponse.json({error:"Unknown action"},{status:400});
}
