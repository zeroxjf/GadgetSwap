/**
 * Update Stripe subscription prices
 *
 * Run with: node scripts/update-stripe-prices.mjs
 *
 * Note: Stripe prices are immutable - this creates NEW prices and archives old ones
 */

import Stripe from 'stripe'
import { config } from 'dotenv'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '..', '.env') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

const newPrices = {
  PLUS: {
    monthly: 499,  // $4.99
    yearly: 4000,  // $40.00
  },
  PRO: {
    monthly: 1199, // $11.99
    yearly: 10000, // $100.00
  },
}

async function updatePrices() {
  console.log('Updating Stripe prices...\n')

  const envPath = join(__dirname, '..', '.env')
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : ''

  // Get existing price IDs from env
  const existingPriceIds = {
    PLUS_MONTHLY: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    PLUS_YEARLY: process.env.STRIPE_PLUS_YEARLY_PRICE_ID,
    PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  }

  const newPriceIds = {}

  for (const [tier, prices] of Object.entries(newPrices)) {
    console.log(`\n${tier}:`)

    // Get the product ID from an existing price
    const existingMonthlyId = existingPriceIds[`${tier}_MONTHLY`]
    let productId

    if (existingMonthlyId) {
      try {
        const existingPrice = await stripe.prices.retrieve(existingMonthlyId)
        productId = existingPrice.product
        console.log(`  Found existing product: ${productId}`)
      } catch (e) {
        console.log(`  Existing price not found, will create new product`)
      }
    }

    // Create product if needed
    if (!productId) {
      const product = await stripe.products.create({
        name: `GadgetSwap ${tier.charAt(0) + tier.slice(1).toLowerCase()}`,
        description: tier === 'PLUS'
          ? '0% platform fee, 15 active listings, 3 device alerts'
          : '0% platform fee, unlimited listings, unlimited alerts',
      })
      productId = product.id
      console.log(`  Created new product: ${productId}`)
    }

    // Create new monthly price
    const monthlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: prices.monthly,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { tier, period: 'monthly' },
    })
    console.log(`  New monthly price: ${monthlyPrice.id} ($${prices.monthly / 100}/mo)`)
    newPriceIds[`STRIPE_${tier}_MONTHLY_PRICE_ID`] = monthlyPrice.id

    // Create new yearly price
    const yearlyPrice = await stripe.prices.create({
      product: productId,
      unit_amount: prices.yearly,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { tier, period: 'yearly' },
    })
    console.log(`  New yearly price: ${yearlyPrice.id} ($${prices.yearly / 100}/yr)`)
    newPriceIds[`STRIPE_${tier}_YEARLY_PRICE_ID`] = yearlyPrice.id

    // Archive old prices
    if (existingPriceIds[`${tier}_MONTHLY`]) {
      try {
        await stripe.prices.update(existingPriceIds[`${tier}_MONTHLY`], { active: false })
        console.log(`  Archived old monthly price`)
      } catch (e) {
        console.log(`  Could not archive old monthly price: ${e.message}`)
      }
    }
    if (existingPriceIds[`${tier}_YEARLY`]) {
      try {
        await stripe.prices.update(existingPriceIds[`${tier}_YEARLY`], { active: false })
        console.log(`  Archived old yearly price`)
      } catch (e) {
        console.log(`  Could not archive old yearly price: ${e.message}`)
      }
    }
  }

  // Update .env file
  console.log('\n' + '='.repeat(50))
  console.log('New price IDs:')
  console.log('='.repeat(50))

  for (const [key, value] of Object.entries(newPriceIds)) {
    console.log(`${key}="${value}"`)

    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}="${value}"`)
    } else {
      envContent += `\n${key}="${value}"`
    }
  }

  writeFileSync(envPath, envContent)
  console.log('\n.env file updated!')
  console.log('\nDONE! Remember to update these in Vercel Dashboard too.')
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY not found in .env')
  process.exit(1)
}

updatePrices().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
