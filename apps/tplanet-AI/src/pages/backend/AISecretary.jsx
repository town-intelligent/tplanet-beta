// src/pages/backend/AISecretary.jsx
import { useEffect, useRef, useState } from "react";
import SidebarNav from "../components/SidebarNav";
import ModuleRenderer from "./components/ModuleRenderer";
import { AISecretaryProvider, useAISecretary } from "./contexts/AISecretaryContext";
import { getEnabledModules } from "./config/modules.config";
import { plan_info } from "../../utils/Plan";

function AISecretaryContent() {
  const [currentPage, setCurrentPage] = useState("chat");
  const prevPageRef = useRef(currentPage);

  const { messages, setMessages, send, sendSdgAnalysis } = useAISecretary();

  const enabledModules = getEnabledModules();

  // hash 導航
  useEffect(() => {
    const onHash = () => {
      const newPage = window.location.hash.slice(1) || "chat";
      prevPageRef.current = newPage;
      setCurrentPage(newPage);
    };

    onHash();
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const goto = (id) => (window.location.hash = id);

  // 由 ChatMessages 呼叫：把指定訊息標記成已確認
  const confirmChart = (id) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, confirmed: true } : m)));
  };

  // 增強的發送函數
  const handleEnhancedSend = async (userInput, clearInput, context = {}) => {
    const text = (userInput || "").trim();
    if (!text) return;

    const { plan, planUuid, selectedSDGs, selectedFaq } = context;
    const isInPlanningPage = currentPage === "planning";
    const hasSdgData = plan?.trim() && selectedSDGs?.length > 0;
    const hasFaqData = selectedFaq && planUuid?.trim();

    if (typeof clearInput === "function") clearInput();

    // SDG 分析模式：傳送計劃名稱到 /api/planning
    if (isInPlanningPage && hasSdgData) {
      await sendSdgAnalysis(selectedSDGs, text, plan);
    }
    // FAQ 模式：用 UUID 獲取計劃資訊，傳送到一般聊天
    else if (isInPlanningPage && hasFaqData) {
      try {
        const planDetails = await plan_info(planUuid);
        const planInfoText = `
計劃名稱：${planDetails.name || ""}
${planDetails.period ? `執行期間：${planDetails.period}` : ""}
${planDetails.budget ? `預算：${planDetails.budget}` : ""}
${planDetails.hoster ? `主辦單位：${planDetails.hoster}` : ""}
${planDetails.project_type ? `計劃類型：${planDetails.project_type}` : ""}
${planDetails.philosophy ? `計劃理念：${planDetails.philosophy.replace(/<[^>]*>/g, '')}` : ""}
        `.trim();

        const enhancedText = `【計劃資訊】\n${planInfoText}\n\n【用戶問題】\n${text}`;
        send(enhancedText, true);
      } catch (error) {
        console.error("獲取計劃資訊失敗:", error);
        send(text, true);
      }
    }
    // 一般模式
    else {
      const enhancedText = `${text}`;
      send(enhancedText, true);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden bg-white">
      <SidebarNav currentPage={currentPage} onNav={goto} />
      <div className="flex-1 h-full">
        <ModuleRenderer
          moduleId={currentPage}
          modules={enabledModules}
          onConfirm={confirmChart}
          onSend={handleEnhancedSend}
        />
      </div>
    </div>
  );
}

export default function AISecretary() {
  return (
    <AISecretaryProvider>
      <AISecretaryContent />
    </AISecretaryProvider>
  );
}
