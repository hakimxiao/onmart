import { Link } from "react-router";
import { HeadphonesIcon, TruckIcon } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-semibold text-base-content">
              <TruckIcon className="size-8 text-primary" aria-hidden />
              OnMart Supply
            </div>
            <p className="mt-3 text-sm leading-relaxed text-base-content/65">
              Peralatan kerja pilihan untuk produktivitas tanpa kompromi.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Shop
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="link link-hover text-base-content/80">
                  All Products
                </Link>
              </li>
              <li>
                <Link
                  to="/cart"
                  className="link link-hover text-base-content/80"
                >
                  Cart
                </Link>
              </li>
              <li>
                <Link
                  to="/orders"
                  className="link link-hover text-base-content/80"
                >
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Support
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-base-content/70">
              <li className="flex items-start gap-2">
                <HeadphonesIcon
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden
                />
                <span>Dukungan responsif untuk setiap pesanan.</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
              Company
            </h3>
            <p className="mt-3 text-sm text-base-content/65">
              Kualitas terjamin, pengiriman cepat, dan layanan yang dapat
              diandalkan.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-4 border-t border-base-300 pt-6">
          <p className="text-center text-xs text-base-content/50">
            © {new Date().getFullYear()} OnMart Supply · Semua harga dalam IDR
          </p>
        </div>
      </div>
    </footer>
  );
}
