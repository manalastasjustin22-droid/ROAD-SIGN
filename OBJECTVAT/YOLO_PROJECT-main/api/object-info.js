import { getObjectInfo } from "../lib/getObjectInfo.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    const objectInfo = await getObjectInfo();
    return res.status(200).json(objectInfo);
  } catch (error) {
    console.error("Error in /api/object-info:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}