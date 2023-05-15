let productsInDB = 0;
let productsInAPI = 0;

export const fakeGetProductsTotal = async () => ({ productsInDB, productsInAPI });

export const fakeSaveProducts = (products: any[]) => {
	productsInDB += products.length
}

export const fakeSaveIteration = (iteration: any) => {}

export const fakeSaveProductsTotal = (total: number) => {
	productsInAPI = total
}
