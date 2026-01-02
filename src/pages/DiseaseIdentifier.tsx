export default function DiseaseIdentifier() {
  return (
    <div className="h-[calc(100vh-140px)] w-full">
      <iframe
        src="https://v0-disease-identifier-ai.vercel.app/"
        className="w-full h-full border-0 rounded-lg"
        title="Disease Identifier AI"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
}