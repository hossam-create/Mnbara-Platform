/**
 * Plugin SDK Usage Examples
 * Demonstrates how to build plugins using the Plugin SDK
 */

import { PluginSDK, PluginBuilder, PluginDevUtils } from '../src';

// Example 1: Basic Plugin using PluginSDK directly
async function basicPluginExample() {
  console.log('🚀 Basic Plugin Example');
  console.log('======================');

  // Create a basic payment plugin
  const paymentPlugin = new PluginSDK({
    pluginId: 'my-payment-plugin',
    pluginName: 'My Payment Gateway',
    version: '1.0.0',
    permissions: ['payment.process', 'payment.refund'],
    debug: true
  });

  await paymentPlugin.initialize();

  // Register a payment processing hook
  paymentPlugin.registerHook('payment:process', async (data, context) => {
    context.logger.info('Processing payment', data);
    
    // Simulate payment processing
    const result = {
      success: true,
      transactionId: `txn_${Date.now()}`,
      amount: data.amount,
      currency: data.currency,
      status: 'completed'
    };

    context.logger.info('Payment processed successfully', result);
    return result;
  });

  // Register a refund hook
  paymentPlugin.registerHook('payment:refund', async (data, context) => {
    context.logger.info('Processing refund', data);
    
    return {
      success: true,
      refundId: `ref_${Date.now()}`,
      transactionId: data.transactionId,
      amount: data.amount,
      status: 'refunded'
    };
  });

  // Test the hooks
  console.log('\n📊 Testing Payment Hook:');
  const paymentResult = await paymentPlugin.executeHook('payment:process', {
    amount: 99.99,
    currency: 'USD',
    customerId: 'cus_12345',
    description: 'Test payment'
  });
  console.log('Payment result:', paymentResult);

  console.log('\n💰 Testing Refund Hook:');
  const refundResult = await paymentPlugin.executeHook('payment:refund', {
    transactionId: paymentResult.transactionId,
    amount: 99.99,
    reason: 'Customer request'
  });
  console.log('Refund result:', refundResult);

  // Generate manifest
  const manifest = paymentPlugin.createManifest({
    description: 'A custom payment gateway plugin',
    author: 'Your Name',
    license: 'MIT',
    homepage: 'https://your-plugin.com',
    repository: 'https://github.com/your-username/your-plugin'
  });

  console.log('\n📋 Plugin Manifest:');
  console.log(JSON.stringify(manifest, null, 2));

  return paymentPlugin;
}

// Example 2: Plugin using PluginBuilder (Fluent API)
async function fluentPluginExample() {
  console.log('\n🎨 Fluent Plugin Builder Example');
  console.log('=================================');

  // Create an analytics plugin using the fluent builder
  const analyticsPlugin = await new PluginBuilder({
    id: 'advanced-analytics',
    name: 'Advanced Analytics Plugin',
    version: '2.0.0',
    description: 'Advanced analytics and tracking plugin',
    author: 'Analytics Team',
    license: 'Apache-2.0'
  })
    .addPermissions([
      'analytics.read',
      'analytics.write',
      'user.tracking',
      'event.tracking',
      'system.info'
    ])
    .setCategory('analytics')
    .addTags(['analytics', 'tracking', 'metrics', 'advanced'])
    .setIcon('📊')
    .addScreenshots([
      'https://example.com/screenshot1.png',
      'https://example.com/screenshot2.png'
    ])
    .addDependency('@analytics/core', '^1.0.0')
    .addDependency('@analytics/utils', '^2.0.0')
    .setConfigSchema({
      trackingId: { type: 'string', required: true, description: 'Google Analytics tracking ID' },
      apiSecret: { type: 'string', required: true, description: 'API secret for authentication' },
      debug: { type: 'boolean', default: false, description: 'Enable debug mode' },
      sampleRate: { type: 'number', default: 100, min: 0, max: 100, description: 'Sample rate percentage' }
    })
    .addHook('analytics:track', async (data, context) => {
      context.logger.info('Tracking analytics event', data);
      
      // Simulate analytics tracking
      const eventData = {
        event: data.event,
        properties: data.properties,
        timestamp: new Date().toISOString(),
        userId: data.userId,
        sessionId: data.sessionId
      };

      // Store in plugin storage
      await context.storage.set(`event_${Date.now()}`, eventData);
      
      return {
        success: true,
        eventId: `evt_${Date.now()}`,
        tracked: true,
        data: eventData
      };
    }, {
      priority: 100,
      timeout: 3000,
      retries: 1
    })
    .addHook('analytics:report', async (data, context) => {
      context.logger.info('Generating analytics report', data);
      
      // Get events from storage
      const events = await context.storage.list('event_');
      const eventData = await Promise.all(
        events.slice(0, 10).map(key => context.storage.get(key))
      );

      return {
        success: true,
        reportId: `rpt_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        totalEvents: events.length,
        events: eventData,
        summary: {
          totalViews: eventData.length,
          uniqueUsers: new Set(eventData.map(e => e.userId)).size,
          averageSessionDuration: 180
        }
      };
    })
    .build();

  console.log('✅ Analytics plugin built successfully!');

  // Test the analytics plugin
  console.log('\n📈 Testing Analytics Tracking:');
  const trackResult = await analyticsPlugin.executeHook('analytics:track', {
    event: 'page_view',
    properties: {
      page: '/home',
      title: 'Home Page',
      referrer: 'https://google.com'
    },
    userId: 'user_12345',
    sessionId: 'session_67890'
  });
  console.log('Track result:', trackResult);

  console.log('\n📊 Testing Analytics Report:');
  const reportResult = await analyticsPlugin.executeHook('analytics:report', {
    type: 'summary',
    dateRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    }
  });
  console.log('Report result:', reportResult);

  return analyticsPlugin;
}

// Example 3: Using Plugin Templates
async function templatePluginExample() {
  console.log('\n🎯 Plugin Template Example');
  console.log('========================');

  // Get available templates
  const templates = PluginDevUtils.getPluginTemplates();
  console.log('Available plugin templates:');
  templates.forEach(template => {
    console.log(`- ${template.name} (${template.id})`);
    console.log(`  Category: ${template.category}`);
    console.log(`  Permissions: ${template.permissions.join(', ')}`);
    console.log(`  Hooks: ${template.hooks.join(', ')}`);
    console.log('');
  });

  // Create a plugin from a template
  console.log('Creating email marketing plugin from template...');
  const emailPlugin = await PluginBuilder.fromTemplate(
    templates.find(t => t.id === 'email-marketing')!,
    {
      id: 'my-email-campaigns',
      name: 'My Email Campaigns',
      version: '1.0.0',
      description: 'Custom email marketing solution',
      author: 'Marketing Team'
    }
  )
    .addHook('email:send', async (data, context) => {
      context.logger.info('Sending email campaign', data);
      
      // Simulate email sending
      return {
        success: true,
        emailId: `email_${Date.now()}`,
        recipients: data.recipients.length,
        status: 'sent',
        sentAt: new Date().toISOString()
      };
    })
    .addHook('campaign:create', async (data, context) => {
      context.logger.info('Creating email campaign', data);
      
      return {
        success: true,
        campaignId: `campaign_${Date.now()}`,
        name: data.name,
        status: 'draft',
        createdAt: new Date().toISOString()
      };
    })
    .build();

  console.log('✅ Email plugin created from template!');

  // Test email plugin
  console.log('\n📧 Testing Email Campaign Creation:');
  const campaignResult = await emailPlugin.executeHook('campaign:create', {
    name: 'Summer Sale 2024',
    subject: '🌞 Summer Sale - Up to 50% Off!',
    template: 'summer-sale',
    recipients: ['customer1@example.com', 'customer2@example.com']
  });
  console.log('Campaign result:', campaignResult);

  console.log('\n📮 Testing Email Sending:');
  const emailResult = await emailPlugin.executeHook('email:send', {
    campaignId: campaignResult.campaignId,
    recipients: ['customer1@example.com', 'customer2@example.com'],
    subject: '🌞 Summer Sale - Up to 50% Off!',
    content: {
      html: '<h1>Summer Sale!</h1><p>Get up to 50% off on selected items.</p>',
      text: 'Summer Sale! Get up to 50% off on selected items.'
    }
  });
  console.log('Email result:', emailResult);

  return emailPlugin;
}

// Example 4: Plugin Development Utilities
async function devUtilsExample() {
  console.log('\n🔧 Plugin Development Utilities');
  console.log('==============================');

  // Create a sample manifest
  const sampleManifest = {
    id: 'test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    permissions: ['test.permission'],
    hooks: ['test:hook']
  };

  // Validate manifest
  const validation = PluginDevUtils.validateManifest(sampleManifest);
  console.log('Manifest validation:', validation);

  // Generate plugin template code
  const templateCode = PluginDevUtils.generatePluginTemplate('payment', {
    id: 'my-stripe-gateway',
    name: 'My Stripe Gateway',
    version: '1.0.0',
    description: 'Stripe payment gateway integration',
    author: 'Your Name'
  });

  console.log('\n📄 Generated Plugin Template Code:');
  console.log(templateCode);
}

// Main function to run all examples
async function main() {
  try {
    console.log('🎯 Plugin SDK Examples');
    console.log('=====================');

    // Run all examples
    await basicPluginExample();
    await fluentPluginExample();
    await templatePluginExample();
    await devUtilsExample();

    console.log('\n✅ All Plugin SDK examples completed successfully!');
    console.log('\n🚀 Ready to build your own plugins!');

  } catch (error) {
    console.error('❌ Error running plugin SDK examples:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  main();
}

export { basicPluginExample, fluentPluginExample, templatePluginExample, devUtilsExample };