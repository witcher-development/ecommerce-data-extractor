import { round } from "./utils";

const randomInRange = (min: number, max: number) => round(Math.floor(Math.random() * ((max-min)+1) + min));

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
export const fakeFetchData = ({ price }: Filters = {}, initial = false, maxTotal: number | null): Promise<Response> => {
  // console.log('request', price)
  const total = initial ? 1000 : randomInRange(0, maxTotal || 500)
  const count = total < 50 ? total : 50;
  const data: Response = {
    total,
    count,
    products: Array(count).fill({})
  }
  // console.log(data.total)

  return new Promise((res) => {
    setTimeout(() => res(data), randomInRange(100, 400))
  })
}
