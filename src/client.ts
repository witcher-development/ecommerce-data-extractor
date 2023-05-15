import { randomInRange } from "./utils";

const MAX_COUNT_PER_RESPONSE = 10;
const FAKE_TOTAL_PRODUCTS_IN_API = 1000;
const FAKE_MAX_TOTAL_PER_PRICE_RANGE = 50;

export type Filters = {
  price: {
    min: number,
    max: number
  }
}
export type Response = {
  total: number,
  count: number,
  products: {}[]
}
export const fakeFetchData = ({ price }: Filters, initial = false, maxTotal: number | null): Promise<Response> => {
  const total = initial ? FAKE_TOTAL_PRODUCTS_IN_API : randomInRange(0, maxTotal || FAKE_MAX_TOTAL_PER_PRICE_RANGE)
  const count = total < MAX_COUNT_PER_RESPONSE ? total : MAX_COUNT_PER_RESPONSE;
  const data: Response = {
    total,
    count,
    products: Array(count).fill({})
  }

  return new Promise((res) => {
    // Just arbitrary server response time
    setTimeout(() => res(data), randomInRange(10, 40))
  })
}
