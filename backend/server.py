from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import base64
import csv
import io
from fastapi.responses import StreamingResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION = 24 * 7  # 7 days in hours

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, is_admin: bool = False) -> str:
    payload = {
        'user_id': user_id,
        'is_admin': is_admin,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_admin_user(user = Depends(get_current_user)):
    if not user.get('is_admin'):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Models
class UserSignup(BaseModel):
    email: EmailStr
    whatsapp: str
    password: str
    full_name: str

class UserLogin(BaseModel):
    whatsapp: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    whatsapp: str
    full_name: str
    is_admin: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    whatsapp: str
    full_name: str
    is_admin: bool

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

class Address(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    full_address: str
    city: str
    postal_code: str
    is_default: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AddressCreate(BaseModel):
    full_address: str
    city: str
    postal_code: str
    is_default: bool = False

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str  # Cookies, Babka, Cake, Hampers
    image_url: str
    requires_customization: bool = False
    customization_options: Optional[dict] = None
    stock: int = 100
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: str
    requires_customization: bool = False
    customization_options: Optional[dict] = None
    stock: int = 100
    active: bool = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    requires_customization: Optional[bool] = None
    customization_options: Optional[dict] = None
    stock: Optional[int] = None
    active: Optional[bool] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    customization: Optional[dict] = None
    price: float

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int
    customization: Optional[dict] = None

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    order_number: str
    user_id: str
    items: List[CartItem]
    total_amount: float
    shipping_fee: float
    discount_amount: float
    final_amount: float
    delivery_type: str  # delivery or pickup
    delivery_address: Optional[str] = None
    pickup_location: Optional[str] = None
    pickup_date: Optional[str] = None
    payment_proof: Optional[str] = None
    status: str = "pending"  # pending, confirmed, processing, completed, cancelled
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    items: List[CartItem]
    delivery_type: str
    delivery_address: Optional[str] = None
    pickup_location: Optional[str] = None
    pickup_date: Optional[str] = None
    discount_code: Optional[str] = None
    notes: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class Discount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str  # percentage or fixed
    discount_value: float
    min_purchase: float
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DiscountCreate(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    min_purchase: float
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    active: bool = True

class ShippingSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "shipping_settings"
    jabodetabek_fee: float = 25000
    pickup_fee: float = 0
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "site_settings"
    hero_image: str = "https://images.unsplash.com/photo-1760448199008-6078bc23bfaa?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxnb3VybWV0JTIwY29va2llcyUyMGFlc3RoZXRpY3xlbnwwfHx8fDE3NjgwMjkxMDB8MA&ixlib=rb-4.1.0&q=85"
    hero_title: str = "Milkbites"
    hero_subtitle: str = "by Keka Cakery"
    hero_tagline: str = "Premium Baked Goods for Your Celebration"
    hero_badge: str = "Eid Special Collection"
    footer_description: str = "Premium baked goods crafted with love"
    footer_contact_1: str = "Melly: 081294607788"
    footer_contact_2: str = "Fari: 081386163292"
    footer_pickup_location: str = "Cilandak & Menara Mandiri"
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SiteSettingsUpdate(BaseModel):
    hero_image: Optional[str] = None
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    hero_tagline: Optional[str] = None
    hero_badge: Optional[str] = None
    footer_description: Optional[str] = None
    footer_contact_1: Optional[str] = None
    footer_contact_2: Optional[str] = None
    footer_pickup_location: Optional[str] = None

# Auth endpoints
@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(user_data: UserSignup):
    # Check if user exists
    existing = await db.users.find_one({"$or": [{"email": user_data.email}, {"whatsapp": user_data.whatsapp}]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user_dict = user_data.model_dump()
    password = user_dict.pop('password')
    hashed_pwd = hash_password(password)
    
    user = User(**user_dict)
    doc = user.model_dump()
    doc['password'] = hashed_pwd
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    # Create token
    token = create_token(user.id, user.is_admin)
    
    return AuthResponse(
        token=token,
        user=UserResponse(**user.model_dump())
    )

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"whatsapp": credentials.whatsapp}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_token(user.id, user.is_admin)
    
    return AuthResponse(
        token=token,
        user=UserResponse(**user.model_dump())
    )

@api_router.post("/auth/admin/login", response_model=AuthResponse)
async def admin_login(credentials: UserLogin):
    user_doc = await db.users.find_one({"whatsapp": credentials.whatsapp, "is_admin": True}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user = User(**{k: v for k, v in user_doc.items() if k != 'password'})
    token = create_token(user.id, user.is_admin)
    
    return AuthResponse(
        token=token,
        user=UserResponse(**user.model_dump())
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user = Depends(get_current_user)):
    user_doc = await db.users.find_one({"id": current_user['user_id']}, {"_id": 0, "password": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return UserResponse(**user_doc)

# Product endpoints
@api_router.get("/products/featured", response_model=List[Product])
async def get_featured_products(limit: int = 6):
    """Get random featured products for homepage"""
    # Use MongoDB aggregation to get random active products
    pipeline = [
        {"$match": {"active": {"$ne": False}}},
        {"$sample": {"size": limit}}
    ]
    products = await db.products.aggregate(pipeline).to_list(limit)
    for product in products:
        product.pop('_id', None)
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products", response_model=List[Product])
async def get_products(category: Optional[str] = None, include_inactive: bool = False):
    # By default, only return active products
    query = {} if include_inactive else {"active": {"$ne": False}}
    if category:
        query["category"] = category
    
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    for product in products:
        if isinstance(product['created_at'], str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product['created_at'], str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    return product

@api_router.post("/products", response_model=Product)
async def create_product(product_data: ProductCreate, admin = Depends(get_admin_user)):
    product = Product(**product_data.model_dump())
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product_data: ProductUpdate, admin = Depends(get_admin_user)):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    if update_data:
        await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return Product(**updated)

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin = Depends(get_admin_user)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# Cart endpoints
@api_router.get("/cart", response_model=Cart)
async def get_cart(current_user = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not cart:
        cart = Cart(user_id=current_user['user_id'])
        doc = cart.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.carts.insert_one(doc)
    else:
        if isinstance(cart['updated_at'], str):
            cart['updated_at'] = datetime.fromisoformat(cart['updated_at'])
        cart = Cart(**cart)
    return cart

@api_router.post("/cart/add")
async def add_to_cart(item: CartItemAdd, current_user = Depends(get_current_user)):
    # Get product to verify price
    product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Calculate price with customization
    price = product['price']
    if item.customization and product.get('requires_customization'):
        # Handle new format with variant_types
        if item.customization.get('variant_types'):
            # Count Kaastengel from cookies type
            cookies_variants = item.customization['variant_types'].get('cookies', [])
            kaastengel_count = sum(1 for v in cookies_variants if 'Kaastengel' in v)
            price += kaastengel_count * 10000
        # Handle old format with single variants list
        elif item.customization.get('variants'):
            variants = item.customization['variants'] if isinstance(item.customization['variants'], list) else [item.customization['variants']]
            kaastengel_count = sum(1 for v in variants if 'Kaastengel' in v)
            price += kaastengel_count * 10000
    
    cart_item = CartItem(
        product_id=item.product_id,
        quantity=item.quantity,
        customization=item.customization,
        price=price
    )
    
    # Get or create cart
    cart = await db.carts.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not cart:
        cart = Cart(user_id=current_user['user_id'], items=[cart_item.model_dump()])
        doc = cart.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.carts.insert_one(doc)
    else:
        # Check if item already in cart
        found = False
        for existing_item in cart['items']:
            if existing_item['product_id'] == item.product_id and existing_item.get('customization') == item.customization:
                existing_item['quantity'] += item.quantity
                found = True
                break
        
        if not found:
            cart['items'].append(cart_item.model_dump())
        
        await db.carts.update_one(
            {"user_id": current_user['user_id']},
            {"$set": {"items": cart['items'], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Item added to cart"}

@api_router.delete("/cart/item/{product_id}")
async def remove_from_cart(product_id: str, current_user = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if cart:
        cart['items'] = [item for item in cart['items'] if item['product_id'] != product_id]
        await db.carts.update_one(
            {"user_id": current_user['user_id']},
            {"$set": {"items": cart['items'], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    return {"message": "Item removed from cart"}

class CartItemUpdate(BaseModel):
    quantity: int

@api_router.put("/cart/item/{product_id}")
async def update_cart_item_quantity(product_id: str, update_data: CartItemUpdate, current_user = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user['user_id']}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")
    
    # Find and update the item
    item_found = False
    for item in cart['items']:
        if item['product_id'] == product_id:
            if update_data.quantity <= 0:
                # Remove item if quantity is 0 or less
                cart['items'] = [i for i in cart['items'] if i['product_id'] != product_id]
            else:
                item['quantity'] = update_data.quantity
            item_found = True
            break
    
    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    
    await db.carts.update_one(
        {"user_id": current_user['user_id']},
        {"$set": {"items": cart['items'], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart updated"}

@api_router.post("/cart/clear")
async def clear_cart(current_user = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": current_user['user_id']},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Cart cleared"}

# Order endpoints
@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate, current_user = Depends(get_current_user)):
    # Calculate amounts
    total = sum(item.price * item.quantity for item in order_data.items)
    
    # Shipping fee
    shipping_fee = 0 if order_data.delivery_type == "pickup" else 25000
    
    # Discount
    discount_amount = 0
    if order_data.discount_code:
        discount = await db.discounts.find_one({"code": order_data.discount_code, "active": True}, {"_id": 0})
        if discount and total >= discount['min_purchase']:
            if discount['discount_type'] == 'percentage':
                discount_amount = total * (discount['discount_value'] / 100)
            else:
                discount_amount = discount['discount_value']
    
    final_amount = total + shipping_fee - discount_amount
    
    # Generate order number
    order_count = await db.orders.count_documents({}) + 1
    order_number = f"MB{datetime.now().strftime('%Y%m%d')}{order_count:04d}"
    
    order = Order(
        order_number=order_number,
        user_id=current_user['user_id'],
        items=order_data.items,
        total_amount=total,
        shipping_fee=shipping_fee,
        discount_amount=discount_amount,
        final_amount=final_amount,
        delivery_type=order_data.delivery_type,
        delivery_address=order_data.delivery_address,
        pickup_location=order_data.pickup_location,
        pickup_date=order_data.pickup_date,
        notes=order_data.notes
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.orders.insert_one(doc)
    
    # Clear cart
    await db.carts.update_one(
        {"user_id": current_user['user_id']},
        {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return order

@api_router.post("/orders/{order_id}/payment-proof")
async def upload_payment_proof(order_id: str, file: UploadFile = File(...), current_user = Depends(get_current_user)):
    # Read file and encode to base64
    contents = await file.read()
    base64_encoded = base64.b64encode(contents).decode('utf-8')
    file_data = f"data:{file.content_type};base64,{base64_encoded}"
    
    # Update order
    result = await db.orders.update_one(
        {"id": order_id, "user_id": current_user['user_id']},
        {"$set": {"payment_proof": file_data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Payment proof uploaded"}

@api_router.get("/orders", response_model=List[Order])
async def get_orders(current_user = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user['user_id']}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str, current_user = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id, "user_id": current_user['user_id']}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if isinstance(order['created_at'], str):
        order['created_at'] = datetime.fromisoformat(order['created_at'])
    if isinstance(order['updated_at'], str):
        order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return order

# Admin endpoints
@api_router.get("/admin/orders")
async def get_all_orders(admin = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich orders with customer info
    enriched_orders = []
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
        
        # Get customer info
        user = await db.users.find_one({"id": order['user_id']}, {"_id": 0})
        if user:
            order['customer_name'] = user.get('full_name', 'Unknown')
            order['customer_whatsapp'] = user.get('whatsapp', 'N/A')
            order['customer_email'] = user.get('email', 'N/A')
        else:
            order['customer_name'] = 'Unknown'
            order['customer_whatsapp'] = 'N/A'
            order['customer_email'] = 'N/A'
        
        enriched_orders.append(order)
    
    return enriched_orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: OrderStatusUpdate, admin = Depends(get_admin_user)):
    # Get order and customer info first
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get customer info
    user = await db.users.find_one({"id": order['user_id']}, {"_id": 0})
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Return order details for WhatsApp notification
    return {
        "message": "Order status updated",
        "order_number": order.get('order_number'),
        "customer_name": user.get('full_name', 'Customer') if user else 'Customer',
        "customer_whatsapp": user.get('whatsapp', '') if user else '',
        "final_amount": order.get('final_amount'),
        "new_status": status_data.status
    }

@api_router.get("/admin/orders/export/csv")
async def export_orders_csv(admin = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header with products column
    writer.writerow(['Order Number', 'Date', 'Customer', 'WhatsApp', 'Products', 'Total Amount', 'Shipping Fee', 'Discount', 'Final Amount', 'Delivery Type', 'Delivery Address', 'Status'])
    
    # Rows
    for order in orders:
        # Get user info
        user = await db.users.find_one({"id": order['user_id']}, {"_id": 0})
        customer_name = user['full_name'] if user else 'Unknown'
        customer_whatsapp = user['whatsapp'] if user else ''
        
        created_at = order['created_at']
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        # Build products string
        products_list = []
        for item in order.get('items', []):
            product = await db.products.find_one({"id": item['product_id']}, {"_id": 0})
            product_name = product['name'] if product else item['product_id']
            products_list.append(f"{product_name} x{item['quantity']}")
        products_str = '; '.join(products_list)
        
        # Get delivery address
        delivery_address = order.get('delivery_address', '') if order['delivery_type'] == 'delivery' else f"{order.get('pickup_location', '')} ({order.get('pickup_date', '')})"
        
        writer.writerow([
            order['order_number'],
            created_at.strftime('%Y-%m-%d %H:%M'),
            customer_name,
            customer_whatsapp,
            products_str,
            order['total_amount'],
            order['shipping_fee'],
            order.get('discount_amount', 0),
            order['final_amount'],
            order['delivery_type'],
            delivery_address,
            order['status']
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=orders_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

# Discount endpoints
@api_router.post("/admin/discounts", response_model=Discount)
async def create_discount(discount_data: DiscountCreate, admin = Depends(get_admin_user)):
    discount = Discount(**discount_data.model_dump())
    doc = discount.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.discounts.insert_one(doc)
    return discount

@api_router.get("/admin/discounts", response_model=List[Discount])
async def get_discounts(admin = Depends(get_admin_user)):
    discounts = await db.discounts.find({}, {"_id": 0}).to_list(1000)
    for discount in discounts:
        if 'created_at' in discount and isinstance(discount['created_at'], str):
            discount['created_at'] = datetime.fromisoformat(discount['created_at'])
        elif 'created_at' not in discount:
            discount['created_at'] = datetime.now(timezone.utc)
    return discounts

@api_router.put("/admin/discounts/{discount_id}", response_model=Discount)
async def update_discount(discount_id: str, discount_data: DiscountCreate, admin = Depends(get_admin_user)):
    existing = await db.discounts.find_one({"id": discount_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    update_data = discount_data.model_dump()
    await db.discounts.update_one({"id": discount_id}, {"$set": update_data})
    
    updated = await db.discounts.find_one({"id": discount_id}, {"_id": 0})
    if 'created_at' in updated and isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    elif 'created_at' not in updated:
        updated['created_at'] = datetime.now(timezone.utc)
    return Discount(**updated)

@api_router.post("/discounts/validate")
async def validate_discount(code: str, total: float):
    discount = await db.discounts.find_one({"code": code, "active": True}, {"_id": 0})
    if not discount:
        raise HTTPException(status_code=404, detail="Invalid discount code")
    
    # Check date validity
    current_date = datetime.now(timezone.utc).date()
    if discount.get('valid_from'):
        valid_from = datetime.fromisoformat(discount['valid_from']).date() if isinstance(discount['valid_from'], str) else discount['valid_from']
        if current_date < valid_from:
            raise HTTPException(status_code=400, detail="Discount not yet valid")
    
    if discount.get('valid_until'):
        valid_until = datetime.fromisoformat(discount['valid_until']).date() if isinstance(discount['valid_until'], str) else discount['valid_until']
        if current_date > valid_until:
            raise HTTPException(status_code=400, detail="Discount has expired")
    
    if total < discount['min_purchase']:
        raise HTTPException(status_code=400, detail=f"Minimum purchase of Rp {discount['min_purchase']:,.0f} required")
    
    discount_amount = 0
    if discount['discount_type'] == 'percentage':
        discount_amount = total * (discount['discount_value'] / 100)
    else:
        discount_amount = discount['discount_value']
    
    return {
        "valid": True,
        "discount_amount": discount_amount,
        "code": code
    }

# Shipping settings
@api_router.get("/admin/shipping", response_model=ShippingSettings)
async def get_shipping_settings(admin = Depends(get_admin_user)):
    settings = await db.shipping_settings.find_one({"id": "shipping_settings"}, {"_id": 0})
    if not settings:
        settings = ShippingSettings()
        doc = settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.shipping_settings.insert_one(doc)
    else:
        if isinstance(settings['updated_at'], str):
            settings['updated_at'] = datetime.fromisoformat(settings['updated_at'])
        settings = ShippingSettings(**settings)
    return settings

@api_router.put("/admin/shipping")
async def update_shipping_settings(jabodetabek_fee: float, admin = Depends(get_admin_user)):
    await db.shipping_settings.update_one(
        {"id": "shipping_settings"},
        {"$set": {"jabodetabek_fee": jabodetabek_fee, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Shipping settings updated"}

# Address endpoints
@api_router.post("/addresses", response_model=Address)
async def create_address(address_data: AddressCreate, current_user = Depends(get_current_user)):
    # If this is default, unset other defaults
    if address_data.is_default:
        await db.addresses.update_many(
            {"user_id": current_user['user_id']},
            {"$set": {"is_default": False}}
        )
    
    address = Address(user_id=current_user['user_id'], **address_data.model_dump())
    doc = address.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.addresses.insert_one(doc)
    return address

@api_router.get("/addresses", response_model=List[Address])
async def get_addresses(current_user = Depends(get_current_user)):
    addresses = await db.addresses.find({"user_id": current_user['user_id']}, {"_id": 0}).to_list(1000)
    for address in addresses:
        if isinstance(address['created_at'], str):
            address['created_at'] = datetime.fromisoformat(address['created_at'])
    return addresses

@api_router.delete("/addresses/{address_id}")
async def delete_address(address_id: str, current_user = Depends(get_current_user)):
    result = await db.addresses.delete_one({"id": address_id, "user_id": current_user['user_id']})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address deleted"}

@api_router.put("/addresses/{address_id}")
async def update_address(address_id: str, address_data: AddressCreate, current_user = Depends(get_current_user)):
    # If this is default, unset other defaults
    if address_data.is_default:
        await db.addresses.update_many(
            {"user_id": current_user['user_id']},
            {"$set": {"is_default": False}}
        )
    
    result = await db.addresses.update_one(
        {"id": address_id, "user_id": current_user['user_id']},
        {"$set": address_data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Address not found")
    return {"message": "Address updated"}

# Site Settings endpoints
@api_router.get("/site-settings")
async def get_site_settings():
    settings = await db.site_settings.find_one({"id": "site_settings"}, {"_id": 0})
    if not settings:
        settings = SiteSettings()
        doc = settings.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.site_settings.insert_one(doc)
        return settings.model_dump()
    return settings

@api_router.put("/admin/site-settings")
async def update_site_settings(settings_data: SiteSettingsUpdate, admin = Depends(get_admin_user)):
    update_data = {k: v for k, v in settings_data.model_dump().items() if v is not None}
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.site_settings.update_one(
        {"id": "site_settings"},
        {"$set": update_data},
        upsert=True
    )
    return {"message": "Site settings updated"}

# Initialize admin user
@api_router.post("/admin/init")
async def init_admin():
    existing = await db.users.find_one({"is_admin": True}, {"_id": 0})
    if existing:
        return {"message": "Admin already exists"}
    
    admin_user = User(
        email="admin@milkbites.com",
        whatsapp="08123456789",
        full_name="Admin Milkbites",
        is_admin=True
    )
    
    doc = admin_user.model_dump()
    doc['password'] = hash_password("admin123")
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    return {"message": "Admin created", "whatsapp": "08123456789", "password": "admin123"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()