import { Customer } from '../models/customer.model.js';
import { User } from '../models/user.model.js';
import redisService, { subscribeToChannel, processJobs } from '../config/redis.js';

class CustomerConsumer {
  constructor() {
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) {
      console.log('🟡 Customer consumer is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting Customer Consumer Service...');

    try {
      // Subscribe to customer events channel
      await subscribeToChannel('customer.events', this.handleCustomerEvent.bind(this));
      
      // Process customer jobs queue
      processJobs('customer.jobs', this.processCustomerJob.bind(this));
      
      console.log('✅ Customer Consumer Service started successfully');
    } catch (error) {
      console.error('❌ Failed to start Customer Consumer:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Handle real-time customer events
  async handleCustomerEvent(event) {
    console.log(`📨 Received customer event: ${event.type}`);
    
    try {
      switch (event.type) {
        case 'customer.validation.success':
          await this.handleValidationSuccess(event.data);
          break;
        case 'customer.validation.failed':
          await this.handleValidationFailed(event.data);
          break;
        case 'customer.activity.updated':
          await this.handleActivityUpdate(event.data);
          break;
        default:
          console.log(`🤷 Unknown customer event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`❌ Error handling customer event ${event.type}:`, error);
    }
  }

  // Process customer jobs from queue
  async processCustomerJob(job) {
    console.log(`⚡ Processing customer job: ${job.type}`);
    
    try {
      switch (job.type) {
        case 'CREATE_CUSTOMER':
          await this.createCustomer(job.data);
          break;
        case 'UPDATE_CUSTOMER':
          await this.updateCustomer(job.data);
          break;
        case 'DELETE_CUSTOMER':
          await this.deleteCustomer(job.data);
          break;
        case 'BULK_IMPORT_CUSTOMERS':
          await this.bulkImportCustomers(job.data);
          break;
        case 'UPDATE_CUSTOMER_STATS':
          await this.updateCustomerStats(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }
    } catch (error) {
      console.error(`❌ Customer job ${job.type} failed:`, error);
      throw error;
    }
  }

  // Create customer in database
  async createCustomer(data) {
    try {
      const { customerData, userId, userEmail } = data;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user || user.email !== userEmail) {
        throw new Error('User verification failed');
      }

      // Check for duplicate email
      const existingCustomer = await Customer.findOne({ 
        email: customerData.email, 
        created_by: userId 
      });
      
      if (existingCustomer) {
        throw new Error('Customer with this email already exists');
      }

      // Create customer
      const customer = new Customer({
        ...customerData,
        created_by: userId,
        created_by_email: userEmail,
      });

      await customer.save();

      // Publish success event
      await redisService.publish('customer.events', {
        type: 'customer.created',
        data: {
          customerId: customer._id,
          userId: userId,
          customerData: customer
        }
      });

      console.log(`✅ Customer created: ${customer.email}`);
      return customer;
    } catch (error) {
      // Publish failure event
      await redisService.publish('customer.events', {
        type: 'customer.creation.failed',
        data: {
          error: error.message,
          customerData: data.customerData
        }
      });
      throw error;
    }
  }

  // Update customer in database
  async updateCustomer(data) {
    try {
      const { customerId, updateData, userId, userEmail } = data;

      // Verify user
      const user = await User.findById(userId);
      if (!user || user.email !== userEmail) {
        throw new Error('User verification failed');
      }

      // Prevent email updates
      if (updateData.email) {
        delete updateData.email;
      }

      const customer = await Customer.findOneAndUpdate(
        {
          _id: customerId,
          created_by: userId,
          created_by_email: userEmail,
        },
        updateData,
        {
          new: true,
          runValidators: true,
        }
      );

      if (!customer) {
        throw new Error('Customer not found or access denied');
      }

      // Publish success event
      await redisService.publish('customer.events', {
        type: 'customer.updated',
        data: {
          customerId: customer._id,
          userId: userId,
          customerData: customer
        }
      });

      console.log(`✅ Customer updated: ${customer.email}`);
      return customer;
    } catch (error) {
      await redisService.publish('customer.events', {
        type: 'customer.update.failed',
        data: {
          error: error.message,
          customerId: data.customerId
        }
      });
      throw error;
    }
  }

  // Soft delete customer
  async deleteCustomer(data) {
    try {
      const { customerId, userId, userEmail } = data;

      // Verify user
      const user = await User.findById(userId);
      if (!user || user.email !== userEmail) {
        throw new Error('User verification failed');
      }

      const customer = await Customer.findOneAndUpdate(
        {
          _id: customerId,
          created_by: userId,
          created_by_email: userEmail,
        },
        { is_active: false },
        { new: true }
      );

      if (!customer) {
        throw new Error('Customer not found or access denied');
      }

      // Publish success event
      await redisService.publish('customer.events', {
        type: 'customer.deleted',
        data: {
          customerId: customer._id,
          userId: userId
        }
      });

      console.log(`✅ Customer deactivated: ${customer.email}`);
      return customer;
    } catch (error) {
      await redisService.publish('customer.events', {
        type: 'customer.deletion.failed',
        data: {
          error: error.message,
          customerId: data.customerId
        }
      });
      throw error;
    }
  }

  // Bulk import customers from CSV
  async bulkImportCustomers(data) {
    try {
      const { customers, userId, userEmail } = data;
      const results = {
        imported: 0,
        failed: 0,
        errors: []
      };

      // Verify user
      const user = await User.findById(userId);
      if (!user || user.email !== userEmail) {
        throw new Error('User verification failed');
      }

      // Process in batches of 100
      const batchSize = 100;
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        
        try {
          // Add user info to each customer
          const customersWithUser = batch.map(customer => ({
            ...customer,
            created_by: userId,
            created_by_email: userEmail,
          }));

          await Customer.insertMany(customersWithUser, { ordered: false });
          results.imported += batch.length;
          
          console.log(`✅ Imported batch ${Math.floor(i/batchSize) + 1}: ${batch.length} customers`);
        } catch (error) {
          results.failed += batch.length;
          results.errors.push({
            batch: Math.floor(i/batchSize) + 1,
            error: error.message
          });
          console.error(`❌ Failed to import batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        }
      }

      // Publish completion event
      await redisService.publish('customer.events', {
        type: 'customer.bulk.import.completed',
        data: {
          userId: userId,
          results: results
        }
      });

      console.log(`✅ Bulk import completed: ${results.imported} imported, ${results.failed} failed`);
      return results;
    } catch (error) {
      await redisService.publish('customer.events', {
        type: 'customer.bulk.import.failed',
        data: {
          error: error.message,
          userId: data.userId
        }
      });
      throw error;
    }
  }

  // Update customer statistics
  async updateCustomerStats(data) {
    try {
      const { customerId, stats } = data;

      const customer = await Customer.findByIdAndUpdate(
        customerId,
        { $set: { stats: stats } },
        { new: true }
      );

      if (!customer) {
        throw new Error('Customer not found');
      }

      console.log(`✅ Updated stats for customer: ${customer.email}`);
      return customer;
    } catch (error) {
      console.error(`❌ Failed to update customer stats:`, error);
      throw error;
    }
  }

  // Handle validation success
  async handleValidationSuccess(data) {
    console.log(`✅ Customer validation successful: ${data.email}`);
    // Could trigger additional processing like welcome emails, etc.
  }

  // Handle validation failure
  async handleValidationFailed(data) {
    console.log(`❌ Customer validation failed: ${data.error}`);
    // Could log to analytics, send notifications, etc.
  }

  // Handle activity update
  async handleActivityUpdate(data) {
    console.log(`📊 Customer activity updated: ${data.customerId}`);
    // Could trigger recommendations, analytics updates, etc.
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 Customer Consumer Service stopped');
  }
}

export default CustomerConsumer;
