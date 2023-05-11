import { fetchData } from "./client";


const runExtractor = async () => {
  console.log(await fetchData())
}

runExtractor()
