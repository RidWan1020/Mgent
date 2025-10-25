import Header from "@Sections/Header";
import Footer from "@Sections/Footer";
import Logo from "@assets/logo.png";
import ProductsCatalog from "@Sections/ProductCatalog";
import CartAndMemo from "@Sections/User/CartAndMemo";
import ItemRequest from "@Sections/User/ItemRequest";
import MemoCatalog from "@Sections/MemoCatalog";

export default function User() {
  return (
    <div className="min-h-screen w-full text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617] font-bornomala">
      <Header Logo={Logo} />
      <main className="w-full grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4 p-4">
        <div className="space-y-4">
          <ProductsCatalog />
          <CartAndMemo />
        </div>
        <div className="space-y-4">
          <MemoCatalog />
          <ItemRequest />
        </div>
      </main>
      <Footer />
    </div>
  );
}
