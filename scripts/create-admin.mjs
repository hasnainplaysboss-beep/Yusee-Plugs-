import {PrismaClient} from "@prisma/client"; import bcrypt from "bcryptjs";
const prisma=new PrismaClient(); const email=process.env.ADMIN_EMAIL?.toLowerCase().trim(); const password=process.env.ADMIN_PASSWORD;
if(!email||!password||password.length<12){console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters)");process.exit(1);}
const passwordHash=await bcrypt.hash(password,12);
await prisma.user.upsert({where:{email},update:{role:"ADMIN",passwordHash},create:{email,name:"Yusee Plugs Admin",role:"ADMIN",passwordHash}});
console.log("Admin account created for "+email); await prisma.$disconnect();
