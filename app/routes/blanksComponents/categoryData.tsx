// src/categoryData.ts (or wherever you place it)

import React from 'react'; // Needed for JSX if you use components like Badge in titleMetadata
import { Badge } from '@shopify/polaris'; // Only if you use Badge or other Polaris components directly in this data

// Define a type for individual category data
export interface CategoryDetails {
  title: string;
  subtitle: string;
  titleMetadata?: React.ReactNode;
  images: string[];
  // You could add more category-specific fields here, like:
  // skuPrefix?: string;
  // availableSizes?: string[];
}

// Define the main data structure for all categories
export const categoriesData: Record<string, CategoryDetails> = {
  "Shirts": {
    title: "Bould Blanks - Short Sleeve Shirt",
    subtitle: "Perfect for anyone any size.",
    titleMetadata: <Badge tone="info">Draft</Badge>,
    images: [
      "https://i.imgur.com/RKj4YfK.png",
      "https://i.imgur.com/mrnGL9o.png",
      "https://i.imgur.com/aE3GXxD.png",
      "https://i.imgur.com/81drHcF.png",
      "https://i.imgur.com/d7Wa7g3.png",
    ],
  },
  "Pants": {
    title: "Bould Blanks - Comfortable Pants",
    subtitle: "Durable and stylish for everyday wear.",
    titleMetadata: <Badge tone="success">New</Badge>,
    images: [
      "https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Pants+1",
      "https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Pants+2",
      "https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Pants+3",
      "https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Pants+4",
      "https://via.placeholder.com/600x400/0000FF/FFFFFF?text=Pants+5",
    ],
  },
  "Hoodies": {
    title: "Bould Blanks - Cozy Hoodies",
    subtitle: "Warm and perfect for chilly days.",
    images: [
      "https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Hoodie+1",
      "https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Hoodie+2",
      "https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Hoodie+3",
      "https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Hoodie+4",
      "https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Hoodie+5",
    ],
  },
  "Shorts": {
    title: "Bould Blanks - Versatile Shorts",
    subtitle: "Lightweight and breathable for active lifestyles.",
    images: [
        "https://via.placeholder.com/600x400/00FF00/000000?text=Shorts+1",
        "https://via.placeholder.com/600x400/00FF00/000000?text=Shorts+2",
        "https://via.placeholder.com/600x400/00FF00/000000?text=Shorts+3",
        "https://via.placeholder.com/600x400/00FF00/000000?text=Shorts+4",
        "https://via.placeholder.com/600x400/00FF00/000000?text=Shorts+5",
    ]
  },
  "Hats": {
    title: "Bould Blanks - Stylish Hats",
    subtitle: "Top off your look.",
    images: [
        "https://via.placeholder.com/600x400/FFA500/000000?text=Hat+1",
        "https://via.placeholder.com/600x400/FFA500/000000?text=Hat+2",
        "https://via.placeholder.com/600x400/FFA500/000000?text=Hat+3",
        "https://via.placeholder.com/600x400/FFA500/000000?text=Hat+4",
        "https://via.placeholder.com/600x400/FFA500/000000?text=Hat+5",
    ]
  },
  "Sweatshirts": {
    title: "Bould Blanks - Comfy Sweatshirts",
    subtitle: "Relax in style.",
    images: [
        "https://via.placeholder.com/600x400/800080/FFFFFF?text=Sweatshirt+1",
        "https://via.placeholder.com/600x400/800080/FFFFFF?text=Sweatshirt+2",
        "https://via.placeholder.com/600x400/800080/FFFFFF?text=Sweatshirt+3",
        "https://via.placeholder.com/600x400/800080/FFFFFF?text=Sweatshirt+4",
        "https://via.placeholder.com/600x400/800080/FFFFFF?text=Sweatshirt+5",
    ]
  },
  "Jackets": {
    title: "Bould Blanks - Durable Jackets",
    subtitle: "For all weather conditions.",
    images: [
        "https://via.placeholder.com/600x400/A52A2A/FFFFFF?text=Jacket+1",
        "https://via.placeholder.com/600x400/A52A2A/FFFFFF?text=Jacket+2",
        "https://via.placeholder.com/600x400/A52A2A/FFFFFF?text=Jacket+3",
        "https://via.placeholder.com/600x400/A52A2A/FFFFFF?text=Jacket+4",
        "https://via.placeholder.com/600x400/A52A2A/FFFFFF?text=Jacket+5",
    ]
  },
  "T-shirts": {
    title: "Bould Blanks - Classic T-shirts",
    subtitle: "A staple for every wardrobe.",
    images: [
        "https://via.placeholder.com/600x400/FFFF00/000000?text=T-shirt+1",
        "https://via.placeholder.com/600x400/FFFF00/000000?text=T-shirt+2",
        "https://via.placeholder.com/600x400/FFFF00/000000?text=T-shirt+3",
        "https://via.placeholder.com/600x400/FFFF00/000000?text=T-shirt+4",
        "https://via.placeholder.com/600x400/FFFF00/000000?text=T-shirt+5",
    ]
  }
};