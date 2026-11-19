import {NextResponse} from "next/server";
import Stripe from "stripe";
import {prisma} from "@/lib/prisma";
import {requireAdmin} from "@/lib/admin-auth";
export async function POST(req:Request){
 if(!await requireAdmin()) return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!process.env.STRIPE_SECRET_KEY) return NextResponse.json({error:"Stripe is not configured"},{status:503});
 const {orderId,amount}=await req.json();
 const order=await prisma.order.findUnique({where:{id:orderId},include:{refunds:true}});
 if(!order?.stripePaymentIntentId) return NextResponse.json({error:"Order has no Stripe payment intent"},{status:400});
 const refunded=order.refunds.filter(r=>r.status==="SUCCEEDED").reduce((s,r)=>s+r.amountPence,0);
 const pence=Math.round(Number(amount)*100);
 if(!Number.isInteger(pence)||pence<=0||pence>order.totalPence-refunded) return NextResponse.json({error:"Invalid refund amount"},{status:400});
 const stripe=new Stripe(process.env.STRIPE_SECRET_KEY);
 const rec=await prisma.refund.create({data:{orderId,amountPence:pence}});
 try{
  const r=await stripe.refunds.create({payment_intent:order.stripePaymentIntentId,amount:pence});
  await prisma.refund.update({where:{id:rec.id},data:{stripeRefundId:r.id,status:r.status==="succeeded"?"SUCCEEDED":"PENDING"}});
  if(r.status==="succeeded") await prisma.order.update({where:{id:orderId},data:{paymentStatus:refunded+pence>=order.totalPence?"REFUNDED":"PARTIALLY_REFUNDED"}});
  return NextResponse.json({ok:true,status:r.status});
 }catch(e){await prisma.refund.update({where:{id:rec.id},data:{status:"FAILED"}});return NextResponse.json({error:e instanceof Error?e.message:"Stripe refund failed"},{status:502});}
}
