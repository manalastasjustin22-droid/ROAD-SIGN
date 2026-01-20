import { cache } from "./cache.js";

const OBJECT_LIST_CACHE_KEY = "object_list";

export async function getObjectList() {
  const cached = cache.get(OBJECT_LIST_CACHE_KEY);
  if (cached) return cached;

  // Hardcoded classes as requested
  const objectList = ["Vehicle", "Traffic Sign", "Pedestrian"];

  cache.set(OBJECT_LIST_CACHE_KEY, objectList);
  return objectList;
}