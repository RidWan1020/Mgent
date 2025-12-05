import Dropdown from "@Components/Menu";

export default function Header({ Logo }) {

  return (
    <header className="flex items-center justify-between gap-2.5 px-3.5 py-4 backdrop-blur-sm bg-[#040b1a] text-white sticky top-0 border-b border-[#1f2937]">
        <img src={Logo} alt="Logo" className="h-10" />
        <Dropdown />
    </header>
  );
}
