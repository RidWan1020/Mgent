<<<<<<< HEAD
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex items-center  justify-center min-h-screen text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617] font-bornomala">
      <div className="py-5">
        <h1 className="text-5xl font-bold text-center">404!!</h1>
        <p className="text-center py-3 text-base">
          ওয়েবসাইটে এরকম কোন পেইজ নেই!
        </p>
        <div className="pt-4 flex items-center justify-center">
          <Link
            to="/"
            className="px-3.5 py-2.5 rounded-full text-[#041315] cursor-pointer bg-[#20c4dd] hover:bg-[#0891b2] transition duration-200 inline-block w-fit"
          >
            হোম পেইজ
          </Link>
        </div>
      </div>
    </div>
  );
}
=======
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex items-center  justify-center min-h-screen text-[#e5e7eb] text-sm bg-gradient-to-b from-[#0b1024] to-[#020617]">
      <div className="py-5">
        <h1 className="text-3xl font-bold text-center">404 Not Found</h1>
        <p className="text-center py-3">ওয়েবসাইটে এরকম কোন পেইজ নেই!</p>
        <div className="pt-4 flex items-center justify-center">
          <Link
            to="/"
            className="px-3.5 py-2.5 rounded-full text-[#041315] cursor-pointer bg-[#20c4dd] hover:bg-[#0891b2] transition duration-200 inline-block w-fit"
          >
            হোম পেইজে ফিরে যান!
          </Link>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 475bb9ce060e4db2334f57b152ed24cd86d8b11a
