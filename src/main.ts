import { fakeFetchData, Filters } from "./client";
import { fakeSaveProductsToMongo, fakeSaveIterationToMongo } from "./db";
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
  // Potentially to be extended with other data to perform optimal iterations
  // (ex. 'previousCount', 'previousTotal', 'priceIterator')
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
// Potentially to be an auto-adjustable value. Probably, should not be global, but local for iteration\iterations group
let priceIterator = 0


const runIteration = async (data: Iteration) => {
  console.log('filters ', data.filters.price)
  const { total, count, products } = await fakeFetchData(data.filters);
  console.log('response ', total, count)
  // If we only save data when we found the optimal price range - we discard previous iterations. It is not optimal.
  // What I can see now - based on knowledge of: 1) Are products in response sorted by price; 2) Can we dedup products post-factotum
  // we could perform some optimisations.
  if (count === total) {
    return fakeSaveProductsToMongo(products)
  }

  const prevMax = data.filters.price?.max || 0
  const filters: Filters = {
    price: { min: prevMax, max: 0 }
  }
  const nextPriceIterator = round((MAX_PRICE / total));
  filters.price!.max = round(prevMax + nextPriceIterator);
  priceIterator = nextPriceIterator;

  queue.add({ filters, status: 'pending' })
}


// Initial one
runIteration({ status: 'pending', filters: {} })

const ticker = async () => {
  // TODO: something needs to monitor DB and change this when all products extracted
  const allProductsExtracted = false;

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
