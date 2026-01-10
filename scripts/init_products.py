import sys
sys.path.append('/app/backend')

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path('/app/backend')
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Product data from Jotform
products_data = [
    # Hampers Personal Cookies (merged from Mini Hampers Sweet & Savory)
    {
        "id": "hampers-personal-cookies",
        "name": "Hampers Personal Cookies",
        "description": "One jar of Milkbites cookies packaged in a special box with greeting card",
        "price": 89000,
        "category": "Hampers",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/img_6643_45c35ac01ad72fdf05b3b1daa7509d63.jpeg",
        "requires_customization": True,
        "customization_options": {
            "required_count": 1,
            "variants": ["Kaastengel", "Putri Salju", "Dark Choco Cookies", "Nastar", "Florentine", "Nastar Keju"]
        },
        "stock": 100,
        "active": True
    },
    # Hampers Babka
    {
        "id": "hampers-babka",
        "name": "Hampers Babka",
        "description": "One your favorite babka packaged in a special box with greeting card",
        "price": 95000,
        "category": "Hampers",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_10_at_16_03_44_e2c19aa73dd93e10e4563d839a17e55e.jpeg",
        "requires_customization": True,
        "customization_options": {
            "required_count": 1,
            "variants": ["Blueberry Cheese", "Nutella"]
        },
        "stock": 100,
        "active": True
    },
    # Hampers Round Babka
    {
        "id": "hampers-round-babka",
        "name": "Hampers Round Babka",
        "description": "One your favorite round babka diameter 18cm packaged in a special box with greeting card",
        "price": 105000,
        "category": "Hampers",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/img_6631_5011acad7fbbc4261f32f3ff4494390e.jpeg",
        "requires_customization": True,
        "customization_options": {
            "required_count": 1,
            "variants": ["Blueberry Cheese", "Nutella"]
        },
        "stock": 100,
        "active": True
    },
    # Hampers 2 Cookies (Double)
    {
        "id": "hampers-double-cookies",
        "name": "Hampers Double Cookies",
        "description": "Two jars of Milkbites cookies packaged in a special box with greeting card",
        "price": 179000,
        "category": "Hampers",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/hampers_2_cookies_05808d834708eff9906b5c60c09d4365.jpeg",
        "requires_customization": True,
        "customization_options": {
            "required_count": 2,
            "variants": ["Kaastengel", "Putri Salju", "Dark Choco Cookies", "Nastar", "Florentine", "Nastar Keju"]
        },
        "stock": 100,
        "active": True
    },
    # Hampers Babka & Cookies
    {
        "id": "hampers-babka-cookies",
        "name": "Hampers Babka & Cookies",
        "description": "One babka and two jars of Milkbites cookies packaged in a special box with greeting card",
        "price": 269000,
        "category": "Hampers",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_13_at_16_32_05_4dbbc4b1d498ea40c84d56ede5571792.jpeg",
        "requires_customization": True,
        "customization_options": {
            "required_count": 3,
            "variants": ["Babka: Blueberry Cheese", "Babka: Nutella", "Cookie: Kaastengel", "Cookie: Putri Salju", "Cookie: Dark Choco Cookies", "Cookie: Nastar", "Cookie: Florentine", "Cookie: Nastar Keju"]
        },
        "stock": 100,
        "active": True
    },
    # Hampers 4 Cookies
    {
        "id": "hampers-4-cookies",
        "name": "Hampers 4 Cookies",
        "description": "Four jars of Milkbites cookies packaged in a special box with greeting card",
        "price": 329000,
        "category": "Hampers",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_13_at_16_38_03_907503c7cc78ca196f4189fd24d488a0.jpeg",
        "requires_customization": True,
        "customization_options": {
            "required_count": 4,
            "variants": ["Kaastengel", "Putri Salju", "Dark Choco Cookies", "Nastar", "Florentine", "Nastar Keju"]
        },
        "stock": 100,
        "active": True
    },
    # Cookies
    {
        "id": "italian-florentine",
        "name": "Italian Florentine",
        "description": "Nutritious caramelized Italian cookies, packed with a rich blend of nuts and seeds. Packaged in a 350ml jar.",
        "price": 79000,
        "category": "Cookies",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_11_at_15_03_59_dbfb57a01366763aa0431c1116c14ac8.jpeg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    },
    {
        "id": "dark-choco-chips",
        "name": "New York Dark Choco Chips",
        "description": "American-style cookies made from the finest quality chocolate with a crunchy texture. Packaged in a 350ml jar.",
        "price": 79000,
        "category": "Cookies",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/double_b3691f411e67cc299f4d8b9ecb0b9e28.jpg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    },
    {
        "id": "putri-salju",
        "name": "Indonesian Putri Salju",
        "description": "Classic Indonesian cookies, perfectly balances the rich flavor of cashews with powdered sugar. Packaged in a 350ml jar.",
        "price": 79000,
        "category": "Cookies",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_11_at_15_04_00_e8211697250eb6ff621534db5968f47c.jpeg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    },
    {
        "id": "kaastengel",
        "name": "Dutch Kaastengel",
        "description": "Dutch-style cookies, crafted with premium ingredients and a blend of three kind of cheeses. Packaged in a 350ml jar.",
        "price": 89000,
        "category": "Cookies",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_11_at_14_56_24_35e6a3341c5a435980baf3c85a594f17.jpeg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    },
    # Babka
    {
        "id": "babka-blueberry",
        "name": "Poland Babka Blueberry Cheese",
        "description": "Babka bread is a traditional bread from Poland consists of a rich and buttery dough filled with Blueberry and Cream Cheese. Packaged in aluminium cup size 20x10cm.",
        "price": 85000,
        "category": "Babka",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/img_6625_b585dfedc74bda1e6c76ab2d16ed9d1f.jpeg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    },
    {
        "id": "babka-cinnamon",
        "name": "Poland Babka Cinnamon Sugar",
        "description": "Babka bread is a traditional bread from Poland consists of a rich and buttery dough filled with Cinnamon Sugar. Packaged in aluminium cup size 20x10cm.",
        "price": 85000,
        "category": "Babka",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/whatsapp_image_2025_02_10_at_16_15_50_e005a03223c457f578648d3257909661.jpeg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    },
    {
        "id": "babka-nutella",
        "name": "Poland Babka Nutella",
        "description": "Babka bread is a traditional bread from Poland consists of a rich and buttery dough filled with Nutella and Choco Chips. Packaged in aluminium cup size 20x10cm.",
        "price": 85000,
        "category": "Babka",
        "image_url": "https://www.jotform.com/uploads/mellywiherayulinda/form_files/unnamed_d42c9e7ee41636133e37f6df94e64069.jpg",
        "requires_customization": False,
        "stock": 100,
        "active": True
    }
]

async def init_products():
    print("Initializing products...")
    
    # Clear existing products
    await db.products.delete_many({})
    
    # Insert products
    for product in products_data:
        await db.products.insert_one(product)
        print(f"Added: {product['name']}")
    
    print(f"\nTotal {len(products_data)} products initialized!")
    
    # Initialize EID2025 discount
    existing_discount = await db.discounts.find_one({"code": "EID2025"})
    if not existing_discount:
        discount = {
            "id": "eid2025",
            "code": "EID2025",
            "discount_type": "percentage",
            "discount_value": 5,
            "min_purchase": 1000000,
            "active": True
        }
        await db.discounts.insert_one(discount)
        print("\nEID2025 discount initialized!")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(init_products())
