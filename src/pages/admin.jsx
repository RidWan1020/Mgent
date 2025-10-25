import Header from "@Sections/Header";
import Footer from "@Sections/Footer";
import Logo from "@assets/adminlogo.png";
import NewItemAdd from "@Sections/Admin/NewItemAdd";
import ProductsCatalog from "@Sections/ProductCatalog";
import MemoCatalog from "@Sections/MemoCatalog";
import NewUserAdding from "@Sections/Admin/NewUserAdding";
import UserItemRequests from "@Sections/Admin/UserItemRequests";
import UserItemPricing from "@Sections/Admin/UserItemPricing";
import UserCatalog from "@Sections/Admin/UserCatalog";

export default function Admin() {
  return (
    <div className="font-bornomala min-h-screen w-full text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617]">
      <Header Logo={Logo} />
      <main className="w-full grid grid-cols-1 md:grid-cols-[1fr_360px] gap-4 p-4">
        <div className="space-y-4">
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
