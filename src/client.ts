
const randomDelay = (max = 400, min = 100) => Math.floor(Math.random() * ((max-min)+1) + min);

export const fetchData = () => {
  const data = [1, 5]

  return new Promise((res) => {
    setTimeout(() => res(data), randomDelay())
  })
}
