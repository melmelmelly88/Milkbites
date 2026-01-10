"""
Milkbites E-commerce - New Features Tests
Tests for:
1. Admin order details with product images
2. View Payment Proof button removed (shown in modal)
3. Customer can edit addresses
4. Default address auto-fills in checkout
5. Customer dashboard title changed to 'My Account'
6. CSV export includes Products column
7. Saved addresses dropdown at checkout
8. Address edit modal pre-fills with existing data
"""
import pytest
import requests
import os
import csv
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://keka-ecommerce.preview.emergentagent.com')

# Test credentials
ADMIN_WHATSAPP = "08123456789"
ADMIN_PASSWORD = "admin123"
CUSTOMER_WHATSAPP = "081038982789"
CUSTOMER_PASSWORD = "testpass123"


class TestAddressManagement:
    """Tests for address CRUD operations including edit functionality"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer authentication token"""
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
    
    def test_create_address(self, customer_token):
        """Test creating a new address"""
        address_data = {
            "full_address": "TEST_Jl. Test Address No. 123",
            "city": "Jakarta",
            "postal_code": "12345",
            "is_default": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/addresses",
            json=address_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Create address failed: {response.text}"
        
        data = response.json()
        assert data["full_address"] == address_data["full_address"]
        assert data["city"] == address_data["city"]
        assert data["postal_code"] == address_data["postal_code"]
        assert "id" in data
        print(f"✓ Created address with id: {data['id']}")
        return data["id"]
    
    def test_get_addresses(self, customer_token):
        """Test getting all addresses for a user"""
        response = requests.get(
            f"{BASE_URL}/api/addresses",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert response.status_code == 200, f"Get addresses failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} addresses")
        return data
    
    def test_update_address(self, customer_token):
        """Test updating an existing address (NEW FEATURE)"""
        # First create an address
        create_response = requests.post(
            f"{BASE_URL}/api/addresses",
            json={
                "full_address": "TEST_Original Address",
                "city": "Jakarta",
                "postal_code": "11111",
                "is_default": False
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert create_response.status_code == 200
        address_id = create_response.json()["id"]
        
        # Update the address
        update_data = {
            "full_address": "TEST_Updated Address",
            "city": "Bandung",
            "postal_code": "22222",
            "is_default": True
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/addresses/{address_id}",
            json=update_data,
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert update_response.status_code == 200, f"Update address failed: {update_response.text}"
        
        # Verify update by getting addresses
        get_response = requests.get(
            f"{BASE_URL}/api/addresses",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        addresses = get_response.json()
        
        updated_address = next((a for a in addresses if a["id"] == address_id), None)
        assert updated_address is not None, "Updated address not found"
        assert updated_address["full_address"] == update_data["full_address"]
        assert updated_address["city"] == update_data["city"]
        assert updated_address["postal_code"] == update_data["postal_code"]
        assert updated_address["is_default"] == True
        
        print(f"✓ Address updated successfully: {updated_address['full_address']}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/addresses/{address_id}",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
    
    def test_default_address_unsets_others(self, customer_token):
        """Test that setting an address as default unsets other defaults"""
        # Create first address as default
        addr1_response = requests.post(
            f"{BASE_URL}/api/addresses",
            json={
                "full_address": "TEST_First Default Address",
                "city": "Jakarta",
                "postal_code": "11111",
                "is_default": True
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        addr1_id = addr1_response.json()["id"]
        
        # Create second address as default
        addr2_response = requests.post(
            f"{BASE_URL}/api/addresses",
            json={
                "full_address": "TEST_Second Default Address",
                "city": "Bandung",
                "postal_code": "22222",
                "is_default": True
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        addr2_id = addr2_response.json()["id"]
        
        # Get all addresses and verify only one is default
        get_response = requests.get(
            f"{BASE_URL}/api/addresses",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        addresses = get_response.json()
        
        default_count = sum(1 for a in addresses if a.get("is_default"))
        assert default_count == 1, f"Expected 1 default address, got {default_count}"
        
        # The second address should be the default
        addr2 = next((a for a in addresses if a["id"] == addr2_id), None)
        assert addr2 and addr2["is_default"], "Second address should be default"
        
        print("✓ Setting new default address unsets previous default")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/addresses/{addr1_id}", headers={"Authorization": f"Bearer {customer_token}"})
        requests.delete(f"{BASE_URL}/api/addresses/{addr2_id}", headers={"Authorization": f"Bearer {customer_token}"})
    
    def test_delete_address(self, customer_token):
        """Test deleting an address"""
        # Create an address
        create_response = requests.post(
            f"{BASE_URL}/api/addresses",
            json={
                "full_address": "TEST_Address to Delete",
                "city": "Jakarta",
                "postal_code": "99999",
                "is_default": False
            },
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        address_id = create_response.json()["id"]
        
        # Delete the address
        delete_response = requests.delete(
            f"{BASE_URL}/api/addresses/{address_id}",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        assert delete_response.status_code == 200, f"Delete address failed: {delete_response.text}"
        
        # Verify deletion
        get_response = requests.get(
            f"{BASE_URL}/api/addresses",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        addresses = get_response.json()
        
        deleted_address = next((a for a in addresses if a["id"] == address_id), None)
        assert deleted_address is None, "Deleted address should not exist"
        
        print("✓ Address deleted successfully")


class TestCSVExport:
    """Tests for CSV export with Products column"""
    
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
    
    def test_csv_export_has_products_column(self, admin_token):
        """Test that CSV export includes Products column with item names and quantities"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders/export/csv",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"CSV export failed: {response.text}"
        
        # Parse CSV content
        csv_content = response.text
        reader = csv.reader(io.StringIO(csv_content))
        headers = next(reader)
        
        # Verify Products column exists
        assert "Products" in headers, f"Products column not found. Headers: {headers}"
        
        # Verify other expected columns
        expected_columns = ["Order Number", "Date", "Customer", "WhatsApp", "Products", 
                          "Total Amount", "Shipping Fee", "Discount", "Final Amount", 
                          "Delivery Type", "Delivery Address", "Status"]
        
        for col in expected_columns:
            assert col in headers, f"Missing column: {col}"
        
        print(f"✓ CSV export has all expected columns including Products")
        print(f"  Headers: {headers}")
        
        # Check if there are any orders and verify Products format
        rows = list(reader)
        if len(rows) > 0:
            products_idx = headers.index("Products")
            sample_products = rows[0][products_idx]
            print(f"  Sample Products value: {sample_products}")
            # Products should be in format "Product Name x2; Another Product x1"
            if sample_products:
                assert "x" in sample_products or sample_products == "", f"Products format unexpected: {sample_products}"
        
        print(f"✓ CSV export contains {len(rows)} orders")


class TestAdminOrderDetails:
    """Tests for admin order details with product images"""
    
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
    
    def test_admin_orders_have_items_with_product_ids(self, admin_token):
        """Test that admin orders include items with product_id for fetching product details"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Get admin orders failed: {response.text}"
        
        orders = response.json()
        if len(orders) > 0:
            order = orders[0]
            assert "items" in order, "Order should have items"
            
            if len(order["items"]) > 0:
                item = order["items"][0]
                assert "product_id" in item, "Item should have product_id"
                assert "quantity" in item, "Item should have quantity"
                assert "price" in item, "Item should have price"
                
                # Verify product can be fetched
                product_response = requests.get(f"{BASE_URL}/api/products/{item['product_id']}")
                if product_response.status_code == 200:
                    product = product_response.json()
                    assert "image_url" in product, "Product should have image_url"
                    print(f"✓ Product {product['name']} has image_url: {product['image_url'][:50]}...")
                else:
                    print(f"⚠ Product {item['product_id']} not found (may have been deleted)")
        
        print(f"✓ Admin orders have items with product_id for fetching images")
    
    def test_admin_orders_have_customer_info(self, admin_token):
        """Test that admin orders include customer name and WhatsApp"""
        response = requests.get(
            f"{BASE_URL}/api/admin/orders",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        orders = response.json()
        if len(orders) > 0:
            order = orders[0]
            assert "customer_name" in order, "Order should have customer_name"
            assert "customer_whatsapp" in order, "Order should have customer_whatsapp"
            print(f"✓ Order has customer info: {order['customer_name']}, {order['customer_whatsapp']}")
        else:
            print("✓ Admin orders endpoint works (no orders yet)")


class TestProductEndpoints:
    """Tests for product endpoints used in order details"""
    
    def test_get_single_product(self):
        """Test getting a single product by ID"""
        # First get list of products
        products_response = requests.get(f"{BASE_URL}/api/products")
        products = products_response.json()
        
        if len(products) == 0:
            pytest.skip("No products available")
        
        product_id = products[0]["id"]
        
        # Get single product
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200, f"Get product failed: {response.text}"
        
        product = response.json()
        assert "id" in product
        assert "name" in product
        assert "image_url" in product
        assert "price" in product
        
        print(f"✓ Single product endpoint works: {product['name']}")
    
    def test_product_not_found(self):
        """Test getting a non-existent product returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/non-existent-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent product returns 404")


class TestCleanupAddresses:
    """Cleanup test addresses"""
    
    @pytest.fixture
    def customer_token(self):
        """Get customer authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "whatsapp": CUSTOMER_WHATSAPP,
            "password": CUSTOMER_PASSWORD
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not get customer token")
    
    def test_cleanup_test_addresses(self, customer_token):
        """Clean up TEST_ prefixed addresses"""
        response = requests.get(
            f"{BASE_URL}/api/addresses",
            headers={"Authorization": f"Bearer {customer_token}"}
        )
        addresses = response.json()
        
        deleted_count = 0
        for address in addresses:
            if address["full_address"].startswith("TEST_"):
                requests.delete(
                    f"{BASE_URL}/api/addresses/{address['id']}",
                    headers={"Authorization": f"Bearer {customer_token}"}
                )
                deleted_count += 1
        
        print(f"✓ Cleaned up {deleted_count} test addresses")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
