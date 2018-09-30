import { ServerHttp2Stream, Http2Server, IncomingHttpHeaders, createSecureServer } from "http2";
import { resolve } from "path";
import { readFileSync } from "fs";

const AllowedExtensions = [".js", ".map", ".ts", ".tsx"];

export default class Server {

  Name: string;
  Server: Http2Server;
  Index: string;
  IndexLength: number;

  constructor(Name: string) {
    this.Name = Name;
    this.Server = createSecureServer({
      cert: readFileSync(resolve("Configs", this.Name, "Cert.pem")),
      key: readFileSync(resolve("Configs", this.Name, "CertPrivate.key"))
    }).on("stream", this.Stream.bind(this));
    this.Index = Index(Name);
    this.IndexLength = Buffer.byteLength(this.Index);
  } 

  Stream(Stream: ServerHttp2Stream, Headers: IncomingHttpHeaders){
    let File = Headers[":path"].substr(1);
    console.log(File);
    if(File) {
      if(File == "favicon.ico") {
        Stream.respond({ status: 404, "Content-Length": 0 });
        Stream.end();
      }
      else {
        if(!AllowedExtensions.map(x => File.endsWith(x)).filter(x => x).length) File += ".js";
        try {
          const Path = resolve("Projects", this.Name, File.startsWith("Source") ? "" : "Dist", File);
          Stream.respondWithFile(Path, {
            "Content-Type": "application/javascript"
          });
        } catch (ex) {
          console.error(ex);
        }
      }
    }
    else {
      Stream.respond({
        "Content-Type": "text/html",
        "Content-Length": this.IndexLength
      })
      Stream.end(this.Index);
    };
  }
}

process.on("uncaughtException", ex => {
  console.log(ex.stack);
})

const Index = (Title: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${Title}</title>
  </head>
  <body>
    <script type="module" src="/Index.js"></script>
  </body>
  </html>`;