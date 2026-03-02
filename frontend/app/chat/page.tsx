import ChatWindow from "@/components/ChatWindow";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100vh-80px)] flex-col rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Inventory AI</h1>
        <p className="text-sm text-gray-500">
          Ask questions about inventory levels, demand forecasts, and replenishment orders.
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
