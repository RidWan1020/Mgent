export default function footer() {
  return (
    <footer className="flex items-center justify-center gap-2.5 backdrop-blur-sm bg-[#040b1a] border-b border-[#1f2937]">
      <p className="text-xs text-gray-500 dark:text-gray-500 py-5">
        &copy; {new Date().getFullYear()} | সকল সত্ত্ব মেসার্স রিদওয়ান সরকার ট্রেডস কর্তৃক সংরক্ষিত
      </p>
    </footer>
  );
}
