/**
 * Setup Stripe subscription products and prices
 *
 * Run with: node scripts/setup-stripe-products.mjs
 *
 * Make sure STRIPE_SECRET_KEY is set in your .env file first
 */

import Stripe from 'stripe'
import { config } from 'dotenv'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load environment variables
config({ path: join(__dirname, '..', '.env') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const plans = {
  PLUS: {
    name: 'GadgetSwap Plus',
    description: '0% platform fee, 15 active listings, 3 device alerts',
    monthlyPrice: 499, // $4.99 in cents
    yearlyPrice: 4000, // $40.00 in cents
    features: [
      '15 active listings',
      '0% platform fee',
      '3 device alerts',
      'Priority support',
      '2 featured listings/month',
    ],
  },
  PRO: {
    name: 'GadgetSwap Pro',
    description: '0% platform fee, unlimited listings, unlimited alerts',
    monthlyPrice: 1199, // $11.99 in cents
    yearlyPrice: 10000, // $100.00 in cents
    features: [
      'Unlimited listings',
      '0% platform fee',
      'Unlimited device alerts',
      '24/7 priority support',
      '10 featured listings/month',
      'Advanced analytics',
      'Bulk listing tools',
      'API access',
    ],
  },
}

async function createProducts() {
  console.log('Setting up Stripe products and prices...\n')

  const envUpdates = []

  for (const [tier, config] of Object.entries(plans)) {
    console.log(`Creating ${config.name}...`)

    // Create the product
    const product = await stripe.products.create({
      name: config.name,
      description: config.description,
      metadata: {
        tier,
        features: JSON.stringify(config.features),
      },
    })

    console.log(`  Product created: ${product.id}`)

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.monthlyPrice,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        tier,
        period: 'monthly',
      },
    })

    console.log(`  Monthly price: ${monthlyPrice.id} ($${config.monthlyPrice / 100}/month)`)
    envUpdates.push(`STRIPE_${tier}_MONTHLY_PRICE_ID="${monthlyPrice.id}"`)

    // Create yearly price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: config.yearlyPrice,
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        tier,
        period: 'yearly',
      },
    })

    console.log(`  Yearly price: ${yearlyPrice.id} ($${config.yearlyPrice / 100}/year)`)
    envUpdates.push(`STRIPE_${tier}_YEARLY_PRICE_ID="${yearlyPrice.id}"`)

    console.log('')
  }

  // Output env variables to add
  console.log('='.repeat(60))
  console.log('Add these to your .env file:')
  console.log('='.repeat(60))
  console.log('')
  envUpdates.forEach(line => console.log(line))
  console.log('')

  // Optionally update .env file
  const envPath = join(__dirname, '..', '.env')
  if (existsSync(envPath)) {
    let envContent = readFileSync(envPath, 'utf-8')

    // Update or add each price ID
    for (const update of envUpdates) {
      const [key] = update.split('=')
      const regex = new RegExp(`^${key}=.*$`, 'm')

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, update)
      } else {
        envContent += `\n${update}`
      }
    }

    writeFileSync(envPath, envContent)
    console.log('.env file updated automatically!')
  } else {
    console.log('No .env file found. Create one and add the above variables.')
  }

  console.log('\nDone! Restart your dev server for changes to take effect.')
}

// Check for required env var
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY not found in .env')
  console.error('Add your Stripe secret key to .env first.')
  process.exit(1)
}

if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
  console.error('Error: STRIPE_SECRET_KEY should start with sk_test_ or sk_live_')
  process.exit(1)
}

createProducts().catch((err) => {
  console.error('Error creating products:', err.message)
  process.exit(1)
})
