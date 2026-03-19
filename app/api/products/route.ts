import { searchProducts } from '@/lib/providers/mock'
import { NextResponse } from 'next/server'

export async function GET() {
  const products = await searchProducts({})
  return NextResponse.json(products)
}
