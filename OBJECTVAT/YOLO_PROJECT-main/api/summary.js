// traffic-summary.js
import { getTrafficSummary } from "./lib/traffic-summary.js"; // siguraduhing tama ang path at case

export function registerTrafficSummaryRoute(app) {
  // Add Express GET route
  app.get("/api/summary", async (req, res) => {
    try {
      const summary = await getTrafficSummary();
      res.status(200).json(summary);
    } catch (error) {
      console.error("Error in /api/summary:", error);
      res.status(500).json({ success: false, message: "Internal Server Error" });
    }
  });
}
