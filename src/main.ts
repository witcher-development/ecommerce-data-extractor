import { fakeFetchData, Filters } from "./client";
import { fakeSaveProductsToMongo, fakeSaveIterationToMongo, fakeGetProductsTotalFromMongo } from "./db";
import { round } from "./utils";

const MAX_PRICE = 2000;
// const MAX_PRICE = 100000;

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
  nestedLevels: number, // level of nesting to narrow down a price range until it's small enough
  order: number // order of iteration on same level of nesting
}
class Queue {
  private iterations: Iteration[] = []

  add (iteration: Iteration) {
    this.iterations.push(iteration);
    // Save iteration to Mongo to potentially restore process from middle if current one dies
    // + maybe to offload iterations data from local memory when not needed anymore
    fakeSaveIterationToMongo(iteration)
  }

  getNext () {
    const nextIteration = this.iterations.filter(({ status }) => status === 'pending')[0];
    if (!nextIteration) return null;
    nextIteration.status = 'processing'
    return nextIteration
  }
}
const queue = new Queue()
let productsTotal = 0;


// TODO: all products total - Done
// TODO: spawn new ranged or narrow down - Done
// TODO: Better debug with logging out of Queue in a table using 'nestedLevel' and 'order'
// TODO: Rate-limiter for number of simultaneous iterations
// TODO: Set iteration to 'done' status

const runIteration = async (data: Iteration, initial = false) => {
  const { total, count, products } = await fakeFetchData(data.filters, initial, data.prevTotal || null);
  console.group()
  console.log(`x: ${data.order} | y: ${data.nestedLevels}`)
  console.log('filters ', data.filters.price)
  console.log('response ', total, count)
  console.groupEnd()

  if (initial) {
    productsTotal = total;
  }

  // TODO: refactor this nightmare
  const prevMin = data.filters.price?.min || 0
  const prevMax = data.filters.price?.max || 0
  // If we only save data when we found the optimal price range - we discard previous iterations. It is not optimal.
  // What I can see now - based on knowledge of: 1) Are products in response sorted by price; 2) Can we dedup products post-factotum
  // we could perform some optimisations.
  if (count === total) {
    if (prevMax !== data.range) {
      const newFilters: Filters = {
        price: {
          min: prevMax,
          max: prevMax + data.iterator
        }
      }
      queue.add({ filters: newFilters, status: 'pending', iterator: data.iterator, range: data.range, nestedLevels: data.nestedLevels, order: data.order + 1 })
    }
    return fakeSaveProductsToMongo(products)
  }

  const filters: Filters = {
    price: { min: prevMin, max: 0 }
  }
  const nextPriceIterator = round((total / count));
  filters.price!.max = prevMin + nextPriceIterator;

  queue.add({ filters, status: 'pending', iterator: nextPriceIterator, range: prevMax, prevTotal: total, nestedLevels: data.nestedLevels + 1, order: 0 })
  if (prevMax !== data.range && !initial) {
    const newFilters: Filters = {
      price: {
        min: prevMax,
        max: prevMax + data.iterator
      }
    }
    queue.add({ filters: newFilters, status: 'pending', iterator: data.iterator, range: data.range, nestedLevels: data.nestedLevels, order: data.order + 1 })
  }
}


// Initial one
runIteration({ status: 'pending', filters: {}, iterator: 0, range: MAX_PRICE, nestedLevels: -1, order: -1 }, true)

// TODO: something needs to monitor DB and change this when all products extracted
let allProductsExtracted = false;
const isExtractionDoneChecker = async () => {
  while (!allProductsExtracted) {
    await new Promise((res) => setTimeout(res, 1000));
    const productsInDB = await fakeGetProductsTotalFromMongo();
    console.group()
    console.log('---------------------------')
    console.log('Checker')
    console.log('all from API ', productsTotal);
    console.log('all from DB ', productsInDB);
    console.log('---------------------------')
    console.groupEnd()

    if (productsInDB >= productsTotal) {
      allProductsExtracted = true
    }
  }
}
isExtractionDoneChecker();

const ticker = async () => {

  while (!allProductsExtracted) {
    console.log('tick')
    // TODO: fine-tune the delay
    await new Promise((res) => setTimeout(res, 100));
    const nextIteration = queue.getNext();
    if (nextIteration) {
      runIteration(nextIteration)
    }
  }
}
ticker()
