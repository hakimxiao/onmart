import {
  CreditCardIcon,
  HeadphonesIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "lucide-react";

const items = [
  {
    icon: TruckIcon,
    title: "Pengiriman Andal",
    desc: "Cepat, tepat, dan dapat diandalkan.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Keamanan Terjamin",
    desc: "Setiap transaksi dilindungi dengan baik.",
  },
  {
    icon: CreditCardIcon,
    title: "Harga Jelas",
    desc: "Transparan tanpa biaya tersembunyi.",
  },
  {
    icon: HeadphonesIcon,
    title: "Layanan Profesional",
    desc: "Dukungan yang responsif dan terpercaya.",
  },
];

export function TrusrtStrip() {
  return (
    <section className="grid gap-4 rounded-box border border-base-300 bg-base-100 p-6 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(({ icon, title, desc }) => {
        const IconCmp = icon;
        return (
          <div key={title} className="flex gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <IconCmp className="size-5" aria-hidden />
            </div>
            <div>
              <h3 className="font-semibold text-base-content">{title}</h3>
              <p className="mt-0.5 text-sm text-base-content/65">{desc}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}
