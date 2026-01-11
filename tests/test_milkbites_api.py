"""
Milkbites E-commerce API Tests
Tests for: Featured products, Admin orders, Site settings, Cart operations, Product management
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cake-commerce-4.preview.emergentagent.com')

# Test credentials
ADMIN_WHATSAPP = "08123456789"
ADMIN_PASSWORD = "admin123"
CUSTOMER_WHATSAPP = "081038982789"
CUSTOMER_PASSWORD = "testpass123"


class TestHealthAndBasicEndpoints:
    """Basic API health and public endpoint tests"""
    
    def test_featured_products_endpoint(self):
        """Test /api/products/featured returns random products"""
        response = requests.get(f"{BASE_URL}/api/products/featured")
        assert response.status_code == 200, f"Featured products failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Featured products should return a list"
        assert len(data) <= 6, "Featured products should return max 6 items"
        
        # Verify product structure
        if len(data) > 0:
            product = data[0]
            assert "id" in product, "Product should have id"
            assert "name" in product, "Product should have name"
            assert "price" in product, "Product should have price"
            assert "active" in product, "Product should have active field"
            print(f"✓ Featured products returned {len(data)} items")
    
    def test_site_settings_endpoint(self):
        """Test /api/site-settings returns site configuration"""
        response = requests.get(f"{BASE_URL}/api/site-settings")
        assert response.status_code == 200, f"Site settings failed: {response.text}"
        
        data = response.json()
        assert "hero_image" in data, "Site settings should have hero_image"
        assert "hero_title" in data, "Site settings should have hero_title"
        assert "footer_description" in data, "Site settings should have footer_description"
        assert "footer_contact_1" in data, "Site settings should have footer_contact_1"
        assert "footer_pickup_location" in data, "Site settings should have footer_pickup_location"
        print(f"✓ Site settings returned: {data.get('hero_title')}")
    
    def test_products_list_endpoint(self):
        """Test /api/products returns active products"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200, f"Products list failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Products should return a list"
        
        # Verify all returned products are active
        for product in data:
            assert product.get("active", True) != False, f"Inactive product returned: {product.get('name')}"
        print(f"✓ Products list returned {len(data)} active products")
    
    def test_products_by_category(self):
        """Test /api/products?category=Cookies filters correctly"""
        response = requests.get(f"{BASE_URL}/api/products?category=Cookies")
        assert response.status_code == 200, f"Products by category failed: {response.text}"
        
        data = response.json()
        for product in data:
            assert product.get("category") == "Cookies", f"Wrong category: {product.get('category')}"
        print(f"✓ Category filter returned {len(data)} Cookies products")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": ADMIN_WHATSAPP,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "Login should return token"
        assert "user" in data, "Login should return user"
        assert data["user"]["is_admin"] == True, "User should be admin"
        print(f"✓ Admin login successful: {data['user']['full_name']}")
        return data["token"]
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": "wrong",
            "password": "wrong"
        })
        assert response.status_code == 401, f"Should return 401 for invalid credentials"
        print("✓ Invalid admin credentials rejected")
    
    def test_customer_login_success(self):
        """Test customer login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "whatsapp": CUSTOMER_WHATSAPP,
            "password": CUSTOMER_PASSWORD
        })
        # May fail if customer doesn't exist
        if response.status_code == 200:
            data = response.json()
            assert "token" in data, "Login should return token"
            print(f"✓ Customer login successful")
            return data["token"]
        else:
            print(f"⚠ Customer login failed (may not exist): {response.status_code}")
            pytest.skip("Customer account may not exist")


class TestAdminOrders:
    """Admin order management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": ADMIN_WHATSAPP,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_admin_get_all_orders(self, admin_token):
        """Test admin can view all orders with customer info"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Admin orders failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list), "Orders should return a list"
        
        # Verify orders have customer info
        if len(data) > 0:
            order = data[0]
            assert "customer_name" in order, "Order should have customer_name"
            assert "customer_whatsapp" in order, "Order should have customer_whatsapp"
            assert "order_number" in order, "Order should have order_number"
            assert "final_amount" in order, "Order should have final_amount"
            assert "items" in order, "Order should have items"
            print(f"✓ Admin orders returned {len(data)} orders with customer info")
        else:
            print("✓ Admin orders endpoint works (no orders yet)")
    
    def test_admin_orders_unauthorized(self):
        """Test admin orders requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/orders")
        assert response.status_code in [401, 403], "Should require authentication"
        print("✓ Admin orders requires authentication")


class TestAdminSiteSettings:
    """Admin site settings management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": ADMIN_WHATSAPP,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_admin_update_site_settings(self, admin_token):
        """Test admin can update site settings"""
        # First get current settings
        get_response = requests.get(f"{BASE_URL}/api/site-settings")
        original_settings = get_response.json()
        
        # Update settings
        update_data = {
            "hero_title": "Milkbites",
            "hero_subtitle": "by Keka Cakery",
            "hero_tagline": "Premium Baked Goods for Your Celebration"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/site-settings",
            json=update_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Update site settings failed: {response.text}"
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/site-settings")
        updated_settings = verify_response.json()
        assert updated_settings["hero_title"] == update_data["hero_title"]
        print("✓ Admin can update site settings")
    
    def test_site_settings_update_unauthorized(self):
        """Test site settings update requires admin auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/site-settings",
            json={"hero_title": "Test"}
        )
        assert response.status_code in [401, 403], "Should require admin authentication"
        print("✓ Site settings update requires admin auth")


class TestCartOperations:
    """Cart operations tests including quantity editing"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer authentication token"""
        # Try to login first
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "whatsapp": CUSTOMER_WHATSAPP,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        
        # If login fails, try to create account
        signup_response = requests.post(f"{BASE_URL}/api/auth/signup", json={
            "email": "testcustomer@test.com",
            "whatsapp": CUSTOMER_WHATSAPP,
            "password": CUSTOMER_PASSWORD,
            "full_name": "Test Customer"
        })
        if signup_response.status_code == 200:
            return signup_response.json()["token"]
        
        pytest.skip("Could not get customer token")
    
    def test_get_cart(self, customer_token):
        """Test getting cart"""
        response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Get cart failed: {response.text}"
        
        data = response.json()
        assert "items" in data, "Cart should have items"
        assert "user_id" in data, "Cart should have user_id"
        print(f"✓ Cart retrieved with {len(data['items'])} items")
    
    def test_add_to_cart(self, customer_token):
        """Test adding product to cart"""
        # Get a product first
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        if len(products) == 0:
            pytest.skip("No products available")
        
        # Find a non-customizable product
        product = None
        for p in products:
            if not p.get("requires_customization"):
                product = p
                break
        
        if not product:
            product = products[0]
        
        # Add to cart
        response = requests.post(
            f"{BASE_URL}/api/cart/add",
            json={
                "product_id": product["id"],
                "quantity": 1,
                "customization": None
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Add to cart failed: {response.text}"
        print(f"✓ Added {product['name']} to cart")
        return product["id"]
    
    def test_update_cart_quantity(self, customer_token):
        """Test updating cart item quantity with +/- buttons"""
        # First add an item
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        if len(products) == 0:
            pytest.skip("No products available")
        
        product = products[0]
        
        # Add to cart
        requests.post(
            f"{BASE_URL}/api/cart/add",
            json={"product_id": product["id"], "quantity": 1, "customization": None},
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        
        # Update quantity to 3
        response = requests.put(
            f"{BASE_URL}/api/cart/item/{product['id']}",
            json={"quantity": 3},
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Update quantity failed: {response.text}"
        
        # Verify quantity updated
        cart_response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        cart = cart_response.json()
        
        item = next((i for i in cart["items"] if i["product_id"] == product["id"]), None)
        if item:
            assert item["quantity"] == 3, f"Quantity should be 3, got {item['quantity']}"
            print(f"✓ Cart quantity updated to 3")
        else:
            print("⚠ Item not found in cart after update")
    
    def test_remove_from_cart(self, customer_token):
        """Test removing item from cart"""
        # Get cart first
        cart_response = requests.get(
            f"{BASE_URL}/api/cart",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        cart = cart_response.json()
        
        if len(cart["items"]) == 0:
            pytest.skip("Cart is empty")
        
        product_id = cart["items"][0]["product_id"]
        
        response = requests.delete(
            f"{BASE_URL}/api/cart/item/{product_id}",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Remove from cart failed: {response.text}"
        print(f"✓ Removed item from cart")


class TestProductManagement:
    """Admin product management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": ADMIN_WHATSAPP,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_create_product(self, admin_token):
        """Test admin can create a product"""
        product_data = {
            "name": "TEST_Product_Delete_Me",
            "description": "Test product for automated testing",
            "price": 50000,
            "category": "Cookies",
            "image_url": "https://example.com/test.jpg",
            "stock": 10,
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Create product failed: {response.text}"
        
        data = response.json()
        assert data["name"] == product_data["name"]
        assert data["price"] == product_data["price"]
        assert "id" in data
        print(f"✓ Created product: {data['name']} with id {data['id']}")
        return data["id"]
    
    def test_update_product(self, admin_token):
        """Test admin can update a product"""
        # First create a product
        create_response = requests.post(
            f"{BASE_URL}/api/products",
            json={
                "name": "TEST_Update_Product",
                "description": "Test",
                "price": 10000,
                "category": "Cookies",
                "image_url": "https://example.com/test.jpg"
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        product_id = create_response.json()["id"]
        
        # Update the product
        update_response = requests.put(
            f"{BASE_URL}/api/products/{product_id}",
            json={"price": 15000, "name": "TEST_Updated_Product"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert update_response.status_code == 200, f"Update product failed: {update_response.text}"
        
        # Verify update
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        updated = get_response.json()
        assert updated["price"] == 15000
        assert updated["name"] == "TEST_Updated_Product"
        print(f"✓ Updated product price to 15000")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/products/{product_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
    
    def test_delete_product(self, admin_token):
        """Test admin can delete a product and it doesn't appear on storefront"""
        # Create a product
        create_response = requests.post(
            f"{BASE_URL}/api/products",
            json={
                "name": "TEST_Delete_Product",
                "description": "Test",
                "price": 10000,
                "category": "Cookies",
                "image_url": "https://example.com/test.jpg",
                "active": True
            },
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        product_id = create_response.json()["id"]
        
        # Delete the product
        delete_response = requests.delete(
            f"{BASE_URL}/api/products/{product_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert delete_response.status_code == 200, f"Delete product failed: {delete_response.text}"
        
        # Verify product doesn't appear in products list
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        deleted_product = next((p for p in products if p["id"] == product_id), None)
        assert deleted_product is None, "Deleted product should not appear in products list"
        print(f"✓ Deleted product no longer appears on storefront")
    
    def test_product_image_upload_url(self, admin_token):
        """Test admin can set product image via URL"""
        product_data = {
            "name": "TEST_Image_URL_Product",
            "description": "Test",
            "price": 10000,
            "category": "Cookies",
            "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400",
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["image_url"] == product_data["image_url"]
        print(f"✓ Product created with image URL")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/products/{data['id']}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )


class TestDiscounts:
    """Discount management tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": ADMIN_WHATSAPP,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_get_discounts(self, admin_token):
        """Test admin can get discounts list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/discounts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Get discounts failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} discounts")
    
    def test_create_discount(self, admin_token):
        """Test admin can create a discount"""
        discount_data = {
            "code": "TEST_DISCOUNT_123",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_purchase": 100000,
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/discounts",
            json=discount_data,
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Create discount failed: {response.text}"
        
        data = response.json()
        assert data["code"] == discount_data["code"]
        print(f"✓ Created discount: {data['code']}")


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "whatsapp": ADMIN_WHATSAPP,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Admin login failed")
        return response.json()["token"]
    
    def test_cleanup_test_products(self, admin_token):
        """Clean up TEST_ prefixed products"""
        # Get all products including inactive
        response = requests.get(
            f"{BASE_URL}/api/products?include_inactive=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        products = response.json()
        
        deleted_count = 0
        for product in products:
            if product["name"].startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/products/{product['id']}",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
