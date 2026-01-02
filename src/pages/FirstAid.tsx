export default function FirstAid() {
  return (
    <div className="h-[calc(100vh-140px)] w-full">
      <iframe
        src="https://v0-dynamic-first-aid-guide.vercel.app/"
        className="w-full h-full border-0 rounded-lg"
        title="Dynamic First Aid Guide"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
}