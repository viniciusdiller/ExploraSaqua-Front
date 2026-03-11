"use client";

import React, { useState, useEffect } from "react";
import { Button } from "antd";
import { AimOutlined } from "@ant-design/icons";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

// --- Imports Dinâmicos do Leaflet (Prevenção de Erro SSR) ---
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);

// Hooks must be imported directly, not dynamically
import { useMap, useMapEvents } from "react-leaflet";

// --- Configuração do Ícone (Fix Padrão Leaflet) ---
import L from "leaflet";
const iconDefault = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface LocationPickerProps {
  // Onde o mapa deve focar (ex: resultado da busca por texto)
  position: { lat: number; lng: number } | null;
  // Função chamada quando o mapa define uma posição (clique ou GPS)
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  // Altura opcional (ex: '240px' ou '100%') para respeitar a div pai
  height?: string;
}

// Sub-componente: Controla o movimento do mapa quando a prop 'position' muda
const MapController = ({
  coords,
}: {
  coords: { lat: number; lng: number } | null;
}) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.flyTo([coords.lat, coords.lng], 16, { duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

// Sub-componente: Captura cliques no mapa
const ClickHandler = ({ onLocationSelect }: { onLocationSelect: any }) => {
  useMapEvents({
    async click(e: any) {
      const { lat, lng } = e.latlng;
      // Notifica o pai imediatamente das coordenadas
      onLocationSelect(lat, lng, undefined); // undefined no address por enquanto

      // Tenta buscar o endereço (Reverso)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        );
        const data = await response.json();
        if (data && data.display_name) {
          // Formata um endereço mais limpo se possível
          const rua = data.address?.road || "";
          const numero = data.address?.house_number || "";
          const bairro =
            data.address?.suburb || data.address?.neighbourhood || "";

          // Se tiver rua e bairro, usa formato curto, senão usa completo
          const enderecoFormatado =
            rua && bairro ? `${rua}, ${numero} - ${bairro}` : data.display_name;

          onLocationSelect(lat, lng, enderecoFormatado);
          toast.success("Endereço atualizado pelo mapa!");
        }
      } catch (error) {
        console.error("Erro no reverse geocoding", error);
      }
    },
  });
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  position,
  onLocationSelect,
  height,
}) => {
  const [loadingLoc, setLoadingLoc] = useState(false);

  // Posição padrão (Saquarema) caso nada seja passado
  const defaultCenter = { lat: -22.92, lng: -42.51 };
  const centerToUse = position || defaultCenter;

  const handleGetMyLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocalização não suportada pelo navegador.");
    }
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Busca endereço reverso do GPS
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const address = data.display_name || "";
          onLocationSelect(latitude, longitude, address);
          toast.success("Localização encontrada!");
        } catch (err) {
          // Se falhar o endereço, pelo menos define o pino
          onLocationSelect(latitude, longitude);
          toast.warning(
            "Localização encontrada, mas endereço não identificado.",
          );
        }
        setLoadingLoc(false);
      },
      (err) => {
        console.error(err);
        toast.error("Permissão de localização negada ou erro no GPS.");
        setLoadingLoc(false);
      },
    );
  };

  return (
    // usa style height para respeitar o container pai; se não informado, 100%
    <div className="relative w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm group" style={{ height: height || "100%" }}>
      <MapContainer
        center={[centerToUse.lat, centerToUse.lng]}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />

        {/* Marcador Visual */}
        {position && (
          <Marker position={[position.lat, position.lng]} icon={iconDefault} />
        )}

        {/* Controladores Lógicos */}
        <MapController coords={position} />
        <ClickHandler onLocationSelect={onLocationSelect} />
      </MapContainer>

      {/* Botão Flutuante de GPS */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          type="primary"
          shape="circle"
          icon={<AimOutlined />}
          size="large"
          loading={loadingLoc}
          onClick={handleGetMyLocation}
          title="Usar minha localização"
          className="shadow-md !bg-white !text-blue-600 hover:!bg-blue-50 border-none"
        />
      </div>

      {/* Dica visual */}
      <div className="absolute bottom-2 left-2 bg-white/90 px-3 py-1 rounded text-xs text-gray-600 z-[1000] shadow pointer-events-none opacity-70 group-hover:opacity-100 transition-opacity">
        Clique no mapa para ajustar o endereço
      </div>
    </div>
  );
};

export default LocationPicker;
