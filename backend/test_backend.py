import os
import sys
import unittest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend.main import app
from backend.database import Base, engine, SessionLocal
from backend.models import AdminUser, Product, Category, Order

class BackendTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        Base.metadata.create_all(bind=engine)

    def test_01_health_and_root(self):
        res = self.client.get("/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {"status": "healthy"})

        res_root = self.client.get("/")
        self.assertEqual(res_root.status_code, 200)
        self.assertEqual(res_root.json()["admin_whitelist_limit"], 2)

    def test_02_public_products_and_categories(self):
        res = self.client.get("/api/products")
        self.assertEqual(res.status_code, 200)
        prods = res.json()
        self.assertIsInstance(prods, list)
        self.assertGreater(len(prods), 0)

        # Check negative price prevention logic
        for p in prods:
            self.assertGreaterEqual(p["price"], 0)

        res_cats = self.client.get("/api/categories")
        self.assertEqual(res_cats.status_code, 200)
        cats = res_cats.json()
        self.assertIsInstance(cats, list)
        self.assertGreater(len(cats), 0)

    def test_03_public_order_creation(self):
        order_payload = {
            "customer": {
                "prenom": "Aminata",
                "nom": "Diallo",
                "telephone": "771234567",
                "ville": "Dakar",
                "adresse": "Almadies",
                "livraison": "Livraison express Dakar",
                "note": "Appeler avant d'arriver"
            },
            "items": [
                {
                    "id": "crocs-noir",
                    "name": "Crocs Hello Kitty Noir",
                    "size": "38",
                    "qty": 1,
                    "price": 15000,
                    "img": "/images/product-crocs-noir.jpg"
                }
            ],
            "subtotal": 15000,
            "deliveryFee": 2000,
            "total": 17000
        }
        res = self.client.post("/api/orders", json=order_payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(data.get("success"))
        self.assertEqual(data["order"]["customer"]["prenom"], "Aminata")
        self.assertEqual(data["order"]["total"], 17000)

    def test_04_admin_protection_without_token(self):
        # Product creation without token should fail with 401
        res = self.client.post("/api/products", json={"name": "Test Without Auth", "price": 10000})
        self.assertEqual(res.status_code, 401)

        # Order listing without token should fail with 401
        res_orders = self.client.get("/api/orders")
        self.assertEqual(res_orders.status_code, 401)

        # Settings update without token should fail with 401
        res_settings = self.client.put("/api/settings", json={"storePhone": "770000000"})
        self.assertEqual(res_settings.status_code, 401)

    def test_05_two_admin_limit_enforcement(self):
        """
        Verify that:
        1. First user to authenticate becomes Admin #1.
        2. Second user becomes Admin #2.
        3. Third user is rejected with 403 Forbidden.
        """
        from backend.auth import get_current_admin
        from backend.models import AdminUser

        db = SessionLocal()
        try:
            # Clean admin whitelist for test
            db.query(AdminUser).delete()
            db.commit()

            # Mock clerk token decoding for test
            from unittest.mock import patch
            import sys
            auth_module_name = "auth" if "auth" in sys.modules else "backend.auth"

            # Admin 1
            with patch(f"{auth_module_name}.verify_token") as mock_verify:
                mock_verify.return_value = {"sub": "user_test_admin_1", "email": "admin1@oumalya.sn"}
                headers = {"Authorization": "Bearer fake_token_1"}
                res1 = self.client.get("/api/admin/verify", headers=headers)
                self.assertEqual(res1.status_code, 200)
                data1 = res1.json()
                self.assertTrue(data1["authorized"])
                self.assertEqual(data1["admin_slot"], 1)
                self.assertEqual(data1["total_admins"], 1)

            # Admin 2
            with patch(f"{auth_module_name}.verify_token") as mock_verify:
                mock_verify.return_value = {"sub": "user_test_admin_2", "email": "admin2@oumalya.sn"}
                headers = {"Authorization": "Bearer fake_token_2"}
                res2 = self.client.get("/api/admin/verify", headers=headers)
                self.assertEqual(res2.status_code, 200)
                data2 = res2.json()
                self.assertTrue(data2["authorized"])
                self.assertEqual(data2["admin_slot"], 2)
                self.assertEqual(data2["total_admins"], 2)

            # Admin 1 reconnects: still authorized
            with patch(f"{auth_module_name}.verify_token") as mock_verify:
                mock_verify.return_value = {"sub": "user_test_admin_1", "email": "admin1@oumalya.sn"}
                headers = {"Authorization": "Bearer fake_token_1"}
                res1_again = self.client.get("/api/admin/verify", headers=headers)
                self.assertEqual(res1_again.status_code, 200)

            # Third user attempts: MUST BE REJECTED WITH 403 FORBIDDEN
            with patch(f"{auth_module_name}.verify_token") as mock_verify:
                mock_verify.return_value = {"sub": "user_test_intruder_3", "email": "intruder@oumalya.sn"}
                headers = {"Authorization": "Bearer fake_token_3"}
                res3 = self.client.get("/api/admin/verify", headers=headers)
                self.assertEqual(res3.status_code, 403)
                self.assertIn("limite des 2 administrateurs", res3.json()["detail"])

        finally:
            db.close()

if __name__ == "__main__":
    unittest.main()
