import { useEffect } from 'react';

export default function CompanionCare() {
  useEffect(() => {
    const prevTitle = document.title;
    const title = 'Companion Care | MediNova';
    const description = 'Companion Care chatbot for supportive health guidance and conversation.';
    const canonicalHref = window.location.origin + '/companion-care';

    document.title = title;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', description);

    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', canonicalHref);

    return () => {
      document.title = prevTitle;
    };
  }, []);

  return (
    <main className="h-[calc(100vh-140px)] w-full">
      <section aria-label="Companion Care Chatbot" className="h-full">
        <iframe
          src="https://v0-light-blue-chatbot.vercel.app/"
          className="w-full h-full border-0 rounded-lg"
          title="Companion Care Chatbot"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          allow="camera; microphone; geolocation"
          loading="lazy"
        />
      </section>
    </main>
  );
}
