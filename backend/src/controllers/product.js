const { Product } = require('../models');
const { requirePermission } = require('../middleware/roles');
const QRCode = require('qrcode');
const Joi = require('joi');

class ProductController {
  // Get all products with pagination and filters
  async getProducts(req, res) {
    try {
      const { orgID } = req.user;
      const { 
        page = 1, 
        limit = 20, 
        search, 
        category, 
        status = 'active',
        lowStock = false,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = { orgID, isActive: true };
      
      if (status !== 'all') filter.status = status;
      if (category) filter.category = category;
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (lowStock === 'true') {
        filter.$expr = { $lte: ['$inventory.currentStock', '$inventory.minStock'] };
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const products = await Product.find(filter)
        .sort(sortOptions)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Product.countDocuments(filter);

      res.json({
        success: true,
        data: {
          products,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get products error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get products' }
      });
    }
  }

  // Get single product by ID
  async getProduct(req, res) {
    try {
      const { productId } = req.params;
      const { orgID } = req.user;

      const product = await Product.findOne({ 
        productID: productId, 
        orgID, 
        isActive: true 
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' }
        });
      }

      res.json({
        success: true,
        data: { product }
      });
    } catch (error) {
      console.error('Get product error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get product' }
      });
    }
  }

  // Create new product
  async createProduct(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().required().trim().min(2).max(100),
        sku: Joi.string().required().trim().min(1).max(50),
        category: Joi.string().required().trim(),
        description: Joi.string().allow('').max(500),
        pricing: Joi.object({
          costPrice: Joi.number().required().min(0),
          sellingPrice: Joi.number().required().min(0),
          mrp: Joi.number().min(0),
          margin: Joi.number().min(0)
        }).required(),
        tax: Joi.object({
          gstRate: Joi.number().required().min(0).max(100),
          hsnCode: Joi.string().allow(''),
          taxCategory: Joi.string().valid('goods', 'services').default('goods')
        }).required(),
        inventory: Joi.object({
          currentStock: Joi.number().default(0).min(0),
          minStock: Joi.number().default(0).min(0),
          maxStock: Joi.number().min(0),
          unit: Joi.string().default('pcs'),
          location: Joi.string().allow('')
        }),
        supplier: Joi.object({
          name: Joi.string().allow(''),
          contact: Joi.string().allow(''),
          email: Joi.string().email().allow('')
        }),
        images: Joi.array().items(Joi.string().uri())
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { orgID, userID } = req.user;

      // Check if SKU already exists in organization
      const existingProduct = await Product.findOne({ 
        orgID, 
        sku: value.sku, 
        isActive: true 
      });

      if (existingProduct) {
        return res.status(409).json({
          success: false,
          error: { code: 'DUPLICATE_RESOURCE', message: 'SKU already exists' }
        });
      }

      // Generate product ID
      const productCount = await Product.countDocuments({ orgID });
      const productID = `${orgID}_PRD${(productCount + 1).toString().padStart(3, '0')}`;

      // Calculate margin if not provided
      if (!value.pricing.margin && value.pricing.costPrice > 0) {
        value.pricing.margin = ((value.pricing.sellingPrice - value.pricing.costPrice) / value.pricing.costPrice * 100).toFixed(2);
      }

      // Generate QR code data
      const qrData = {
        productID,
        name: value.name,
        sku: value.sku,
        price: value.pricing.sellingPrice,
        orgID
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      const product = new Product({
        productID,
        orgID,
        ...value,
        qrCode: qrCodeDataURL,
        createdBy: userID,
        updatedBy: userID
      });

      await product.save();

      res.status(201).json({
        success: true,
        data: { product },
        message: 'Product created successfully'
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create product' }
      });
    }
  }

  // Update product
  async updateProduct(req, res) {
    try {
      const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100),
        sku: Joi.string().trim().min(1).max(50),
        category: Joi.string().trim(),
        description: Joi.string().allow('').max(500),
        pricing: Joi.object({
          costPrice: Joi.number().min(0),
          sellingPrice: Joi.number().min(0),
          mrp: Joi.number().min(0),
          margin: Joi.number().min(0)
        }),
        tax: Joi.object({
          gstRate: Joi.number().min(0).max(100),
          hsnCode: Joi.string().allow(''),
          taxCategory: Joi.string().valid('goods', 'services')
        }),
        inventory: Joi.object({
          currentStock: Joi.number().min(0),
          minStock: Joi.number().min(0),
          maxStock: Joi.number().min(0),
          unit: Joi.string(),
          location: Joi.string().allow('')
        }),
        supplier: Joi.object({
          name: Joi.string().allow(''),
          contact: Joi.string().allow(''),
          email: Joi.string().email().allow('')
        }),
        images: Joi.array().items(Joi.string().uri()),
        status: Joi.string().valid('active', 'inactive', 'discontinued')
      });

      const { error, value } = schema.validate(req.body);
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const { productId } = req.params;
      const { orgID, userID } = req.user;

      // Check if SKU already exists (excluding current product)
      if (value.sku) {
        const existingProduct = await Product.findOne({ 
          orgID, 
          sku: value.sku, 
          productID: { $ne: productId },
          isActive: true 
        });

        if (existingProduct) {
          return res.status(409).json({
            success: false,
            error: { code: 'DUPLICATE_RESOURCE', message: 'SKU already exists' }
          });
        }
      }

      // Calculate margin if pricing is updated
      if (value.pricing && value.pricing.costPrice && value.pricing.sellingPrice) {
        value.pricing.margin = ((value.pricing.sellingPrice - value.pricing.costPrice) / value.pricing.costPrice * 100).toFixed(2);
      }

      const updateData = { ...value, updatedBy: userID };

      // Regenerate QR code if name, sku, or price changed
      if (value.name || value.sku || (value.pricing && value.pricing.sellingPrice)) {
        const currentProduct = await Product.findOne({ productID: productId, orgID });
        const qrData = {
          productID,
          name: value.name || currentProduct.name,
          sku: value.sku || currentProduct.sku,
          price: (value.pricing && value.pricing.sellingPrice) || currentProduct.pricing.sellingPrice,
          orgID
        };

        updateData.qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      }

      const product = await Product.findOneAndUpdate(
        { productID: productId, orgID, isActive: true },
        updateData,
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' }
        });
      }

      res.json({
        success: true,
        data: { product },
        message: 'Product updated successfully'
      });
    } catch (error) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update product' }
      });
    }
  }

  // Delete product (soft delete)
  async deleteProduct(req, res) {
    try {
      const { productId } = req.params;
      const { orgID, userID } = req.user;

      const product = await Product.findOneAndUpdate(
        { productID: productId, orgID, isActive: true },
        { isActive: false, updatedBy: userID },
        { new: true }
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' }
        });
      }

      res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Delete product error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete product' }
      });
    }
  }

  // Generate QR code for specific product
  async generateQR(req, res) {
    try {
      const { productId } = req.params;
      const { orgID } = req.user;
      const { size = 200, format = 'png' } = req.query;

      const product = await Product.findOne({ 
        productID: productId, 
        orgID, 
        isActive: true 
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'Product not found' }
        });
      }

      const qrData = {
        productID: product.productID,
        name: product.name,
        sku: product.sku,
        price: product.pricing.sellingPrice,
        orgID
      };

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: parseInt(size),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      res.json({
        success: true,
        data: {
          qrCode: qrCodeDataURL,
          productInfo: {
            productID: product.productID,
            name: product.name,
            sku: product.sku,
            price: product.pricing.sellingPrice
          }
        }
      });
    } catch (error) {
      console.error('Generate QR error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to generate QR code' }
      });
    }
  }

  // Bulk QR code export
  async bulkQRExport(req, res) {
    try {
      const { orgID } = req.user;
      const { productIds, size = 200, includeLabels = true } = req.body;

      const schema = Joi.object({
        productIds: Joi.array().items(Joi.string()).min(1).max(100).required(),
        size: Joi.number().min(50).max(500).default(200),
        includeLabels: Joi.boolean().default(true)
      });

      const { error, value } = schema.validate({ productIds, size, includeLabels });
      if (error) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: error.details[0].message }
        });
      }

      const products = await Product.find({ 
        productID: { $in: value.productIds }, 
        orgID, 
        isActive: true 
      });

      if (products.length === 0) {
        return res.status(404).json({
          success: false,
          error: { code: 'RESOURCE_NOT_FOUND', message: 'No products found' }
        });
      }

      const qrCodes = await Promise.all(
        products.map(async (product) => {
          const qrData = {
            productID: product.productID,
            name: product.name,
            sku: product.sku,
            price: product.pricing.sellingPrice,
            orgID
          };

          const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: parseInt(value.size),
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          return {
            productID: product.productID,
            name: product.name,
            sku: product.sku,
            price: product.pricing.sellingPrice,
            qrCode: qrCodeDataURL
          };
        })
      );

      res.json({
        success: true,
        data: {
          qrCodes,
          count: qrCodes.length,
          exportOptions: {
            size: value.size,
            includeLabels: value.includeLabels
          }
        },
        message: `Generated ${qrCodes.length} QR codes successfully`
      });
    } catch (error) {
      console.error('Bulk QR export error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to export QR codes' }
      });
    }
  }

  // Get product categories
  async getCategories(req, res) {
    try {
      const { orgID } = req.user;

      const categories = await Product.distinct('category', { 
        orgID, 
        isActive: true 
      });

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get categories' }
      });
    }
  }
}

module.exports = new ProductController();