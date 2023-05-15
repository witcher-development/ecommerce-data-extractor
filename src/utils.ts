import { Filters } from "./client";

export const round = (n: number) => Number(n.toFixed(2))

export const randomInRange = (min: number, max: number) => round(Math.floor(Math.random() * ((max-min)+1) + min));

export const logExtractionProgress = (productsInDB: number, productsInAPI: number) => {
  console.log('---------------------------')
  console.group()
  console.log(`Progress: , ${productsInDB} / ${productsInAPI}`);
  console.groupEnd()
  console.log('---------------------------')
}

export const logIterationData = (order: number, nestedLevel: number, price: Filters['price'], total: number, count: number) => {
  console.group()
  console.log(`x: ${order} | y: ${nestedLevel}`)
  console.log('filters ', price)
  console.log('response ', total, count)
  console.log('---------------------------')
  console.groupEnd()
}
