import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trash2, Save } from "lucide-react";

interface SavedChartManagerProps {
  currentPlacements: string;
  onLoadChart: (placements: string) => void;
}

export function SavedChartManager({
  currentPlacements,
  onLoadChart,
}: SavedChartManagerProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [chartName, setChartName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const chartsQuery = trpc.charts.list.useQuery();
  const saveMutation = trpc.charts.save.useMutation();
  const deleteMutation = trpc.charts.delete.useMutation();
  const loadQuery = trpc.charts.load.useQuery(
    { chartId: 0 },
    { enabled: false }
  );

  const handleSaveChart = async () => {
    if (!chartName.trim()) return;

    try {
      await saveMutation.mutateAsync({
        chartName: chartName.trim(),
        placements: currentPlacements,
      });
      setChartName("");
      setShowSaveForm(false);
      chartsQuery.refetch();
    } catch (error) {
      console.error("Failed to save chart:", error);
    }
  };

  const handleLoadChart = (chart: any) => {
    onLoadChart(chart.placements);
    setShowDropdown(false);
  };

  const handleDeleteChart = async (chartId: number) => {
    try {
      await deleteMutation.mutateAsync({ chartId });
      chartsQuery.refetch();
    } catch (error) {
      console.error("Failed to delete chart:", error);
    }
  };

  const charts = chartsQuery.data || [];

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "center",
        marginTop: "12px",
      }}
    >
      {/* Save Button */}
      {!showSaveForm ? (
        <Button
          onClick={() => setShowSaveForm(true)}
          variant="outline"
          size="sm"
          style={{ display: "flex", alignItems: "center", gap: "4px" }}
        >
          <Save size={14} />
          Save Chart
        </Button>
      ) : (
        <div style={{ display: "flex", gap: "4px", flex: 1 }}>
          <input
            type="text"
            placeholder="Chart name..."
            value={chartName}
            onChange={e => setChartName(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: "4px",
              border: "1px solid var(--rim)",
              background: "var(--void)",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Button
            onClick={handleSaveChart}
            disabled={!chartName.trim() || saveMutation.isPending}
            size="sm"
            style={{ fontSize: "11px" }}
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            onClick={() => {
              setShowSaveForm(false);
              setChartName("");
            }}
            variant="outline"
            size="sm"
            style={{ fontSize: "11px" }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Load Dropdown */}
      {charts.length > 0 && (
        <div style={{ position: "relative" }}>
          <Button
            onClick={() => setShowDropdown(!showDropdown)}
            variant="outline"
            size="sm"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            <ChevronDown size={14} />
            Load Chart ({charts.length})
          </Button>

          {showDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: "4px",
                background: "var(--void)",
                border: "1px solid var(--rim)",
                borderRadius: "4px",
                minWidth: "200px",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 1000,
              }}
            >
              {charts.map((chart: any) => (
                <div
                  key={chart.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--rim)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLElement).style.background =
                      "rgba(100,160,220,0.1)";
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                >
                  <div
                    onClick={() => handleLoadChart(chart)}
                    style={{
                      flex: 1,
                      fontSize: "12px",
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {chart.chartName}
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteChart(chart.id);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--silver-dim)",
                      padding: "4px",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
