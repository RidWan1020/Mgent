import Header from "@Sections/Header";
import Footer from "@Sections/Footer";
import Logo from "@assets/logo.png";
import UserFinance from "@Sections/UserFinance";
import UserDailySummary from "@Sections/UserDailySummary";

export default function UserSummary() {
  return (
    <div className="min-h-screen w-full text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617] font-bornomala">
      <Header Logo={Logo} />
      <main className="w-full flex flex-col gap-4 p-4">
        <UserFinance />
        {/* <UserDailySummary /> */}
      </main>
      <Footer />
    </div>
  );
}
