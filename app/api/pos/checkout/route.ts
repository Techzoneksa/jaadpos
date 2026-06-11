import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";
import { buildBasicQrPayload, calculateTax } from "@/lib/tax";
import { canCreateFinancialRecords, expiredTrialMessage, normalizeSubscriptionStatus } from "@/lib/subscription";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  items: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive().max(99) })).min(1),
  orderType: z.enum(["داخل المحل", "سفري", "توصيل"]),
  paymentMethod: z.enum(["نقدي", "مدى", "Visa/Mastercard", "Apple Pay"])
});

const orderTypeMap = {
  "داخل المحل": "DINE_IN",
  "سفري": "TAKEAWAY",
  "توصيل": "DELIVERY"
} as const;

const paymentMethodMap = {
  "نقدي": "CASH",
  "مدى": "MADA",
  "Visa/Mastercard": "VISA_MASTERCARD",
  "Apple Pay": "APPLE_PAY"
} as const;

const allowedCheckoutRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER", "CASHIER"]);

function token(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: Request) {
  const session = await getCurrentSession();

  if (!session?.tenantId || !allowedCheckoutRoles.has(session.role)) {
    return NextResponse.json({ error: "غير مصرح بإنشاء طلب جديد." }, { status: 403 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "بيانات الطلب غير مكتملة." }, { status: 400 });
  }

  const now = new Date();
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: {
      subscription: true,
      invoiceSettings: true,
      branches: {
        where: { active: true },
        orderBy: [{ isMain: "desc" }, { createdAt: "asc" }],
        take: 1
      },
      posDevices: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1
      }
    }
  });

  if (!tenant || !tenant.subscription) {
    return NextResponse.json({ error: "لم يتم العثور على اشتراك صالح للمنشأة." }, { status: 402 });
  }

  const canSell = canCreateFinancialRecords(
    {
      status: normalizeSubscriptionStatus(tenant.subscription.status),
      trialEndsAt: tenant.subscription.trialEndsAt,
      tenantActive: tenant.status === "ACTIVE"
    },
    now
  );

  if (!canSell) {
    return NextResponse.json({ error: expiredTrialMessage }, { status: 402 });
  }

  const branch = tenant.branches[0];
  const device = tenant.posDevices[0];

  if (!tenant.onboardingCompleted || !branch || !device) {
    return NextResponse.json({ error: "أكمل التهيئة أولًا لإنشاء الفرع وجهاز POS." }, { status: 400 });
  }

  const quantityByProduct = new Map<string, number>();
  for (const item of parsed.data.items) {
    quantityByProduct.set(item.productId, (quantityByProduct.get(item.productId) ?? 0) + item.quantity);
  }

  const products = await prisma.product.findMany({
    where: {
      tenantId: session.tenantId,
      id: { in: [...quantityByProduct.keys()] },
      status: "ACTIVE",
      available: true
    },
    include: { category: true }
  });

  if (products.length !== quantityByProduct.size) {
    return NextResponse.json({ error: "بعض المنتجات غير متاحة." }, { status: 400 });
  }

  const lines = products.map((product) => {
    const quantity = quantityByProduct.get(product.id) ?? 0;
    const unitPrice = Number(product.price);
    const lineTax = calculateTax(unitPrice * quantity, product.pricesIncludeTax);

    return {
      id: product.id,
      name: product.nameArabic,
      category: product.category.nameArabic,
      price: unitPrice,
      quantity,
      subtotal: lineTax.subtotal,
      tax: lineTax.tax,
      total: lineTax.total,
      taxRate: Number(product.taxRate),
      productId: product.id
    };
  });

  const subtotal = lines.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = lines.reduce((sum, item) => sum + item.tax, 0);
  const total = lines.reduce((sum, item) => sum + item.total, 0);
  const issuedAt = now;
  const orderNumber = token("ORD");
  const invoiceNumber = token("INV");
  const sellerVatNumber = tenant.vatNumber || "000000000000000";
  const qrPayload = buildBasicQrPayload({
    sellerName: tenant.name,
    vatNumber: sellerVatNumber,
    issuedAt,
    total,
    tax
  });

  await prisma.$transaction(async (tx) => {
    const shift =
      (await tx.shift.findFirst({
        where: {
          tenantId: session.tenantId!,
          branchId: branch.id,
          deviceId: device.id,
          cashierId: session.userId,
          status: "OPEN"
        }
      })) ??
      (await tx.shift.create({
        data: {
          tenantId: session.tenantId!,
          branchId: branch.id,
          deviceId: device.id,
          cashierId: session.userId,
          openingFloat: 0
        }
      }));

    await tx.order.create({
      data: {
        tenantId: session.tenantId!,
        branchId: branch.id,
        deviceId: device.id,
        cashierId: session.userId,
        shiftId: shift.id,
        orderNumber,
        orderType: orderTypeMap[parsed.data.orderType],
        status: "PAID",
        subtotal,
        taxTotal: tax,
        total,
        items: {
          create: lines.map((item) => ({
            tenantId: session.tenantId!,
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            taxRate: item.taxRate,
            taxAmount: item.tax,
            lineTotal: item.total
          }))
        },
        payments: {
          create: {
            tenantId: session.tenantId!,
            method: paymentMethodMap[parsed.data.paymentMethod],
            status: "PAID",
            amount: total
          }
        },
        invoice: {
          create: {
            tenantId: session.tenantId!,
            invoiceNumber,
            invoiceStatus: "PAID",
            issuedAt,
            sellerName: tenant.name,
            sellerVatNumber,
            qrPayload,
            subtotal,
            taxTotal: tax,
            total,
            footerText: tenant.invoiceSettings?.footerText ?? "شكرًا لزيارتكم"
          }
        }
      }
    });
  });

  return NextResponse.json({
    orderNumber,
    invoiceNumber,
    issuedAt: issuedAt.toISOString(),
    orderType: parsed.data.orderType,
    paymentMethod: parsed.data.paymentMethod,
    items: lines.map((item) => ({ id: item.id, name: item.name, category: item.category, price: item.price, quantity: item.quantity })),
    subtotal,
    tax,
    total,
    qrPayload
  });
}
