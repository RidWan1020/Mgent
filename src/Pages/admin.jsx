import Header from "@Sections/Header";
import Footer from "@Sections/Footer";
import Logo from "@assets/adminlogo.png";
import NewItemAdd from "@Sections/NewItemAdd";
import ProductsCatalog from "@Sections/ProductCatalog";
import MemoCatalog from "@Sections/MemoCatalog";
import NewUserAdding from "@Sections/NewUserAdding";
import UserItemRequests from "@Sections/UserItemRequests";
import UserItemPricing from "@Sections/UserItemPricing";
import UserCatalog from "@Sections/UserCatalog";
import Finance from "@Sections/Finance";

export default function Admin() {
  return (
    <div className="font-bornomala min-h-screen w-full text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617]">
      <Header Logo={Logo} />
      <main className="w-full grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4 p-4">
        <div className="space-y-4">
          <Finance />
          <ProductsCatalog />
          <MemoCatalog />
          <UserItemRequests />
          <UserCatalog />
        </div>
        <div className="space-y-4">
          <NewItemAdd />
          <NewUserAdding />
          <UserItemPricing />
        </div>
      </main>
      <Footer />
    </div>
  );
}
