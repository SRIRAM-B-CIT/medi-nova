export default function DiseaseRisk() {
  return (
    <div className="h-[calc(100vh-140px)] w-full">
      <iframe
        src="https://disease-weather-vxnt.vercel.app/"
        className="w-full h-full border-0 rounded-lg"
        title="Disease Risk Prediction"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        allow="camera; microphone; geolocation"
      />
    </div>
  );
}