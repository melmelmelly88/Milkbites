import requests
import sys
import json
import base64
from datetime import datetime
import io

class MilkbitesBakeryAPITester:
    def __init__(self, base_url="https://cake-commerce-4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.customer_token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.customer_id = None
        self.admin_id = None
        self.test_order_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    file_headers = {k: v for k, v in default_headers.items() if k != 'Content-Type'}
                    response = requests.post(url, data=data, files=files, headers=file_headers)
                else:
                    response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_init(self):
        """Initialize admin user"""
        print("\n=== ADMIN INITIALIZATION ===")
        success, response = self.run_test(
            "Initialize Admin User",
            "POST",
            "admin/init",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login"""
        print("\n=== ADMIN AUTHENTICATION ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/admin/login",
            200,
            data={"whatsapp": "08123456789", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.admin_id = response['user']['id']
            print(f"   Admin ID: {self.admin_id}")
            return True
        return False

    def test_customer_signup(self):
        """Test customer signup"""
        print("\n=== CUSTOMER AUTHENTICATION ===")
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Customer Signup",
            "POST",
            "auth/signup",
            200,
            data={
                "email": f"test{timestamp}@example.com",
                "whatsapp": f"08{timestamp}123",
                "password": "testpass123",
                "full_name": f"Test Customer {timestamp}"
            }
        )
        if success and 'token' in response:
            self.customer_token = response['token']
            self.customer_id = response['user']['id']
            print(f"   Customer ID: {self.customer_id}")
            return True
        return False

    def test_customer_login(self):
        """Test customer login with existing credentials"""
        timestamp = datetime.now().strftime('%H%M%S')
        success, response = self.run_test(
            "Customer Login",
            "POST",
            "auth/login",
            200,
            data={"whatsapp": f"08{timestamp}123", "password": "testpass123"}
        )
        return success

    def get_auth_headers(self, is_admin=False):
        """Get authorization headers"""
        token = self.admin_token if is_admin else self.customer_token
        return {'Authorization': f'Bearer {token}'}

    def test_products_crud(self):
        """Test product CRUD operations"""
        print("\n=== PRODUCT MANAGEMENT ===")
        
        # Create test products
        products_data = [
            {
                "name": "Kaastengel Cookies",
                "description": "Traditional Indonesian cheese cookies",
                "price": 50000,
                "category": "Cookies",
                "image_url": "https://example.com/kaastengel.jpg",
                "stock": 100
            },
            {
                "name": "Hampers Personal Cookies",
                "description": "Personal cookie hampers with customization",
                "price": 150000,
                "category": "Hampers",
                "image_url": "https://example.com/hampers-personal.jpg",
                "requires_customization": True,
                "customization_options": {
                    "variants_required": 1,
                    "available_variants": ["Kaastengel", "Nastar", "Putri Salju"]
                },
                "stock": 50
            },
            {
                "name": "Hampers Double Cookies",
                "description": "Double cookie hampers with customization",
                "price": 250000,
                "category": "Hampers",
                "image_url": "https://example.com/hampers-double.jpg",
                "requires_customization": True,
                "customization_options": {
                    "variants_required": 2,
                    "available_variants": ["Kaastengel", "Nastar", "Putri Salju"]
                },
                "stock": 30
            }
        ]

        created_products = []
        for product_data in products_data:
            success, response = self.run_test(
                f"Create Product: {product_data['name']}",
                "POST",
                "products",
                200,
                data=product_data,
                headers=self.get_auth_headers(is_admin=True)
            )
            if success:
                created_products.append(response)

        # Get all products
        success, response = self.run_test(
            "Get All Products",
            "GET",
            "products",
            200
        )
        
        if success and len(response) >= 3:
            print(f"   Found {len(response)} products")
            return created_products
        return []

    def test_cart_operations(self, products):
        """Test cart operations"""
        print("\n=== CART MANAGEMENT ===")
        
        if not products:
            print("❌ No products available for cart testing")
            return False

        # Find hampers products for customization testing
        hampers_personal = next((p for p in products if "Personal" in p['name']), None)
        hampers_double = next((p for p in products if "Double" in p['name']), None)

        # Add hampers personal with Kaastengel (should add 10,000)
        if hampers_personal:
            success, response = self.run_test(
                "Add Hampers Personal with Kaastengel",
                "POST",
                "cart/add",
                200,
                data={
                    "product_id": hampers_personal['id'],
                    "quantity": 1,
                    "customization": {"variants": ["Kaastengel"]}
                },
                headers=self.get_auth_headers()
            )

        # Add hampers double with 2 variants
        if hampers_double:
            success, response = self.run_test(
                "Add Hampers Double with 2 variants",
                "POST",
                "cart/add",
                200,
                data={
                    "product_id": hampers_double['id'],
                    "quantity": 1,
                    "customization": {"variants": ["Kaastengel", "Nastar"]}
                },
                headers=self.get_auth_headers()
            )

        # Get cart
        success, response = self.run_test(
            "Get Cart",
            "GET",
            "cart",
            200,
            headers=self.get_auth_headers()
        )

        if success:
            print(f"   Cart items: {len(response.get('items', []))}")
            # Verify Kaastengel pricing
            for item in response.get('items', []):
                if 'Kaastengel' in str(item.get('customization', {})):
                    expected_price = next((p['price'] for p in products if p['id'] == item['product_id']), 0)
                    if 'Personal' in next((p['name'] for p in products if p['id'] == item['product_id']), ''):
                        expected_price += 10000  # Kaastengel fee
                    print(f"   Item price: {item['price']}, Expected: {expected_price}")
            return response
        return None

    def test_discount_validation(self):
        """Test discount code validation"""
        print("\n=== DISCOUNT MANAGEMENT ===")
        
        # Create EID2025 discount
        success, response = self.run_test(
            "Create EID2025 Discount",
            "POST",
            "admin/discounts",
            200,
            data={
                "code": "EID2025",
                "discount_type": "percentage",
                "discount_value": 5,
                "min_purchase": 1000000,
                "active": True
            },
            headers=self.get_auth_headers(is_admin=True)
        )

        # Test discount validation with insufficient amount
        success, response = self.run_test(
            "Validate Discount - Insufficient Amount",
            "POST",
            "discounts/validate?code=EID2025&total=500000",
            400
        )

        # Test discount validation with sufficient amount
        success, response = self.run_test(
            "Validate Discount - Sufficient Amount",
            "POST",
            "discounts/validate?code=EID2025&total=1200000",
            200
        )

        if success:
            print(f"   Discount amount: {response.get('discount_amount')}")

        return success

    def test_order_creation(self, cart):
        """Test order creation"""
        print("\n=== ORDER MANAGEMENT ===")
        
        if not cart or not cart.get('items'):
            print("❌ No cart items for order testing")
            return None

        # Create order with delivery
        success, response = self.run_test(
            "Create Order - Delivery",
            "POST",
            "orders",
            200,
            data={
                "items": cart['items'],
                "delivery_type": "delivery",
                "delivery_address": "Jl. Test Address No. 123, Jakarta Selatan, 12345",
                "discount_code": None,
                "notes": "Test order for delivery"
            },
            headers=self.get_auth_headers()
        )

        if success:
            self.test_order_id = response['id']
            print(f"   Order ID: {self.test_order_id}")
            print(f"   Order Number: {response['order_number']}")
            print(f"   Total Amount: {response['total_amount']}")
            print(f"   Shipping Fee: {response['shipping_fee']}")
            print(f"   Final Amount: {response['final_amount']}")
            
            # Verify shipping fee for delivery (should be 25,000)
            if response['shipping_fee'] == 25000:
                print("✅ Delivery shipping fee correct (Rp 25,000)")
            else:
                print(f"❌ Delivery shipping fee incorrect: {response['shipping_fee']}")
            
            return response
        return None

    def test_payment_proof_upload(self):
        """Test payment proof upload"""
        print("\n=== PAYMENT PROOF UPLOAD ===")
        
        if not self.test_order_id:
            print("❌ No order ID for payment proof testing")
            return False

        # Create a dummy image file
        dummy_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('payment_proof.png', io.BytesIO(dummy_image), 'image/png')}
        
        success, response = self.run_test(
            "Upload Payment Proof",
            "POST",
            f"orders/{self.test_order_id}/payment-proof",
            200,
            files=files,
            headers=self.get_auth_headers()
        )
        
        return success

    def test_admin_order_management(self):
        """Test admin order management"""
        print("\n=== ADMIN ORDER MANAGEMENT ===")
        
        # Get all orders
        success, response = self.run_test(
            "Get All Orders (Admin)",
            "GET",
            "admin/orders",
            200,
            headers=self.get_auth_headers(is_admin=True)
        )

        if success:
            print(f"   Total orders: {len(response)}")

        # Update order status
        if self.test_order_id:
            statuses = ["confirmed", "processing", "completed"]
            for status in statuses:
                success, response = self.run_test(
                    f"Update Order Status to {status}",
                    "PUT",
                    f"admin/orders/{self.test_order_id}/status",
                    200,
                    data={"status": status},
                    headers=self.get_auth_headers(is_admin=True)
                )

        # Export orders CSV
        success, response = self.run_test(
            "Export Orders CSV",
            "GET",
            "admin/orders/export/csv",
            200,
            headers=self.get_auth_headers(is_admin=True)
        )

        return success

    def test_customer_order_tracking(self):
        """Test customer order tracking"""
        print("\n=== CUSTOMER ORDER TRACKING ===")
        
        # Get customer orders
        success, response = self.run_test(
            "Get Customer Orders",
            "GET",
            "orders",
            200,
            headers=self.get_auth_headers()
        )

        if success:
            print(f"   Customer orders: {len(response)}")

        # Get specific order
        if self.test_order_id:
            success, response = self.run_test(
                "Get Specific Order",
                "GET",
                f"orders/{self.test_order_id}",
                200,
                headers=self.get_auth_headers()
            )

        return success

def main():
    print("🧪 Starting Milkbites Bakery API Tests")
    print("=" * 50)
    
    tester = MilkbitesBakeryAPITester()
    
    # Test sequence
    try:
        # 1. Initialize admin
        if not tester.test_admin_init():
            print("❌ Admin initialization failed")
            return 1

        # 2. Admin login
        if not tester.test_admin_login():
            print("❌ Admin login failed, stopping tests")
            return 1

        # 3. Customer signup
        if not tester.test_customer_signup():
            print("❌ Customer signup failed, stopping tests")
            return 1

        # 4. Product management
        products = tester.test_products_crud()
        if not products:
            print("❌ Product creation failed")
            return 1

        # 5. Cart operations
        cart = tester.test_cart_operations(products)
        if not cart:
            print("❌ Cart operations failed")
            return 1

        # 6. Discount validation
        tester.test_discount_validation()

        # 7. Order creation
        order = tester.test_order_creation(cart)
        if not order:
            print("❌ Order creation failed")
            return 1

        # 8. Payment proof upload
        tester.test_payment_proof_upload()

        # 9. Admin order management
        tester.test_admin_order_management()

        # 10. Customer order tracking
        tester.test_customer_order_tracking()

    except Exception as e:
        print(f"❌ Test execution failed: {str(e)}")
        return 1

    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed - check logs above")
        return 1

if __name__ == "__main__":
    sys.exit(main())