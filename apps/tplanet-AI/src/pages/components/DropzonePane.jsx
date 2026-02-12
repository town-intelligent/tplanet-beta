import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Upload from "../../assets/upload_icon.svg";

/**
 * 檔案上傳組件（拖拽上傳區域）
 *
 * 這個組件負責「第一階段：上傳 PDF/DOCX 到 LLMTwins 服務器」
 * 完整流程：
 * 1. 使用者拖曳或選擇 PDF 或 DOCX 檔案
 * 2. 上傳到 LLMTwins API (POST /api/sessions/{sid}/upload)
 * 3. 取得檔案 ID 後，觸發 onUploaded callback
 * 4. 由 UploadModule 接手進行「第二階段：OCR/解析、LLM 抽取、CMS 發佈」
 *
 * @param {Function} ensureSession - 取得 session ID 的函式
 * @param {Function} onUploadStart - 開始上傳時的 callback
 * @param {Function} onUploaded - 上傳完成後的 callback，會傳遞 { id, name, size }
 * @param {string} API_LLMTWINS - LLMTwins API 基礎 URL
 */
export default function DropzonePane({ ensureSession, onUploadStart, onUploaded, API_LLMTWINS }) {
  const [uploaded, setUploaded] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/msword": [],
      "text/plain": [],
    },
    multiple: true,
    onDrop: async (files) => {
      setErr("");
      if (!files?.length) return;
      setBusy(true);

      try {
        // 取得當前會話 ID
        const sid = await ensureSession();

        for (const file of files) {
          // 生成臨時檔案 ID（用於追蹤上傳進度）
          const id = Date.now() + Math.random();

          // 通知 UploadModule：開始上傳檔案
          onUploadStart?.({ id, name: file.name, size: file.size });

          // === 第一階段：上傳 PDF 到 LLMTwins 服務器 ===
          // 建立 FormData 並附加檔案
          const form = new FormData();
          form.append("file", file);

          // 上傳到 LLMTwins API
          // POST /api/sessions/{sessionId}/upload
          const res = await fetch(`${API_LLMTWINS}/api/sessions/${sid}/upload`, {
            method: "POST",
            body: form
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data?.error || `上傳失敗：${res.status}`);

          // 上傳成功，準備檔案資訊
          const row = {
            id,                           // 臨時 ID（用於前端追蹤）
            name: data?.name || file.name,
            size: data?.size || file.size
          };

          // 加入已上傳列表
          setUploaded(prev => [...prev, row]);

          // === 觸發第二階段：OCR、LLM 抽取、CMS 發佈 ===
          // 通知 UploadModule：檔案已上傳到服務器，可以開始處理
          // UploadModule 會呼叫 processPdfAndPublishToCms 進行後續處理
          onUploaded?.(row);
        }
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setBusy(false);
      }
    },
  });

  return (
    <div className="text-left">
      <p className="text-lg font-semibold text-[var(--tenant-primary)] mb-3">上傳檔案</p>
      <div {...getRootProps()} className={`flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-xl bg-white w-[300px] transition-colors ${busy ? "opacity-60 cursor-wait" : "hover:bg-gray-50 cursor-pointer"}`}>
        <input {...getInputProps()} disabled={busy} />
        <img src={Upload} alt="上傳檔案" className="w-10 h-10 mb-2" />
        <p className="text-gray-700">拖曳或點擊選擇檔案</p>
        <small className="text-gray-500 mt-1">支援 .pdf 或 .docx 檔案</small>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <a
          href="/docx-template.docx"
          download="南投縣計畫數位管理系統計畫檔案格式.docx"
          className="text-[var(--tenant-primary)] hover:underline"
        >
          📥 下載 DOCX 範本
        </a>
      </div>

      {err && <div className="mt-3 text-sm text-red-600">⚠️ {err}</div>}

      {uploaded.length > 0 && (
        <div className="mt-5 max-w-[320px]">
          <p className="font-medium text-gray-700 mb-2">已上傳檔案 ({uploaded.length})</p>
          <div className="space-y-2">
            {uploaded.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                  <p className="text-xs text-gray-500">{(f.size/1024/1024).toFixed(2)} MB</p>
                </div>
                {/* <button className="ml-2 p-1 rounded"><img src={Delete} alt="刪除檔案" className="w-5 h-5" /></button> */}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
