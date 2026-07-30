import React, { useRef, useState } from "react";
import { trpc } from "../lib/trpc";
import { FirmamentCanvasRenderer, RenderItem } from "../lib/firmamentCanvasRenderer";

export function BirthChartForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<FirmamentCanvasRenderer | null>(null);

  const [formData, setFormData] = useState({
    month: "11",
    day: "20",
    year: "1986",
    hour: "10",
    minute: "06",
    latitude: "32.7767",
    longitude: "-96.797",
    city: "Dallas, TX",
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ephemerisQuery = trpc.ephemeris.calculate.useMutation({
    onSuccess: (data) => {
      setLoading(false);
      renderChart(data);
    },
    onError: (err) => {
      setLoading(false);
      setError(err.message || "Failed to calculate chart");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const date = new Date(
      parseInt(formData.year),
      parseInt(formData.month) - 1,
      parseInt(formData.day)
    );

    ephemerisQuery.mutate({
      date: date.toISOString(),
      hour: parseInt(formData.hour),
      minute: parseInt(formData.minute),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
    });
  };

  const renderChart = (data: any) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Initialize renderer if needed
    if (!rendererRef.current) {
      rendererRef.current = new FirmamentCanvasRenderer(
        ctx,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }

    // Prepare planet render items
    const planetSymbols: Record<string, string> = {
      Sun: "☉",
      Moon: "☽",
      Mercury: "☿",
      Venus: "♀",
      Mars: "♂",
      Jupiter: "♃",
      Saturn: "♄",
      Uranus: "♅",
      Neptune: "♆",
      Pluto: "♇",
      Rahu: "☊",
      Ketu: "☋",
    };

    const planets: RenderItem[] = data.planets.map((p: any) => ({
      name: p.name,
      absoluteDegree: p.tropicalLon,
      orbitRadius: 300, // Standard zodiac ring radius
      iconSymbol: planetSymbols[p.name] || "★",
    }));

    // Render the chart
    rendererRef.current.renderChart(data.angles.asc, planets);

    // Display chart info
    const sign = Math.floor(data.angles.asc / 30);
    const signNames = [
      "Aries",
      "Taurus",
      "Gemini",
      "Cancer",
      "Leo",
      "Virgo",
      "Libra",
      "Scorpio",
      "Sagittarius",
      "Capricorn",
      "Aquarius",
      "Pisces",
    ];

    return (
      <div className="mt-4 p-4 bg-slate-900 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-2">Chart Calculated</h3>
        <p className="text-slate-300">
          Ascendant: <span className="text-yellow-400">{data.angles.asc.toFixed(2)}°</span>{" "}
          {signNames[sign]}
        </p>
        <p className="text-slate-300 text-sm mt-2">
          Planets: {data.planets.length} | Houses: 12 | Royal Stars: 4
        </p>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-950 rounded-lg border border-slate-800">
      <h1 className="text-3xl font-bold text-white mb-6">Birth Chart Calculator</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Birth Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Birth Date</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="month"
              placeholder="MM"
              min="1"
              max="12"
              value={formData.month}
              onChange={handleInputChange}
              className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
            />
            <input
              type="number"
              name="day"
              placeholder="DD"
              min="1"
              max="31"
              value={formData.day}
              onChange={handleInputChange}
              className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
            />
            <input
              type="number"
              name="year"
              placeholder="YYYY"
              value={formData.year}
              onChange={handleInputChange}
              className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
            />
          </div>
        </div>

        {/* Birth Time */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Birth Time</label>
          <div className="flex gap-2">
            <input
              type="number"
              name="hour"
              placeholder="HH"
              min="0"
              max="23"
              value={formData.hour}
              onChange={handleInputChange}
              className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
            />
            <span className="text-slate-400 leading-10">:</span>
            <input
              type="number"
              name="minute"
              placeholder="MM"
              min="0"
              max="59"
              value={formData.minute}
              onChange={handleInputChange}
              className="w-16 px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
            />
            <span className="text-slate-400 leading-10 text-sm">(CST)</span>
          </div>
        </div>

        {/* Location */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">Birth Location</label>
          <input
            type="text"
            name="city"
            placeholder="City, State"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded mb-2"
          />
        </div>

        {/* Coordinates */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Latitude</label>
          <input
            type="number"
            name="latitude"
            step="0.0001"
            value={formData.latitude}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Longitude</label>
          <input
            type="number"
            name="longitude"
            step="0.0001"
            value={formData.longitude}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded"
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-black font-bold rounded transition"
          >
            {loading ? "Calculating..." : "Calculate Chart"}
          </button>
        </div>
      </form>

      {error && <div className="text-red-400 text-sm mb-4 p-3 bg-red-950 rounded">{error}</div>}

      {/* Canvas */}
      <div className="bg-slate-900 rounded-lg border border-slate-700 p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="w-full bg-black rounded border border-slate-600"
        />
      </div>
    </div>
  );
}
