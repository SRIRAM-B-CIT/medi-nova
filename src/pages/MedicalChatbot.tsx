export default function MedicalChatbot() {
  return (
    <div className="h-[calc(100vh-140px)] w-full">
      <iframe
        src="https://77h9ikcwod93.manus.space/"
        className="w-full h-full border-0 rounded-lg"
        title="Medical Chatbot"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
}