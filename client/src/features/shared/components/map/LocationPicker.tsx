import { LocationData } from "@advanced-react/shared/schema/experience";
import { LatLngTuple } from "leaflet";
import { useEffect, useState } from "react";

import {
  ScrollArea,
  ScrollBar,
} from "@/features/shared/components/ui/ScrollArea";
import { useDebounce } from "@/features/shared/hooks/useDebounce";

import { Button } from "../ui/Button";
import { RawInput } from "../ui/Input";
import LocationDisplay from "./LocationDisplay";

const DEFAULT_LOCATION = {
  lat: 51.505,
  lon: -0.09,
};

type Venue = {
  display_name: string;
  lat: string;
  lon: string;
};

type LocationPickerProps = {
  value?: LocationData;
  onChange: (location: LocationData | null) => void;
};

export default function LocationPicker({
  value,
  onChange,
}: LocationPickerProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [zoom, setZoom] = useState(value ? 18 : 13);
  const [center, setCenter] = useState<LatLngTuple>(
    value
      ? [value.lat, value.lon]
      : [DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon],
  );

  async function handleSearch(query: string) {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
    );
    const responseData = await response.json();
    setVenues(responseData);
  }

  function handleVenueSelect(venue: Venue) {
    onChange({
      displayName: venue.display_name,
      lat: parseFloat(venue.lat),
      lon: parseFloat(venue.lon),
    });
    setVenues([]);
    setZoom(18);
    setCenter([parseFloat(venue.lat), parseFloat(venue.lon)]);
  }

  function handleClear() {
    onChange(null);
    setVenues([]);
    setZoom(13);
    setCenter([DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        {!value && (
          <>
            <LocationSearch onSearch={handleSearch} />
            {venues.length > 0 && (
              <VenueList venues={venues} onSelect={handleVenueSelect} />
            )}
          </>
        )}
        {value && (
          <SelectedLocation name={value.displayName} onClear={handleClear} />
        )}
      </div>
      <LocationDisplay
        location={{
          lat: center[0],
          lon: center[1],
        }}
        zoom={zoom}
      />
    </div>
  );
}

function LocationSearch({ onSearch }: { onSearch: (query: string) => void }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch) {
      onSearch(debouncedSearch);
    }
  }, [debouncedSearch, onSearch]);

  return (
    <RawInput
      placeholder="Search location..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  );
}

type SelectedLocationProps = {
  name: string;
  onClear: () => void;
};

function SelectedLocation({ name, onClear }: SelectedLocationProps) {
  return (
    <div className="mb-4">
      <div className="rounded border border-neutral-100 p-2 dark:border-neutral-800">
        <div className="mb-2">{name}</div>
        <Button type="button" variant="destructive-link" onClick={onClear}>
          Clear Location
        </Button>
      </div>
    </div>
  );
}

type VenueListProps = {
  venues: Venue[];
  onSelect: (venue: Venue) => void;
};

function VenueList({ venues, onSelect }: VenueListProps) {
  return (
    <ScrollArea className="h-[160px]">
      <div className="space-y-2 pr-4">
        {venues.map((venue, index) => (
          <div
            key={index}
            className="cursor-pointer rounded border border-neutral-100 p-2 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-800"
            onClick={() => onSelect(venue)}
          >
            {venue.display_name}
          </div>
        ))}
      </div>
      <ScrollBar />
    </ScrollArea>
  );
}
