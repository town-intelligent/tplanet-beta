import { useState, useEffect, useRef } from "react";
import SDG1 from "../../../assets/sdgs/E_WEB_01.png";
import SDG2 from "../../../assets/sdgs/E_WEB_02.png";
import SDG3 from "../../../assets/sdgs/E_WEB_03.png";
import SDG4 from "../../../assets/sdgs/E_WEB_04.png";
import SDG5 from "../../../assets/sdgs/E_WEB_05.png";
import SDG6 from "../../../assets/sdgs/E_WEB_06.png";
import SDG7 from "../../../assets/sdgs/E_WEB_07.png";
import SDG8 from "../../../assets/sdgs/E_WEB_08.png";
import SDG9 from "../../../assets/sdgs/E_WEB_09.png";
import SDG10 from "../../../assets/sdgs/E_WEB_10.png";
import SDG11 from "../../../assets/sdgs/E_WEB_11.png";
import SDG12 from "../../../assets/sdgs/E_WEB_12.png";
import SDG13 from "../../../assets/sdgs/E_WEB_13.png";
import SDG14 from "../../../assets/sdgs/E_WEB_14.png";
import SDG15 from "../../../assets/sdgs/E_WEB_15.png";
import SDG16 from "../../../assets/sdgs/E_WEB_16.png";
import SDG17 from "../../../assets/sdgs/E_WEB_17.png";
import "../../../utils/i18n";
import i18n from "../../../utils/i18n";

// 可控元件：父層可傳入 selectedSDGs / setSelectedSDGs；若未傳入，則自行管理
export default function SdgSelect({ selectedSDGs: controlledValue, setSelectedSDGs: controlledSetter }) {
  const [open, setOpen] = useState(false);
  const [inner, setInner] = useState([]);

  const isControlled = Array.isArray(controlledValue) && typeof controlledSetter === "function";
  const value = isControlled ? controlledValue : inner;
  const setValue = isControlled ? controlledSetter : setInner;

  const SDG_CONFIG = {
    1: { title: i18n.t("sdgs.1"), img: SDG1 },
    2: { title: i18n.t("sdgs.2"), img: SDG2 },
    3: { title: i18n.t("sdgs.3"), img: SDG3 },
    4: { title: i18n.t("sdgs.4"), img: SDG4 },
    5: { title: i18n.t("sdgs.5"), img: SDG5 },
    6: { title: i18n.t("sdgs.6"), img: SDG6 },
    7: { title: i18n.t("sdgs.7"), img: SDG7 },
    8: { title: i18n.t("sdgs.8"), img: SDG8 },
    9: { title: i18n.t("sdgs.9"), img: SDG9 },
    10: { title: i18n.t("sdgs.10"), img: SDG10 },
    11: { title: i18n.t("sdgs.11"), img: SDG11 },
    12: { title: i18n.t("sdgs.12"), img: SDG12 },
    13: { title: i18n.t("sdgs.13"), img: SDG13 },
    14: { title: i18n.t("sdgs.14"), img: SDG14 },
    15: { title: i18n.t("sdgs.15"), img: SDG15 },
    16: { title: i18n.t("sdgs.16"), img: SDG16 },
    17: { title: i18n.t("sdgs.17"), img: SDG17 },
  };

  const options = Object.keys(SDG_CONFIG).map((n) => ({
    id: `sdg${n}`,
    number: Number(n),
    title: SDG_CONFIG[n].title,
    img: SDG_CONFIG[n].img,
  }));

  const toggle = (id) => {
    setValue((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const summary = () => {
    if (!value.length) return i18n.t("sdgs.selectSdgs");
    if (value.length === 1) {
      const n = Number(value[0].replace("sdg", ""));
      return `${n} ${SDG_CONFIG[n].title}`;
    }
    return i18n.t("sdgs.selectedCount", { value: value.length });
    };

  return (
    <div className="relative">
      {/* 觸發器 */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-2 border border-gray-300 rounded shadow-sm flex items-center justify-between text-left hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
      >
        <span className="text-gray-700 font-medium">{summary()}</span>
        <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none">
          <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* 下拉清單 */}
      {open && (
        <div className="absolute z-50 mt-2 w-full bg-[#EDEDED] border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <div className="grid grid-cols-1">
            {options.map((opt) => {
              const checked = value.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => toggle(opt.id)}
                  className="flex items-center px-3 py-1 cursor-pointer transition-colors"
                >
                  <div className={`flex-grow p-3 ${checked ? "bg-blue-500" : "bg-white"}`}>
                    <div className="flex items-center">
                      <img src={opt.img} alt={opt.title} className="w-10 h-10 mr-3 object-cover" />
                      <span className={`font-semibold mr-3 ${checked ? "text-white" : "text-gray-900"}`}>
                        SDG {opt.number}
                      </span>
                      <span className={checked ? "text-white" : "text-gray-700"}>{opt.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 已選擇縮圖列 */}
      {!!value.length && (
        <div className="flex gap-2 mt-2">
          {value.slice(0, 6).map((id) => {
            const n = Number(id.replace("sdg", ""));
            const img = SDG_CONFIG[n].img;
            return <img key={id} src={img} alt={`SDG ${n}`} className="w-10 h-10 rounded shadow-sm" />;
          })}
        </div>
      )}
    </div>
  );
}
