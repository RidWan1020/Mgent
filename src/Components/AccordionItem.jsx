import React from "react";
import { ChevronDown } from "lucide-react";

export default function AccordionItem({
  id,
  title,
  subtitle,
  children,
  isOpen = false,
  onToggle = () => {},
}) {
  return (
    <div className="border-2 border-[#1f2937] hover:border-[#20c4dd] rounded-xl p-2 bg-[#071225]">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="text-left">
            <div className="text-base font-semibold text-[#e6eef6]">{title}</div>
            {subtitle ? (
              <div className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ChevronDown
            size={18}
            className={`text-[#94a3b8] transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </div>
      </button>

      <div
        id={id}
        role="region"
        aria-labelledby={id + "-toggle"}
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px]" : "max-h-0"
        }`}
      >
        <div className="px-4 pb-4 pt-2 text-sm text-[#d7eaf6]">{children}</div>
      </div>
    </div>
  );
}
