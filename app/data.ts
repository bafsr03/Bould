// app/data.ts

export type Product = {
  id: string;
  name: string;
  category: string;
  image: string;
  materials: string[];
  converted: boolean;
  status: "active" | "draft" | "inactive";
};

// This array is your “fake DB.” Both tables will read from here.
export const products: Product[] = [
  {
    id: "p1",
    name: "Blanks Hoodie",
    category: "Hoodie",
    image: "https://i.imgur.com/H7Utdza.png",
    materials: ["French terry", "Cotton", "Polyester"],
    converted: true,
    status: "active",
  },
  {
    id: "p2",
    name: "Retro Coffee Table",
    category: "Table",
    image:
      "https://media.istockphoto.com/id/1368342833/photo/end-table-round-coffee-table-isolated-on-white.jpg",
    materials: [""],
    converted: false,
    status: "inactive",
  },
  {
    id: "p3",
    name: "T-shirt",
    category: "T-shirt",
    image:
      "https://theme-spotlight-demo.myshopify.com/cdn/shop/products/DSC07686_Coffee-Jazz-Rap_Black_Shopify_1080x.jpg",
    materials: ["Cotton pima 100%"],
    converted: false,
    status: "draft",
  },
  {
    id: "p4",
    name: "Blanks Cap",
    category: "Cap",
    image: "https://i.imgur.com/vcFmbkv.png",
    materials: ["Corduroy", "Cotton"],
    converted: true,
    status: "draft",
  },
];


// app/data.ts
// ────────────────────────────────────────────────────────────────────────────
// A simple in‐memory “fake” store. Resets whenever the server restarts.

export type StoreDetails = {
  storeName: string;
  accountEmail: string;
};

let storeDetails: StoreDetails = {
  storeName: "Bould",
  accountEmail: "bould@example.com",
};

/**
 * Fetch the current store details.
 */
export async function getStoreDetails(): Promise<StoreDetails> {
  return storeDetails;
}

/**
 * Overwrite the store details in memory.
 */
export async function updateStoreDetails(
  updates: StoreDetails
): Promise<StoreDetails> {
  storeDetails = updates;
  return storeDetails;
}
