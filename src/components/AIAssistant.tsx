import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  FileText,
  Search,
  BookOpen,
  HelpCircle,
  Lightbulb,
  PenTool,
  Paperclip,
  CheckCircle,
  Copy,
  Folder,
} from 'lucide-react';
import { FileItem } from '../types';
import { api } from '../services/api';

interface AIAssistantProps {
  files: FileItem[];
  selectedFileContext?: FileItem | null;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  referencedFiles?: string[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  files,
  selectedFileContext,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg_welcome',
      sender: 'ai',
      text: `Kính chào Thầy Từ Văn Gọn! Em là **Trợ lý AI chuyên môn** của Thầy tại Trường Tiểu học Phường An Xuyên, tỉnh Cà Mau.\n\nEm đã kết nối với toàn bộ kho tài liệu của Thầy và sẵn sàng hỗ trợ:\n- Tra cứu nhanh và phân tích Thông tư 27/2020/TT-BGDĐT.\n- Soạn kế hoạch bài dạy (Giáo án) môn Toán, Tiếng Việt Lớp 1 theo chuẩn Công văn 2345.\n- Viết nhận xét đánh giá thường xuyên & định kỳ cho học sinh lớp 1C.\n- Soạn ma trận đề kiểm tra 3 mức độ đạt chuẩn kiến thức kỹ năng.\n\nThầy cần em hỗ trợ nội dung gì hôm nay ạ?`,
      timestamp: 'Vừa xong',
    },
    {
      id: 'msg_sample_user',
      sender: 'user',
      text: 'Tìm cho tôi các tài liệu liên quan đến đánh giá học sinh lớp 1.',
      timestamp: 'Hôm nay',
    },
    {
      id: 'msg_sample_ai',
      sender: 'ai',
      text: `Em đã tìm thấy **5 tài liệu** liên quan trực tiếp đến công tác đánh giá học sinh lớp 1 trong kho của Thầy:\n\n1. **Thông tư 27.pdf** (Mục 01. GIÁO DỤC - Quy định đánh giá học sinh tiểu học toàn diện theo CT GDPT 2018)\n2. **Hướng dẫn đánh giá học sinh tiểu học.docx** (Quy trình nhận xét bằng lời và biểu hiện phẩm chất, năng lực)\n3. **Sổ theo dõi đánh giá lớp 1.xlsx** (Bảng tổng hợp điểm số và theo dõi sự tiến bộ)\n4. **Mẫu nhận xét học sinh lớp 1.docx** (Bộ câu nhận xét chuẩn mực theo từng mức độ Hoàn thành tốt, Hoàn thành, Chưa hoàn thành)\n5. **Kế hoạch đánh giá học sinh lớp 1.pdf** (Lịch kiểm tra định kỳ học kỳ 1 và cuối năm)\n\nThầy có muốn em trích xuất tóm tắt các điểm cốt lõi trong **Thông tư 27** hay soạn thảo câu nhận xét mẫu cho một em học sinh cụ thể không ạ?`,
      timestamp: 'Hôm nay',
      referencedFiles: [
        'Thông tư 27.pdf',
        'Hướng dẫn đánh giá học sinh tiểu học.docx',
        'Sổ theo dõi đánh giá lớp 1.xlsx',
        'Mẫu nhận xét học sinh lớp 1.docx',
        'Kế hoạch đánh giá học sinh lớp 1.pdf',
      ],
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string>(selectedFileContext?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedFileContext) {
      setSelectedFileId(selectedFileContext.id);
    }
  }, [selectedFileContext]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickActionPrompts = [
    {
      id: 'search-docs',
      label: 'Tìm tài liệu',
      icon: Search,
      prompt: 'Tìm cho tôi các tài liệu liên quan đến kế hoạch bài dạy môn Toán và Tiếng Việt lớp 1.',
    },
    {
      id: 'analyze-doc',
      label: 'Phân tích tài liệu',
      icon: BookOpen,
      prompt: 'Phân tích tài liệu đang chọn về mức độ đáp ứng yêu cầu cần đạt theo Chương trình GDPT 2018.',
    },
    {
      id: 'summary-doc',
      label: 'Tóm tắt nội dung',
      icon: FileText,
      prompt: 'Tóm tắt các điểm trọng tâm nhất trong Thông tư 27/2020/TT-BGDĐT về đánh giá học sinh tiểu học.',
    },
    {
      id: 'qa-doc',
      label: 'Hỏi đáp tài liệu',
      icon: HelpCircle,
      prompt: 'Trong Thông tư 27, quy định về khen thưởng học sinh tiểu học cuối năm học gồm những danh hiệu nào?',
    },
    {
      id: 'suggest-doc',
      label: 'Gợi ý tài liệu',
      icon: Lightbulb,
      prompt: 'Gợi ý các trò chơi khởi động và hoạt động trải nghiệm bổ trợ môn Toán lớp 1 bài phép cộng trong phạm vi 10.',
    },
    {
      id: 'write-content',
      label: 'Hỗ trợ viết nội dung',
      icon: PenTool,
      prompt: 'Hãy giúp Thầy viết 3 câu nhận xét đánh giá thường xuyên môn Toán cho học sinh lớp 1 có tiến bộ rõ rệt trong tuần.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Vừa xong',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const reply = await api.chatAI(text, selectedFileId || undefined);

      const aiMsg: Message = {
        id: `msg_ai_${Date.now()}`,
        sender: 'ai',
        text: reply,
        timestamp: 'Vừa xong',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: Message = {
        id: `msg_ai_err_${Date.now()}`,
        sender: 'ai',
        text: 'Dạ Thầy Gọn ơi, hệ thống AI tạm thời đang bận kết nối. Thầy vui lòng gửi lại câu hỏi trong giây lát nhé!',
        timestamp: 'Vừa xong',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[78vh]">
      {/* Left Sidebar: Quick Prompts matching Mockup #7 */}
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Trợ lý AI của Thầy Gọn
              </h3>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sẵn sàng phục vụ
              </span>
            </div>
          </div>

          <p className="text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Nghiệp vụ đề xuất
          </p>

          <div className="space-y-1.5">
            {quickActionPrompts.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleSendMessage(action.prompt)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 shadow-2xs transition-all text-left group cursor-pointer"
                >
                  <Icon className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Context File Picker */}
        <div className="mt-4 pt-3 border-t border-slate-200">
          <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-blue-600" />
            Tài liệu ngữ cảnh:
          </label>
          <select
            value={selectedFileId}
            onChange={(e) => setSelectedFileId(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 truncate"
          >
            <option value="">-- Tất cả tài liệu trong kho --</option>
            {files
              .filter((f) => !f.isDeleted)
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Main Chat Conversation Area */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50/50">
        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white'
                }`}
              >
                {msg.sender === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4 text-yellow-300" />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`p-4 rounded-2xl shadow-xs text-xs md:text-sm leading-relaxed relative group ${
                  msg.sender === 'user'
                    ? 'bg-[#0866E8] text-white rounded-tr-xs'
                    : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Referenced Documents List if any */}
                {msg.referencedFiles && msg.referencedFiles.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                    <p className="text-[11px] font-bold text-blue-700">Tệp tham chiếu trong kho:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.referencedFiles.map((rf, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100"
                        >
                          <FileText className="w-3 h-3 text-blue-600" />
                          {rf}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Message Meta & Copy */}
                <div className="flex items-center justify-between mt-2 pt-1 text-[10px] opacity-70">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button
                      onClick={() => handleCopy(msg.text, msg.id)}
                      className="hover:opacity-100 flex items-center gap-1 ml-2 text-slate-500 hover:text-blue-600"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Đã sao chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-xs text-slate-500">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4 text-yellow-300 animate-spin" />
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>Trợ lý AI đang tra cứu và soạn nội dung cho Thầy Gọn...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 md:p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập câu hỏi của thầy (Ví dụ: Soạn giáo án Toán tiết 2, viết nhận xét học sinh)..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="bg-[#0866E8] hover:bg-[#064AA8] disabled:opacity-40 text-white font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs">Gửi</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
