"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http2_1 = require("http2");
const path_1 = require("path");
const fs_1 = require("fs");
const AllowedExtensions = [".js", ".map", ".ts", ".tsx"];
class Server {
    constructor(Name) {
        this.Name = Name;
        this.Server = http2_1.createSecureServer({
            cert: fs_1.readFileSync(path_1.resolve("Configs", this.Name, "Cert.pem")),
            key: fs_1.readFileSync(path_1.resolve("Configs", this.Name, "CertPrivate.key"))
        }).on("stream", this.Stream.bind(this));
        this.Index = Index(Name);
        this.IndexLength = Buffer.byteLength(this.Index);
    }
    Stream(Stream, Headers) {
        let File = Headers[":path"].substr(1);
        console.log(File);
        if (File) {
            if (File == "favicon.ico") {
                Stream.respond({ status: 404, "Content-Length": 0 });
                Stream.end();
            }
            else {
                if (!AllowedExtensions.map(x => File.endsWith(x)).filter(x => x).length)
                    File += ".js";
                try {
                    const Path = path_1.resolve("Projects", this.Name, File.startsWith("Source") ? "" : "Dist", File);
                    Stream.respondWithFile(Path, {
                        "Content-Type": "application/javascript"
                    });
                }
                catch (ex) {
                    console.error(ex);
                }
            }
        }
        else {
            Stream.respond({
                "Content-Type": "text/html",
                "Content-Length": this.IndexLength
            });
            Stream.end(this.Index);
        }
        ;
    }
}
exports.default = Server;
process.on("uncaughtException", ex => {
    console.log(ex.stack);
});
const Index = (Title) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>${Title}</title>
    <style>
      html, body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <script type="module" src="/Index.js"></script>
  </body>
  </html>`;
