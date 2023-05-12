let savedProductsTotal = 0;

export const fakeGetProductsTotalFromMongo = async () => savedProductsTotal;

export const fakeSaveProductsToMongo = (products: any[]) => {
	savedProductsTotal += products.length
  // console.log('DB: save products, ', products)
}

export const fakeSaveIterationToMongo = (iteration: any) => {
  // console.log('DB: save iteration, ', iteration)
}
