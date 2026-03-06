import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Idempotent: clear and re-seed
  await prisma.product.deleteMany();
  await prisma.store.deleteMany();

  const bestBuy = await prisma.store.create({
    data: {
      name: "Best Buy",
      address: "1000 Best Buy Dr, Richfield, MN 55423",
    },
  });

  const nike = await prisma.store.create({
    data: {
      name: "Nike Factory Store",
      address: "5220 Fashion Outlets Way, Rosemont, IL 60018",
    },
  });

  const wholefoods = await prisma.store.create({
    data: {
      name: "Whole Foods Market",
      address: "95 E Houston St, New York, NY 10002",
    },
  });

  await prisma.product.createMany({
    data: [
      // Best Buy (25 products)
      { name: "Sony WH-1000XM5", category: "Audio", price: 349.99, quantity: 42, storeId: bestBuy.id },
      { name: "Apple AirPods Pro 2", category: "Audio", price: 249.99, quantity: 85, storeId: bestBuy.id },
      { name: "JBL Charge 5", category: "Audio", price: 179.99, quantity: 33, storeId: bestBuy.id },
      { name: "Bose QuietComfort Ultra", category: "Audio", price: 429.99, quantity: 15, storeId: bestBuy.id },
      { name: "Samsung Galaxy S24 Ultra", category: "Phones", price: 1299.99, quantity: 18, storeId: bestBuy.id },
      { name: "Apple iPhone 15 Pro", category: "Phones", price: 999.99, quantity: 24, storeId: bestBuy.id },
      { name: "Google Pixel 8 Pro", category: "Phones", price: 899.99, quantity: 30, storeId: bestBuy.id },
      { name: "LG C4 65\" OLED TV", category: "TVs", price: 1799.99, quantity: 7, storeId: bestBuy.id },
      { name: "Samsung 55\" Neo QLED", category: "TVs", price: 1299.99, quantity: 12, storeId: bestBuy.id },
      { name: "Sony Bravia 75\" 4K", category: "TVs", price: 2199.99, quantity: 4, storeId: bestBuy.id },
      { name: "Logitech MX Master 3S", category: "Accessories", price: 99.99, quantity: 120, storeId: bestBuy.id },
      { name: "Apple Magic Keyboard", category: "Accessories", price: 199.99, quantity: 55, storeId: bestBuy.id },
      { name: "Anker USB-C Hub", category: "Accessories", price: 34.99, quantity: 200, storeId: bestBuy.id },
      { name: "MacBook Pro 14\" M3", category: "Laptops", price: 1999.99, quantity: 10, storeId: bestBuy.id },
      { name: "Dell XPS 15", category: "Laptops", price: 1549.99, quantity: 14, storeId: bestBuy.id },
      { name: "Lenovo ThinkPad X1 Carbon", category: "Laptops", price: 1449.99, quantity: 8, storeId: bestBuy.id },
      { name: "ASUS ROG Zephyrus G14", category: "Laptops", price: 1599.99, quantity: 6, storeId: bestBuy.id },
      { name: "iPad Pro 12.9\" M2", category: "Tablets", price: 1099.99, quantity: 22, storeId: bestBuy.id },
      { name: "Samsung Galaxy Tab S9", category: "Tablets", price: 799.99, quantity: 18, storeId: bestBuy.id },
      { name: "Apple Watch Series 9", category: "Wearables", price: 399.99, quantity: 45, storeId: bestBuy.id },
      { name: "Samsung Galaxy Watch 6", category: "Wearables", price: 299.99, quantity: 38, storeId: bestBuy.id },
      { name: "Sony PlayStation 5", category: "Gaming", price: 499.99, quantity: 0, storeId: bestBuy.id },
      { name: "Nintendo Switch OLED", category: "Gaming", price: 349.99, quantity: 25, storeId: bestBuy.id },
      { name: "Xbox Series X", category: "Gaming", price: 499.99, quantity: 0, storeId: bestBuy.id },
      { name: "Canon EOS R6 Mark II", category: "Cameras", price: 2499.99, quantity: 5, storeId: bestBuy.id },

      // Nike Factory Store (25 products)
      { name: "Air Jordan 1 Retro High OG", category: "Shoes", price: 180.00, quantity: 35, storeId: nike.id },
      { name: "Nike Air Force 1 '07", category: "Shoes", price: 115.00, quantity: 60, storeId: nike.id },
      { name: "Nike Air Max 90", category: "Shoes", price: 130.00, quantity: 48, storeId: nike.id },
      { name: "Nike Dunk Low Retro", category: "Shoes", price: 115.00, quantity: 55, storeId: nike.id },
      { name: "Nike Pegasus 40", category: "Shoes", price: 130.00, quantity: 40, storeId: nike.id },
      { name: "Nike Vaporfly 3", category: "Shoes", price: 260.00, quantity: 12, storeId: nike.id },
      { name: "Nike Air Max 97", category: "Shoes", price: 175.00, quantity: 0, storeId: nike.id },
      { name: "Nike Blazer Mid '77", category: "Shoes", price: 105.00, quantity: 65, storeId: nike.id },
      { name: "Nike Dri-FIT ADV TechKnit", category: "Apparel", price: 90.00, quantity: 45, storeId: nike.id },
      { name: "Nike Sportswear Club Fleece", category: "Apparel", price: 60.00, quantity: 0, storeId: nike.id },
      { name: "Nike Pro Compression Tights", category: "Apparel", price: 55.00, quantity: 80, storeId: nike.id },
      { name: "Nike Windrunner Jacket", category: "Apparel", price: 110.00, quantity: 30, storeId: nike.id },
      { name: "Nike ACG Therma-FIT", category: "Apparel", price: 185.00, quantity: 15, storeId: nike.id },
      { name: "Nike Sportswear Tech Fleece Joggers", category: "Apparel", price: 110.00, quantity: 50, storeId: nike.id },
      { name: "Nike Dri-FIT Swoosh Sports Bra", category: "Apparel", price: 40.00, quantity: 90, storeId: nike.id },
      { name: "Nike Heritage Backpack", category: "Accessories", price: 35.00, quantity: 70, storeId: nike.id },
      { name: "Nike Everyday Crew Socks (6 pk)", category: "Accessories", price: 22.00, quantity: 150, storeId: nike.id },
      { name: "Nike Brasilia Duffel Bag", category: "Accessories", price: 45.00, quantity: 40, storeId: nike.id },
      { name: "Nike Dri-FIT Head Tie", category: "Accessories", price: 16.00, quantity: 100, storeId: nike.id },
      { name: "Nike Aerobill Cap", category: "Accessories", price: 28.00, quantity: 85, storeId: nike.id },
      { name: "Jordan MVP Backpack", category: "Accessories", price: 70.00, quantity: 25, storeId: nike.id },
      { name: "Nike Mercurial Superfly 9", category: "Cleats", price: 275.00, quantity: 18, storeId: nike.id },
      { name: "Nike Tiempo Legend 10", category: "Cleats", price: 230.00, quantity: 22, storeId: nike.id },
      { name: "Nike Metcon 9", category: "Training", price: 150.00, quantity: 35, storeId: nike.id },
      { name: "Nike Free Metcon 5", category: "Training", price: 120.00, quantity: 28, storeId: nike.id },

      // Whole Foods Market (25 products)
      { name: "Organic Avocados (6 pack)", category: "Produce", price: 5.99, quantity: 200, storeId: wholefoods.id },
      { name: "Organic Bananas (bunch)", category: "Produce", price: 1.99, quantity: 300, storeId: wholefoods.id },
      { name: "Organic Baby Spinach (5 oz)", category: "Produce", price: 4.49, quantity: 120, storeId: wholefoods.id },
      { name: "Organic Blueberries (pint)", category: "Produce", price: 6.99, quantity: 80, storeId: wholefoods.id },
      { name: "Honeycrisp Apples (3 lb)", category: "Produce", price: 7.99, quantity: 95, storeId: wholefoods.id },
      { name: "365 Organic Whole Milk (gal)", category: "Dairy", price: 6.49, quantity: 150, storeId: wholefoods.id },
      { name: "Chobani Greek Yogurt (32 oz)", category: "Dairy", price: 5.99, quantity: 110, storeId: wholefoods.id },
      { name: "Kerrygold Irish Butter", category: "Dairy", price: 4.99, quantity: 85, storeId: wholefoods.id },
      { name: "Tillamook Sharp Cheddar", category: "Dairy", price: 5.49, quantity: 70, storeId: wholefoods.id },
      { name: "Impossible Burger Patties", category: "Frozen", price: 8.99, quantity: 90, storeId: wholefoods.id },
      { name: "Amy's Margherita Pizza", category: "Frozen", price: 9.49, quantity: 60, storeId: wholefoods.id },
      { name: "Caulipower Chicken Tenders", category: "Frozen", price: 8.49, quantity: 45, storeId: wholefoods.id },
      { name: "La Croix Sparkling Water (12 pk)", category: "Beverages", price: 5.49, quantity: 0, storeId: wholefoods.id },
      { name: "Liquid Death Mountain Water (8 pk)", category: "Beverages", price: 9.99, quantity: 75, storeId: wholefoods.id },
      { name: "GT's Synergy Kombucha", category: "Beverages", price: 3.99, quantity: 130, storeId: wholefoods.id },
      { name: "Stumptown Cold Brew (10.5 oz)", category: "Beverages", price: 4.49, quantity: 55, storeId: wholefoods.id },
      { name: "Dr. Bronner's Castile Soap", category: "Personal Care", price: 12.99, quantity: 65, storeId: wholefoods.id },
      { name: "Native Deodorant", category: "Personal Care", price: 12.49, quantity: 80, storeId: wholefoods.id },
      { name: "365 Multivitamin Gummies", category: "Supplements", price: 14.99, quantity: 50, storeId: wholefoods.id },
      { name: "Garden of Life Protein Powder", category: "Supplements", price: 39.99, quantity: 30, storeId: wholefoods.id },
      { name: "Justin's Almond Butter (16 oz)", category: "Pantry", price: 10.99, quantity: 40, storeId: wholefoods.id },
      { name: "Bob's Red Mill Rolled Oats", category: "Pantry", price: 5.99, quantity: 60, storeId: wholefoods.id },
      { name: "Rao's Marinara Sauce", category: "Pantry", price: 8.99, quantity: 55, storeId: wholefoods.id },
      { name: "RXBar Protein Bar (12 pk)", category: "Snacks", price: 24.99, quantity: 35, storeId: wholefoods.id },
      { name: "Siete Tortilla Chips", category: "Snacks", price: 5.49, quantity: 70, storeId: wholefoods.id },
    ],
  });

  console.log("Seed data created: 3 stores, 75 products");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
