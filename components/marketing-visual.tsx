import { Coffee, CreditCard, QrCode, ReceiptText } from "lucide-react";

export function MarketingVisual() {
  const rows = [
    ["لاتيه", "2", "32.00"],
    ["كرواسون زبدة", "1", "10.00"],
    ["موهيتو فراولة", "1", "18.00"]
  ];

  return (
    <div className="surface relative overflow-hidden rounded-lg p-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-lg border border-ink/10 bg-fog p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-ink/50">وردية مفتوحة</p>
              <p className="font-bold text-ink">الفرع الرئيسي</p>
            </div>
            <span className="rounded-full bg-mint/12 px-3 py-1 text-xs font-bold text-mint">Online POS</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["قهوة أمريكية", "لاتيه", "تشيز كيك", "ساندويتش"].map((item, index) => (
              <div key={item} className="rounded-lg bg-white p-3 shadow-sm">
                <Coffee className={index % 2 === 0 ? "h-5 w-5 text-mint" : "h-5 w-5 text-date"} aria-hidden="true" />
                <p className="mt-3 text-sm font-bold">{item}</p>
                <p className="text-xs text-ink/55">{12 + index * 4}.00 ر.س</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-ink p-4 text-white">
          <div className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-date" aria-hidden="true" />
            <strong>فاتورة ضريبية</strong>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            {rows.map(([name, qty, total]) => (
              <div key={name} className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>{name}</span>
                <span className="text-white/70">{qty} × {total}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-white/10 p-3 text-sm">
            <div className="flex justify-between">
              <span>ضريبة 15%</span>
              <span>7.83 ر.س</span>
            </div>
            <div className="mt-2 flex justify-between text-lg font-black">
              <span>الإجمالي</span>
              <span>60.00 ر.س</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-white/70">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
              مدى / Apple Pay
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-ink">
              <QrCode className="h-7 w-7" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
