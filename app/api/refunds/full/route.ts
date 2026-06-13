import { NextResponse } from "next/server";
import { z } from "zod";
import { consoleUrl } from "@/lib/domains";
import { getCurrentSession } from "@/lib/platform-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const refundSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.preprocess((value) => {
    if (typeof value !== "string") return null;
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }, z.string().nullable())
});

const allowedRoles = new Set(["TENANT_OWNER", "BRANCH_MANAGER"]);

function redirectTo(invoiceId: string, status: string) {
  return NextResponse.redirect(consoleUrl(`/invoices/${invoiceId}?status=${status}#refund`));
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  const form = Object.fromEntries(await request.formData());
  const parsed = refundSchema.safeParse(form);
  const invoiceId = typeof form.invoiceId === "string" ? form.invoiceId : "";

  if (!session?.tenantId || !allowedRoles.has(session.role)) {
    return invoiceId ? redirectTo(invoiceId, "forbidden") : NextResponse.redirect(consoleUrl("/invoices"));
  }

  if (!parsed.success) {
    return invoiceId ? redirectTo(invoiceId, "invalid") : NextResponse.redirect(consoleUrl("/invoices"));
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: parsed.data.invoiceId,
        tenantId: session.tenantId
      },
      include: {
        refunds: true,
        order: {
          include: {
            items: true
          }
        }
      }
    });

    if (!invoice) {
      return redirectTo(parsed.data.invoiceId, "missing");
    }

    if (invoice.invoiceStatus !== "PAID") {
      return redirectTo(invoice.id, "not_refundable");
    }

    const refundedAmount = invoice.refunds.reduce((sum, refund) => sum + Number(refund.amount), 0);
    const invoiceTotal = Number(invoice.total);

    if (refundedAmount >= invoiceTotal) {
      return redirectTo(invoice.id, "not_refundable");
    }

    const amount = invoiceTotal - refundedAmount;
    const taxAmount = Math.max(0, Number(invoice.taxTotal) - invoice.refunds.reduce((sum, refund) => sum + Number(refund.taxAmount), 0));

    await prisma.$transaction(async (tx) => {
      await tx.refund.create({
        data: {
          tenantId: session.tenantId!,
          invoiceId: invoice.id,
          orderId: invoice.orderId,
          userId: session.userId,
          type: "FULL",
          reason: parsed.data.reason ?? "مرتجع كامل",
          amount,
          taxAmount,
          items: {
            create: invoice.order.items.map((item) => ({
              tenantId: session.tenantId!,
              orderItemId: item.id,
              productName: item.productName,
              quantity: item.quantity,
              amount: item.lineTotal
            }))
          }
        }
      });

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { invoiceStatus: "REFUNDED" }
      });

      await tx.order.update({
        where: { id: invoice.orderId },
        data: { status: "REFUNDED" }
      });
    });

    return redirectTo(invoice.id, "refunded");
  } catch {
    return parsed.success ? redirectTo(parsed.data.invoiceId, "error") : NextResponse.redirect(consoleUrl("/invoices"));
  }
}
