import { plans } from "@/lib/plans";
import { daysRemaining, trialEndsFrom } from "@/lib/subscription";

export const demoTenant = {
  name: "مقهى جاد التجريبي",
  legalName: "شركة مقهى جاد للتغذية",
  vatNumber: "300000000000003",
  city: "الرياض",
  branch: "الفرع الرئيسي",
  plan: plans[1],
  trialEndsAt: trialEndsFrom(new Date("2026-06-11T08:00:00+03:00"))
};

export const dashboardMetrics = [
  { label: "مبيعات اليوم", value: "2,846.00 ر.س", hint: "شامل الضريبة" },
  { label: "صافي اليوم", value: "2,486.00 ر.س", hint: "بعد المرتجعات" },
  { label: "عدد الطلبات", value: "42", hint: "متوسط الطلب 67.76 ر.س" },
  { label: "ضريبة VAT", value: "371.22 ر.س", hint: "15%" }
];

export const products = [
  { id: "p1", name: "قهوة أمريكية", category: "قهوة", price: 12 },
  { id: "p2", name: "لاتيه", category: "قهوة", price: 16 },
  { id: "p3", name: "كابتشينو", category: "قهوة", price: 15 },
  { id: "p4", name: "سبانش لاتيه", category: "قهوة", price: 19 },
  { id: "p5", name: "موهيتو فراولة", category: "مشروبات باردة", price: 18 },
  { id: "p6", name: "كرواسون زبدة", category: "مخبوزات", price: 10 },
  { id: "p7", name: "تشيز كيك", category: "حلويات", price: 22 },
  { id: "p8", name: "ساندويتش دجاج", category: "ساندويتشات", price: 24 }
];

export const categories = ["الكل", "قهوة", "مشروبات باردة", "حلويات", "مخبوزات", "ساندويتشات"];

export const recentOrders = [
  { id: "ORD-1024", invoice: "INV-2026-00041", cashier: "سارة", type: "داخل المحل", payment: "مدى", total: "86.25 ر.س", status: "paid" },
  { id: "ORD-1023", invoice: "INV-2026-00040", cashier: "عبدالله", type: "سفري", payment: "Apple Pay", total: "41.40 ر.س", status: "paid" },
  { id: "ORD-1022", invoice: "INV-2026-00039", cashier: "سارة", type: "توصيل", payment: "Visa/Mastercard", total: "126.50 ر.س", status: "partially_refunded" }
];

export const reportRows = [
  { name: "تقرير المبيعات", total: "2,846.00 ر.س", change: "+12%" },
  { name: "تقرير الضريبة VAT", total: "371.22 ر.س", change: "جاهز للمراجعة" },
  { name: "تقرير طرق الدفع", total: "4 طرق", change: "نقدي / مدى / بطاقات / Apple Pay" },
  { name: "تقرير المرتجعات", total: "360.00 ر.س", change: "3 عمليات" }
];

export const platformTenants = [
  { name: "مقهى جاد التجريبي", owner: "مالك مقهى جاد", plan: "Growth", status: "trial", branches: 1, devices: 2, users: 4, sales: "2,846.00 ر.س" },
  { name: "مطعم النخيل", owner: "عبدالعزيز سالم", plan: "Starter", status: "active", branches: 1, devices: 1, users: 2, sales: "11,240.50 ر.س" },
  { name: "كافيه المرسى", owner: "نورة خالد", plan: "Pro", status: "past_due", branches: 5, devices: 8, users: 18, sales: "48,900.00 ر.س" }
];

export const trialDaysLeft = daysRemaining(demoTenant.trialEndsAt, new Date("2026-06-11T10:00:00+03:00"));
