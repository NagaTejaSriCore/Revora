export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number; // in INR (Rupees)
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  category: string;
  image: string;
  description: string;
  features: string[];
  inStock: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "AeroSound Pro Wireless Headphones",
    slug: "aerosound-pro-headphones",
    price: 4999,
    originalPrice: 6999,
    rating: 4.8,
    reviewCount: 142,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
    description: "Experience high-fidelity sound with Active Noise Cancellation (ANC), 40-hour battery life, and ergonomic memory foam ear cushions for all-day listening comfort.",
    features: [
      "Hybrid Active Noise Cancellation (ANC)",
      "Up to 40 Hours of Playtime with Fast Charging",
      "Custom 40mm Dynamic Drivers for Deep Bass",
      "Bluetooth 5.3 with Low Latency Mode",
      "Built-in HD Microphone for Crystal Clear Calls",
    ],
    inStock: true,
  },
  {
    id: "prod_2",
    name: "Apex Ultra Smart Watch Series X",
    slug: "apex-smart-watch-series-x",
    price: 12999,
    originalPrice: 15999,
    rating: 4.9,
    reviewCount: 98,
    category: "Wearables",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
    description: "Next-gen smartwatch featuring an Always-On AMOLED Retina display, advanced SpO2 & ECG health monitoring, dual-band GPS, and 100+ multi-sport workout modes.",
    features: [
      "1.95-inch Ultra AMOLED Retina Display",
      "24/7 Heart Rate, SpO2 & Stress Tracking",
      "Built-in GPS & Altimeter for Outdoor Tracking",
      "5 ATM Water Resistance (50m Swimproof)",
      "7-Day Battery Life on a Single Charge",
    ],
    inStock: true,
  },
  {
    id: "prod_3",
    name: "SoundPulse Portable Bluetooth Speaker",
    slug: "soundpulse-portable-speaker",
    price: 2499,
    originalPrice: 3499,
    rating: 4.6,
    reviewCount: 86,
    category: "Audio",
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=800&q=80",
    description: "Compact 20W stereo Bluetooth speaker with passive radiators for room-filling sound, IPX7 waterproof rating, and dynamic RGB ambient lighting.",
    features: [
      "20W Stereo Sound with BassBoost Driver",
      "IPX7 Fully Waterproof & Dustproof",
      "18 Hours Playback at 60% Volume",
      "Customizable RGB Ambient Light Rings",
      "True Wireless Stereo (TWS) Pairing Support",
    ],
    inStock: true,
  },
  {
    id: "prod_4",
    name: "Tactile Precision Mechanical Keyboard",
    slug: "tactile-mechanical-keyboard",
    price: 6499,
    originalPrice: 7999,
    rating: 4.7,
    reviewCount: 115,
    category: "Peripherals",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80",
    description: "Hot-swappable 75% mechanical keyboard featuring custom linear switches, PBT double-shot keycaps, per-key RGB backlighting, and tri-mode connectivity.",
    features: [
      "Hot-Swappable 5-Pin Switch Sockets",
      "Tri-Mode: 2.4GHz Wireless, Bluetooth & Type-C",
      "Durable PBT Double-Shot Keycaps",
      "Sound-Dampening Silicone Gasket Mount",
      "Dynamic Per-Key RGB Customization",
    ],
    inStock: true,
  },
  {
    id: "prod_5",
    name: "Ergonomic Aluminum Laptop Stand",
    slug: "ergonomic-aluminum-laptop-stand",
    price: 1999,
    originalPrice: 2799,
    rating: 4.8,
    reviewCount: 210,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    description: "Adjustable premium aluminum alloy stand engineered to elevate your laptop to eye level, reducing neck strain while maximizing airflow cooling.",
    features: [
      "Precision-Machined Aircraft Grade Aluminum",
      "6-Level Height & Angle Adjustments",
      "Non-Slip Anti-Scratch Silicone Pads",
      "Folds Flat for Easy Travel Storage",
      "Universal Compatibility for 10-17 inch Laptops",
    ],
    inStock: true,
  },
  {
    id: "prod_6",
    name: "PowerMax 20,000mAh Fast Charging Bank",
    slug: "powermax-20000mah-power-bank",
    price: 1499,
    originalPrice: 2199,
    rating: 4.7,
    reviewCount: 165,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=800&q=80",
    description: "High-capacity power bank equipped with 65W Power Delivery (PD 3.0), dual USB-C ports, and an LED digital percentage status display.",
    features: [
      "20,000mAh Massive Lithium-Polymer Cell",
      "65W Super-Fast Power Delivery Output",
      "Charges Laptops, Smartphones & Tablets",
      "Smart LED Battery Percentage Screen",
      "MultiProtect Surge & Thermal Safety Circuit",
    ],
    inStock: true,
  },
  {
    id: "prod_7",
    name: "Urban Explorer Water-Resistant Backpack",
    slug: "urban-explorer-backpack",
    price: 3299,
    originalPrice: 4299,
    rating: 4.9,
    reviewCount: 74,
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
    description: "Sleek 25L commuter backpack with padded 16-inch laptop compartment, hidden anti-theft back pocket, and integrated USB charging port.",
    features: [
      "Water-Resistant 900D Ballistic Nylon Fabric",
      "Dedicated Shockproof 16-inch Laptop Sleeve",
      "Integrated External USB Charging Pass-Through",
      "Hidden Anti-Theft Passport & Value Pocket",
      "Breathable Air-Mesh Back Panel",
    ],
    inStock: true,
  },
  {
    id: "prod_8",
    name: "HydroSmart Temperature Control Bottle",
    slug: "hydrosmart-temperature-bottle",
    price: 2199,
    originalPrice: 2999,
    rating: 4.5,
    reviewCount: 52,
    category: "Lifestyle",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80",
    description: "Smart 600ml stainless steel vacuum bottle featuring an LED touch-screen temperature lid, double-wall insulation, and hydration reminders.",
    features: [
      "LED Cap with Real-Time Temperature Touch Screen",
      "Double-Wall Vacuum Keeps Drinks Hot for 12h / Cold for 24h",
      "Food-Grade 304 Stainless Steel Interior",
      "BPA-Free Leakproof Seal Ring",
      "Built-in Hourly Hydration Reminder Alert",
    ],
    inStock: true,
  },
];

export const CATEGORIES = ["All", "Audio", "Wearables", "Peripherals", "Accessories", "Lifestyle"];
