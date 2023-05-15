let productsInDB = 0;
// let DB: any[] = []
let productsInAPI = 0;

export const fakeGetProductsTotal = async () => ({ productsInDB, productsInAPI });

export const fakeSaveProducts = (products: any[]) => {
	productsInDB += products.length
	// DB.push(...products)
}

export const fakeSaveIteration = (iteration: any) => {}

export const fakeSaveProductsTotal = (total: number) => {
	productsInAPI = total
}

// thing to see average price in "DB"
// const ticker = async () => {
// 	await new Promise((res) => setTimeout(res, 1000));
// 	while (productsInDB < productsInAPI) {
// 		await new Promise((res) => setTimeout(res, 1000));
// 		const length = DB.length;
// 		const averagePrice = DB.reduce((accum, { price }) => {
// 			return accum + price
// 		}, 0) / length
// 		console.log(averagePrice)
// 	}
// }
// ticker()

