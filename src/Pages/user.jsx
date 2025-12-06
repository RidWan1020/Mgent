import Header from "@Sections/Header";
import Footer from "@Sections/Footer";
import Logo from "@assets/logo.png";
import ProductsCatalog from "@Sections/ProductCatalog";
import ItemRequest from "@Sections/ItemRequest";
import MemoCatalog from "@Sections/MemoCatalog";

export default function User() {
  return (
    <div className="min-h-screen w-full text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617] font-bornomala">
      <Header Logo={Logo} />
      <main className="w-full flex flex-col gap-4 p-4">
          <ProductsCatalog />
          <ItemRequest />
      </main>
      <Footer />
    </div>
  );
}
