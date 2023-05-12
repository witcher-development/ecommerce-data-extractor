
const randomInRange = (max = 400, min = 100) => Math.floor(Math.random() * ((max-min)+1) + min);

export type Filters = {
  price?: {
    min: number,
    max: number
  }
}
export type Response = {
  total: number,
  count: number,
  products: {}[]
}
export const fakeFetchData = ({ price }: Filters = {}): Promise<Response> => {
  // console.log('request', price)
  const data: Response = {
    total: randomInRange(1, 5000),
    count: 5,
    products: Array(5).fill({})
  }
  // console.log(data.total)

  return new Promise((res) => {
    setTimeout(() => res(data), randomInRange())
  })
}
