import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { getTouristPlaces } from '@/services/touristPlacesService';
import type { TouristPlace } from '@/types/touristPlaces';
import 'leaflet/dist/leaflet.css';
import '@/pages/SafetyMap.css';
const tamilNaduCenter: [number, number] = [10.9, 78.4];
function Recenter({ center, zoom }: { center: [number, number]; zoom: number }) { const map = useMap(); useEffect(() => { map.setView(center, zoom); }, [center, map, zoom]); return null; }
export default function HomeMap() {
 const [places,setPlaces]=useState<TouristPlace[]>([]); const [center,setCenter]=useState<[number,number]>(tamilNaduCenter); const [locationAvailable,setLocationAvailable]=useState(false);
 useEffect(()=>{let alive=true; getTouristPlaces().then(data=>{if(alive)setPlaces(data.filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude)).slice(0,120));}).catch(()=>{if(alive)setPlaces([]);}); if(navigator.geolocation) navigator.geolocation.getCurrentPosition(({coords})=>{if(alive){setCenter([coords.latitude,coords.longitude]);setLocationAvailable(true);}},()=>{}, {timeout:8000,maximumAge:60000}); return()=>{alive=false;};},[]);
 return <section aria-label="Interactive Tamil Nadu safety map" className="overflow-hidden rounded-3xl border-2 border-black bg-white p-3 shadow-float"><header className="flex items-center justify-between gap-2 px-2 pb-3"><div><p className="text-sm font-extrabold text-saf-text">Tamil Nadu safety map</p><p className="text-xs text-saf-muted">{locationAvailable?'Centered on your location':'Regional view · location unavailable'}</p></div><Link to="/safety-map" className="rounded-lg bg-saf-blue px-3 py-2 text-xs font-bold text-white">Open map</Link></header><div className="h-[360px] overflow-hidden rounded-2xl border-2 border-black"><MapContainer center={center} zoom={7} className="h-full w-full" scrollWheelZoom={false}><Recenter center={center} zoom={locationAvailable?11:7}/><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>{places.map(place=><Marker key={place.id} position={[place.latitude,place.longitude]}><Popup><strong>{place.name}</strong><br/>{place.district} · {place.category}</Popup></Marker>)}</MapContainer></div><p className="mt-2 flex items-center gap-1 px-2 text-xs text-saf-muted"><MapPin className="h-3.5 w-3.5 text-saf-blue"/>{places.length?places.length+' tourist places from SAFEYATRI data':'Loading available tourist locations…'}</p></section>;
}
