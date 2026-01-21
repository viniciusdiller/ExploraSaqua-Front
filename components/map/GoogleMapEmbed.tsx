import React from "react";

interface GoogleMapEmbedProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

const GoogleMapEmbed: React.FC<GoogleMapEmbedProps> = ({
  latitude,
  longitude,
  zoom = 15,
}) => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // Se não tiver chave configurada, usa o fallback sem chave
  const mapSrc = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}`
    : `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <iframe
        width="100%"
        height="100%"
        src={mapSrc}
        title="Localização do Estabelecimento"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        loading="lazy"
        allowFullScreen
        className="filter grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
      ></iframe>
    </div>
  );
};

export default GoogleMapEmbed;
