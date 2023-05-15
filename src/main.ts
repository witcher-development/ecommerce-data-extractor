import {fakeFetchData, Filters, Response} from "./client";
import * as db from "./db";
import {logAverageIterationPrice, logEngOfExtractor, logExtractionProgress, logIterationData, logTick} from "./utils";
import { MAX_PRICE } from "./consts";

// Thinking out loud.
// Would be cool to run this extractor from both sides of price range simultaneously:
// starting with { min: 0, max: 100 } on one side and { min 99900, max: 100000 } on other side
// On this stage it feels like it needs a more flexible data structure and more iterations metadata/iterations history
type Iteration = {
  filters: Filters,
  status: 'pending' | 'processing' | 'done',
  iterator: number,
  range: number,

  // those for debug purposes
  prevTotal?: number,
  nestedLevel: number, // level of nesting to narrow down a price range until it's small enough
  order: number // order of iteration on same level of nesting
}
class Queue {
  private iterations: Iteration[] = []

  add (iteration: Omit<Iteration, 'status'>) {
    this.iterations.push({ ...iteration, status: 'pending' });
    // Save iteration to Mongo to potentially restore process from middle if current one dies
    // + maybe to offload iterations data from local memory when not needed anymore
    db.fakeSaveIteration(iteration)
  }

  getNext () {
    const nextIteration = this.iterations.filter(({ status }) => status === 'pending')[0];
    if (!nextIteration) return null;
    nextIteration.status = 'processing'
    return nextIteration
  }

  getAveragePrice () {
    const length = this.iterations.length;
    const min = this.iterations.map(({ filters }) => filters.price.min).reduce((accum, min) => {
      return accum + min
    }, 0) / length
    const max = this.iterations.map(({ filters }) => filters.price.max).reduce((accum, max) => {
      return accum + max
    }, 0) / length
    return { min, max }
  }
}
const queue = new Queue()

// TODO: Better debug building a tree of iterations based on data in Queue
// TODO: Rate-limiter for number of simultaneous iterations
// TODO: Set iteration to 'done' status

const addIteration = (previousIteration: Iteration, { total, count }: Omit<Response, 'products'>, type: 'subsequent' | 'nested') => {
  const { filters, iterator, range, nestedLevel, order, prevTotal } = previousIteration;
  const { min, max } = filters.price;
  switch (type) {
    case "subsequent": {
      return queue.add({
        filters: {
          price: { min: max, max: max + iterator }
        },
        iterator,
        range,
        nestedLevel,
        order: order + 1
      })
    }
    case "nested": {
      const nestedIterator = (max || MAX_PRICE) / total;
      return queue.add({
        filters: {
          price: { min, max: min + nestedIterator }
        },
        iterator: nestedIterator,
        range: max || MAX_PRICE,
        nestedLevel: nestedLevel + 1,
        order: 0,
        prevTotal: total
      })
    }
    default: {
      throw new Error('Should not happen')
    }
  }
}

const runIteration = async (iteration: Iteration, initial = false) => {
  const { filters, iterator, range, nestedLevel, order, prevTotal } = iteration;
  const { total, count, products } = await fakeFetchData(filters, initial, prevTotal || null);
  logIterationData(order, nestedLevel, filters.price, total, count, range, iterator)

  if (initial) {
    db.fakeSaveProductsTotal(total)
  }

  const prevMax = filters.price.max
  // If we only save data when we found the optimal price range - we discard previous iterations. It is not optimal.
  // What I can see now - based on knowledge of: 1) Are products in response sorted by price; 2) Can we dedup products post-factum
  // we could perform some optimisations.
  if (count === total) {
    if (prevMax < range) {
      addIteration(iteration, { total, count }, 'subsequent')
    }
    return db.fakeSaveProducts(products)
  }

  addIteration(iteration, { total, count }, 'nested')

  if (prevMax !== range && !initial) {
    addIteration(iteration, { total, count }, 'subsequent')
  }
}


// Initial one
runIteration({ status: 'pending', filters: { price: { min: 0, max: 0 }}, iterator: 0, range: MAX_PRICE, nestedLevel: -1, order: -1 }, true)

let allProductsExtracted = false;
const isExtractionDoneChecker = async () => {
  while (!allProductsExtracted) {
    await new Promise((res) => setTimeout(res, 1000));

    const { productsInAPI, productsInDB } = await db.fakeGetProductsTotal();
    logExtractionProgress(productsInDB, productsInAPI)

    const { min, max } = queue.getAveragePrice()
    logAverageIterationPrice(min, max)

    if (productsInDB >= productsInAPI) {
      allProductsExtracted = true
    }
  }
  logEngOfExtractor()
}
isExtractionDoneChecker();

const ticker = async () => {
  while (!allProductsExtracted) {
    logTick()
    await new Promise((res) => setTimeout(res, 100));
    const nextIteration = queue.getNext();
    if (nextIteration) {
      runIteration(nextIteration)
    }
  }
  logEngOfExtractor()
}
ticker()
