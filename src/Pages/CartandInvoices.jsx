import Header from "@Sections/Header";
import Footer from "@Sections/Footer";
import Logo from "@assets/logo.png";
import Cart from "@Sections/Cart"
import MemoCatalog from "@Sections/MemoCatalog";

export default function CartandInvoices() {
  return (
    <div className="min-h-screen w-full text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617] font-bornomala">
      <Header Logo={Logo} />
      <main className="w-full flex flex-col gap-4 p-4">
        <Cart />
        <MemoCatalog />
      </main>
      <Footer />
    </div>
  );
}