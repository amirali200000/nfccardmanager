import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const FEATURE_FLAGS = [
  { key: "registration", label: "ثبت‌نام کاربران جدید", description: "امکان ساخت حساب جدید" },
  { key: "google_login", label: "ورود با گوگل", description: "احراز هویت از طریق گوگل" },
  { key: "live_chat", label: "چت زنده", description: "دسترسی به ماژول گفتگوی هوش مصنوعی" },
  { key: "web_search", label: "وب‌گردی", description: "جستجوی زنده در وب" },
  { key: "image_studio", label: "استودیو تصویر", description: "تولید تصویر با هوش مصنوعی" },
  { key: "knowledge_base", label: "پایگاه دانش", description: "چت با اسناد اختصاصی" },
  { key: "subscriptions", label: "خرید اشتراک", description: "امکان خرید پلن‌ها" },
  { key: "maintenance", label: "حالت تعمیر سایت", description: "نمایش صفحه تعمیرات به کاربران" },
]

const MODELS = [
  { name: "GPT-4o Mini", slug: "gpt-4o-mini", provider: "openai", type: "TEXT" as const, priceFactor: 1 },
  { name: "GPT-4o", slug: "gpt-4o", provider: "openai", type: "TEXT" as const, priceFactor: 3 },
  { name: "Llama 3.3 70B", slug: "groq-llama-3.3-70b", provider: "groq", type: "TEXT" as const, priceFactor: 1 },
]

const PLANS = [
  { name: "رایگان", description: "شروع سریع با محدودیت روزانه", price: 0n, interval: "MONTHLY" as const, tokenLimit: 100000, imageLimit: 5 },
  { name: "حرفه‌ای", description: "برای کاربران فعال", price: 490000n, interval: "MONTHLY" as const, tokenLimit: 2000000, imageLimit: 200, featured: true },
  { name: "سازمانی", description: "دسترسی نامحدود سالانه", price: 4900000n, interval: "YEARLY" as const, tokenLimit: 30000000, imageLimit: 3000 },
]

const FORM_FIELDS = [
  { key: "phone", label: "شماره تماس", type: "TEL" as const, required: false, order: 1 },
  { key: "company", label: "نام شرکت", type: "TEXT" as const, required: false, order: 2 },
]

async function main() {
  for (const f of FEATURE_FLAGS) {
    await prisma.featureFlag.upsert({ where: { key: f.key }, update: {}, create: f })
  }
  for (const m of MODELS) {
    await prisma.modelConfig.upsert({ where: { slug: m.slug }, update: {}, create: m })
  }
  for (const p of PLANS) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } })
    if (!existing) await prisma.plan.create({ data: p })
  }
  for (const field of FORM_FIELDS) {
    await prisma.formField.upsert({ where: { key: field.key }, update: {}, create: field })
  }

  const adminEmail = "admin@ai-platform.ir"
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "SUPERADMIN" },
    create: {
      email: adminEmail,
      name: "مدیر کل",
      role: "SUPERADMIN",
      passwordHash: await bcrypt.hash("admin1234", 10),
      tokenBalance: 10000000,
    },
  })

  console.log("Seed completed. Admin login: admin@ai-platform.ir / admin1234")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
