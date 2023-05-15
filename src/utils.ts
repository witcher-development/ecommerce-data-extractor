import { Filters } from "./client";
import { logLevel } from "./consts";

export const round = (n: number) => Number(n.toFixed(2))

export const randomInRange = (min: number, max: number) => round(Math.floor(Math.random() * ((max-min)+1) + min));

export const logExtractionProgress = (productsInDB: number, productsInAPI: number) => {
  if (!logLevel.generalStatus) return;
  console.log('---------------------------')
  console.group()
  console.log(`Progress: ${productsInDB} / ${productsInAPI}`);
  console.groupEnd()
  console.log('---------------------------')
}

export const logAverageIterationPrice = (min: number, max: number) => {
  if (!logLevel.generalStatus) return;
  console.log(`Average min: ${min} | max: ${max}`)
}

export const logEngOfExtractor = () => {
  if (!logLevel.generalStatus) return;
  console.log('loop ended -------------------------------------------------------------------------')
}


export const logIterationData = (order: number, nestedLevel: number, price: Filters['price'], total: number, count: number, range: number, iterator: number) => {
  if (!logLevel.debug) return;
  console.group()
  if (order === -1 && nestedLevel === -1) {
    console.log('INITIAL')
  } else {
    console.log(`x: ${order} | y: ${nestedLevel}`)
  }
  console.log(`range: ${range}`)
  console.log(`iterator: ${iterator}`)
  console.log('filters ', price)
  console.log('response ', total, count)
  console.log('---------------------------')
  console.groupEnd()
}

export const logTick = () => {
  if (!logLevel.debug) return;
  console.log('tick')
}
