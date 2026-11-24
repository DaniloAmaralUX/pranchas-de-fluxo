import {createServer} from "node:http";
import {technicalPreview} from "./live-preview.mjs";

const [configuration, number] = process.argv.slice(2);
const port = Number(number || 57126);
const handle = await technicalPreview(configuration);
createServer((request,response) => {
  if (request.headers.host !== "127.0.0.1:" + port || !["GET","HEAD"].includes(request.method)) {
    response.writeHead(404).end();
    return;
  }
  handle(request.url.split("?")[0], response, request.method === "HEAD");
}).listen(port,"127.0.0.1",() => {
  process.stdout.write("Visor ao vivo em http://127.0.0.1:" + port + "/\n");
});
