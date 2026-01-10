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
@api_router.get("/admin/orders", response_model=List[Order])
async def get_all_orders(admin = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order['created_at'], str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
        if isinstance(order['updated_at'], str):
            order['updated_at'] = datetime.fromisoformat(order['updated_at'])
    return orders

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status_data: OrderStatusUpdate, admin = Depends(get_admin_user)):
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status_data.status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

@api_router.get("/admin/orders/export/csv")
async def export_orders_csv(admin = Depends(get_admin_user)):
    orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Header
    writer.writerow(['Order Number', 'Date', 'Customer', 'Total Amount', 'Shipping Fee', 'Final Amount', 'Delivery Type', 'Status'])
    
    # Rows
    for order in orders:
        # Get user info
        user = await db.users.find_one({"id": order['user_id']}, {"_id": 0})
        customer_name = user['full_name'] if user else 'Unknown'
        
        created_at = order['created_at']
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        
        writer.writerow([
            order['order_number'],
            created_at.strftime('%Y-%m-%d %H:%M'),
            customer_name,
            order['total_amount'],
            order['shipping_fee'],
            order['final_amount'],
            order['delivery_type'],
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
        if isinstance(discount['created_at'], str):
            discount['created_at'] = datetime.fromisoformat(discount['created_at'])
    return discounts

@api_router.put("/admin/discounts/{discount_id}", response_model=Discount)
async def update_discount(discount_id: str, discount_data: DiscountCreate, admin = Depends(get_admin_user)):
    existing = await db.discounts.find_one({"id": discount_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Discount not found")
    
    update_data = discount_data.model_dump()
    await db.discounts.update_one({"id": discount_id}, {"$set": update_data})
    
    updated = await db.discounts.find_one({"id": discount_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
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