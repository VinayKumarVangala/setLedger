import os
import requests
from pymongo import MongoClient
from datetime import datetime, timedelta

class DataService:
    def __init__(self):
        self.mongo_uri = os.getenv('MONGO_URI')
        self.backend_url = os.getenv('BACKEND_URL', 'http://localhost:3001')
        self.client = None
        
    def connect_db(self):
        """Connect to MongoDB"""
        if self.mongo_uri:
            self.client = MongoClient(self.mongo_uri)
            return self.client.setledger
        return None
    
    def get_stock_data(self, org_id, product_id, days=90):
        """Get stock movement data for a product"""
        try:
            # Try MongoDB first
            db = self.connect_db()
            if db:
                return self._get_stock_from_mongo(db, org_id, product_id, days)
            
            # Fallback to API
            return self._get_stock_from_api(org_id, product_id, days)
            
        except Exception as e:
            print(f"Error fetching stock data: {e}")
            return []
    
    def get_product_info(self, org_id, product_id):
        """Get product information"""
        try:
            db = self.connect_db()
            if db:
                return self._get_product_from_mongo(db, org_id, product_id)
            
            return self._get_product_from_api(org_id, product_id)
            
        except Exception as e:
            print(f"Error fetching product info: {e}")
            return {}
    
    def _get_stock_from_mongo(self, db, org_id, product_id, days):
        """Get stock data from MongoDB"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        stock_data = list(db.ledgers.find({
            'orgID': org_id,
            'accountID': {'$regex': f'.*{product_id}.*'},
            'date': {'$gte': cutoff_date}
        }).sort('date', 1))
        
        return [{
            'date': item['date'],
            'balance': item['balance'],
            'quantity': item.get('debit', 0) - item.get('credit', 0)
        } for item in stock_data]
    
    def _get_product_from_mongo(self, db, org_id, product_id):
        """Get product info from MongoDB"""
        product = db.products.find_one({
            'orgID': org_id,
            'productID': product_id
        })
        
        if product:
            return {
                'current_stock': product.get('inventory', {}).get('currentStock', 0),
                'min_stock': product.get('inventory', {}).get('minStock', 0),
                'name': product.get('name', ''),
                'sku': product.get('sku', '')
            }
        
        return {}
    
    def _get_stock_from_api(self, org_id, product_id, days):
        """Get stock data from API (fallback)"""
        try:
            response = requests.get(
                f"{self.backend_url}/api/v1/stock/movements",
                params={'productID': product_id, 'limit': days * 2},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    return [{
                        'date': item['date'],
                        'balance': item['balanceAfter'],
                        'quantity': item['quantity']
                    } for item in data.get('data', [])]
            
        except Exception as e:
            print(f"API request failed: {e}")
        
        return []
    
    def _get_product_from_api(self, org_id, product_id):
        """Get product info from API (fallback)"""
        try:
            response = requests.get(
                f"{self.backend_url}/api/v1/products/{product_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    product = data.get('data', {})
                    return {
                        'current_stock': product.get('inventory', {}).get('currentStock', 0),
                        'min_stock': product.get('inventory', {}).get('minStock', 0),
                        'name': product.get('name', ''),
                        'sku': product.get('sku', '')
                    }
            
        except Exception as e:
            print(f"API request failed: {e}")
        
        return {}
    
    def get_all_products_for_org(self, org_id):
        """Get all products for an organization"""
        try:
            db = self.connect_db()
            if db:
                products = list(db.products.find({
                    'orgID': org_id,
                    'status': 'active'
                }, {
                    'productID': 1,
                    'name': 1,
                    'sku': 1,
                    'inventory.currentStock': 1,
                    'inventory.minStock': 1
                }))
                
                return [{
                    'product_id': p['productID'],
                    'name': p.get('name', ''),
                    'sku': p.get('sku', ''),
                    'current_stock': p.get('inventory', {}).get('currentStock', 0),
                    'min_stock': p.get('inventory', {}).get('minStock', 0)
                } for p in products]
            
        except Exception as e:
            print(f"Error fetching products: {e}")
        
        return []
    
    def get_sales_history(self, org_id, product_id, days=90):
        """Get sales history for pricing analysis"""
        try:
            db = self.connect_db()
            if db:
                return self._get_sales_from_mongo(db, org_id, product_id, days)
            
            return self._get_sales_from_api(org_id, product_id, days)
            
        except Exception as e:
            print(f"Error fetching sales data: {e}")
            return []
    
    def _get_sales_from_mongo(self, db, org_id, product_id, days):
        """Get sales data from MongoDB"""
        cutoff_date = datetime.now() - timedelta(days=days)
        
        # Get invoice items for this product
        invoices = list(db.invoices.find({
            'orgID': org_id,
            'createdAt': {'$gte': cutoff_date},
            'items.productID': product_id
        }).sort('createdAt', 1))
        
        sales_data = []
        for invoice in invoices:
            for item in invoice.get('items', []):
                if item.get('productID') == product_id:
                    sales_data.append({
                        'date': invoice['createdAt'],
                        'quantity': item.get('quantity', 0),
                        'unit_price': item.get('unitPrice', 0),
                        'total_amount': item.get('totalAmount', 0),
                        'discount': item.get('discount', 0)
                    })
        
        return sales_data
    
    def _get_sales_from_api(self, org_id, product_id, days):
        """Get sales data from API (fallback)"""
        try:
            response = requests.get(
                f"{self.backend_url}/api/v1/invoices",
                params={'productID': product_id, 'days': days},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    sales_data = []
                    for invoice in data.get('data', []):
                        for item in invoice.get('items', []):
                            if item.get('productID') == product_id:
                                sales_data.append({
                                    'date': invoice['createdAt'],
                                    'quantity': item.get('quantity', 0),
                                    'unit_price': item.get('unitPrice', 0),
                                    'total_amount': item.get('totalAmount', 0),
                                    'discount': item.get('discount', 0)
                                })
                    return sales_data
            
        except Exception as e:
            print(f"API request failed: {e}")
        
        return []