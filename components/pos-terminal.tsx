"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CreditCard, Minus, Plus, Printer, ReceiptText, Trash2, Wifi } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { buildBasicQrPayload, calculateTax } from "@/lib/tax";

export type PosProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
};

export type PosTenantInfo = {
  name: string;
  vatNumber: string;
  branchName: string;
  deviceCode: string;
};

type CartItem = PosProduct & {
  quantity: number;
};

type CompletedInvoice = {
  orderId: string;
  invoiceId: string;
  orderNumber: string;
  invoiceNumber: string;
  issuedAt: string;
  orderType: string;
  paymentMethod: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  qrPayload: string;
};

type PosTerminalProps = {
  products: PosProduct[];
  categories: string[];
  tenant: PosTenantInfo;
  canSell: boolean;
  shiftOpen: boolean;
  blockedMessage?: string;
  shiftMessage?: string | null;
};

const money = new Intl.NumberFormat("ar-SA", {
  style: "currency",
  currency: "SAR"
});

export function PosTerminal({ products, categories, tenant, canSell, shiftOpen, blockedMessage, shiftMessage }: PosTerminalProps) {
  const [category, setCategory] = useState("الكل");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState("داخل المحل");
  const [paymentMethod, setPaymentMethod] = useState("مدى");
  const [completedInvoice, setCompletedInvoice] = useState<CompletedInvoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleProducts = category === "الكل" ? products : products.filter((product) => product.category === category);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totals = calculateTax(subtotal, false);
  const qrPayload = buildBasicQrPayload({
    sellerName: tenant.name,
    vatNumber: tenant.vatNumber,
    issuedAt: new Date(),
    total: totals.total,
    tax: totals.tax
  });

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const canCheckout = canSell && shiftOpen && cart.length > 0 && !isSubmitting;
  const disabledSaleReason = !canSell ? blockedMessage : !shiftOpen ? "افتح وردية قبل بدء البيع." : undefined;
  const checkoutDisabledReason = disabledSaleReason ?? (cart.length === 0 ? "اختر منتجًا واحدًا على الأقل." : undefined);

  function addItem(product: PosProduct) {
    if (!canSell || !shiftOpen) return;

    setCompletedInvoice(null);
    setError(null);
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...current, { ...product, quantity: 1 }];
    });
  }

  function changeQuantity(id: string, delta: number) {
    setCart((current) =>
      current.flatMap((item) => {
        if (item.id !== id) return item;
        const quantity = item.quantity + delta;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      })
    );
  }

  function printInvoice() {
    window.print();
  }

  function startNewOrder() {
    setCart([]);
    setCompletedInvoice(null);
    setError(null);
  }

  async function completeOrder() {
    if (!shiftOpen) {
      setError("افتح وردية قبل بدء البيع.");
      return;
    }

    if (!canCheckout) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ productId: item.id, quantity: item.quantity })),
          orderType,
          paymentMethod
        })
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "تعذر إنشاء الطلب. حاول مرة أخرى.");
        return;
      }

      setCompletedInvoice(data as CompletedInvoice);
      setCart([]);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
      <section className="space-y-4">
        <div className="surface rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-ink/60">الفرع والجهاز</p>
              <h2 className="text-xl font-bold">{tenant.branchName} · {tenant.deviceCode}</h2>
            </div>
            <span className={shiftOpen ? "rounded-lg bg-mint px-4 py-2 text-sm font-bold text-white" : "rounded-lg bg-date px-4 py-2 text-sm font-bold text-white"}>
              {shiftOpen ? "وردية مفتوحة" : "لا توجد وردية"}
            </span>
          </div>
          {!canSell && <p className="mt-3 rounded-lg bg-date/10 p-3 text-sm font-bold text-date">{blockedMessage}</p>}
          {shiftMessage && <p className="mt-3 rounded-lg bg-mint/10 p-3 text-sm font-bold text-mint">{shiftMessage}</p>}
          {!shiftOpen && canSell && (
            <form action="/api/shifts/open" method="post" className="mt-4 rounded-lg bg-date/10 p-4">
              <input type="hidden" name="returnTo" value="/pos" />
              <p className="text-sm font-bold text-date">افتح وردية قبل بدء البيع.</p>
              <label className="mt-3 block text-sm font-bold">
                بداية الصندوق
                <input name="openingFloat" required type="number" min="0" step="0.01" className="mt-2 w-full rounded-lg border-ink/10 bg-white" defaultValue="0" />
              </label>
              <button type="submit" className="mt-3 rounded-lg bg-mint px-4 py-2 text-sm font-black text-white">فتح وردية</button>
            </form>
          )}
          <p className="mt-3 flex items-center gap-2 text-sm text-ink/60">
            <Wifi className="h-4 w-4 text-mint" aria-hidden="true" />
            يحتاج JAADPOS اتصالًا بالإنترنت أثناء البيع وحفظ الفاتورة.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {["الكل", ...categories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={item === category ? "shrink-0 rounded-lg bg-ink px-4 py-2 text-sm font-bold text-white" : "shrink-0 rounded-lg border border-ink/10 bg-white px-4 py-2 text-sm font-bold text-ink/70"}
            >
              {item}
            </button>
          ))}
        </div>

        {visibleProducts.length === 0 ? (
          <div className="surface rounded-lg p-6 text-center text-sm font-bold text-ink/60">
            لا توجد منتجات متاحة للبيع. أضف منتجات نشطة ضمن تصنيف نشط من صفحة المنتجات.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addItem(product)}
                disabled={!canSell || !shiftOpen}
                className="surface min-h-32 rounded-lg p-4 text-right transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                title={disabledSaleReason}
              >
                <span className="text-xs text-ink/50">{product.category}</span>
                <strong className="mt-3 block text-lg">{product.name}</strong>
                <span className="mt-2 block text-sm font-bold text-mint">{money.format(product.price)}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <aside className="surface rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 pb-3">
          <div>
            <p className="text-sm text-ink/60">السلة الحالية</p>
            <h2 className="text-xl font-black">{cartCount} صنف</h2>
          </div>
          <button type="button" onClick={() => setCart([])} className="rounded-lg border border-ink/10 p-2 text-ink/60 hover:text-date" title="تفريغ السلة">
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {cart.length === 0 ? (
            <p className="rounded-lg bg-fog p-4 text-center text-sm text-ink/55">اختر المنتجات لإضافة طلب جديد.</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="rounded-lg border border-ink/10 p-3">
                <div className="flex items-center justify-between">
                  <strong>{item.name}</strong>
                  <span className="font-bold text-mint">{money.format(item.price * item.quantity)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => changeQuantity(item.id, -1)} className="rounded-md border border-ink/10 p-1" title="تقليل الكمية">
                      <Minus className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button type="button" onClick={() => changeQuantity(item.id, 1)} className="rounded-md border border-ink/10 p-1" title="زيادة الكمية">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                  <button type="button" onClick={() => changeQuantity(item.id, -item.quantity)} className="text-sm font-bold text-date">
                    حذف
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          {["داخل المحل", "سفري", "توصيل"].map((item) => (
            <button key={item} type="button" onClick={() => setOrderType(item)} className={item === orderType ? "rounded-lg bg-sea px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-fog px-3 py-2 text-sm font-bold"}>
              {item}
            </button>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {["نقدي", "مدى", "Visa/Mastercard", "Apple Pay"].map((item) => (
            <button key={item} type="button" onClick={() => setPaymentMethod(item)} className={item === paymentMethod ? "rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white" : "rounded-lg bg-fog px-3 py-2 text-sm font-bold"}>
              {item}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-fog p-4 text-sm">
          <div className="flex justify-between">
            <span>قبل الضريبة</span>
            <span>{money.format(totals.subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>ضريبة 15%</span>
            <span>{money.format(totals.tax)}</span>
          </div>
          <div className="mt-3 flex justify-between border-t border-ink/10 pt-3 text-xl font-black">
            <span>الإجمالي</span>
            <span>{money.format(totals.total)}</span>
          </div>
        </div>

        {error && <p className="mt-4 rounded-lg bg-date/10 p-3 text-sm font-bold text-date">{error}</p>}

        <button type="button" onClick={completeOrder} disabled={!canCheckout} className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-mint px-4 py-3 font-black text-white disabled:cursor-not-allowed disabled:bg-ink/30" title={checkoutDisabledReason}>
          <CreditCard className="h-5 w-5" aria-hidden="true" />
          {isSubmitting ? "جاري إنشاء الطلب..." : "إتمام الدفع وإصدار الفاتورة"}
        </button>

        <div className="mt-4 rounded-lg border border-ink/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">فاتورة QR</p>
              <p className="text-xs text-ink/55">سيظهر الإيصال الكامل بعد الدفع.</p>
            </div>
            <QRCodeSVG value={qrPayload} size={64} />
          </div>
        </div>

        {completedInvoice && (
          <div className="mt-4 rounded-lg border border-mint/30 bg-mint/5 p-4">
            <p className="text-sm font-black text-mint">تم إنشاء الطلب والفاتورة بنجاح.</p>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>رقم الطلب</span>
                <strong>{completedInvoice.orderNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>رقم الفاتورة</span>
                <strong>{completedInvoice.invoiceNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span>التاريخ</span>
                <strong>{new Date(completedInvoice.issuedAt).toLocaleString("ar-SA")}</strong>
              </div>
              <div className="flex justify-between">
                <span>طريقة الدفع</span>
                <strong>{completedInvoice.paymentMethod}</strong>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-white p-3 text-sm">
              {completedInvoice.items.map((item) => (
                <div key={item.id} className="flex justify-between border-b border-ink/10 py-2 last:border-b-0">
                  <span>{item.name} × {item.quantity}</span>
                  <strong>{money.format(item.price * item.quantity)}</strong>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>قبل الضريبة</span>
                <strong>{money.format(completedInvoice.subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span>ضريبة 15%</span>
                <strong>{money.format(completedInvoice.tax)}</strong>
              </div>
              <div className="flex justify-between text-base font-black">
                <span>الإجمالي</span>
                <span>{money.format(completedInvoice.total)}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-white p-3">
              <p className="text-xs leading-6 text-ink/60">تم حفظ الفاتورة وربطها بالطلب وطريقة الدفع.</p>
              <QRCodeSVG value={completedInvoice.qrPayload} size={72} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={printInvoice} className="flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold">
                <Printer className="h-4 w-4" aria-hidden="true" />
                طباعة الفاتورة
              </button>
              <button type="button" onClick={startNewOrder} className="rounded-lg bg-ink px-3 py-2 text-sm font-bold text-white">
                طلب جديد
              </button>
              <Link href={`/invoices/${completedInvoice.invoiceId}`} className="flex items-center justify-center gap-2 rounded-lg bg-mint px-3 py-2 text-sm font-bold text-white">
                <ReceiptText className="h-4 w-4" aria-hidden="true" />
                عرض الفاتورة
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
